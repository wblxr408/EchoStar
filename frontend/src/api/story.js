import api from './index';
import { storyApiProxy } from './mockProxy';

/**
 * 故事相关 API
 */
export const storyApi = {
  /**
   * 发布故事
   */
  createStory(data) {
    if (storyApiProxy) {
      return storyApiProxy.createStory(data);
    }
    return api.post('/v1/stories', data);
  },

  /**
   * 查看故事详情
   */
  getStoryById(id) {
    if (storyApiProxy) {
      return storyApiProxy.getStoryById(id);
    }
    return api.get(`/v1/stories/${id}`);
  },

  /**
   * 删除故事
   */
  deleteStory(id) {
    if (storyApiProxy) {
      return storyApiProxy.deleteStory(id);
    }
    return api.delete(`/v1/stories/${id}`);
  },

  /**
   * 修改故事内容
   */
  updateStory(id, data) {
    if (storyApiProxy) {
      return storyApiProxy.updateStory(id, data);
    }
    return api.post(`/v1/stories/${id}`, data);
  },

  /**
   * 修改故事可见性
   */
  updateVisibility(id, visibility) {
    if (storyApiProxy) {
      return storyApiProxy.updateVisibility(id, visibility);
    }
    return api.put(`/v1/stories/${id}/visibility`, { visibility });
  },

  /**
   * 我的故事列表
   */
  getMyStories(params) {
    if (storyApiProxy) {
      return storyApiProxy.getMyStories(params);
    }
    return api.get('/v1/stories/me/list', { params });
  },

  /**
   * 搜索故事
   */
  searchStories(keyword, params = {}) {
    if (storyApiProxy) {
      return storyApiProxy.searchStories(keyword, params);
    }
    return api.get('/v1/stories/search', { params: { keyword, ...params } });
  },

  /**
   * 解锁时光胶囊
   */
  unlockTimeCapsule(id) {
    if (storyApiProxy) {
      return storyApiProxy.unlockTimeCapsule(id);
    }
    return api.post(`/v1/stories/${id}/unlock`);
  },

  /**
   * 获取 OSS 上传凭证
   */
  getUploadToken() {
    if (storyApiProxy) {
      return storyApiProxy.getUploadToken();
    }
    return api.get('/v1/stories/upload-token');
  },

  /**
   * 管理员获取所有帖子
   */
  getAdminStories(params = {}) {
    if (storyApiProxy) {
      return storyApiProxy.getAdminStories(params);
    }
    return api.get('/v1/stories/admin/all', { params });
  }
};
