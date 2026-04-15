import { Router } from 'express';
import * as adminController from '../modules/admin/admin.controller.js';
import { authenticateJWT, requireAdmin } from '../modules/auth/auth.middleware.js';

const router = Router();

// 所有管理员路由都需要认证和管理员权限
router.use(authenticateJWT, requireAdmin);

/**
 * POST /api/admin/stories/:storyId/recommend - 设为推荐
 */
router.post('/stories/:storyId/recommend', adminController.recommendStory);

/**
 * POST /api/admin/stories/:storyId/unrecommend - 取消推荐
 */
router.post('/stories/:storyId/unrecommend', adminController.unrecommendStory);

/**
 * POST /api/admin/stories/:storyId/shadowban - Shadowban 故事
 */
router.post('/stories/:storyId/shadowban', adminController.shadowbanStory);

/**
 * POST /api/admin/stories/:storyId/restore - 恢复故事
 */
router.post('/stories/:storyId/restore', adminController.restoreStory);

/**
 * POST /api/admin/users/:userId/ban - 封禁用户
 */
router.post('/users/:userId/ban', adminController.banUser);

/**
 * POST /api/admin/users/:userId/unban - 解封用户
 */
router.post('/users/:userId/unban', adminController.unbanUser);

/**
 * POST /api/admin/users/:userId/upgrade-vip - 升级用户为VIP
 */
router.post('/users/:userId/upgrade-vip', adminController.upgradeUserToVip);

/**
 * GET /api/admin/statistics - 数据统计
 */
router.get('/statistics', adminController.getStatistics);

export default router;
