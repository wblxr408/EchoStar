import api from "./index";
import { storyApiProxy } from "./mockProxy";

export const storyApi = {
  createStory(data) {
    if (storyApiProxy) {
      return storyApiProxy.createStory(data);
    }
    return api.post("/v1/stories", data);
  },

  getStoryById(id) {
    if (storyApiProxy) {
      return storyApiProxy.getStoryById(id);
    }
    return api.get(`/v1/stories/${id}`);
  },

  deleteStory(id) {
    if (storyApiProxy) {
      return storyApiProxy.deleteStory(id);
    }
    return api.delete(`/v1/stories/${id}`);
  },

  updateStory(id, data) {
    if (storyApiProxy) {
      return storyApiProxy.updateStory(id, data);
    }
    return api.post(`/v1/stories/${id}`, data);
  },

  updateVisibility(id, visibility) {
    if (storyApiProxy) {
      return storyApiProxy.updateVisibility(id, visibility);
    }
    return api.put(`/v1/stories/${id}/visibility`, { visibility });
  },

  getMyStories(params) {
    if (storyApiProxy) {
      return storyApiProxy.getMyStories(params);
    }
    return api.get("/v1/stories/me/list", { params });
  },

  searchStories(keyword, params = {}) {
    if (storyApiProxy) {
      return storyApiProxy.searchStories(keyword, params);
    }
    return api.get("/v1/stories/search", { params: { keyword, ...params } });
  },

  unlockTimeCapsule(id) {
    if (storyApiProxy) {
      return storyApiProxy.unlockTimeCapsule(id);
    }
    return api.post(`/v1/stories/${id}/unlock`);
  },

  getUploadToken() {
    if (storyApiProxy) {
      return storyApiProxy.getUploadToken();
    }
    return api.get("/v1/stories/upload-token");
  },

  getFeaturedStories(params = {}) {
    if (storyApiProxy) {
      return storyApiProxy.getFeaturedStories(params);
    }
    return api.get("/v1/stories/featured", { params });
  },

  getAdminStories(params = {}) {
    if (storyApiProxy) {
      return storyApiProxy.getAdminStories(params);
    }
    return api.get("/v1/stories/admin/all", { params });
  },
};
