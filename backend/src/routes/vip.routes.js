import { Router } from 'express';
import * as vipController from '../modules/vip/vip.controller.js';
import { authenticateJWT } from '../modules/auth/auth.middleware.js';

const router = Router();

// 所有VIP路由都需要认证
router.use(authenticateJWT);

/**
 * GET /api/v1/vip/status - 查看当前用户VIP状态
 */
router.get('/status', vipController.getCurrentUserVipStatus);

/**
 * GET /api/v1/vip/history - 获取用户VIP订单历史
 */
router.get('/history', vipController.getUserVipHistory);

/**
 * POST /api/v1/vip/activate - 使用激活码激活VIP
 */
router.post('/activate', vipController.activateVipByCode);

export default router;
