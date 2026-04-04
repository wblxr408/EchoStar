import { Like } from './like.model.js';
import { User } from '../auth/auth.model.js';
import { StoryService } from '../story/story.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { likeCacheUtil } from '../../common/utils/like-cache.util.js';
import { Story } from '../story/story.model.js';
import { favoriteServiceInstance } from '../favorite/favorite.service.js';

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

function normalizeStoryId(storyId) {
  if (storyId === undefined || storyId === null) {
    throw new Error('Story ID is required');
  }
  return typeof storyId === 'bigint' ? storyId.toString() : String(storyId).trim();
}

/**
 * Like Service - 点赞业务逻辑（使用 Redis 三集合增量缓存架构）
 *
 * 架构说明：
 *   - 点赞/取消点赞只写 Redis（BASE/ADD/DEL 三个集合）
 *   - 通过 syncToDatabase() 定时任务批量持久化到数据库
 *   - 所有读取走 Redis 缓存，DB 故障时自动回退
 */
class LikeServiceClass {
  /**
   * 点赞/取消点赞（切换）
   */
  async toggleLike(userId, storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const storyData = await StoryService.fetchStoryRaw(normalizedStoryId);
    const story = storyData?.story || storyData;

    if (!story) {
      throw new Error('Story not found');
    }

    const isLiked = await likeCacheUtil.isLiked(userId, normalizedStoryId);

    if (isLiked) {
      // 取消点赞
      const result = await likeCacheUtil.unlikeStory(userId, normalizedStoryId);
      return {
        isLiked: false,
        likeCount: result.likeCount,
        message: 'Like removed'
      };
    } else {
      // 点赞（只写 Redis，不立即写 DB）
      const result = await likeCacheUtil.likeStory(userId, normalizedStoryId);

      // 发送通知（给故事作者）
      if (story.userId !== userId) {
        NotificationService.createNotification('like', story.userId, userId, normalizedStoryId).catch((err) => {
          console.error('Failed to create like notification:', err);
        });
      }

      return {
        isLiked: true,
        likeCount: result.likeCount,
        message: 'Like created'
      };
    }
  }

  /**
   * 创建点赞（明确点赞，不能切换取消）
   */
  async createLike(userId, storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const storyData = await StoryService.fetchStoryRaw(normalizedStoryId);
    const story = storyData?.story || storyData;

    if (!story) {
      throw new Error('Story not found');
    }

    const isLiked = await likeCacheUtil.isLiked(userId, normalizedStoryId);
    if (isLiked) {
      throw new Error('Story already liked');
    }

    const result = await likeCacheUtil.likeStory(userId, normalizedStoryId);

    // 发送通知（给故事作者）
    if (story.userId !== userId) {
      NotificationService.createNotification('like', story.userId, userId, normalizedStoryId).catch((err) => {
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
    const normalizedStoryId = normalizeStoryId(storyId);
    const isLiked = await likeCacheUtil.isLiked(userId, normalizedStoryId);
    if (!isLiked) {
      throw new Error('Like record not found');
    }

    await likeCacheUtil.unlikeStory(userId, normalizedStoryId);

    return {
      success: true,
      message: 'Like removed'
    };
  }

  /**
   * 获取故事点赞列表（直接查数据库，列表数据不需要缓存）
   */
  async getLikesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const normalizedStoryId = normalizeStoryId(storyId);
    return await likeCacheUtil.getLikesByStoryId(normalizedStoryId, { page, limit });
  }

  /**
   * 统计点赞数量（从 Redis 缓存计算：|base| + |add| - |del|）
   */
  async getLikeCount(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const count = await likeCacheUtil.getLikeCount(normalizedStoryId);
    return { storyId: normalizedStoryId, likeCount: count };
  }

  /**
   * 检查用户是否已点赞
   */
  async checkIsLiked(storyId, userId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (!userId) {
      return { storyId: normalizedStoryId, isLiked: false };
    }

    const isLiked = await likeCacheUtil.isLiked(userId, normalizedStoryId);
    return { storyId: normalizedStoryId, isLiked };
  }

  /**
   * 获取用户的点赞列表
   * 查数据库获取用户点过赞的故事详情，同时从 Redis 获取最新点赞数和收藏数
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

    // 获取每个故事的点赞数和收藏数（并行执行）
    const storyIds = rows.map(like => like.storyId).filter(Boolean);
    const [likeCountResults, favoriteCountResults] = await Promise.all([
      Promise.all(storyIds.map(sid => likeCacheUtil.getLikeCount(sid))),
      Promise.all(storyIds.map(sid => favoriteServiceInstance.getFavoriteCount(sid)))
    ]);

    const likeCounts = {};
    const favoriteCounts = {};
    storyIds.forEach((sid, i) => {
      likeCounts[sid] = likeCountResults[i];
      favoriteCounts[sid] = favoriteCountResults[i]?.favoriteCount || 0;
    });

    return {
      likes: rows.map(like => ({
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
          favoriteCount: favoriteCounts[like.storyId] || 0,
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
      return storyIds.map(storyId => ({ storyId, isLiked: false }));
    }

    return await likeCacheUtil.checkMultipleLiked(storyIds, userId);
  }
}

export const likeServiceInstance = new LikeServiceClass();
export { likeServiceInstance as LikeService };
