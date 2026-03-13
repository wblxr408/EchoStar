import api from './index';

/**
 * 故事相关 API
 */
export const storyApi = {
  /**
   * 发布故事
   */
  createStory(data) {
    return api.post('/stories', data);
  },

  /**
   * 查看故事详情
   */
  getStoryById(id) {
    return api.get(`/stories/${id}`);
  },

  /**
   * 删除故事
   */
  deleteStory(id) {
    return api.delete(`/stories/${id}`);
  },

  /**
   * 我的故事列表
   */
  getMyStories(params) {
    return api.get('/stories/me/list', { params });
  },

  /**
   * 获取 OSS 上传凭证
   */
  getUploadToken() {
    return api.get('/stories/upload/token');
  }
};
