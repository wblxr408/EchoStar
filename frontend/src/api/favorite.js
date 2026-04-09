import api from "./index";
import { favoriteApiProxy } from "./mockProxy";

function normalizeStoryId(storyId) {
  return typeof storyId === "bigint"
    ? storyId.toString()
    : String(storyId).trim();
}

export const favoriteApi = {
  toggle(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (favoriteApiProxy) {
      return favoriteApiProxy.toggle(normalizedStoryId);
    }
    return api.post("/v1/favorites", { storyId: normalizedStoryId });
  },

  create(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (favoriteApiProxy) {
      return favoriteApiProxy.create(normalizedStoryId);
    }
    return api.post("/v1/favorites/create", { storyId: normalizedStoryId });
  },

  remove(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (favoriteApiProxy) {
      return favoriteApiProxy.remove(normalizedStoryId);
    }
    return api.delete(`/v1/favorites/${normalizedStoryId}`);
  },

  getStoryFavorites(storyId, params = {}) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (favoriteApiProxy) {
      return favoriteApiProxy.getStoryFavorites(normalizedStoryId, params);
    }
    return api.get(`/v1/favorites/story/${normalizedStoryId}`, { params });
  },

  check(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (favoriteApiProxy) {
      return favoriteApiProxy.check(normalizedStoryId);
    }
    return api.get(`/v1/favorites/${normalizedStoryId}/check`);
  },

  getCount(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);
    if (favoriteApiProxy) {
      return favoriteApiProxy.getCount(normalizedStoryId);
    }
    return api.get(`/v1/favorites/${normalizedStoryId}/count`);
  },

  getMyFavorites(params = {}) {
    if (favoriteApiProxy) {
      return favoriteApiProxy.getMyFavorites(params);
    }
    return api.get("/v1/favorites/me", { params });
  },

  checkMultiple(storyIds) {
    const normalizedStoryIds = Array.isArray(storyIds)
      ? storyIds.map((storyId) => normalizeStoryId(storyId))
      : [];
    if (favoriteApiProxy) {
      return favoriteApiProxy.checkMultiple(normalizedStoryIds);
    }
    return api.post("/v1/favorites/check-multiple", {
      storyIds: normalizedStoryIds,
    });
  },
};
