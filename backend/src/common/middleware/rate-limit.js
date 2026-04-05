import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../utils/redis.js';

// K6_TEST=true 时跳过所有限流（性能测试场景）
const skipRateLimit = process.env.K6_TEST === 'true';

const noopMiddleware = (req, res, next) => next();

/**
 * 通用限流中间件
 */
export const generalLimiter = skipRateLimit ? noopMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10000, // 最多 10000 个请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
  // 使用 Redis 存储（多进程共享限流计数）
  // 需要先安装: npm install rate-limit-redis
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.getClient().call(...args),
  //   prefix: 'rl:general:'
  // })
});

/**
 * 严格限流（用于登录、注册等敏感操作）
 */
export const strictLimiter = skipRateLimit ? noopMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5000, // 最多 5000 个请求
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
export const looseLimiter = skipRateLimit ? noopMiddleware : rateLimit({
  windowMs: 1 * 60 * 1000, // 1 分钟
  max: 60000, // 最多 60000 个请求
  message: {
    code: 429,
    message: '查询过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});
