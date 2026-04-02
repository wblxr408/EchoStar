import api from './index';
import { likeApiProxy } from './mockProxy';

function normalizeStoryId(storyId) {
  return typeof storyId === 'bigint'
    ? storyId.toString()
    : String(storyId).trim();
}

/**
 * 点赞相关 API
 */
export const likeApi = {
  /**
   * 点赞/取消点赞（自动切换）
   */
  toggle(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.toggle(normalizedStoryId);
    }

    return api.post('/v1/likes', { storyId: normalizedStoryId });
  },

  /**
   * 创建点赞（明确点赞，不能取消）
   */
  create(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.create(normalizedStoryId);
    }

    return api.post('/v1/likes/create', { storyId: normalizedStoryId });
  },

  /**
   * 取消点赞
   */
  remove(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.remove(normalizedStoryId);
    }

    return api.delete(`/v1/likes/${normalizedStoryId}`);
  },

  /**
   * 获取故事点赞列表
   */
  getStoryLikes(storyId, params = {}) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.getStoryLikes(normalizedStoryId, params);
    }

    return api.get(`/v1/likes/story/${normalizedStoryId}`, { params });
  },

  /**
   * 检查是否已点赞
   */
  check(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.check(normalizedStoryId);
    }

    return api.get(`/v1/likes/${normalizedStoryId}/check`);
  },

  /**
   * 统计点赞数量
   */
  getCount(storyId) {
    const normalizedStoryId = normalizeStoryId(storyId);

    if (likeApiProxy) {
      return likeApiProxy.getCount(normalizedStoryId);
    }

    return api.get(`/v1/likes/${normalizedStoryId}/count`);
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
    const normalizedStoryIds = Array.isArray(storyIds)
      ? storyIds.map((storyId) => normalizeStoryId(storyId))
      : [];

    if (likeApiProxy) {
      return likeApiProxy.checkMultiple(normalizedStoryIds);
    }

    return api.post('/v1/likes/check-multiple', { storyIds: normalizedStoryIds });
  }
};
