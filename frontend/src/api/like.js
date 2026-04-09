import api from "./index";
import { likeApiProxy } from "./mockProxy";

function normalizeStoryId(storyId) {
  return typeof storyId === "bigint"
    ? storyId.toString()
    : String(storyId).trim();
}

export const likeApi = {
  toggle(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.toggle(normalizedStoryId);
    }

    return api.post("/v1/likes", { storyId: normalizedStoryId });
  },

  create(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.create(normalizedStoryId);
    }

    return api.post("/v1/likes/create", { storyId: normalizedStoryId });
  },

  remove(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.remove(normalizedStoryId);
    }

    return api.delete(`/v1/likes/${normalizedStoryId}`);
  },

  getStoryLikes(storyId, params = {}) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.getStoryLikes(normalizedStoryId, params);
    }

    return api.get(`/v1/likes/story/${normalizedStoryId}`, { params });
  },

  check(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.check(normalizedStoryId);
    }

    return api.get(`/v1/likes/${normalizedStoryId}/check`);
  },

  getCount(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.getCount(normalizedStoryId);
    }

    return api.get(`/v1/likes/${normalizedStoryId}/count`);
  },

  getMyLikes(params = {}) {
    if (likeApiProxy) {
      return likeApiProxy.getMyLikes(params);
    }

    return api.get("/v1/likes/me", { params });
  },

  checkMultiple(storyIds) {
    const normalizedStoryIds = Array.isArray(storyIds)
      ? storyIds.map((storyId) => normalizeStoryId(storyId))
      : [];

    if (likeApiProxy) {
      return likeApiProxy.checkMultiple(normalizedStoryIds);
    }

    return api.post("/v1/likes/check-multiple", {
      storyIds: normalizedStoryIds,
    });
  },
};
