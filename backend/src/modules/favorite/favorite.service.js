import { Favorite } from './favorite.model.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { Op } from 'sequelize';
import { wrapWithCache } from '../../common/utils/redis.js';
import { wrapWithClearCache } from '../../common/utils/redis.js';
import { redisClient } from '../../common/utils/redis.js';

function parseStoryLocationValue(locationValue) {
  if (!locationValue) return null;
  if (locationValue.type === 'Point' && Array.isArray(locationValue.coordinates)) {
    return { lng: locationValue.coordinates[0], lat: locationValue.coordinates[1] };
  }
  return null;
}

/**
 * Favorite Service - 收藏业务逻辑（Redis 缓存优化版）
 */
class FavoriteServiceClass {
  constructor() {
    // 缓存前缀定义
    this.CACHE_PREFIX = {
      FAVORITE_COUNT: 'favorite:count',        // 收藏计数
      IS_FAVORITED: 'favorite:check',         // 检查是否收藏
      STORY_FAVORITES: 'favorite:story:list',  // 故事的收藏列表
      USER_FAVORITES: 'favorite:user:list'    // 用户的收藏列表
    };

    // 缓存过期时间（秒）
    this.CACHE_TTL = {
      COUNT: 600,      // 计数缓存 10 分钟
      CHECK: 1800,     // 状态检查 30 分钟
      LIST: 300,       // 列表缓存 5 分钟
      EMPTY: 60        // 空值防穿透 1 分钟
    };

    // 包装缓存方法
    this._wrapCacheMethods();
  }

  /**
   * 生成包含 storyId + userId 的复合缓存 key
   */
  _getCheckCacheKey(storyId, userId) {
    return `${this.CACHE_PREFIX.IS_FAVORITED}:${storyId}:${userId}`;
  }

  /**
   * 清除故事相关的所有收藏缓存
   */
  async _clearAllStoryFavoriteCache(storyId, userId) {
    const redis = redisClient.getClient();
    try {
      const pipeline = redis.pipeline();
      // 清除该故事的收藏计数缓存
      pipeline.del(`${this.CACHE_PREFIX.FAVORITE_COUNT}:${storyId}`);
      // 清除该故事的收藏列表缓存
      pipeline.del(`${this.CACHE_PREFIX.STORY_FAVORITES}:${storyId}`);
      // 如果有 userId，清除该用户对特定故事的收藏状态缓存
      if (userId) {
        pipeline.del(this._getCheckCacheKey(storyId, userId));
      }
      // 清除该用户的收藏列表缓存（使用 SCAN 模式删除）
      await pipeline.exec();
      // 清除用户收藏列表缓存（key 格式：favorite:user:list:userId）
      if (userId) {
        await redis.del(`${this.CACHE_PREFIX.USER_FAVORITES}:${userId}`);
      }
      console.log(`✅ 清除故事收藏相关缓存: storyId=${storyId}, userId=${userId || 'all'}`);
    } catch (err) {
      console.error(`❌ 清除故事收藏缓存失败 [storyId: ${storyId}]:`, err);
    }
  }

  /**
   * 自动包装所有需要缓存的方法
   */
  _wrapCacheMethods() {
    // 1. 统计收藏数量 - 加缓存
    this.getFavoriteCount = wrapWithCache(
      this,
      'getFavoriteCount',
      this.getFavoriteCount.bind(this),
      this.CACHE_PREFIX.FAVORITE_COUNT,
      this.CACHE_TTL.COUNT,
      this.CACHE_TTL.EMPTY
    );

    // 2. 检查是否已收藏 - 加缓存（使用复合 key: storyId + userId）
    this.checkIsFavorited = this._wrapCheckIsFavorited();

    // 3. 故事收藏列表 - 加缓存
    this.getFavoritesByStoryId = wrapWithCache(
      this,
      'getFavoritesByStoryId',
      this.getFavoritesByStoryId.bind(this),
      this.CACHE_PREFIX.STORY_FAVORITES,
      this.CACHE_TTL.LIST,
      this.CACHE_TTL.EMPTY
    );

    // 4. 用户收藏列表 - 加缓存
    this.getUserFavorites = wrapWithCache(
      this,
      'getUserFavorites',
      this.getUserFavorites.bind(this),
      this.CACHE_PREFIX.USER_FAVORITES,
      this.CACHE_TTL.LIST,
      this.CACHE_TTL.EMPTY
    );

    // 5. 切换收藏 - 执行后清所有相关缓存
    this.toggleFavorite = this._wrapWithClearAllCache(
      this.toggleFavorite.bind(this),
      1 // storyId 在参数第 1 位
    );

    // 6. 创建收藏 - 执行后清所有相关缓存
    this.createFavorite = this._wrapWithClearAllCache(
      this.createFavorite.bind(this),
      1
    );

    // 7. 删除收藏 - 执行后清所有相关缓存
    this.deleteFavorite = this._wrapWithClearAllCache(
      this.deleteFavorite.bind(this),
      0
    );
  }

