import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { clearUserCache } from '../auth/auth.middleware.js';
import { User } from '../auth/auth.model.js';
import { EmotionCoinInventory, EmotionCoinLedger, VipOrder } from './vip.model.js';

const ACTIVATION_CODES = new Map([
  ['_echostar', 30],
]);

const DAILY_CHECK_IN_REWARDS = [
  { amount: 30, probability: 0.7 },
  { amount: 66, probability: 0.15 },
  { amount: 188, probability: 0.08 },
  { amount: 520, probability: 0.04 },
  { amount: 1314, probability: 0.02 },
  { amount: 5200, probability: 0.0095 },
  { amount: 10000, probability: 0.0005 }
];

const COIN_RULES = {
  earn: {
    dailyLogin: {
      overview: '每日签到概率获得30-10000币，快来试试吧。',
      rewards: DAILY_CHECK_IN_REWARDS
    }
  },
  vipPackages: [
    { key: 'vip_weekly', name: '周卡', cost: 150, days: 7 },
    { key: 'vip_monthly', name: '月卡', cost: 400, days: 30 },
    { key: 'vip_quarterly', name: '季卡', cost: 900, days: 90 },
    { key: 'vip_yearly', name: '年卡', cost: 2000, days: 365 }
  ],
  rechargePackages: [
    { key: 'topup_6', label: '6元', priceCny: 6, coins: 60 },
    { key: 'topup_30', label: '30元', priceCny: 30, coins: 350 },
    { key: 'topup_98', label: '98元', priceCny: 98, coins: 1200 }
  ],
  storeItems: [
    {
      key: 'footprint_animation',
      name: '我的足迹',
      description: '非VIP 20币/次，VIP免费',
      cost: 20,
      type: 'consumable',
      vipFree: true
    },
    {
      key: 'message_polish',
      name: '擦亮故事',
      description: '非VIP 30币/次，VIP免费',
      cost: 30,
      type: 'consumable',
      vipFree: true
    },
    {
      key: 'bubble_decor_7d',
      name: '气泡装饰与装扮',
      description: '非VIP 100币/7天，VIP免费',
      cost: 100,
      type: 'timed',
      durationDays: 7,
      vipFree: true
    },
    {
      key: 'theme_skin',
      name: '主题皮肤',
      description: '非VIP 500币永久，VIP免费',
      cost: 500,
      type: 'permanent',
      vipFree: true
    }
  ]
};

