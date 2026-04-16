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
