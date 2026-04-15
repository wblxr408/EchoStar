import { VipOrder } from '../modules/vip/vip.model.js';
import { User } from '../modules/auth/auth.model.js';
import { clearUserCache } from '../modules/auth/auth.middleware.js';
import { Op } from 'sequelize';
import logger from '../common/utils/logger.js';

/**
 * 检查VIP过期任务
 * 每日凌晨执行，将过期的VIP订单标记为失效，并更新用户状态
 */
export async function checkVipExpiry() {
  try {
    logger.info('🔄 开始检查VIP过期...');

    // 1. 查询所有已过期但仍标记为有效的VIP订单
    const expiredOrders = await VipOrder.findAll({
      where: {
        isActive: true,
        expiresAt: {
          [Op.lt]: new Date()  // 到期时间小于当前时间
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'vip']
      }]
    });

    if (expiredOrders.length === 0) {
      logger.info('✅ 没有过期的VIP订单');
      return;
    }

    logger.info(`📋 发现 ${expiredOrders.length} 个过期的VIP订单`);

    // 2. 批量处理过期订单
    for (const order of expiredOrders) {
      // 标记订单为失效
      await order.update({ isActive: false });

      // 检查用户是否还有其他有效的VIP订单
      const hasActiveVip = await VipOrder.findOne({
        where: {
          userId: order.userId,
          isActive: true,
          id: { [Op.ne]: order.id },  // 排除当前订单
          expiresAt: { [Op.gt]: new Date() }
        }
      });

      // 如果没有其他有效VIP订单，则将用户VIP状态改为0
      if (!hasActiveVip && order.user?.vip === 1) {
        await order.user.update({ vip: 0 });

        // 清除用户缓存
        await clearUserCache(order.userId);

        logger.info(`✅ 用户 ${order.userId} VIP已过期，状态已更新`);
      }
    }

    logger.info(`✅ VIP过期检查完成，处理了 ${expiredOrders.length} 个订单`);
  } catch (error) {
    logger.error('❌ VIP过期检查失败:', error);
    throw error;
  }
}
