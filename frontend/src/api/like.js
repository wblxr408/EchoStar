import api from './index';
import { likeApiProxy } from './mockProxy';

/**
 * 点赞相关 API
 */
export const likeApi = {
  /**
   * 点赞/取消点赞（自动切换）
   */
  toggle(storyId) {
    if (likeApiProxy) {
      return likeApiProxy.toggle(storyId);
    }
    return api.post('/v1/likes', { storyId });
  },

  /**
   * 创建点赞（明确点赞，不能取消）
   */
  create(storyId) {
    if (likeApiProxy) {
      return likeApiProxy.create(storyId);
    }
    return api.post('/v1/likes/create', { storyId });
  },

  /**
   * 取消点赞
   */
  remove(storyId) {
    if (likeApiProxy) {
      return likeApiProxy.remove(storyId);
    }
    return api.delete(`/v1/likes/${storyId}`);
  },

  /**
   * 获取故事点赞列表
   */
  getStoryLikes(storyId, params = {}) {
    if (likeApiProxy) {
      return likeApiProxy.getStoryLikes(storyId, params);
    }
    return api.get(`/v1/likes/story/${storyId}`, { params });
  },

  /**
   * 检查是否已点赞
   */
  check(storyId) {
    if (likeApiProxy) {
      return likeApiProxy.check(storyId);
    }
    return api.get(`/v1/likes/${storyId}/check`);
  },

  /**
   * 统计点赞数量
   */
  getCount(storyId) {
    if (likeApiProxy) {
      return likeApiProxy.getCount(storyId);
    }
    return api.get(`/v1/likes/${storyId}/count`);
  },

  /**
   * 获取我的点赞列表
   */
  getMyLikes(params = {}) {
    if (likeApiProxy) {
      return likeApiProxy.getMyLikes(params);
    }
    return api.get('/v1/likes/me', { params });
  },

  /**
   * 批量检查多个故事的点赞状态
   */
  checkMultiple(storyIds) {
    if (likeApiProxy) {
      return likeApiProxy.checkMultiple(storyIds);
    }
    return api.post('/v1/likes/check-multiple', { storyIds });
  }
};
