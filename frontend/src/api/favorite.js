import api from './index';
import { favoriteApiProxy } from './mockProxy';

/**
 * 收藏相关 API
 */
export const favoriteApi = {
  /**
   * 收藏/取消收藏（自动切换）
   */
  toggle(storyId) {
    if (favoriteApiProxy) {
      return favoriteApiProxy.toggle(storyId);
    }
    return api.post('/v1/favorites', { storyId });
  },

  /**
   * 创建收藏（明确收藏，不能取消）
   */
  create(storyId) {
    if (favoriteApiProxy) {
      return favoriteApiProxy.create(storyId);
    }
    return api.post('/v1/favorites/create', { storyId });
  },

  /**
   * 取消收藏
   */
  remove(storyId) {
    if (favoriteApiProxy) {
      return favoriteApiProxy.remove(storyId);
    }
    return api.delete(`/v1/favorites/${storyId}`);
  },

  /**
   * 获取故事收藏列表
   */
  getStoryFavorites(storyId, params = {}) {
    if (favoriteApiProxy) {
      return favoriteApiProxy.getStoryFavorites(storyId, params);
    }
    return api.get(`/v1/favorites/story/${storyId}`, { params });
  },

  /**
   * 检查是否已收藏
   */
  check(storyId) {
    if (favoriteApiProxy) {
      return favoriteApiProxy.check(storyId);
    }
    return api.get(`/v1/favorites/${storyId}/check`);
  },

  /**
   * 统计收藏数量
   */
  getCount(storyId) {
    if (favoriteApiProxy) {
      return favoriteApiProxy.getCount(storyId);
    }
    return api.get(`/v1/favorites/${storyId}/count`);
  },

  /**
   * 获取我的收藏列表
   */
  getMyFavorites(params = {}) {
    if (favoriteApiProxy) {
      return favoriteApiProxy.getMyFavorites(params);
    }
    return api.get('/v1/favorites/me', { params });
  },

  /**
   * 批量检查多个故事的收藏状态
   */
  checkMultiple(storyIds) {
    if (favoriteApiProxy) {
      return favoriteApiProxy.checkMultiple(storyIds);
    }
    return api.post('/v1/favorites/check-multiple', { storyIds });
  }
};
