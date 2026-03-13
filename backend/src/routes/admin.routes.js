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
 * POST /api/admin/stories/:storyId/shadowban - Shadowban 故事
 */
router.post('/stories/:storyId/shadowban', adminController.shadowbanStory);

/**
 * POST /api/admin/stories/:storyId/restore - 恢复故事
 */
router.post('/stories/:storyId/restore', adminController.restoreStory);

/**
 * GET /api/admin/reports - 获取举报列表
 * Query: ?status=pending&page=1&limit=20
 */
router.get('/reports', adminController.getReports);

/**
 * POST /api/admin/reports/:reportId/handle - 处理举报
 */
router.post('/reports/:reportId/handle', adminController.handleReport);

/**
 * GET /api/admin/statistics - 数据统计
 */
router.get('/statistics', adminController.getStatistics);

export default router;
