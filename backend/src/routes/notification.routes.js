import { Router } from 'express';
import * as notificationController from '../modules/notification/notification.controller.js';
import { authenticateJWT } from '../modules/auth/auth.middleware.js';
import { generalLimiter } from '../common/middleware/rate-limit.js';

const router = Router();

/**
 * GET /api/notifications/me - 获取我的通知列表（固定路径需在动态路径之前）
 */
router.get('/me', authenticateJWT, notificationController.getNotifications);

/**
 * GET /api/notifications/me/unread-count - 获取未读通知数量
 */
router.get('/me/unread-count', authenticateJWT, notificationController.getUnreadCount);

/**
 * PUT /api/notifications/me/mark-read - 标记所有通知为已读
 */
router.put('/me/mark-read', authenticateJWT, notificationController.markAllAsRead);

/**
 * DELETE /api/notifications/me - 清空所有通知
 */
router.delete('/me', authenticateJWT, notificationController.clearAllNotifications);

/**
 * PUT /api/notifications/:id/mark-read - 标记通知为已读
 */
router.put('/:id/mark-read', authenticateJWT, notificationController.markAsRead);

export default router;
