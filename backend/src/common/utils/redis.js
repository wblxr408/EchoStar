import Redis from 'ioredis';
import config from '../../config/redis.js';

/**
 * Redis 客户端单例
 */
class RedisClient {
  constructor() {
    this.client = null;
  }

  connect() {
    if (!this.client) {
      this.client = new Redis(config);

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err);
      });
    }

    return this.client;
  }

  getClient() {
    if (!this.client) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

export const redisClient = new RedisClient();

/**
 * 缓存装饰器
 * @param {String} keyPrefix - 缓存键前缀
 * @param {Number} ttl - 过期时间（秒）
 */
export function cache(keyPrefix, ttl = 3600) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const redis = redisClient.getClient();
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 写入缓存
      await redis.setex(cacheKey, ttl, JSON.stringify(result));

      return result;
    };

    return descriptor;
  };
}
