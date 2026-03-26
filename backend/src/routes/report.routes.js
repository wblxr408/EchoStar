import { Router } from 'express';
import * as reportController from '../modules/report/report.controller.js';
import { authenticateJWT, requireAdmin } from '../modules/auth/auth.middleware.js';
import { validateCreateReport, validateHandleReport, validateGetReports } from '../modules/report/report.validator.js';

const router = Router();

// ======================
// 用户路由（需要登录）
// ======================

/**
 * POST /api/reports - 创建举报
 */
router.post(
  '/',
  authenticateJWT,
  validateCreateReport,
  reportController.createReport
);

/**
 * GET /api/reports/me - 获取用户自己的举报列表
 * Query: ?page=1&limit=20
 */
router.get(
  '/me',
  authenticateJWT,
  validateGetReports,
  reportController.getUserReports
);

// ======================
// 管理员路由（需要管理员权限）
// ======================

/**
 * GET /api/reports - 获取举报列表（管理员）
 * Query: ?targetType=story|comment&status=pending|approved|rejected&page=1&limit=20
 */
router.get(
  '/',
  authenticateJWT,
  requireAdmin,
  validateGetReports,
  reportController.getReports
);

/**
 * POST /api/reports/:reportId/handle - 处理举报（管理员）
 * Body: { action: 'approve' | 'reject' }
 */
router.post(
  '/:reportId/handle',
  authenticateJWT,
  requireAdmin,
  validateHandleReport,
  reportController.handleReport
);

/**
 * GET /api/reports/statistics - 获取举报统计（管理员）
 */
router.get(
  '/statistics',
  authenticateJWT,
  requireAdmin,
  reportController.getStatistics
);

/**
 * GET /api/reports/stories - 获取故事举报列表（管理员）
 */
router.get(
  '/stories',
  authenticateJWT,
  requireAdmin,
  reportController.getStoryReports
);

/**
 * GET /api/reports/comments - 获取评论举报列表（管理员）
 */
router.get(
  '/comments',
  authenticateJWT,
  requireAdmin,
  reportController.getCommentReports
);

export default router;
