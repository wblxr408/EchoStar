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

  polishStory(storyId) {
    return api.post(`/stories/${storyId}/polish`);
  },

  /**
   * 保存/更新VIP评论背景设置
   * PUT /v1/vip/comment-bg
   * Body: { commentBg: { type, color, gradientColor, useGradient } }
   */
  saveCommentBg(commentBg) {
    return api.put('/v1/vip/comment-bg', { commentBg });
  },

  /**
   * 获取用户字体设置
   * GET /v1/vip/fonts
   */
  getFontSettings() {
    return api.get('/v1/vip/fonts');
  },

  /**
   * 保存/更新用户字体设置
   * PUT /v1/vip/fonts
   * Body: { fontFamily: string, fontEffect: string }
   */
  saveFontSettings(fontFamily, fontEffect) {
    return api.put('/v1/vip/fonts', { fontFamily, fontEffect });
  },

  /**
   * 获取个人资料背景设置
   * GET /v1/vip/profile-bg
   */
  getProfileBg() {
    return api.get('/v1/vip/profile-bg');
  },

  /**
   * 保存/更新个人资料背景设置
   * PUT /v1/vip/profile-bg
   * Body: { profileBg: object }
   */
  saveProfileBg(profileBg) {
    return api.put('/v1/vip/profile-bg', { profileBg });
  },
};
