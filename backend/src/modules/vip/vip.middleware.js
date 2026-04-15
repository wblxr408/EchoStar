import { VipService } from './vip.service.js';

/**
 * 要求VIP权限中间件
 */
export const requireVip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isVip } = await VipService.checkUserVipStatus(userId);

    if (!isVip) {
      return res.status(403).json({
        code: 403,
        message: '此功能仅限VIP会员使用'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 可选VIP检查（将VIP状态附加到req对象）
 */
export const optionalVipCheck = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      req.isVip = false;
      return next();
    }

    const { isVip, expiresAt } = await VipService.checkUserVipStatus(userId);
    req.isVip = isVip;
    req.vipExpiresAt = expiresAt;
    next();
  } catch (error) {
    req.isVip = false;
    next();
  }
};
