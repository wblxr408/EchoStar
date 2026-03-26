import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { User } from './auth.model.js';

/**
 * JWT 验证中间件
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

    // 验证 Token
    const decoded = jwt.verify(token, config.jwt.secret);

    // 查询用户信息
    const userId = decoded.userId ?? decoded.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'username', 'avatarUrl', 'role', 'status']
    });

    if (!user) {
      return res.status(401).json({
        code: 4001,
        message: '用户不存在'
      });
    }

    // 检查用户状态
    if (user.status === 'deleted') {
      return res.status(403).json({
        code: 4003,
        message: '用户已被删除'
      });
    }

    // 将用户信息附加到 req 对象
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 4001,
      message: 'Token 无效或已过期'
    });
  }
};

/**
 * 管理员权限验证中间件
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '需要管理员权限'
    });
  }
  next();
};

/**
 * 可选认证中间件（Token 可有可无）
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret);
      const userId = decoded.userId ?? decoded.id;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'username', 'avatarUrl', 'role']
      });

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Token 无效也继续，只是 req.user 为 undefined
    next();
  }
};
