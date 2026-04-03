import { Router } from 'express';
import * as announcementController from '../modules/announcement/announcement.controller.js';
import { authenticateJWT, requireAdmin } from '../modules/auth/auth.middleware.js';

const router = Router();

/**
 * GET /api/announcements - 获取公告列表（公开）
 */
router.get('/', announcementController.getAnnouncements);

/**
 * POST /api/announcements - 创建公告（管理员）
 */
router.post('/', authenticateJWT, requireAdmin, announcementController.createAnnouncement);

/**
 * PUT /api/announcements/:id - 更新公告（管理员）
 */
router.put('/:id', authenticateJWT, requireAdmin, announcementController.updateAnnouncement);

/**
 * DELETE /api/announcements/:id - 删除公告（管理员）
 */
router.delete('/:id', authenticateJWT, requireAdmin, announcementController.deleteAnnouncement);

export default router;
