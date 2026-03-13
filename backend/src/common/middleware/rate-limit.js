import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../utils/redis.js';

/**
 * 通用限流中间件
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 个请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 使用 Redis 存储（可选）
  // store: new RedisStore({
  //   client: redisClient.getClient(),
  //   prefix: 'rl:'
  // })
});

/**
 * 严格限流（用于登录、注册等敏感操作）
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5, // 最多 5 个请求
  message: {
    code: 429,
    message: '操作过于频繁，请 15 分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 宽松限流（用于查询操作）
 */
export const looseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 分钟
  max: 60, // 最多 60 个请求
  message: {
    code: 429,
    message: '查询过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});
