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

    // ===================== 安全检查：Token 是否被拉黑 =====================
    const isBlacklisted = await redis.get(`${REDIS_PREFIX.TOKEN_BL}:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        code: 4001,
        message: 'Token 已失效，请重新登录'
      });
    }

    // 验证 Token 合法性 + 获取过期时间
    const decoded = jwt.verify(token, config.jwt.secret);
    const userId = decoded.userId;

    // ===================== 用户信息缓存 =====================
    let user;
    const userCacheKey = `${REDIS_PREFIX.USER}:${userId}`;
    const cachedUser = await redis.get(userCacheKey);

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

    // 黑名单检查
    const blacklisted = await redis.get(`${REDIS_PREFIX.TOKEN_BL}:${token}`);
    if (blacklisted) return next();

    const decoded = jwt.verify(token, config.jwt.secret);
    const userId = decoded.userId;
    const userCacheKey = `${REDIS_PREFIX.USER}:${userId}`;

    let user;
    const cached = await redis.get(userCacheKey);
    if (cached) {
      user = JSON.parse(cached);
    } else {
      user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'username', 'avatarUrl', 'role', 'status']
      });
      if (user) await redis.setex(userCacheKey, CACHE_TTL, JSON.stringify(user.toJSON()));
    }

    if (user && user.status !== 'deleted') {
      const banned = await Blacklist.findOne({ where: { email: user.email } });
      if (!banned) req.user = user;
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
export const clearUserCache = async (userId) => {
  if (!userId) return;
  const redis = redisClient.getClient();
  await redis.del(`user:info:${userId}`);
};