import { VipService } from './vip.service.js';

/**
 * 查看当前用户VIP状态
 */
export const getCurrentUserVipStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = await VipService.checkUserVipStatus(userId);
    res.json({ code: 0, data: status });
  } catch (error) {
    next(error);
  }
};

/**
 * 使用激活码激活VIP
 */
export const activateVipByCode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ code: 40001, message: '请输入激活码' });
    }

    const result = await VipService.activateByCode(userId, code);

    if (!result.success) {
      return res.status(400).json({ code: 40002, message: result.message });
    }

    res.json({ code: 0, data: { isVip: true, expiresAt: result.expiresAt }, message: result.message });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户VIP订单历史
 */
export const getUserVipHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const result = await VipService.getUserVipHistory(userId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取情绪币经济体系概览
 */
export const getEmotionCoinProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await VipService.getEmotionCoinProfile(userId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 每日签到
 */
export const claimDailyCheckIn = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await VipService.claimDailyCheckIn(userId);
    res.json({ code: 0, data: result, message: `签到成功，获得${result.reward}情绪币` });
  } catch (error) {
    if (error.message === '今日已签到') {
      return res.status(400).json({ code: 40010, message: error.message });
    }
    next(error);
  }
};

/**
 * 充值情绪币（当前为自愿充值的本地模拟入口）
 */
export const rechargeEmotionCoins = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { packageKey } = req.body;
    const result = await VipService.rechargeEmotionCoins(userId, packageKey);
    res.json({ code: 0, data: result, message: '充值成功' });
  } catch (error) {
    next(error);
  }
};

/**
 * 消耗情绪币购买权益
 */
export const purchaseEmotionCoinItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemKey } = req.body;
    const result = await VipService.purchaseEmotionCoinItem(userId, itemKey);
    res.json({ code: 0, data: result, message: result.vipFree ? '领取成功' : '购买成功' });
  } catch (error) {
    if (error.message === '情绪币余额不足' || error.message === '该权益已拥有，无需重复购买' || error.message === '商品不存在') {
      return res.status(400).json({ code: 40011, message: error.message });
    }
    next(error);
  }
};

/**
 * 消耗按次权益
 */
export const consumeEmotionCoinItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemKey } = req.body;
    const result = await VipService.consumeEmotionCoinItem(userId, itemKey);
    res.json({ code: 0, data: result, message: result.vipFree ? 'VIP 免费使用' : '使用成功' });
  } catch (error) {
    if (error.message === '商品不存在' || error.message === '该权益无需按次消耗' || error.message === '该权益次数不足，请先购买') {
      return res.status(400).json({ code: 40012, message: error.message });
    }
    next(error);
  }
};
