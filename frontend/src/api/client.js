/**
 * API 客户端 - 基于 OpenAPI 规范的类型安全封装
 *
 * 使用方式:
 * import { authApi, storyApi, mapApi, adminApi, announcementApi } from '@/api/client'
 */

import api from './index.js';

// ==================== Auth API ====================
// 认证模块 - 用户登录、注册、信息修改

export const authApi = {
  /**
   * 邮箱注册
   * 连接数据: 用户表(users)
   * @param {string} email
   * @param {string} password
   * @param {string} [username] - 可选，默认为"用户{userId}"
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
   * 连接数据: 用户表(users)
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
   * 连接数据: 用户表(users)
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
  },

  /**
   * 修改个人信息
   * 连接数据: 用户表(users)
   * @param {object} data - { username?, avatarUrl?, bio? }
   * @returns {Promise<{id, username, avatar, bio}>}
   */
  updateProfile(data) {
    return api.put('/v1/auth/users/me', data).then(res => res.data);
  },

  /**
   * 获取头像上传凭证
   * @returns {Promise<{accessKeyId, accessKeySecret, bucket, region, host}>}
   */
  getAvatarUploadToken() {
    return api.get('/v1/auth/avatar/upload-token').then(res => res.data);
  }
};

// ==================== Story API ====================
// 故事模块 - 故事的增删改查、点赞、评论、举报

export const storyApi = {
  /**
   * 获取 OSS 上传凭证
   * 连接数据: OSS临时凭证
   * @returns {Promise<{accessKeyId, accessKeySecret, stsToken, bucket, region, expiration}>}
   */
  getUploadToken() {
    return api.get('/v1/stories/upload-token').then(res => res.data);
  },

  /**
   * 发布故事
   * 连接数据: 故事表(stories), 用户表(users)
   * @param {object} data - 故事数据
   * @param {string} [data.content] - 故事正文
   * @param {string[]} data.images - 图片 URL 数组 (1-9张)
   * @param {object} [data.location] - 位置信息 {lng, lat, address}
   * @param {string} data.emotion - 情绪标签: 'happy'|'sad'|'neutral'|'excited'|'peaceful'
   * @param {boolean} [data.isTimeCapsule] - 是否时光胶囊
   * @param {string} [data.unlockAt] - 解锁时间 (ISO 8601)
   * @returns {Promise<{id, content, createdAt}>}
   */
  create(data) {
    return api.post('/v1/stories', data).then(res => res.data);
  },

  /**
   * 查看故事详情
   * 连接数据: 故事表(stories), 用户表(users), 点赞表(likes), 评论表(comments)
   * @param {number} id
   * @returns {Promise<object>}
   */
  getById(id) {
    return api.get(`/v1/stories/${id}`).then(res => res.data);
  },

  /**
   * 我的故事列表
   * 连接数据: 故事表(stories)
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
   * 连接数据: 故事表(stories)
   * @param {number} id
   * @returns {Promise<{message}>}
   */
  delete(id) {
    return api.delete(`/v1/stories/${id}`);
  },

  /**
   * 点赞故事
   * 连接数据: 点赞表(likes), 故事表(stories)
   * @param {number} id - 故事ID
   * @returns {Promise<{likes: number, isLiked: boolean}>}
   */
  // like(id) {
  //   return api.post(`/v1/stories/${id}/like`).then(res => res.data);
  // },

  /**
   * 取消点赞
   * 连接数据: 点赞表(likes), 故事表(stories)
   * @param {number} id - 故事ID
   * @returns {Promise<{likes: number, isLiked: boolean}>}
   */
  // unlike(id) {
  //   return api.delete(`/v1/stories/${id}/like`).then(res => res.data);
  // },

  /**
   * 获取我点赞的故事列表
   * 连接数据: 点赞表(likes), 故事表(stories)
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<{total, list}>}
   */
  // getLiked(page = 1, limit = 20) {
  //   return api.get('/v1/stories/liked', { params: { page, limit } }).then(res => res.data);
  // },

  /**
   * 获取评论列表
   * 连接数据: 评论表(comments), 用户表(users)
   * @param {number} id - 故事ID
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<{total, list}>}
   */
  // getComments(id, page = 1, limit = 20) {
  //   return api.get(`/v1/stories/${id}/comments`, { params: { page, limit } }).then(res => res.data);
  // },

  /**
   * 发表评论
   * 连接数据: 评论表(comments), 故事表(stories)
   * @param {number} id - 故事ID
   * @param {string} content - 评论内容
   * @returns {Promise<{id, content, createdAt}>}
   */
  // createComment(id, content) {
  //   return api.post(`/v1/stories/${id}/comments`, { content }).then(res => res.data);
  // },

  /**
   * 举报故事
   * 连接数据: 举报表(reports), 故事表(stories)
   * @param {number} id - 故事ID
   * @param {string} type - 举报类型: 'spam'|'abuse'|'illegal'|'porn'|'other'
   * @param {string} description - 举报描述
   * @returns {Promise<{message}>}
   */
  // report(id, type, description) {
  //   return api.post(`/v1/stories/${id}/report`, { type, description }).then(res => res.data);
  // },

  /**
   * 获取精选故事列表
   * 连接数据: 故事表(stories), 精选表(featured_stories)
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @returns {Promise<{total, list}>}
   */
  // getFeatured(page = 1, limit = 10) {
  //   return api.get('/v1/stories/featured', { params: { page, limit } }).then(res => res.data);
  // }
};

