import { VipOrder } from './vip.model.js';
import { User } from '../auth/auth.model.js';
import { clearUserCache } from '../auth/auth.middleware.js';
import { Op } from 'sequelize';

// 激活码配置：key为激活码，value为VIP天数
const ACTIVATION_CODES = new Map([
  ['_echostar', 30],
]);

export const VipService = {
  /**
   * 使用激活码开通/续费VIP
   * @param {number} userId - 用户ID
   * @param {string} code - 激活码
   * @returns {Promise<{success: boolean, message: string, expiresAt?: Date}>}
   */
  async activateByCode(userId, code) {
    if (!code || typeof code !== 'string') {
      return { success: false, message: '请输入有效的激活码' };
    }

    const days = ACTIVATION_CODES.get(code.trim());
    if (!days) {
      return { success: false, message: '激活码无效，请检查后重试' };
    }

    // 复用升级逻辑
    try {
      const result = await this.upgradeUserToVip(userId, null, days);
      return {
        success: true,
        message: `VIP激活成功，获得${days}天会员时长`,
        expiresAt: result.expiresAt,
      };
    } catch (err) {
      return { success: false, message: err.message || '激活失败，请稍后重试' };
    }
  },

  /**
   * 检查用户VIP状态（供其他模块调用）
   * @param {number} userId - 用户ID
   * @returns {Promise<{isVip: boolean, expiresAt?: Date}>}
   */
  async checkUserVipStatus(userId) {
    // 查询最新的有效VIP订单
    const vipOrder = await VipOrder.findOne({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date()  // 未过期
        }
      },
      order: [['expiresAt', 'DESC']]
    });

    return {
      isVip: !!vipOrder,
      expiresAt: vipOrder?.expiresAt
    };
  },

  /**
   * 升级用户为VIP
   * @param {number} userId - 用户ID
   * @param {number} adminId - 管理员ID
   * @param {number} days - VIP天数
   */
  async upgradeUserToVip(userId, adminId, days = 30) {
    // 1. 查询用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 2. 检查是否已有未过期的VIP订单
    const existingVip = await VipOrder.findOne({
      where: {
        userId,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    let expiresAt;
    if (existingVip) {
      // 已有VIP，在原到期时间基础上延长
      expiresAt = new Date(existingVip.expiresAt);
      expiresAt.setDate(expiresAt.getDate() + days);

      // 标记旧订单为失效
      await existingVip.update({ isActive: false });
    } else {
      // 新开通VIP
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    // 3. 创建VIP订单
    await VipOrder.create({
      userId,
      adminId,
      expiresAt,
      isActive: true
    });

    // 4. 更新用户VIP状态
    await user.update({ vip: 1 });

    // 5. 清除用户缓存
    await clearUserCache(userId);

    return {
      userId,
      vip: 1,
      expiresAt
    };
  },

  /**
   * 取消用户VIP（管理员手动取消或自动过期）
   * @param {number} userId - 用户ID
   */
  async cancelUserVip(userId) {
    // 1. 查询用户
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 2. 失效所有VIP订单
    await VipOrder.update(
      { isActive: false },
      {
        where: {
          userId,
          isActive: true
        }
      }
    );

    // 3. 更新用户VIP状态
    await user.update({ vip: 0 });

    // 4. 清除用户缓存
    await clearUserCache(userId);

    return { success: true, message: 'VIP已取消' };
  },

  /**
   * 获取用户VIP订单历史
   * @param {number} userId - 用户ID
   */
  async getUserVipHistory(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await VipOrder.findAndCountAll({
      where: { userId },
      include: [{
        model: User,
        as: 'admin',
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      orders: rows.map(order => ({
        id: order.id,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
        isActive: order.isActive,
        admin: order.admin?.username || '系统'
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }
};
