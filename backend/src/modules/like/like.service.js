import { Like } from './like.model.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { NotificationService } from '../notification/notification.service.js';
import { likeCacheUtil } from '../../common/utils/like-cache.util.js';

function parseStoryLocationValue(locationValue) {
  if (!locationValue) {
    return null;
  }

  if (locationValue.type === 'Point' && Array.isArray(locationValue.coordinates)) {
    return {
      lng: locationValue.coordinates[0],
      lat: locationValue.coordinates[1]
    };
  }

  const locationStr = typeof locationValue === 'string'
    ? locationValue
    : locationValue.toString();
  const match = locationStr.match(/POINT\(([^ ]+) ([^ ]+)\)/i);

  if (!match) {
    return null;
  }

  return {
    lng: parseFloat(match[1]),
    lat: parseFloat(match[2])
  };
}

/**
 * Like Service - 点赞业务逻辑（使用 Redis 缓存优化）
 */
class LikeServiceClass {
  /**
   * 点赞/取消点赞（切换）
   */
  async toggleLike(userId, storyId) {
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('Story not found');
    }

    const isLiked = await likeCacheUtil.isLiked(userId, storyId);

    if (isLiked) {
      // 取消点赞
      await likeCacheUtil.unlikeStory(userId, storyId);
      const likeCount = await likeCacheUtil.getLikeCount(storyId);
      return {
        isLiked: false,
        likeCount,
        message: 'Like removed'
      };
    } else {
      // 点赞
      await likeCacheUtil.likeStory(userId, storyId);

      // 发送通知
      if (story.userId !== userId) {
        NotificationService.createNotification('like', story.userId, userId, storyId).catch((err) => {
          console.error('Failed to create like notification:', err);
        });
      }

      const likeCount = await likeCacheUtil.getLikeCount(storyId);
      return {
        isLiked: true,
        likeCount,
        message: 'Like created'
      };
    }
  }

  /**
   * 创建点赞（明确点赞，不能取消）
   */
  async createLike(userId, storyId) {
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('Story not found');
    }

    const isLiked = await likeCacheUtil.isLiked(userId, storyId);
    if (isLiked) {
      throw new Error('Story already liked');
    }

    const result = await likeCacheUtil.likeStory(userId, storyId);

    // 发送通知
    if (story.userId !== userId) {
      NotificationService.createNotification('like', story.userId, userId, storyId).catch((err) => {
        console.error('Failed to create like notification:', err);
      });
    }

    return {
      isLiked: result.isLiked,
      likeCount: result.likeCount
    };
  }

  /**
   * 删除点赞
   */
  async deleteLike(storyId, userId) {
    const isLiked = await likeCacheUtil.isLiked(userId, storyId);
    if (!isLiked) {
      throw new Error('Like record not found');
    }

    await likeCacheUtil.unlikeStory(userId, storyId);

    return {
      success: true,
      message: 'Like removed'
    };
  }

  /**
   * 获取故事点赞列表
   * 直接查询数据库（列表数据不需要缓存）
   */
  async getLikesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    return await likeCacheUtil.getLikesByStoryId(storyId, { page, limit });
  }

  /**
   * 统计点赞数量
   * 从 Redis 缓存计算（|base| + |add| - |del|）
   */
  async getLikeCount(storyId) {
    const count = await likeCacheUtil.getLikeCount(storyId);
    return { storyId, likeCount: count };
  }

  /**
   * 检查用户是否已点赞
   */
  async checkIsLiked(storyId, userId) {
    if (!userId) {
      return { storyId, isLiked: false };
    }

    const isLiked = await likeCacheUtil.isLiked(userId, storyId);
    return { storyId, isLiked };
  }

  /**
   * 获取用户的点赞列表
   * 废弃接口，保留兼容性（前端未使用）
   */
  async getUserLikes(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Like.findAndCountAll({
      where: { userId },
      include: [{
        model: Story,
        as: 'story',
        attributes: ['id', 'content', 'images', 'emotionTag', 'createdAt', 'location', 'locationName'],
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatarUrl']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    // 获取每个故事的点赞数（并行执行）
    const storyIds = rows.map((like) => like.storyId).filter(Boolean);
    const countPromises = storyIds.map(storyId => likeCacheUtil.getLikeCount(storyId));
    const counts = await Promise.all(countPromises);

    const likeCounts = {};
    storyIds.forEach((storyId, i) => {
      likeCounts[storyId] = counts[i];
    });

    return {
      likes: rows.map((like) => ({
        id: like.id,
        createdAt: like.createdAt,
        story: {
          id: like.storyId,
          content: like.story?.content,
          images: like.story?.images || [],
          emotionTag: like.story?.emotionTag,
          createdAt: like.story?.createdAt,
          location: parseStoryLocationValue(like.story?.location),
          locationName: like.story?.locationName,
          likeCount: likeCounts[like.storyId] || 0,
          author: like.story?.author
            ? {
                id: like.story.author.id,
                username: like.story.author.username,
                avatar: like.story.author.avatarUrl || null
              }
            : null
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 批量检查多个故事的点赞状态
   */
  async checkMultipleLiked(storyIds, userId) {
    if (!userId) {
      return storyIds.map((storyId) => ({
        storyId,
        isLiked: false
      }));
    }

    return await likeCacheUtil.checkMultipleLiked(storyIds, userId);
  }
}

export const likeServiceInstance = new LikeServiceClass();
export { likeServiceInstance as LikeService };
