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
 * GET /api/v1/vip/economy - 获取情绪币体系概览
 */
router.get('/economy', vipController.getEmotionCoinProfile);

/**
 * GET /api/v1/vip/history - 获取用户VIP订单历史
 */
router.get('/history', vipController.getUserVipHistory);

/**
 * POST /api/v1/vip/activate - 使用激活码激活VIP
 */
router.post('/activate', vipController.activateVipByCode);

/**
 * POST /api/v1/vip/economy/check-in - 每日签到
 */
router.post('/economy/check-in', vipController.claimDailyCheckIn);

/**
 * POST /api/v1/vip/economy/recharge - 充值情绪币
 */
router.post('/economy/recharge', vipController.rechargeEmotionCoins);

/**
 * POST /api/v1/vip/economy/purchase - 购买权益
 */
router.post('/economy/purchase', vipController.purchaseEmotionCoinItem);

/**
 * POST /api/v1/vip/economy/consume - 消耗按次权益
 */
router.post('/economy/consume', vipController.consumeEmotionCoinItem);

/**
 * POST /api/v1/vip/economy/purchase-vip - 用情绪币购买VIP
 */
router.post('/economy/purchase-vip', vipController.purchaseVipWithCoins);

export default router;
