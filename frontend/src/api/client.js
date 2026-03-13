/**
 * API 客户端 - 基于 OpenAPI 规范的类型安全封装
 *
 * 使用方式:
 * import { authApi, storyApi, mapApi } from '@/api/client'
 *
 * const { accessToken, user } = await authApi.login('email@example.com', '123456')
 */

import api from './index.js';

// ==================== Auth API ====================

export const authApi = {
  /**
   * 邮箱注册
   * @param {string} email
   * @param {string} password
   * @param {string} username
   * @returns {Promise<{accessToken: string, user: object}>}
   */
  register(email, password, username) {
    return api.post('/v1/auth/register', {
      email,
      password,
      username
    }).then(res => res.data);
  },

  /**
   * 邮箱登录
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{accessToken: string, user: object}>}
   */
  login(email, password) {
    return api.post('/v1/auth/login', {
      email,
      password
    }).then(res => res.data);
  },

  /**
   * 获取当前用户信息
   * @returns {Promise<object>}
   */
  me() {
    return api.get('/v1/auth/me').then(res => res.data);
  },

  /**
   * GitHub OAuth 登录 URL
   * @returns {string}
   */
  getGitHubOAuthUrl() {
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/v1/auth/oauth/github`;
  }
};

// ==================== Story API ====================

export const storyApi = {
  /**
   * 获取 OSS 上传凭证
   * @returns {Promise<{accessKeyId, accessKeySecret, stsToken, bucket, region, expiration}>}
   */
  getUploadToken() {
    return api.get('/v1/stories/upload-token').then(res => res.data);
  },

  /**
   * 发布故事
   * @param {object} data - 故事数据
   * @param {string} [data.content] - 故事正文
   * @param {string[]} data.images - 图片 URL 数组 (1-9张)
   * @param {object} [data.location] - 位置信息 {lng, lat}
   * @param {string} data.emotionTag - 情绪标签: '治愈'|'难过'|'开心'|'打卡'
   * @param {boolean} [data.isTimeCapsule] - 是否时光胶囊
   * @param {string} [data.unlockAt] - 解锁时间 (ISO 8601)
   * @returns {Promise<{id, content, createdAt}>}
   */
  create(data) {
    return api.post('/v1/stories', data).then(res => res.data);
  },

  /**
   * 查看故事详情
   * @param {number} id
   * @returns {Promise<object>}
   */
  getById(id) {
    return api.get(`/v1/stories/${id}`).then(res => res.data);
  },

  /**
   * 我的故事列表
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<{total, page, limit, list}>}
   */
  getMy(page = 1, limit = 20) {
    return api.get('/v1/stories/my', {
      params: { page, limit }
    }).then(res => res.data);
  },

  /**
   * 删除故事
   * @param {number} id
   * @returns {Promise<{message}>}
   */
  delete(id) {
    return api.delete(`/v1/stories/${id}`);
  }
};

// ==================== Map API ====================

export const mapApi = {
  /**
   * 范围查询
   * @param {number} lat - 纬度
   * @param {number} lng - 经度
   * @param {number} [radius=1000] - 半径(米), 最大 5000
   * @returns {Promise<{stories: Array}>}
   */
  explore(lat, lng, radius = 1000) {
    return api.get('/v1/map/explore', {
      params: { lat, lng, radius }
    }).then(res => res.data);
  },

  /**
   * 随机漫步
   * @returns {Promise<{location, story}>}
   */
  random() {
    return api.get('/v1/map/random').then(res => res.data);
  },

  /**
   * 同地点故事墙
   * @param {number} lat
   * @param {number} lng
   * @param {number} [radius=100]
   * @returns {Promise<{total, stories}>}
   */
  locationWall(lat, lng, radius = 100) {
    return api.get('/v1/map/location-wall', {
      params: { lat, lng, radius }
    }).then(res => res.data);
  },

  /**
   * 点聚合数据
   * @param {string} bounds - 地图视野范围: "sw_lat,sw_lng,ne_lat,ne_lng"
   * @param {number} zoom - 地图缩放级别 (3-18)
   * @returns {Promise<{clusters}>}
   */
  cluster(bounds, zoom) {
    return api.get('/v1/map/cluster', {
      params: { bounds, zoom }
    }).then(res => res.data);
  }
};

// ==================== Admin API ====================

export const adminApi = {
  /**
   * 设为推荐
   * @param {number} id
   * @param {string} reason
   */
  recommend(id, reason) {
    return api.post(`/v1/admin/stories/${id}/recommend`, { reason });
  },

  /**
   * Shadowban 故事
   * @param {number} id
   * @param {string} reason
   */
  shadowban(id, reason) {
    return api.post(`/v1/admin/stories/${id}/shadowban`, { reason });
  },

  /**
   * 恢复故事正常状态
   * @param {number} id
   */
  restore(id) {
    return api.post(`/v1/admin/stories/${id}/restore`);
  },

  /**
   * 举报列表
   * @param {string} [status='pending'] - pending|resolved|rejected
   * @returns {Promise<{total, list}>}
   */
  getReports(status = 'pending') {
    return api.get('/v1/admin/reports', {
      params: { status }
    }).then(res => res.data);
  }
};

// ==================== 导出所有 API ====================

export default {
  auth: authApi,
  story: storyApi,
  map: mapApi,
  admin: adminApi
};
