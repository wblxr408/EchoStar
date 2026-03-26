import api from './index';
import { adminApiProxy } from './mockProxy';

/**
 * 管理员相关 API
 */
export const adminApi = {
  /**
   * 设为推荐
   */
  recommend(storyId, reason) {
    if (adminApiProxy) {
      return adminApiProxy.recommend(storyId, reason);
    }
    return api.post(`/v1/admin/stories/${storyId}/recommend`, { reason });
  },

  /**
   * 取消推荐
   */
  unrecommend(storyId, reason) {
    if (adminApiProxy) {
      return adminApiProxy.unrecommend(storyId, reason);
    }
    return api.post(`/v1/admin/stories/${storyId}/unrecommend`, { reason });
  },

  /**
   * Shadowban 故事
   */
  shadowban(storyId, reason) {
    if (adminApiProxy) {
      return adminApiProxy.shadowban(storyId, reason);
    }
    return api.post(`/v1/admin/stories/${storyId}/shadowban`, { reason });
  },

  /**
   * 恢复故事
   */
  restore(storyId) {
    if (adminApiProxy) {
      return adminApiProxy.restore(storyId);
    }
    return api.post(`/v1/admin/stories/${storyId}/restore`);
  },

  /**
   * 封禁用户
   */
  banUser(userId, reason) {
    if (adminApiProxy) {
      return adminApiProxy.banUser(userId, reason);
    }
    return api.post(`/v1/admin/users/${userId}/ban`, { reason });
  },

  /**
   * 解封用户
   */
  unbanUser(userId) {
    if (adminApiProxy) {
      return adminApiProxy.unbanUser(userId);
    }
    return api.post(`/v1/admin/users/${userId}/unban`);
  },

  /**
   * 数据统计
   */
  getStatistics() {
    if (adminApiProxy) {
      return adminApiProxy.getStatistics();
    }
    return api.get('/v1/admin/statistics');
  },

  /**
   * 获取管理员用户列表
   * 通过 authApi.getAdminUsers 实现
   */
  getUsers(params = {}) {
    if (adminApiProxy) {
      return adminApiProxy.getUsers(params);
    }
    return api.get('/v1/auth/admin/users', { params });
  }
};
