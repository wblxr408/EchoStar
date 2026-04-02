import { Favorite } from './favorite.model.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { Op } from 'sequelize';
import redisClient from '../../config/redis.js'; // 引入 Redis 客户端

/**
 * Favorite Service - 收藏业务逻辑
 */
class FavoriteServiceClass {
  /**
   * 异步落库处理 (替代 MQ 的轻量级异步持久化方案)
   */
  async _asyncPersistFavorite(userId, storyId, isFavorited) {
    try {
      if (isFavorited) {
        await Favorite.findOrCreate({
          where: { userId, storyId },
          defaults: { userId, storyId }
        });
      } else {
        await Favorite.destroy({
          where: { userId, storyId }
        });
      }
    } catch (error) {
      console.error('[Favorite] 异步落库失败:', error);
    }
  }

  /**
   * 收藏/取消收藏（根据是否存在决定操作）
   */
  async toggleFavorite(userId, storyId) {
    // 验证故事是否存在
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('故事不存在');
    }

    const favKey = `favorite:status:${userId}:${storyId}`;
    const countKey = `favorite:count:${storyId}`;

    console.log(`[Favorite] toggleFavorite userId=${userId} storyId=${storyId}`);

    // 1. 优先查 Redis 缓存
    let isFavorited = false;
    try {
      const cachedStatus = await redisClient.get(favKey);
      if (cachedStatus !== null) {
        isFavorited = cachedStatus === '1';
        console.log(`[Favorite] 缓存命中: favKey=${favKey}, isFavorited=${isFavorited}`);
      } else {
        // 缓存未命中，降级查库
        const existing = await Favorite.findOne({ where: { userId, storyId } });
        isFavorited = !!existing;
        console.log(`[Favorite] 缓存未命中，查询数据库: isFavorited=${isFavorited}`);

        // 🔥 关键修复：回写缓存，防止下次查询时状态不一致
        await redisClient.set(favKey, isFavorited ? '1' : '0', 'EX', 3600);
        console.log(`[Favorite] 回写缓存: favKey=${isFavorited ? '1' : '0'}`);
      }
    } catch (err) {
      console.warn('[Favorite] Redis读取失败，降级查库', err);
      const existing = await Favorite.findOne({ where: { userId, storyId } });
      isFavorited = !!existing;
    }

    // 2. 翻转状态
    const newStatus = !isFavorited;
    console.log(`[Favorite] 状态翻转: isFavorited=${isFavorited} -> newStatus=${newStatus}`);

    // 3. 同步写入 Redis (内存极速操作)
    try {
      await redisClient.set(favKey, newStatus ? '1' : '0', 'EX', 3600); // 设置过期时间

      if (newStatus) {
        // 收藏：计数加1
        const newCount = await redisClient.incr(countKey);
        console.log(`[Favorite] 收藏成功: countKey incr -> ${newCount}`);
      } else {
        // 取消收藏：计数减1
        const newCount = await redisClient.decr(countKey);
        console.log(`[Favorite] 取消收藏: countKey decr -> ${newCount}`);
      }
    } catch (err) {
      console.error('[Favorite] Redis写入失败', err);
    }

    // 4. 触发异步落库到 MySQL (没有 await，直接结束去响应前端)
    this._asyncPersistFavorite(userId, storyId, newStatus);