function isSameLocalDay(left, right) {
  if (!left || !right) return false;
  const a = new Date(left);
  const b = new Date(right);
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function drawDailyCheckInReward() {
  const roll = Math.random();
  let cursor = 0;

  for (const reward of DAILY_CHECK_IN_REWARDS) {
    cursor += reward.probability;
    if (roll < cursor) {
      return reward.amount;
    }
  }

  return DAILY_CHECK_IN_REWARDS[DAILY_CHECK_IN_REWARDS.length - 1].amount;
}

function normalizeInventoryItem(record) {
  const expiresAt = record.expiresAt || null;
  const now = Date.now();
  return {
    id: record.id,
    itemKey: record.itemKey,
    quantity: record.quantity,
    expiresAt,
    metadata: record.metadata || {},
    isActive: !expiresAt || new Date(expiresAt).getTime() > now
  };
}

async function updateInventoryForPurchase(userId, item, transaction, metadata = {}) {
  const existing = await EmotionCoinInventory.findOne({
    where: { userId, itemKey: item.key },
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  let expiresAt = null;
  if (item.type === 'timed') {
    const base = existing?.expiresAt && new Date(existing.expiresAt) > new Date()
      ? new Date(existing.expiresAt)
      : new Date();
    base.setDate(base.getDate() + (item.durationDays || 0));
    expiresAt = base;
  }

  if (existing) {
    if (item.type === 'permanent') {
      return existing;
    }

    await existing.update({
      quantity: item.type === 'timed' ? existing.quantity : existing.quantity + 1,
      expiresAt: expiresAt || existing.expiresAt,
      metadata: {
        ...(existing.metadata || {}),
        ...(metadata || {}),
        lastPurchasedAt: new Date().toISOString()
      }
    }, { transaction });
    return existing;
  }

  return EmotionCoinInventory.create({
    userId,
    itemKey: item.key,
    quantity: 1,
    expiresAt,
    metadata: {
      ...(metadata || {}),
      firstPurchasedAt: new Date().toISOString()
    }
  }, { transaction });
}

export const VipService = {
  getEconomyConfig() {
    return {
      earnRules: {
        dailyLogin: `每日签到${COIN_RULES.earn.dailyLogin.min}-${COIN_RULES.earn.dailyLogin.max}币`,
        recharge: 'RMB充值获取情绪币'
      },
      rechargePackages: COIN_RULES.rechargePackages,
      storeItems: COIN_RULES.storeItems,
      vipPackages: COIN_RULES.vipPackages,
      vipBenefits: [
        '我的足迹动画免费使用',
        '擦亮故事免费不限次',
        '气泡装饰免费使用',
        '主题皮肤可免费领取'
      ]
    };
  },

  async activateByCode(userId, code) {
    if (!code || typeof code !== 'string') {
      return { success: false, message: '请输入有效的激活码' };
    }

    const days = ACTIVATION_CODES.get(code.trim());
    if (!days) {
      return { success: false, message: '激活码无效，请检查后重试' };
    }

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

  async checkUserVipStatus(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'vip', 'emotionCoins', 'lastCheckInAt', 'checkInStreak', 'commentBg']
    });

    const vipOrder = await VipOrder.findOne({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date()
        }
      },
      order: [['expiresAt', 'DESC']]
    });

    return {
      isVip: !!vipOrder,
      expiresAt: vipOrder?.expiresAt || null,
      emotionCoins: user?.emotionCoins || 0,
      lastCheckInAt: user?.lastCheckInAt || null,
      checkInStreak: user?.checkInStreak || 0,
      commentBg: user?.commentBg || null
    };
  },

  async upgradeUserToVip(userId, adminId, days = 30) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const existingVip = await VipOrder.findOne({
      where: {
        userId,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    let expiresAt;
    if (existingVip) {
      expiresAt = new Date(existingVip.expiresAt);
      expiresAt.setDate(expiresAt.getDate() + days);
      await existingVip.update({ isActive: false });
    } else {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    await VipOrder.create({
      userId,
      adminId,
      expiresAt,
      isActive: true
    });

    await user.update({ vip: 1 });
    await clearUserCache(userId);

    return {
      userId,
      vip: 1,
      expiresAt
    };
  },

  async cancelUserVip(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    await VipOrder.update(
      { isActive: false },
      {
        where: {
          userId,
          isActive: true
        }
      }
    );

    await user.update({ vip: 0 });
    await clearUserCache(user.id);

    return { success: true, message: 'VIP已取消' };
  },

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
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
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
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit)
      }
    };
  },

  async getEmotionCoinProfile(userId) {
    const [status, ledgerRows, inventoryRows] = await Promise.all([
      this.checkUserVipStatus(userId),
      EmotionCoinLedger.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 20
      }),
      EmotionCoinInventory.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']]
      })
    ]);

    return {
      ...status,
      economy: this.getEconomyConfig(),
      ledger: ledgerRows.map((row) => ({
        id: row.id,
        direction: row.direction,
        amount: row.amount,
        balanceAfter: row.balanceAfter,
        source: row.source,
        title: row.title,
        referenceId: row.referenceId,
        metadata: row.metadata || {},
        createdAt: row.createdAt
      })),
      inventory: inventoryRows.map(normalizeInventoryItem)
    };
  },

  async appendLedgerAndBalance(userId, payload, transaction) {
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const nextBalance = (user.emotionCoins || 0) + payload.amount;
    if (nextBalance < 0) {
      throw new Error('情绪币余额不足');
    }

    await user.update({ emotionCoins: nextBalance }, { transaction });

    const record = await EmotionCoinLedger.create({
      userId,
      direction: payload.direction,
      amount: payload.amount,
      balanceAfter: nextBalance,
      source: payload.source,
      title: payload.title,
      referenceId: payload.referenceId || null,
      metadata: payload.metadata || {}
    }, { transaction });

    return { user, record, balanceAfter: nextBalance };
  },

  async grantEmotionCoins(userId, {
    amount,
    source,
    title,
    referenceId = null,
    metadata = {},
    allowDuplicate = false
  }) {
    if (!amount || amount <= 0) {
      return { granted: 0, skipped: true, reason: 'invalid_amount' };
    }

    return sequelize.transaction(async (transaction) => {
      if (!allowDuplicate && referenceId) {
        const existing = await EmotionCoinLedger.findOne({
          where: { userId, source, referenceId },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (existing) {
          return { granted: 0, skipped: true, reason: 'duplicate' };
        }
      }

      const result = await this.appendLedgerAndBalance(userId, {
        direction: 'earn',
        amount,
        source,
        title,
        referenceId,
        metadata
      }, transaction);

      await clearUserCache(userId);

      return {
        granted: amount,
        balanceAfter: result.balanceAfter,
        recordId: result.record.id
      };
    });
  },

  async spendEmotionCoins(userId, {
    amount,
    source,
    title,
    referenceId = null,
    metadata = {}
  }) {
    if (!amount || amount <= 0) {
      throw new Error('无效的扣费金额');
    }

    const result = await sequelize.transaction(async (transaction) => {
      return this.appendLedgerAndBalance(userId, {
        direction: 'spend',
        amount: -Math.abs(amount),
        source,
        title,
        referenceId,
        metadata
      }, transaction);
    });

    await clearUserCache(userId);
    return result;
  },

  async claimDailyCheckIn(userId) {
    return sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      if (user.lastCheckInAt && isSameLocalDay(user.lastCheckInAt, new Date())) {
        throw new Error('今日已签到');
      }

      const reward = drawDailyCheckInReward();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const nextStreak = user.lastCheckInAt && isSameLocalDay(user.lastCheckInAt, yesterday)
        ? (user.checkInStreak || 0) + 1
        : 1;

      const dateKey = new Date().toISOString().slice(0, 10);
      const existing = await EmotionCoinLedger.findOne({
        where: {
          userId,
          source: 'daily_check_in',
          referenceId: dateKey
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (existing) {
        throw new Error('今日已签到');
      }

      await user.update({
        lastCheckInAt: new Date(),
        checkInStreak: nextStreak
      }, { transaction });

      const result = await this.appendLedgerAndBalance(userId, {
        direction: 'earn',
        amount: reward,
        source: 'daily_check_in',
        title: '每日登录奖励',
        referenceId: dateKey,
        metadata: { streak: nextStreak }
      }, transaction);

      await clearUserCache(userId);

      return {
        reward,
        streak: nextStreak,
        balanceAfter: result.balanceAfter
      };
    });
  },

  async rechargeEmotionCoins(userId, packageKey) {
    const pkg = COIN_RULES.rechargePackages.find((item) => item.key === packageKey);
    if (!pkg) {
      throw new Error('充值套餐不存在');
    }

    const result = await sequelize.transaction(async (transaction) => {
      return this.appendLedgerAndBalance(userId, {
        direction: 'recharge',
        amount: pkg.coins,
        source: 'coin_recharge',
        title: `充值${pkg.label}获得${pkg.coins}币`,
        referenceId: `${packageKey}:${Date.now()}`,
        metadata: pkg
      }, transaction);
    });

    await clearUserCache(userId);

    return {
      packageKey,
      coins: pkg.coins,
      balanceAfter: result.balanceAfter
    };
  },

  async purchaseVipWithCoins(userId, packageKey) {
    if (!packageKey) {
      throw new Error('请选择要购买的VIP套餐');
    }

    const selectedPackage = COIN_RULES.vipPackages.find((item) => item.key === packageKey);
    if (!selectedPackage) {
      throw new Error('VIP套餐不存在');
    }

    const cost = Number(selectedPackage.cost);
    const days = Number(selectedPackage.days);
    const name = selectedPackage.name;

    return sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      if ((user.emotionCoins || 0) < cost) {
        throw new Error(`情绪币不足，购买VIP需要${cost}币`);
      }

      // 扣减情绪币
      const result = await this.appendLedgerAndBalance(userId, {
        direction: 'spend',
        amount: -cost,
        source: 'vip_purchase',
        title: `购买${days}天VIP`,
        referenceId: `vip_purchase:${packageKey}:${Date.now()}`,
        metadata: { packageKey, name, cost, days }
      }, transaction);

      // 升级VIP
      const existingVip = await VipOrder.findOne({
        where: {
          userId,
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        },
        transaction
      });

      let expiresAt;
      if (existingVip) {
        expiresAt = new Date(existingVip.expiresAt);
        expiresAt.setDate(expiresAt.getDate() + days);
        await existingVip.update({ isActive: false }, { transaction });
      } else {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      await VipOrder.create({
        userId,
        adminId: null,
        expiresAt,
        isActive: true
      }, { transaction });

      await user.update({ vip: 1 }, { transaction });
      await clearUserCache(userId);

      return {
        packageKey,
        packageName: name,
        isVip: true,
        expiresAt,
        cost,
        days,
        balanceAfter: result.balanceAfter
      };
    });
  },

  async purchaseEmotionCoinItem(userId, itemKey) {
    const item = COIN_RULES.storeItems.find((entry) => entry.key === itemKey);
    if (!item) {
      throw new Error('商品不存在');
    }

    const status = await this.checkUserVipStatus(userId);
    const isVipFree = Boolean(status.isVip && item.vipFree);
    const effectiveCost = isVipFree ? 0 : item.cost;

    return sequelize.transaction(async (transaction) => {
      const existingInventory = await EmotionCoinInventory.findOne({
        where: { userId, itemKey },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (item.type === 'permanent' && existingInventory) {
        throw new Error('该权益已拥有，无需重复购买');
      }

      if (effectiveCost > 0) {
        await this.appendLedgerAndBalance(userId, {
          direction: 'spend',
          amount: -effectiveCost,
          source: `purchase_${item.key}`,
          title: `购买${item.name}`,
          referenceId: `${item.key}:${Date.now()}`,
          metadata: { itemKey: item.key, itemType: item.type }
        }, transaction);
      } else {
        await EmotionCoinLedger.create({
          userId,
          direction: 'gift',
          amount: 0,
          balanceAfter: status.emotionCoins || 0,
          source: `vip_claim_${item.key}`,
          title: `VIP领取${item.name}`,
          referenceId: `${item.key}:${Date.now()}`,
          metadata: { itemKey: item.key }
        }, { transaction });
      }

      await updateInventoryForPurchase(userId, item, transaction, {
        cost: effectiveCost,
        vipFree: isVipFree
      });

      return {
        itemKey,
        itemName: item.name,
        cost: effectiveCost,
        vipFree: isVipFree
      };
    }).then(async (result) => {
      // ✅ 修复：在transaction成功后清除缓存
      await clearUserCache(userId);
      return result;
    }).catch(async (err) => {
      // ✅ 修复：确保错误时也清除缓存
      await clearUserCache(userId);
      throw err;
    });
  },

  async consumeEmotionCoinItem(userId, itemKey) {
    const item = COIN_RULES.storeItems.find((entry) => entry.key === itemKey);
    if (!item) {
      throw new Error('商品不存在');
    }

    if (item.type !== 'consumable') {
      throw new Error('该权益无需按次消耗');
    }

    const status = await this.checkUserVipStatus(userId);
    if (item.vipFree && status.isVip) {
      return {
        itemKey,
        itemName: item.name,
        vipFree: true,
        remainingQuantity: Number.POSITIVE_INFINITY
      };
    }

    const result = await sequelize.transaction(async (transaction) => {
      const inventory = await EmotionCoinInventory.findOne({
        where: { userId, itemKey },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!inventory || Number(inventory.quantity || 0) <= 0) {
        throw new Error('该权益次数不足，请先购买');
      }

      const nextQuantity = Math.max(0, Number(inventory.quantity || 0) - 1);

      if (nextQuantity === 0) {
        await inventory.destroy({ transaction });
      } else {
        await inventory.update({
          quantity: nextQuantity,
          metadata: {
            ...(inventory.metadata || {}),
            lastConsumedAt: new Date().toISOString()
          }
        }, { transaction });
      }

      const user = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      await EmotionCoinLedger.create({
        userId,
        direction: 'gift',
        amount: 0,
        balanceAfter: user?.emotionCoins || 0,
        source: `consume_${item.key}`,
        title: `使用${item.name}`,
        referenceId: `${item.key}:${Date.now()}`,
        metadata: { itemKey: item.key }
      }, { transaction });

      return {
        itemKey,
        itemName: item.name,
        vipFree: false,
        remainingQuantity: nextQuantity
      };
    });

    await clearUserCache(userId);
    return result;
  },

  /**
   * 保存/更新用户评论背景设置（仅VIP）
   */
  async saveCommentBg(userId, commentBg) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // ✅ 修复：同时检查VIP状态和有效期
    const vipStatus = await this.checkUserVipStatus(userId);
    if (!vipStatus.isVip) {
      throw new Error('仅VIP用户可设置评论背景');
    }

    await user.update({ commentBg });

    await clearUserCache(userId);

    return {
      commentBg: user.commentBg
    };
  },

  /**
   * 获取用户字体设置
   */
  async getUserFontSettings(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'bioFontFamily', 'bioFontEffect']
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      fontFamily: user.bioFontFamily || '',
      fontEffect: user.bioFontEffect || ''
    };
  },

  /**
   * 保存/更新用户字体设置（仅VIP）
   */
  async saveFontSettings(userId, { fontFamily, fontEffect }) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // ✅ 修复：同时检查VIP状态和有效期
    const vipStatus = await this.checkUserVipStatus(userId);
    if (!vipStatus.isVip) {
      throw new Error('仅VIP用户可设置字体');
    }

    await user.update({
      bioFontFamily: fontFamily,
      bioFontEffect: fontEffect || ''
    });

    await clearUserCache(userId);

    return {
      fontFamily: user.bioFontFamily,
      fontEffect: user.bioFontEffect
    };
  },


};
