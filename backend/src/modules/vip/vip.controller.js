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
