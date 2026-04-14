import api from "./index";
import { adminApiProxy } from "./mockProxy";

export const adminApi = {
  recommend(storyId, reason) {
    if (adminApiProxy) {
      return adminApiProxy.recommend(storyId, reason);
    }
    return api.post(`/v1/admin/stories/${storyId}/recommend`, { reason });
  },

  unrecommend(storyId, reason) {
    if (adminApiProxy) {
      return adminApiProxy.unrecommend(storyId, reason);
    }
    return api.post(`/v1/admin/stories/${storyId}/unrecommend`, { reason });
  },

  shadowban(storyId, reason) {
    if (adminApiProxy) {
      return adminApiProxy.shadowban(storyId, reason);
    }
    return api.post(`/v1/admin/stories/${storyId}/shadowban`, { reason });
  },

  restore(storyId) {
    if (adminApiProxy) {
      return adminApiProxy.restore(storyId);
    }
    return api.post(`/v1/admin/stories/${storyId}/restore`);
  },

  banUser(userId, reason) {
    if (adminApiProxy) {
      return adminApiProxy.banUser(userId, reason);
    }
    return api.post(`/v1/admin/users/${userId}/ban`, { reason });
  },

  unbanUser(userId) {
    if (adminApiProxy) {
      return adminApiProxy.unbanUser(userId);
    }
    return api.post(`/v1/admin/users/${userId}/unban`);
  },

  getStatistics() {
    if (adminApiProxy) {
      return adminApiProxy.getStatistics();
    }
    return api.get("/v1/admin/statistics");
  },

  getUsers(params = {}) {
    if (adminApiProxy) {
      return adminApiProxy.getUsers(params);
    }
    return api.get("/v1/auth/admin/users", { params });
  },

  upgradeVip(userId, days = 30) {
    if (adminApiProxy) {
      return adminApiProxy.upgradeVip(userId, days);
    }
    return api.post(`/v1/admin/users/${userId}/upgrade-vip`, { days });
  },
};