  /**
   * 自定义 checkIsFavorited 包装器（使用复合 key: storyId + userId）
   */
  _wrapCheckIsFavorited() {
    const self = this;
    const originalMethod = self.checkIsFavorited.bind(self);

    return async function (storyId, userId) {
      if (!userId) {
        return { storyId, isFavorited: false };
      }

      const redis = redisClient.getClient();
      const cacheKey = self._getCheckCacheKey(storyId, userId);

      try {
        const cachedValue = await redis.get(cacheKey);
        if (cachedValue !== null) {
          if (cachedValue === '__EMPTY__') {
            return { storyId, isFavorited: false };
          }
          if (cachedValue === '__UPDATING__') {
            return { _updating: true };
          }
          const parsed = JSON.parse(cachedValue);
          return parsed;
        }
      } catch (err) {
        console.error(`❌ 查收藏状态缓存失败 [${cacheKey}]:`, err);
      }

      const dbResult = await originalMethod(storyId, userId);

      try {
        const cacheValue = JSON.stringify(dbResult);
        await redis.setex(cacheKey, self.CACHE_TTL.CHECK, cacheValue);
      } catch (err) {
        console.error(`❌ 写收藏状态缓存失败 [${cacheKey}]:`, err);
      }

      return dbResult;
    };
  }

  /**
   * 自定义清除缓存包装器（清除故事相关的所有收藏缓存）
   */
  _wrapWithClearAllCache(originalMethod, storyIdArgIndex) {
    const self = this;

    return async function (...args) {
      const result = await originalMethod(...args);
      const storyId = args[storyIdArgIndex];
      const userId = args.find((arg, idx) => idx !== storyIdArgIndex && typeof arg === 'number');
      await self._clearAllStoryFavoriteCache(storyId, userId);
      return result;
    };
  }

  /**
   * 收藏/取消收藏（自动切换）
   */
  async toggleFavorite(userId, storyId) {
    const story = await Story.findByPk(storyId);
    if (!story) throw new Error('故事不存在');

    const existing = await Favorite.findOne({ where: { userId, storyId } });
    if (existing) {
      await existing.destroy();
      return { isFavorited: false, message: '已取消收藏' };
    } else {
      const favorite = await Favorite.create({ userId, storyId });
      return { isFavorited: true, message: '收藏成功', id: favorite.id };
    }
  }

  /**
   * 创建收藏（强制）
   */
  async createFavorite(userId, storyId) {
    const story = await Story.findByPk(storyId);
    if (!story) throw new Error('故事不存在');

    const existing = await Favorite.findOne({ where: { userId, storyId } });
    if (existing) throw new Error('已经收藏过此故事');

    const favorite = await Favorite.create({ userId, storyId });
    return {
      id: favorite.id,
      storyId: favorite.storyId,
      createdAt: favorite.createdAt
    };
  }

  /**
   * 取消收藏
   */
  async deleteFavorite(storyId, userId) {
    const favorite = await Favorite.findOne({ where: { userId, storyId } });
    if (!favorite) throw new Error('收藏记录不存在');

    await favorite.destroy();
    return { success: true, message: '取消收藏成功' };
  }

  /**
   * 获取故事的收藏列表（带缓存）
   */
  async getFavoritesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const { rows, count } = await Favorite.findAndCountAll({
      where: { storyId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatarUrl'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      favorites: rows.map(f => ({
        id: f.id,
        createdAt: f.createdAt,
        user: {
          id: f.userId,
          username: f.user?.username || '匿名用户',
          avatar: f.user?.avatarUrl || null
        }
      })),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) }
    };
  }

  /**
   * 统计收藏数量（带缓存）
   */
  async getFavoriteCount(storyId) {
    const count = await Favorite.count({ where: { storyId } });
    return { storyId, favoriteCount: count };
  }

  /**
   * 检查是否已收藏（带缓存）
   */
  async checkIsFavorited(storyId, userId) {
    if (!userId) return { storyId, isFavorited: false };
    const fav = await Favorite.findOne({ where: { userId, storyId } });
    return { storyId, isFavorited: !!fav };
  }

  /**
   * 获取用户收藏列表（带缓存）
   */
  async getUserFavorites(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
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
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 批量获取点赞数和收藏数
    const storyIds = rows.map(f => f.storyId).filter(Boolean);
    const { likeCacheUtil } = await import('../../common/utils/like-cache.util.js');
    const countPromises = [
      ...storyIds.map(id => likeCacheUtil.getLikeCount(id)),
      ...storyIds.map(id => this.getFavoriteCount(id))
    ];
    const counts = await Promise.all(countPromises);

    const likeCounts = {};
    const favoriteCounts = {};
    storyIds.forEach((storyId, i) => {
      likeCounts[storyId] = counts[i];
      favoriteCounts[storyId] = counts[storyIds.length + i];
    });

    return {
      favorites: rows.map(f => ({
        id: f.id,
        createdAt: f.createdAt,
        story: {
          id: f.storyId,
          content: f.story?.content,
          images: f.story?.images || [],
          emotionTag: f.story?.emotionTag,
          createdAt: f.story?.createdAt,
          location: parseStoryLocationValue(f.story?.location),
          locationName: f.story?.locationName,
          likeCount: likeCounts[f.storyId] || 0,
          favoriteCount: favoriteCounts[f.storyId]?.favoriteCount || 0,
          author: f.story?.author
            ? {
                id: f.story.author.id,
                username: f.story.author.username,
                avatar: f.story.author.avatarUrl || null
              }
            : null
        }
      })),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) }
    };
  }

  /**
   * 批量检查收藏状态
   */
  async checkMultipleFavorited(storyIds, userId) {
    if (!userId) return storyIds.map(id => ({ storyId: id, isFavorited: false }));

    const favorites = await Favorite.findAll({
      where: { userId, storyId: { [Op.in]: storyIds } },
      attributes: ['storyId']
    });

    const favIds = favorites.map(f => f.storyId);
    return storyIds.map(id => ({ storyId: id, isFavorited: favIds.includes(id) }));
  }
}

// 创建单例实例
export const favoriteServiceInstance = new FavoriteServiceClass();

// 导出别名
export { favoriteServiceInstance as FavoriteService };
