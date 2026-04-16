import { Router } from 'express';
import * as authController from '../modules/auth/auth.controller.js';
import { authenticateJWT, requireAdmin } from '../modules/auth/auth.middleware.js';
import { strictLimiter } from '../common/middleware/rate-limit.js';

const router = Router();

/**
 * POST /api/auth/send-code - 发送邮箱验证码
 */
router.post('/send-code', strictLimiter, authController.sendVerificationCode);

/**
 * POST /api/auth/register - 用户注册 (带验证码验证)
 */
router.post('/register', strictLimiter, authController.register);

/**
 * POST /api/auth/register_2 - 用户注册 (不带验证码，仅测试用)
 */
router.post('/register_2', strictLimiter, authController.register_2);

/**
 * POST /api/admin/login - 管理员登录
 */
router.post('/admin/login', strictLimiter, authController.adminLogin);

/**
 * POST /api/auth/login - 用户登录
 */
router.post('/login', strictLimiter, authController.login);

/**
 * POST /api/auth/forgot-password - 忘记密码（通过邮箱验证码重置）
 */
router.post('/forgot-password', strictLimiter, authController.forgotPassword);

/**
 * GET /api/auth/me - 获取当前用户信息
 */
router.get('/me', authenticateJWT, authController.getCurrentUser);

/**
 * DELETE /api/auth/me - 注销账号
 */
router.delete('/me', authenticateJWT, authController.deleteAccount);

/**
 * GET /api/users/:userId - 查看其他用户信息
 */
router.get('/users/:userId', authController.getUserById);

/**
 * PUT /api/users/me - 修改个人信息
 */
router.put('/users/me', authenticateJWT, authController.updateProfile);

/**
 * GET /api/auth/avatar/upload-token - 获取头像上传凭证
 */
router.get('/avatar/upload-token', authenticateJWT, authController.getAvatarUploadToken);

/**
 * GET /api/auth/users/search - 根据用户名模糊搜索用户
 */
router.get('/users/search', authController.searchUsersByUsername);

/**
 * PUT /api/users/me/password - 修改密码
 */
router.put('/users/me/password', authenticateJWT, authController.changePassword);

/**
 * GET /api/auth/admin/users - 管理员获取所有用户列表
 */
router.get('/admin/users', authenticateJWT, requireAdmin, authController.getAllUsers);

export default router;
