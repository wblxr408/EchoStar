import { Router } from 'express';
import * as authController from '../modules/auth/auth.controller.js';
import { authenticateJWT } from '../modules/auth/auth.middleware.js';
import { strictLimiter } from '../common/middleware/rate-limit.js';

const router = Router();

/**
 * POST /api/auth/register - 用户注册
 */
router.post('/register', strictLimiter, authController.register);

/**
 * POST /api/auth/login - 用户登录
 */
router.post('/login', strictLimiter, authController.login);

/**
 * POST /api/auth/github - GitHub OAuth 登录
 */
router.post('/github', authController.loginWithGitHub);

/**
 * GET /api/auth/me - 获取当前用户信息
 */
router.get('/me', authenticateJWT, authController.getCurrentUser);

export default router;
