import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { User } from './auth.model.js';
import { Blacklist } from './blacklist.model.js';
import { redisClient } from '../../common/utils/redis.js';

const REDIS_PREFIX = {
  USER: 'user:info',
  TOKEN_BL: 'token:bl'
};
const CACHE_TTL = 3600; // 用户信息缓存 1 小时

/**
 * JWT 验证中间件（生产安全版）
 * 1. 验证 Token 格式
 * 2. 检查 Redis 黑名单（登出/强制下线）
 * 3. 读取用户缓存（Redis优先）
 * 4. 校验用户状态 + 管理员黑名单
 */
export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 4001,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7);
    const redis = redisClient.getClient();

    // 验证 Token 合法性 + 获取 userId
    const decoded = jwt.verify(token, config.jwt.secret);
    const userId = decoded.userId;
    const userCacheKey = `${REDIS_PREFIX.USER}:${userId}`;

    // ===================== 安全检查 + 用户缓存：合并为单次 pipeline =====================
    const cachedPipeline = redis.pipeline();
    cachedPipeline.get(`${REDIS_PREFIX.TOKEN_BL}:${token}`);
    cachedPipeline.get(userCacheKey);
    const [[, isBlacklisted], [, cachedUser]] = await cachedPipeline.exec();

    if (isBlacklisted) {
      return res.status(401).json({
        code: 4001,
        message: 'Token 已失效，请重新登录'
      });
    }

    // ===================== 用户信息缓存 =====================
    let user;

    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'username', 'avatarUrl', 'role', 'status']
      });

      if (!user) {
        return res.status(401).json({ code: 4001, message: '用户不存在' });
      }

      await redis.setex(userCacheKey, CACHE_TTL, JSON.stringify(user.toJSON()));
    }

    // ===================== 状态校验 =====================
    if (user.status === 'deleted') {
      await redis.del(userCacheKey);

      // 判断用户是否被拉黑
      const isBanned = await Blacklist.findOne({ where: { email: user.email } });
      if (isBanned) {
        await redis.del(userCacheKey);
        return res.status(401).json({ code: 4001, message: '用户已被管理员封禁' });
      } 
      else {
        return res.status(401).json({ code: 4001, message: '用户已注销' });
      }
    }

    req.user = user;
    next();

  } catch (error) {
    let msg = 'Token 无效或已过期';
    if (error.name === 'TokenExpiredError') msg = 'Token 已过期';
    if (error.name === 'JsonWebTokenError') msg = 'Token 无效';

    return res.status(401).json({ code: 4001, message: msg });
  }
};

// 管理员权限校验
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '需要管理员权限' });
  }
  next();
};

// 可选认证（游客模式）
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.substring(7);
    const redis = redisClient.getClient();

    // 验证 token（不阻塞无 token 请求）
    const decoded = jwt.verify(token, config.jwt.secret);
    const userId = decoded.userId;
    const userCacheKey = `${REDIS_PREFIX.USER}:${userId}`;

    // 黑名单检查 + 用户缓存：合并为单次 pipeline
    const pipeline = redis.pipeline();
    pipeline.get(`${REDIS_PREFIX.TOKEN_BL}:${token}`);
    pipeline.get(userCacheKey);
    const [[, blacklisted], [, cached]] = await pipeline.exec();

    if (blacklisted) return next();

    let user;
    if (cached) {
      user = JSON.parse(cached);
    } else {
      user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'username', 'avatarUrl', 'role', 'status']
      });
      if (user) await redis.setex(userCacheKey, CACHE_TTL, JSON.stringify(user.toJSON()));
    }

    if (user && user.status !== 'deleted') {
      // 缓存黑名单检查结果（5 分钟 TTL），避免每次请求查 DB
      const blCheckKey = `${REDIS_PREFIX.TOKEN_BL}:check:${user.id}`;
      const cachedBl = await redis.get(blCheckKey);
      if (cachedBl === '0') {
        req.user = user;
      } else if (cachedBl === null) {
        const banned = await Blacklist.findOne({ where: { email: user.email } });
        await redis.setex(blCheckKey, 300, banned ? '1' : '0');
        if (!banned) req.user = user;
      }
    }

    next();
  } catch (err) {
    next();
  }
};

// ===================== 核心修复：登出方法 =====================
/**
 * 登出（拉黑Token）
 * 自动计算 Token 剩余有效期，存入 Redis
 * 绝对安全：黑名单过期 = Token 本身过期
 */
export const logoutToken = async (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const now = Math.floor(Date.now() / 1000);
    const remainingTtl = decoded.exp - now;

    // 如果 Token 已过期，无需拉黑
    if (remainingTtl <= 0) return;

    const redis = redisClient.getClient();
    const key = `${REDIS_PREFIX.TOKEN_BL}:${token}`;
    await redis.setex(key, remainingTtl, '1');
  } catch (err) {
    // Token 无效，直接忽略
  }
};

// 清理用户缓存（封禁/解封/修改状态时必须调用）
// 同时清除 JWT 中间件缓存 (user:info) 和 Service 层缓存 (user:raw)
export const clearUserCache = async (userId) => {
  if (!userId) return;
  const redis = redisClient.getClient();
  const pipeline = redis.pipeline();
  pipeline.del(`user:info:${userId}`);
  pipeline.del(`user:raw:${userId}`);
  await pipeline.exec();
};