import api from './index';

export const vipApi = {
  /**
   * 获取当前用户 VIP 状态
   * GET /v1/vip/status
   * Response: { isVip: boolean, expiresAt?: string }
   */
  getStatus() {
    return api.get('/v1/vip/status');
  },

  getEconomy() {
    return api.get('/v1/vip/economy');
  },

  /**
   * 获取用户 VIP 订单历史
   * GET /v1/vip/history
   * Response: { orders: [...], pagination: {...} }
   */
  getHistory(params = {}) {
    return api.get('/v1/vip/history', { params });
  },

  /**
   * 使用激活码激活 VIP
   * POST /v1/vip/activate
   * Body: { code: string }
   * Response: { code: 0, data: { isVip, expiresAt }, message: string }
   */
  activateByCode(code) {
    return api.post('/v1/vip/activate', { code });
  },

  claimDailyCheckIn() {
    return api.post('/v1/vip/economy/check-in');
  },

  rechargeCoins(packageKey) {
    return api.post('/v1/vip/economy/recharge', { packageKey });
  },

  purchaseItem(itemKey) {
    return api.post('/v1/vip/economy/purchase', { itemKey });
  },

  consumeItem(itemKey) {
    return api.post('/v1/vip/economy/consume', { itemKey });
  },

  purchaseVip(packageKey) {
    return api.post('/v1/vip/economy/purchase-vip', { packageKey });
  },
};