    return {
      isFavorited: newStatus,
      message: newStatus ? '收藏成功' : '已取消收藏'
    };
  }

  /**
   * 创建收藏
   */
  async createFavorite(userId, storyId) {
    // 验证故事是否存在
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('故事不存在');
    }

    // 检查是否已收藏（优先查缓存）
    const favKey = `favorite:status:${userId}:${storyId}`;
    try {
      const cachedStatus = await redisClient.get(favKey);
      if (cachedStatus === '1') {
        throw new Error('已经收藏过此故事');
      }
    } catch (err) {
      console.warn('[Favorite] Redis读取失败', err);
    }

    // 降级查库
    const existingFavorite = await Favorite.findOne({
      where: { userId, storyId }
    });

    if (existingFavorite) {
      throw new Error('已经收藏过此故事');
    }

    // 创建收藏
    const favorite = await Favorite.create({
      userId,
      storyId
    });

    // 同步更新 Redis 缓存以保持一致性
    try {
      const countKey = `favorite:count:${storyId}`;
      await redisClient.set(favKey, '1', 'EX', 3600); // 设置过期时间
      await redisClient.incr(countKey);
      console.log(`[Favorite] createFavorite userId=${userId} storyId=${storyId} 计数+1`);
    } catch (err) {
      console.error('[Favorite] Redis写入失败', err);
    }

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
    // 优先查缓存
    const favKey = `favorite:status:${userId}:${storyId}`;
    try {
      const cachedStatus = await redisClient.get(favKey);
      if (cachedStatus === '0') {
        throw new Error('收藏记录不存在');
      }
    } catch (err) {
      console.warn('[Favorite] Redis读取失败', err);
    }

    const favorite = await Favorite.findOne({
      where: { userId, storyId }
    });

    if (!favorite) {
      throw new Error('收藏记录不存在');
    }

    await favorite.destroy();

    // 同步更新 Redis 缓存以保持一致性
    try {
      const countKey = `favorite:count:${storyId}`;
      await redisClient.set(favKey, '0', 'EX', 3600); // 设置过期时间
      await redisClient.decr(countKey);
      console.log(`[Favorite] deleteFavorite userId=${userId} storyId=${storyId} 计数-1`);
    } catch (err) {
      console.error('[Favorite] Redis写入失败', err);
    }

    return { success: true, message: '取消收藏成功' };
  }

  /**
   * 获取故事收藏列表
   */
  async getFavoritesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Favorite.findAndCountAll({
      where: { storyId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      favorites: rows.map(favorite => ({
        id: favorite.id,
        createdAt: favorite.createdAt,
        user: {
          id: favorite.userId,
          username: favorite.user?.username || '匿名用户',
          avatar: favorite.user?.avatarUrl || null
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 统计收藏数量
   */
  async getFavoriteCount(storyId) {
    const countKey = `favorite:count:${storyId}`;

    // 1. 尝试从 Redis 读取
    try {
      const cachedCount = await redisClient.get(countKey);
      if (cachedCount !== null) {
        const count = parseInt(cachedCount, 10);
        console.log(`[Favorite] getFavoriteCount storyId=${storyId} 缓存命中: ${count}`);
        return { storyId, favoriteCount: count };
      }
    } catch (err) {
      console.warn('[Favorite] Redis读取失败', err);
    }

    // 2. 缓存未命中，查库
    const count = await Favorite.count({ where: { storyId } });
    console.log(`[Favorite] getFavoriteCount storyId=${storyId} 数据库查询: ${count}`);

    // 3. 回写缓存 (设置 1 小时过期，避免冷数据常驻内存)
    try {
      await redisClient.set(countKey, count, 'EX', 3600);
    } catch (err) {
      console.error('[Favorite] Redis写入失败', err);
    }

    return { storyId, favoriteCount: count };
  }

  /**
   * 检查用户是否已收藏
   */
  async checkIsFavorited(storyId, userId) {
    const favKey = `favorite:status:${userId}:${storyId}`;

    try {
      const cachedStatus = await redisClient.get(favKey);
      if (cachedStatus !== null) {
        const isFavorited = cachedStatus === '1';
        console.log(`[Favorite] checkIsFavorited userId=${userId} storyId=${storyId} 缓存命中: ${isFavorited}`);
        return { storyId, isFavorited };
      }
    } catch (err) {
      console.warn('[Favorite] Redis读取失败', err);
    }

    // 缓存未命中，查库
    const favorite = await Favorite.findOne({
      where: { userId, storyId }
    });

    const isFavorited = !!favorite;
    console.log(`[Favorite] checkIsFavorited userId=${userId} storyId=${storyId} 数据库查询: ${isFavorited}`);

    // 缓存未命中回写
    try {
      await redisClient.set(favKey, isFavorited ? '1' : '0', 'EX', 3600);
    } catch (err) {
      console.error('[Favorite] Redis写入失败', err);
    }

    return { storyId, isFavorited };
  }

  /**
   * 获取用户的收藏列表（我的收藏）
   */
  async getUserFavorites(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Favorite.findAndCountAll({
      where: { userId },
      include: [{
        model: Story,
        as: 'story',
        attributes: ['id', 'content', 'images', 'emotionTag', 'createdAt']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      favorites: rows.map(favorite => ({
        id: favorite.id,
        createdAt: favorite.createdAt,
        story: {
          id: favorite.storyId,
          content: favorite.story?.content,
          images: favorite.story?.images || [],
          emotionTag: favorite.story?.emotionTag,
          createdAt: favorite.story?.createdAt
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 批量检查多个故事的收藏状态
   */
  async checkMultipleFavorited(storyIds, userId) {
    // 使用 Promise.all 并发检查，由于复用了 checkIsFavorited，内部会优先走 Redis 缓存并回写
    const results = await Promise.all(
      storyIds.map(async (storyId) => {
        return await this.checkIsFavorited(storyId, userId);
      })
    );
    
    return results;
  }
}

// 创建单例实例
export const favoriteServiceInstance = new FavoriteServiceClass();

// 导出别名
export { favoriteServiceInstance as FavoriteService };
