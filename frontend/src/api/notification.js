import api from "./index";
import { notificationApiProxy } from "./mockProxy";

export const notificationApi = {
  getMyNotifications(params = {}) {
    if (notificationApiProxy) {
      return notificationApiProxy.getMyNotifications(params);
    }
    return api.get("/v1/notifications/me", { params });
  },

  getUnreadCount() {
    if (notificationApiProxy) {
      return notificationApiProxy.getUnreadCount();
    }
    return api.get("/v1/notifications/me/unread-count");
  },

  markAllRead() {
    if (notificationApiProxy) {
      return notificationApiProxy.markAllRead();
    }
    return api.put("/v1/notifications/me/mark-read");
  },

  clearAll() {
    if (notificationApiProxy) {
      return notificationApiProxy.clearAll();
    }
    return api.delete("/v1/notifications/me");
  },

  markRead(id) {
    if (notificationApiProxy) {
      return notificationApiProxy.markRead(id);
    }
    return api.put(`/v1/notifications/${id}/mark-read`);
  },
};
