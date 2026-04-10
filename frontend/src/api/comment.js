import api from "./index";
import { commentApiProxy } from "./mockProxy";

function normalizeStoryId(storyId) {
  return typeof storyId === "bigint"
    ? storyId.toString()
    : String(storyId).trim();
}

export const commentApi = {
  create(storyId, content) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (commentApiProxy) {
      return commentApiProxy.create(normalizedStoryId, content);
    }
    return api.post("/v1/comments", { storyId: normalizedStoryId, content });
  },

  search(keyword, params = {}) {
    if (commentApiProxy) {
      return commentApiProxy.search(keyword, params);
    }
    return api.get("/v1/comments/search", { params: { keyword, ...params } });
  },

  getMyComments(params = {}) {
    if (commentApiProxy) {
      return commentApiProxy.getMyComments(params);
    }
    return api.get("/v1/comments/me", { params });
  },

  getStoryComments(storyId, params = {}) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (commentApiProxy) {
      return commentApiProxy.getStoryComments(normalizedStoryId, params);
    }
    return api.get(`/v1/comments/story/${normalizedStoryId}`, { params });
  },

  getCount(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (commentApiProxy) {
      return commentApiProxy.getCount(normalizedStoryId);
    }
    return api.get(`/v1/comments/${normalizedStoryId}/count`);
  },

  delete(id) {
    if (commentApiProxy) {
      return commentApiProxy.delete(id);
    }
    return api.delete(`/v1/comments/${id}`);
  },
};
