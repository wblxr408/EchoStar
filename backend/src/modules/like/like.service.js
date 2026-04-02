import { Like } from './like.model.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { StoryService } from '../story/story.service.js';
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

function normalizeStoryId(storyId) {
  if (storyId === undefined || storyId === null) {
    throw new Error('Story ID is required');
  }

  return typeof storyId === 'bigint'
    ? storyId.toString()
    : String(storyId).trim();
}

/**
 * Like Service - 点赞业务逻辑
 */
class LikeServiceClass {
  /**
   * 点赞/取消点赞（切换）
   */
  async toggleLike(userId, storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const storyData = await StoryService.fetchStoryRaw(normalizedStoryId);

    if (!storyData?.story) {
      throw new Error('Story not found');
    }

    const story = storyData.story;
    const isLiked = await likeCacheUtil.isLiked(userId, normalizedStoryId);

    if (isLiked) {
      await likeCacheUtil.unlikeStory(userId, normalizedStoryId);
      const likeCount = await likeCacheUtil.getLikeCount(normalizedStoryId);

      return {
        isLiked: false,
        likeCount,
        message: 'Like removed'
      };
    }

    await likeCacheUtil.likeStory(userId, normalizedStoryId);

    if (story.userId !== userId) {
      NotificationService.createNotification('like', story.userId, userId, normalizedStoryId).catch((err) => {
        console.error('Failed to create like notification:', err);
      });
    }

    const likeCount = await likeCacheUtil.getLikeCount(normalizedStoryId);
    return {
      isLiked: true,
      likeCount,
      message: 'Like created'
    };
  }

  /**
   * 创建点赞（明确点赞，不能取消）
   */
  async createLike(userId, storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const storyData = await StoryService.fetchStoryRaw(normalizedStoryId);

    if (!storyData?.story) {
      throw new Error('Story not found');
    }

    const story = storyData.story;
    const isLiked = await likeCacheUtil.isLiked(userId, normalizedStoryId);
    if (isLiked) {
      throw new Error('Story already liked');
    }

    const result = await likeCacheUtil.likeStory(userId, normalizedStoryId);

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
   * 获取故事点赞列表
   */
  async getLikesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const normalizedStoryId = normalizeStoryId(storyId);
    return likeCacheUtil.getLikesByStoryId(normalizedStoryId, { page, limit });
  }

  /**
   * 统计点赞数量
   */
  async getLikeCount(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const count = await likeCacheUtil.getLikeCount(normalizedStoryId);

    return {
      storyId: normalizedStoryId,
      likeCount: count
    };
  }

  /**
   * 检查用户是否已点赞
   */
  async checkIsLiked(storyId, userId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (!userId) {
      return {
        storyId: normalizedStoryId,
        isLiked: false
      };
    }

    const isLiked = await likeCacheUtil.isLiked(userId, normalizedStoryId);
    return {
      storyId: normalizedStoryId,
      isLiked
    };
  }

  /**
   * 获取用户点赞列表
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

    const storyIds = rows.map((like) => normalizeStoryId(like.storyId)).filter(Boolean);
    const counts = await Promise.all(storyIds.map((storyId) => likeCacheUtil.getLikeCount(storyId)));

    const likeCounts = {};
    storyIds.forEach((storyId, index) => {
      likeCounts[storyId] = counts[index];
    });

    return {
      likes: rows.map((like) => {
        const normalizedStoryId = normalizeStoryId(like.storyId);

        return {
          id: like.id,
          createdAt: like.createdAt,
          story: {
            id: normalizedStoryId,
            content: like.story?.content,
            images: like.story?.images || [],
            emotionTag: like.story?.emotionTag,
            createdAt: like.story?.createdAt,
            location: parseStoryLocationValue(like.story?.location),
            locationName: like.story?.locationName,
            likeCount: likeCounts[normalizedStoryId] || 0,
            author: like.story?.author
              ? {
                  id: like.story.author.id,
                  username: like.story.author.username,
                  avatar: like.story.author.avatarUrl || null
                }
              : null
          }
        };
      }),
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
    const normalizedStoryIds = Array.isArray(storyIds)
      ? storyIds.map((storyId) => normalizeStoryId(storyId))
      : [];

    if (!userId) {
      return normalizedStoryIds.map((storyId) => ({
        storyId,
        isLiked: false
      }));
    }

    return likeCacheUtil.checkMultipleLiked(normalizedStoryIds, userId);
  }
}

export const likeServiceInstance = new LikeServiceClass();
export { likeServiceInstance as LikeService };
