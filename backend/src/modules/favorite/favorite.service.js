import { Favorite } from './favorite.model.js';
import { User } from '../auth/auth.model.js';
import { StoryService } from '../story/story.service.js';
import { Op } from 'sequelize';
import { favoriteCacheUtil } from '../../common/utils/favorite-cache.util.js';
import { likeCacheUtil } from '../../common/utils/like-cache.util.js';

/**
 * 解析故事位置信息（经纬度）
 * 支持 GeoJSON Point 或 POINT(x y) 字符串格式
 */
function parseStoryLocationValue(locationValue) {
  if (!locationValue) {
    return null;
  }

  // GeoJSON 格式
  if (locationValue.type === 'Point' && Array.isArray(locationValue.coordinates)) {
    return {
      lng: locationValue.coordinates[0],
      lat: locationValue.coordinates[1]
    };
  }

  // 字符串格式：POINT(经度 纬度)
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
 * 标准化故事ID，统一格式为字符串
 */
function normalizeStoryId(storyId) {
  if (storyId === undefined || storyId === null) {
    throw new Error('Story ID is required');
  }

  return typeof storyId === 'bigint'
    ? storyId.toString()
    : String(storyId).trim();
}

/**
 * 收藏服务类
 * 所有高频操作：收藏/取消收藏/计数/状态查询 均走 Redis 缓存
 */
class FavoriteServiceClass {
  /**
   * 切换收藏状态（收藏/取消收藏）
   */
  async toggleFavorite(userId, storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const storyData = await StoryService.fetchStoryRaw(normalizedStoryId);
    const story = storyData?.story || storyData;

    if (!story) {
      throw new Error('Story not found');
    }

    const isFavorited = await favoriteCacheUtil.isFavorited(userId, normalizedStoryId);

    if (isFavorited) {
      const result = await favoriteCacheUtil.unfavoriteStory(userId, normalizedStoryId);
      return {
        isFavorited: false,
        favoriteCount: result.favoriteCount,
        message: 'Favorite removed'
      };
    }

    const result = await favoriteCacheUtil.favoriteStory(userId, normalizedStoryId);
    return {
      isFavorited: true,
      favoriteCount: result.favoriteCount,
      message: 'Favorite created'
    };
  }

  /**
   * 创建收藏（单独接口）
   */
  async createFavorite(userId, storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    const storyData = await StoryService.fetchStoryRaw(normalizedStoryId);
    const story = storyData?.story || storyData;

    if (!story) {
      throw new Error('Story not found');
    }

    const isFavorited = await favoriteCacheUtil.isFavorited(userId, normalizedStoryId);
    if (isFavorited) {
      throw new Error('Story already favorited');
    }

    const result = await favoriteCacheUtil.favoriteStory(userId, normalizedStoryId);

    return {
      isFavorited: result.isFavorited,
      favoriteCount: result.favoriteCount
    };
  }

  /**
   * 取消收藏（单独接口）
   */
  async deleteFavorite(storyId, userId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    const isFavorited = await favoriteCacheUtil.isFavorited(userId, normalizedStoryId);

    if (!isFavorited) {
      throw new Error('Favorite record not found');
    }

    await favoriteCacheUtil.unfavoriteStory(userId, normalizedStoryId);
    return {
      success: true,
      message: 'Favorite removed'
    };
  }

  /**
   * 获取故事的收藏用户列表（分页）
   */
  async getFavoritesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const normalizedStoryId = normalizeStoryId(storyId);
    return favoriteCacheUtil.getFavoritesByStoryId(normalizedStoryId, { page, limit });
  }

  /**
   * 获取故事收藏数量
   */
  async getFavoriteCount(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    try {
      const count = await favoriteCacheUtil.getFavoriteCount(normalizedStoryId);
      return {
        storyId: normalizedStoryId,
        favoriteCount: count
      };
    } catch (err) {
      console.error(`[favorite-service] Redis获取收藏数失败，降级到数据库: storyId=${normalizedStoryId}`, err);
      // 降级处理：直接查询数据库
      const count = await Favorite.count({ where: { storyId: normalizedStoryId } });
      return {
        storyId: normalizedStoryId,
        favoriteCount: count
      };
    }
  }

  /**
   * 检查用户是否收藏某故事
   */
  async checkIsFavorited(storyId, userId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (!userId) {
      return {
        storyId: normalizedStoryId,
        isFavorited: false
      };
    }

    try {
      const isFavorited = await favoriteCacheUtil.isFavorited(userId, normalizedStoryId);
      return {
        storyId: normalizedStoryId,
        isFavorited
      };
    } catch (err) {
      console.error(`[favorite-service] Redis检查收藏状态失败，降级到数据库: storyId=${normalizedStoryId}`, err);
      // 降级处理：直接查询数据库
      const record = await Favorite.findOne({
        where: { userId, storyId: normalizedStoryId }
      });
      return {
        storyId: normalizedStoryId,
        isFavorited: !!record
      };
    }
  }

  /**
   * 获取用户的收藏列表（我的收藏）
   * 直接查询数据库，关联故事和作者信息
   */
  async getUserFavorites(userId, { page = 1, limit = 10 } = {}) {
    const normalizedPage = parseInt(page, 10) || 1;
    const normalizedLimit = parseInt(limit, 10) || 10;
    const offset = (normalizedPage - 1) * normalizedLimit;

    const { rows, count } = await Favorite.findAndCountAll({
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
      limit: normalizedLimit,
      offset
    });

    // 批量获取故事的点赞数和收藏数
    const storyIds = rows
      .map((favorite) => normalizeStoryId(favorite.storyId))
      .filter(Boolean);

    const [likeCountResults, favoriteCountResults] = await Promise.all([
      Promise.all(storyIds.map((storyId) => likeCacheUtil.getLikeCount(storyId))),
      Promise.all(storyIds.map((storyId) => favoriteCacheUtil.getFavoriteCount(storyId)))
    ]);

    const likeCounts = {};
    const favoriteCounts = {};
    storyIds.forEach((storyId, index) => {
      likeCounts[storyId] = likeCountResults[index];
      favoriteCounts[storyId] = favoriteCountResults[index] || 0;
    });

    return {
      favorites: rows.map((favorite) => {
        const normalizedStoryId = normalizeStoryId(favorite.storyId);

        return {
          id: favorite.id,
          createdAt: favorite.createdAt,
          story: {
            id: normalizedStoryId,
            content: favorite.story?.content,
            images: favorite.story?.images || [],
            emotionTag: favorite.story?.emotionTag,
            createdAt: favorite.story?.createdAt,
            location: parseStoryLocationValue(favorite.story?.location),
            locationName: favorite.story?.locationName,
            likeCount: likeCounts[normalizedStoryId] || 0,
            favoriteCount: favoriteCounts[normalizedStoryId] || 0,
            author: favorite.story?.author
              ? {
                  id: favorite.story.author.id,
                  username: favorite.story.author.username,
                  avatar: favorite.story.author.avatarUrl || null
                }
              : null
          }
        };
      }),
      pagination: {
        total: count,
        page: normalizedPage,
        limit: normalizedLimit,
        totalPages: Math.ceil(count / normalizedLimit)
      }
    };
  }

  /**
   * 更新故事的统计数据（点赞数和收藏数）
   */
  async updateStoryStats(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    try {
      const [likeCount, favoriteCount] = await Promise.all([
        likeCacheUtil.getLikeCount(normalizedStoryId),
        favoriteCacheUtil.getFavoriteCount(normalizedStoryId)
      ]);

      // 这里可以添加将统计数据更新到故事的逻辑
      // 例如更新Story表的stats字段
      const { Story } = await import('../story/story.model.js');
      await Story.update(
        {
          likeCount,
          favoriteCount
        },
        {
          where: { id: normalizedStoryId }
        }
      );
    } catch (err) {
      console.error(`[favorite-service] 更新故事统计数据失败: storyId=${normalizedStoryId}`, err);
    }
  }

  /**
   * 批量检查多个故事的收藏状态
   */
  async checkMultipleFavorited(storyIds, userId) {
    const normalizedStoryIds = Array.isArray(storyIds)
      ? storyIds.map((storyId) => normalizeStoryId(storyId))
      : [];

    if (!userId) {
      return normalizedStoryIds.map((storyId) => ({
        storyId,
        isFavorited: false
      }));
    }

    try {
      return favoriteCacheUtil.checkMultipleFavorited(normalizedStoryIds, userId);
    } catch (err) {
      console.error(`[favorite-service] Redis批量检查收藏失败，降级到数据库: userId=${userId}`, err);
      // 降级处理：直接查询数据库
      const { Favorite } = await import('../../modules/favorite/favorite.model.js');
      const { Op } = await import('sequelize');
      const favorites = await Favorite.findAll({
        where: {
          userId,
          storyId: { [Op.in]: normalizedStoryIds }
        },
        attributes: ['storyId']
      });
      const favoritedIds = new Set(favorites.map((item) => String(item.storyId)));

      return normalizedStoryIds.map((storyId) => ({
        storyId,
        isFavorited: favoritedIds.has(String(storyId))
      }));
    }
  }
}

export const favoriteServiceInstance = new FavoriteServiceClass();
export { favoriteServiceInstance as FavoriteService };