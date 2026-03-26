import api from './index';
import { notificationApiProxy } from './mockProxy';

/**
 * 通知相关 API
 */
export const notificationApi = {
  /**
   * 获取我的通知列表
   */
  getMyNotifications(params = {}) {
    if (notificationApiProxy) {
      return notificationApiProxy.getMyNotifications(params);
    }
    return api.get('/v1/notifications/me', { params });
  },

  /**
   * 获取未读通知数量
   */
  getUnreadCount() {
    if (notificationApiProxy) {
      return notificationApiProxy.getUnreadCount();
    }
    return api.get('/v1/notifications/me/unread-count');
  },

  /**
   * 标记所有通知为已读
   */
  markAllRead() {
    if (notificationApiProxy) {
      return notificationApiProxy.markAllRead();
    }
    return api.put('/v1/notifications/me/mark-read');
  },

  /**
   * 清空所有通知
   */
  clearAll() {
    if (notificationApiProxy) {
      return notificationApiProxy.clearAll();
    }
    return api.delete('/v1/notifications/me');
  },

  /**
   * 标记单条通知为已读
   */
  markRead(id) {
    if (notificationApiProxy) {
      return notificationApiProxy.markRead(id);
    }
    return api.put(`/v1/notifications/${id}/mark-read`);
  }
};
