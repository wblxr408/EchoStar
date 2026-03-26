import api from './index';
import { reportApiProxy } from './mockProxy';

/**
 * 举报相关 API
 */
export const reportApi = {
  /**
   * 创建举报
   */
  create(targetType, targetId, reason) {
    if (reportApiProxy) {
      return reportApiProxy.create(targetType, targetId, reason);
    }
    return api.post('/reports', { targetType, targetId, reason });
  },

  /**
   * 获取我的举报列表
   */
  getMyReports(params = {}) {
    if (reportApiProxy) {
      return reportApiProxy.getMyReports(params);
    }
    return api.get('/reports/me', { params });
  },

  /**
   * 获取举报列表（管理员）
   * @param {Object} params - { targetType: 'story'|'comment', status?: 'pending'|'approved'|'rejected', page?: number, limit?: number }
   */
  getReports(params = {}) {
    if (reportApiProxy) {
      return reportApiProxy.getReports(params);
    }
    return api.get('/reports', { params });
  },

  /**
   * 获取故事举报列表（管理员）
   */
  getStoryReports(params = {}) {
    if (reportApiProxy) {
      return reportApiProxy.getStoryReports(params);
    }
    return api.get('/reports/stories', { params });
  },

  /**
   * 获取评论举报列表（管理员）
   */
  getCommentReports(params = {}) {
    if (reportApiProxy) {
      return reportApiProxy.getCommentReports(params);
    }
    return api.get('/reports/comments', { params });
  },

  /**
   * 处理举报（管理员）
   */
  handle(reportId, action) {
    if (reportApiProxy) {
      return reportApiProxy.handle(reportId, action);
    }
    return api.post(`/reports/${reportId}/handle`, { action });
  },

  /**
   * 获取举报统计（管理员）
   */
  getStatistics() {
    if (reportApiProxy) {
      return reportApiProxy.getStatistics();
    }
    return api.get('/reports/statistics');
  }
};
