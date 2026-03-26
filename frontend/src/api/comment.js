import api from './index';
import { commentApiProxy } from './mockProxy';

/**
 * 评论相关 API
 */
export const commentApi = {
  /**
   * 创建评论
   */
  create(storyId, content) {
    if (commentApiProxy) {
      return commentApiProxy.create(storyId, content);
    }
    return api.post('/comments', { storyId, content });
  },

  /**
   * 搜索评论
   */
  search(keyword, params = {}) {
    if (commentApiProxy) {
      return commentApiProxy.search(keyword, params);
    }
    return api.get('/comments/search', { params: { keyword, ...params } });
  },

  /**
   * 获取我的评论列表
   */
  getMyComments(params = {}) {
    if (commentApiProxy) {
      return commentApiProxy.getMyComments(params);
    }
    return api.get('/comments/me', { params });
  },

  /**
   * 获取故事评论列表
   */
  getStoryComments(storyId, params = {}) {
    if (commentApiProxy) {
      return commentApiProxy.getStoryComments(storyId, params);
    }
    return api.get(`/comments/story/${storyId}`, { params });
  },

  /**
   * 统计评论数量
   */
  getCount(storyId) {
    if (commentApiProxy) {
      return commentApiProxy.getCount(storyId);
    }
    return api.get(`/comments/${storyId}/count`);
  },

  /**
   * 删除评论
   */
  delete(id) {
    if (commentApiProxy) {
      return commentApiProxy.delete(id);
    }
    return api.delete(`/comments/${id}`);
  }
};