// ==================== Map API ====================
// 地图模块 - 地图上的故事探索

export const mapApi = {
  /**
   * 范围查询 - 获取附近故事
   * 连接数据: 故事表(stories), 按地理位置索引
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
   * 随机漫步 - 随机获取一个故事
   * 连接数据: 故事表(stories)
   * @returns {Promise<{location, story}>}
   */
  random() {
    return api.get('/v1/map/random').then(res => res.data);
  },

  /**
   * 同地点故事墙
   * 连接数据: 故事表(stories), 按地理位置聚合
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
   * 连接数据: 故事表(stories), 地图聚合算法
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

// ==================== Announcement API ====================
// 公告模块 - 系统公告

export const announcementApi = {
  /**
   * 获取公告列表
   * 连接数据: 公告表(announcements)
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @returns {Promise<{total, list}>}
   */
  // getList(page = 1, limit = 10) {
  //   return api.get('/v1/announcements', { params: { page, limit } }).then(res => res.data);
  // }
};

// ==================== Admin API ====================
// 管理员模块 - 举报处理、用户管理、内容精选、公告管理

export const adminApi = {
  // ===== 举报管理 =====

  /**
   * 获取举报列表
   * 连接数据: 举报表(reports), 故事表(stories), 用户表(users)
   * @param {string} [status='pending'] - pending|resolved|rejected
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<{total, list}>}
   */
  getReports(status = 'pending', page = 1, limit = 20) {
    return api.get('/v1/admin/reports', {
      params: { status, page, limit }
    }).then(res => res.data);
  },

  /**
   * 批准举报
   * 连接数据: 举报表(reports), 故事表(stories)
   * @param {number} id - 举报ID
   * @param {string} action - 处理动作: 'delete'|'shadowban'
   * @param {string} reason - 处理原因
   * @returns {Promise<{message}>}
   */
  // approveReport(id, action, reason) {
  //   return api.post(`/v1/admin/reports/${id}/approve`, { action, reason }).then(res => res.data);
  // },

  /**
   * 驳回举报
   * 连接数据: 举报表(reports)
   * @param {number} id - 举报ID
   * @param {string} reason - 驳回原因
   * @returns {Promise<{message}>}
   */
  // rejectReport(id, reason) {
  //   return api.post(`/v1/admin/reports/${id}/reject`, { reason }).then(res => res.data);
  // },

  // ===== 用户管理 =====

  /**
   * 获取用户列表
   * 连接数据: 用户表(users), 故事表(stories)统计
   * @param {string} [status] - normal|banned|shadowbanned
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<{total, list}>}
   */
  // getUsers(status, page = 1, limit = 20) {
  //   return api.get('/v1/admin/users', { params: { status, page, limit } }).then(res => res.data);
  // },

  /**
   * 封禁用户
   * 连接数据: 用户表(users)
   * @param {number} id - 用户ID
   * @param {string} reason - 封禁原因
   * @param {number} [duration] - 封禁天数，不传则永久封禁
   * @returns {Promise<{message}>}
   */
  // banUser(id, reason, duration) {
  //   return api.post(`/v1/admin/users/${id}/ban`, { reason, duration }).then(res => res.data);
  // },

  /**
   * 解封用户
   * 连接数据: 用户表(users)
   * @param {number} id - 用户ID
   * @returns {Promise<{message}>}
   */
  // unbanUser(id) {
  //   return api.post(`/v1/admin/users/${id}/unban`).then(res => res.data);
  // },

  /**
   * Shadowban 用户
   * 连接数据: 用户表(users)
   * @param {number} id - 用户ID
   * @param {string} reason - shadowban原因
   * @returns {Promise<{message}>}
   */
  // shadowbanUser(id, reason) {
  //   return api.post(`/v1/admin/users/${id}/shadowban`, { reason }).then(res => res.data);
  // },

  // ===== 内容精选 =====

  /**
   * 获取精选池故事列表
   * 连接数据: 故事表(stories), 精选表(featured_stories)
   * @param {string} [filter='pending'] - pending|featured|all
   * @param {number} [page=1]
   * @param {number} [limit=20]
   * @returns {Promise<{total, list}>}
   */
  // getCurationList(filter = 'pending', page = 1, limit = 20) {
  //   return api.get('/v1/admin/curation', { params: { filter, page, limit } }).then(res => res.data);
  // },

  /**
   * 设为推荐
   * 连接数据: 精选表(featured_stories), 故事表(stories)
   * @param {number} id - 故事ID
   * @param {string} reason - 推荐理由
   * @param {boolean} [pinned=false] - 是否置顶
   * @returns {Promise<{message}>}
   */
  featureStory(id, reason, pinned = false) {
    return api.post(`/v1/admin/stories/${id}/feature`, { reason, pinned });
  },

  /**
   * 取消推荐
   * 连接数据: 精选表(featured_stories)
   * @param {number} id - 故事ID
   * @returns {Promise<{message}>}
   */
  // unfeatureStory(id) {
  //   return api.delete(`/v1/admin/stories/${id}/feature`).then(res => res.data);
  // },

  /**
   * 置顶故事
   * 连接数据: 精选表(featured_stories)
   * @param {number} id - 故事ID
   * @returns {Promise<{message}>}
   */
  // pinStory(id) {
  //   return api.post(`/v1/admin/stories/${id}/pin`).then(res => res.data);
  // },

  /**
   * 取消置顶
   * 连接数据: 精选表(featured_stories)
   * @param {number} id - 故事ID
   * @returns {Promise<{message}>}
   */
  // unpinStory(id) {
  //   return api.delete(`/v1/admin/stories/${id}/pin`).then(res => res.data);
  // },

  /**
   * Shadowban 故事
   * 连接数据: 故事表(stories)
   * @param {number} id - 故事ID
   * @param {string} reason - shadowban原因
   * @returns {Promise<{message}>}
   */
  shadowban(id, reason) {
    return api.post(`/v1/admin/stories/${id}/shadowban`, { reason });
  },

  /**
   * 恢复故事正常状态
   * 连接数据: 故事表(stories)
   * @param {number} id - 故事ID
   * @returns {Promise<{message}>}
   */
  restore(id) {
    return api.post(`/v1/admin/stories/${id}/restore`);
  },

  // ===== 公告管理 =====

  /**
   * 发布公告
   * 连接数据: 公告表(announcements)
   * @param {string} title - 公告标题
   * @param {string} content - 公告内容
   * @param {string} type - 公告类型: 'info'|'warning'|'feature'|'emotion'
   * @returns {Promise<{id, title, createdAt}>}
   */
  // publishAnnouncement(title, content, type) {
  //   return api.post('/v1/admin/announcements', { title, content, type }).then(res => res.data);
  // },

  /**
   * 删除公告
   * 连接数据: 公告表(announcements)
   * @param {number} id - 公告ID
   * @returns {Promise<{message}>}
   */
  // deleteAnnouncement(id) {
  //   return api.delete(`/v1/admin/announcements/${id}`).then(res => res.data);
  // },

  // ===== 统计数据 =====

  /**
   * 获取管理后台统计数据
   * 连接数据: 用户表(users), 故事表(stories), 举报表(reports)统计
   * @returns {Promise<{totalUsers, totalStories, pendingReports, todayNewUsers, todayNewStories}>}
   */
  // getStats() {
  //   return api.get('/v1/admin/stats').then(res => res.data);
  // }
};

// ==================== 导出所有 API ====================

export default {
  auth: authApi,
  story: storyApi,
  map: mapApi,
  announcement: announcementApi,
  admin: adminApi
};
