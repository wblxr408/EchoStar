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
    return api.post('/stories', data);
  },

  /**
   * 查看故事详情
   */
  getStoryById(id) {
    if (storyApiProxy) {
      return storyApiProxy.getStoryById(id);
    }
    return api.get(`/stories/${id}`);
  },

  /**
   * 删除故事
   */
  deleteStory(id) {
    if (storyApiProxy) {
      return storyApiProxy.deleteStory(id);
    }
    return api.delete(`/stories/${id}`);
  },

  /**
   * 我的故事列表
   */
  getMyStories(params) {
    if (storyApiProxy) {
      return storyApiProxy.getMyStories(params);
    }
    return api.get('/stories/me/list', { params });
  },

  /**
   * 获取 OSS 上传凭证
   */
  getUploadToken() {
    if (storyApiProxy) {
      return storyApiProxy.getUploadToken();
    }
    return api.get('/stories/upload/token');
  }
};
