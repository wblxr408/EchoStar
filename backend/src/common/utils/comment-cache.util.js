import { redisClient } from './redis.js';

/**
 * 评论缓存工具类
 * 缓存每个故事的评论数量
 * 使用懒加载机制：首次操作时从DB加载真实值作为基准
 */
class CommentCacheUtil {
  constructor() {
    this.KEY_PREFIX = {
      COUNT: 'comment:count',
      INIT: 'comment:count:init'
    };

    // 缓存过期时间（1小时）
    this.COUNT_TTL = 3600;

    // 初始化标记过期时间（1天）
    this.INIT_TTL = 86400;
  }

  /**
   * 生成 Redis key
   */
  getCountKey(storyId) {
    return `${this.KEY_PREFIX.COUNT}:${storyId}`;
  }

  getInitKey(storyId) {
    return `${this.KEY_PREFIX.INIT}:${storyId}`;
  }

  /**
   * 确保评论数缓存已初始化（懒加载，从DB加载真实值）
   */
  async ensureCountInit(storyId) {
    const redis = redisClient.getClient();
    const initKey = this.getInitKey(storyId);
    const countKey = this.getCountKey(storyId);

    try {
      const countExists = await redis.exists(countKey);
      if (countExists) return;

      const initExists = await redis.exists(initKey);
      if (initExists) {
        await redis.expire(initKey, this.INIT_TTL);
        return;
      }

      // 从数据库加载真实评论数
      const { Comment } = await import('../../modules/comment/comment.model.js');
      const dbCount = await Comment.count({ where: { storyId, status: 'active' } });

      await redis.setex(countKey, this.COUNT_TTL, dbCount);
      await redis.set(initKey, '1', 'EX', this.INIT_TTL);

      console.log(`✅ 评论数缓存懒加载 [storyId: ${storyId}, count: ${dbCount}]`);
    } catch (err) {
      console.error(`❌ 评论数缓存初始化失败 [storyId: ${storyId}]:`, err);
    }
  }

  /**
   * 获取故事评论数量
   */
  async getCommentCount(storyId) {
    const redis = redisClient.getClient();
    const key = this.getCountKey(storyId);

    try {
      // 确保缓存已初始化
      await this.ensureCountInit(storyId);

      const count = await redis.get(key);
      if (count !== null) {
        return parseInt(count, 10);
      }
    } catch (err) {
      console.error(`❌ 获取评论数缓存失败 [storyId: ${storyId}]:`, err);
    }

    // 缓存未命中，返回 -1 表示需要从数据库查询
    return -1;
  }

  /**
   * 设置故事评论数量
   */
  async setCommentCount(storyId, count) {
    const redis = redisClient.getClient();
    const key = this.getCountKey(storyId);

    try {
      await redis.setex(key, this.COUNT_TTL, count);
      console.log(`✅ 设置评论数缓存: storyId=${storyId}, count=${count}`);
    } catch (err) {
      console.error(`❌ 设置评论数缓存失败 [storyId: ${storyId}]:`, err);
    }
  }

  /**
   * 增加故事评论数量（原子操作，先确保缓存已初始化）
   */
  async incrementCommentCount(storyId) {
    const redis = redisClient.getClient();
    const key = this.getCountKey(storyId);

    try {
      // 确保缓存已从DB加载基准值
      await this.ensureCountInit(storyId);

      const count = await redis.incr(key);
      // 确保过期时间存在
      await redis.expire(key, this.COUNT_TTL);
      console.log(`✅ 增加评论数: storyId=${storyId}, count=${count}`);
      return count;
    } catch (err) {
      console.error(`❌ 增加评论数失败 [storyId: ${storyId}]:`, err);
      return -1;
    }
  }

  /**
   * 减少故事评论数量（原子操作，缓存未命中时从DB重新加载）
   */
  async decrementCommentCount(storyId) {
    const redis = redisClient.getClient();
    const key = this.getCountKey(storyId);

    try {
      // 确保缓存已从DB加载基准值
      await this.ensureCountInit(storyId);

      const currentCount = parseInt(await redis.get(key), 10);
      if (currentCount <= 0) {
        // 缓存值为0或空，重新从DB加载
        const { Comment } = await import('../../modules/comment/comment.model.js');
        const dbCount = await Comment.count({ where: { storyId, status: 'active' } });
        if (dbCount > 0) {
          const newCount = dbCount - 1;
          await redis.setex(key, this.COUNT_TTL, newCount);
          console.log(`✅ 减少评论数(重新加载): storyId=${storyId}, count=${newCount}`);
          return newCount;
        }
        return 0;
      }

      const count = await redis.decr(key);
      await redis.expire(key, this.COUNT_TTL);
      console.log(`✅ 减少评论数: storyId=${storyId}, count=${count}`);
      return count;
    } catch (err) {
      console.error(`❌ 减少评论数失败 [storyId: ${storyId}]:`, err);
      return -1;
    }
  }

  /**
   * 删除故事评论缓存
   */
  async deleteCommentCache(storyId) {
    const redis = redisClient.getClient();
    const countKey = this.getCountKey(storyId);
    const initKey = this.getInitKey(storyId);

    try {
      const pipeline = redis.pipeline();
      pipeline.del(countKey);
      pipeline.del(initKey);
      await pipeline.exec();
      console.log(`✅ 删除评论数缓存: storyId=${storyId}`);
    } catch (err) {
      console.error(`❌ 删除评论数缓存失败 [storyId: ${storyId}]:`, err);
    }
  }
}

export const commentCacheUtil = new CommentCacheUtil();
export default commentCacheUtil;
