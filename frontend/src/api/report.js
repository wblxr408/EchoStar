import api from "./index";
import { reportApiProxy } from "./mockProxy";

function normalizeTargetId(targetId) {
  return typeof targetId === "bigint"
    ? targetId.toString()
    : String(targetId).trim();
}

export const reportApi = {
  create(targetType, targetId, reason) {
    const normalizedTargetId = normalizeTargetId(targetId);
    if (reportApiProxy) {
      return reportApiProxy.create(targetType, normalizedTargetId, reason);
    }
    return api.post("/v1/reports", {
      targetType,
      targetId: normalizedTargetId,
      reason,
    });
  },

  getMyReports(params = {}) {
    if (reportApiProxy) {
      return reportApiProxy.getMyReports(params);
    }
    return api.get("/v1/reports/me", { params });
  },

  getReports(params = {}) {
    if (reportApiProxy) {
      return reportApiProxy.getReports(params);
    }
    return api.get("/v1/reports", { params });
  },

  getStoryReports(params = {}) {
    if (reportApiProxy) {
      return reportApiProxy.getStoryReports(params);
    }
    return api.get("/v1/reports/stories", { params });
  },

  getCommentReports(params = {}) {
    if (reportApiProxy) {
      return reportApiProxy.getCommentReports(params);
    }
    return api.get("/v1/reports/comments", { params });
  },

  handle(reportId, action) {
    if (reportApiProxy) {
      return reportApiProxy.handle(reportId, action);
    }
    return api.post(`/v1/reports/${reportId}/handle`, { action });
  },

  getStatistics() {
    if (reportApiProxy) {
      return reportApiProxy.getStatistics();
    }
    return api.get("/v1/reports/statistics");
  },
};
