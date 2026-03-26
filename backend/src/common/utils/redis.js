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

const EMPTY_PLACEHOLDER = "__EMPTY__";

/**
 * 缓存包装器（手动调用，无需装饰器语法）
 * @param {Object} target - 类实例
 * @param {String} propertyKey - 方法名
 * @param {Function} originalMethod - 原始方法
 * @param {String} keyPrefix - 缓存键前缀
 * @param {Number} ttl - 正常数据过期时间（秒）
 * @param {Number} emptyTtl - 占位值过期时间（秒）
 * @param {Number} keyIndex - 关键参数索引
 */
export function wrapWithCache(
  target,
  propertyKey,
  originalMethod,
  keyPrefix,
  ttl = 3600,
  emptyTtl = 300,
  keyIndex = 0
) {
  return async function (...args) {
    const redis = redisClient.getClient();
    // 核心优化：只提取关键参数生成缓存键
    const keyIdentifier = args[keyIndex];
    // 关键参数序列化（确保是字符串）
    const keyStr = typeof keyIdentifier === 'object'
      ? JSON.stringify(keyIdentifier)
      : String(keyIdentifier);
    const cacheKey = `${keyPrefix}:${keyStr}`;

    // 缓存读取逻辑
    try {
      const cachedValue = await redis.get(cacheKey);
      if (cachedValue !== null) {
        if (cachedValue === EMPTY_PLACEHOLDER) {
          console.log(`✅ 命中防穿透占位值：${cacheKey}`);
          return null;
        }
        const parsedData = JSON.parse(cachedValue);
        console.log(`✅ 命中正常缓存：${cacheKey}`);
        return parsedData;
      }
      console.log(`🔄 缓存未初始化：${cacheKey} → 执行数据库查询`);
    } catch (err) {
      console.error(`❌ 查缓存失败 [${cacheKey}]:`, err);
    }

    const dbResult = await originalMethod.call(target, ...args);

    // 缓存写入逻辑
    try {
      if (dbResult === null || dbResult === undefined || dbResult === '') {
        await redis.setex(cacheKey, emptyTtl, EMPTY_PLACEHOLDER);
        console.log(`✅ 写入防穿透占位值：${cacheKey}，过期时间：${emptyTtl}秒`);
      } else {
        const cacheValue = JSON.stringify(dbResult);
        await redis.setex(cacheKey, ttl, cacheValue);
        console.log(`✅ 写入正常缓存：${cacheKey}，过期时间：${ttl}秒`);
      }
    } catch (err) {
      console.error(`❌ 写缓存失败 [${cacheKey}]:`, err);
    }

    return dbResult;
  };
}

/**
 * 清除缓存包装器（手动调用，无需装饰器语法）
 * @param {Object} target - 类实例
 * @param {String} propertyKey - 方法名
 * @param {Function} originalMethod - 原始方法
 * @param {String} keyPrefix - 缓存键前缀
 * @param {Number} keyIndex - 关键参数索引
 */
export function wrapWithClearCache(
  target,
  propertyKey,
  originalMethod,
  keyPrefix,
  keyIndex = 0
) {
  return async function (...args) {
    const redis = redisClient.getClient();
    // 核心：和缓存包装器用完全相同的方式生成缓存键
    const keyIdentifier = args[keyIndex];
    const keyStr = typeof keyIdentifier === 'object'
      ? JSON.stringify(keyIdentifier)
      : String(keyIdentifier);
    const cacheKey = `${keyPrefix}:${keyStr}`;

    const result = await originalMethod.call(target, ...args);

    try {
      await redis.del(cacheKey);
      console.log(`✅ 删除缓存成功：${cacheKey}`);
    } catch (err) {
      console.error(`❌ 删除缓存失败 [${cacheKey}]:`, err);
    }

    return result;
  };
}