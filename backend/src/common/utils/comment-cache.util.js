import { redisClient } from './redis.js';

/**
 * 评论缓存工具类
 * 缓存每个故事的评论数量
 */
class CommentCacheUtil {
  constructor() {
    this.KEY_PREFIX = {
      COUNT: 'comment:count'
    };

    // 缓存过期时间（1小时）
    this.COUNT_TTL = 3600;
  }

  /**
   * 生成 Redis key
   */
  getCountKey(storyId) {
    return `${this.KEY_PREFIX.COUNT}:${storyId}`;
  }

  /**
   * 获取故事评论数量
   */
  async getCommentCount(storyId) {
    const redis = redisClient.getClient();
    const key = this.getCountKey(storyId);

    try {
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
   * 增加故事评论数量（原子操作）
   */
  async incrementCommentCount(storyId) {
    const redis = redisClient.getClient();
    const key = this.getCountKey(storyId);

    try {
      const count = await redis.incr(key);
      // 如果是新 key，设置过期时间
      if (count === 1) {
        await redis.expire(key, this.COUNT_TTL);
      }
      console.log(`✅ 增加评论数: storyId=${storyId}, count=${count}`);
      return count;
    } catch (err) {
      console.error(`❌ 增加评论数失败 [storyId: ${storyId}]:`, err);
      return -1;
    }
  }

  /**
   * 减少故事评论数量（原子操作）
   */
  async decrementCommentCount(storyId) {
    const redis = redisClient.getClient();
    const key = this.getCountKey(storyId);

    try {
      const count = await redis.decr(key);
      // 防止负数
      if (count < 0) {
        await redis.set(key, '0');
        return 0;
      }
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
    const key = this.getCountKey(storyId);

    try {
      await redis.del(key);
      console.log(`✅ 删除评论数缓存: storyId=${storyId}`);
    } catch (err) {
      console.error(`❌ 删除评论数缓存失败 [storyId: ${storyId}]:`, err);
    }
  }
}

export const commentCacheUtil = new CommentCacheUtil();
export default commentCacheUtil;
