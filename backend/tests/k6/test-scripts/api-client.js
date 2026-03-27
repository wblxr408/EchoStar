/**
 * API 客户端封装
 */

import http from 'k6/http';
import { check } from 'k6';
import { config } from './config.js';
import { recordRequest } from './report-generator.js';

// 存储认证令牌
const userTokens = [];
const adminTokens = [];
let currentUserIndex = 0;
let currentAdminIndex = 0;

// 存储创建的资源 ID
const userIds = [];
const adminIds = [];
const storyIds = [];
const commentIds = [];

/**
 * 发送 HTTP 请求并记录结果
 */
function sendRequest(method, endpoint, body = null, headers = {}, options = {}) {
  const url = `${config.baseUrl}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const allHeaders = { ...defaultHeaders, ...headers };
  
  const params = {
    headers: allHeaders,
    tags: { endpoint: endpoint },
    ...options,
  };

  let response;
  const startTime = new Date().getTime();

  switch (method.toUpperCase()) {
    case 'GET':
      response = http.get(url, params);
      break;
    case 'POST':
      response = http.post(url, JSON.stringify(body), params);
      break;
    case 'PUT':
      response = http.put(url, JSON.stringify(body), params);
      break;
    case 'DELETE':
      response = http.del(url, null, params);
      break;
    default:
      response = http.request(method, url, JSON.stringify(body), params);
  }

  const responseTime = new Date().getTime() - startTime;
  const success = response.status >= 200 && response.status < 400;

  recordRequest(endpoint, success, responseTime, response.status);

  return response;
}

/**
 * 用户注册（不带验证码）
 */
export function registerUser(userData) {
  const response = sendRequest('POST', '/api/auth/register_2', userData);
  
  if (response.status === 200 || response.status === 201) {
    try {
      const body = JSON.parse(response.body);
      if (body.code === 0 && body.data && body.data.user && body.data.user.id) {
        userIds.push(body.data.user.id);
        return {
          success: true,
          userId: body.data.user.id,
          token: body.data.token,
        };
      }
    } catch (e) {
      // 解析失败
    }
  }
  
  return { success: false };
}

/**
 * 管理员注册
 */
export function registerAdmin(adminData) {
  const response = sendRequest('POST', '/api/auth/register_2', {
    ...adminData,
  });
  
  if (response.status === 200 || response.status === 201) {
    try {
      const body = JSON.parse(response.body);
      if (body.code === 0 && body.data && body.data.user && body.data.user.id) {
        adminIds.push(body.data.user.id);
        return {
          success: true,
          adminId: body.data.user.id,
          token: body.data.token,
        };
      }
    } catch (e) {
      // 解析失败
    }
  }
  
  return { success: false };
}

/**
 * 用户登录
 */
export function loginUser(email, password) {
  const response = sendRequest('POST', '/api/auth/login', { email, password });
  
  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.code === 0 && body.data && body.data.token) {
        userTokens.push({
          token: body.data.token,
          userId: body.data.user.id,
        });
        return {
          success: true,
          token: body.data.token,
          userId: body.data.user.id,
        };
      }
    } catch (e) {
      // 解析失败
    }
  }
  
  return { success: false };
}

/**
 * 管理员登录
 */
export function loginAdmin(email, password) {
  const response = sendRequest('POST', '/api/auth/admin/login', { email, password });
  
  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.code === 0 && body.data && body.data.token) {
        adminTokens.push({
          token: body.data.token,
          adminId: body.data.user.id,
        });
        return {
          success: true,
          token: body.data.token,
          adminId: body.data.user.id,
        };
      }
    } catch (e) {
      // 解析失败
    }
  }
  
  return { success: false };
}

/**
 * 获取下一个用户令牌
 */
export function getNextUserToken() {
  if (userTokens.length === 0) return null;
  const token = userTokens[currentUserIndex % userTokens.length];
  currentUserIndex++;
  return token;
}

/**
 * 获取下一个管理员令牌
 */
export function getNextAdminToken() {
  if (adminTokens.length === 0) return null;
  const token = adminTokens[currentAdminIndex % adminTokens.length];
  currentAdminIndex++;
  return token;
}

/**
 * 获取用户令牌列表
 */
export function getUserTokens() {
  return userTokens;
}

/**
 * 获取管理员令牌列表
 */
export function getAdminTokens() {
  return adminTokens;
}

/**
 * 创建故事
 */
export function createStory(token, storyData) {
  const response = sendRequest('POST', '/api/stories', storyData, {
    'Authorization': `Bearer ${token}`,
  });
  
  if (response.status === 200 || response.status === 201) {
    try {
      const body = JSON.parse(response.body);
      if (body.code === 0 && body.data && body.data.id) {
        storyIds.push(body.data.id);
        return {
          success: true,
          storyId: body.data.id,
        };
      }
    } catch (e) {
      // 解析失败
    }
  }
  
  return { success: false };
}

/**
 * 获取故事详情
 */
export function getStory(token, storyId) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  return sendRequest('GET', `/api/stories/${storyId}`, null, headers);
}

/**
 * 获取我的故事列表
 */
export function getMyStories(token, page = 1, limit = 10) {
  return sendRequest('GET', `/api/stories/me/list?page=${page}&limit=${limit}`, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 搜索故事
 */
export function searchStories(keyword, page = 1, limit = 10) {
  return sendRequest('GET', `/api/stories/search?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`);
}

/**
 * 删除故事
 */
export function deleteStory(token, storyId) {
  return sendRequest('DELETE', `/api/stories/${storyId}`, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 创建评论
 */
export function createComment(token, commentData) {
  const response = sendRequest('POST', '/api/comments', commentData, {
    'Authorization': `Bearer ${token}`,
  });
  
  if (response.status === 200 || response.status === 201) {
    try {
      const body = JSON.parse(response.body);
      if (body.code === 0 && body.data && body.data.id) {
        commentIds.push(body.data.id);
        return {
          success: true,
          commentId: body.data.id,
        };
      }
    } catch (e) {
      // 解析失败
    }
  }
  
  return { success: false };
}

/**
 * 获取故事评论列表
 */
export function getCommentsByStoryId(storyId, page = 1, limit = 10) {
  return sendRequest('GET', `/api/comments/story/${storyId}?page=${page}&limit=${limit}`);
}

/**
 * 获取评论数量
 */
export function getCommentCount(storyId) {
  return sendRequest('GET', `/api/comments/${storyId}/count`);
}

/**
 * 删除评论
 */
export function deleteComment(token, commentId) {
  return sendRequest('DELETE', `/api/comments/${commentId}`, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 点赞
 */
export function toggleLike(token, storyId) {
  return sendRequest('POST', '/api/likes', { storyId }, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 创建点赞
 */
export function createLike(token, storyId) {
  return sendRequest('POST', '/api/likes/create', { storyId }, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 获取点赞数量
 */
export function getLikeCount(storyId) {
  return sendRequest('GET', `/api/likes/${storyId}/count`);
}

/**
 * 检查是否已点赞
 */
export function checkIsLiked(storyId, token = null) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  return sendRequest('GET', `/api/likes/${storyId}/check`, null, headers);
}

/**
 * 收藏
 */
export function toggleFavorite(token, storyId) {
  return sendRequest('POST', '/api/favorites', { storyId }, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 创建收藏
 */
export function createFavorite(token, storyId) {
  return sendRequest('POST', '/api/favorites/create', { storyId }, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 获取收藏数量
 */
export function getFavoriteCount(storyId) {
  return sendRequest('GET', `/api/favorites/${storyId}/count`);
}

/**
 * 检查是否已收藏
 */
export function checkIsFavorited(storyId, token = null) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  return sendRequest('GET', `/api/favorites/${storyId}/check`, null, headers);
}

/**
 * 获取地图范围故事
 */
export function exploreStories(lat, lng, radius = 1000) {
  return sendRequest('GET', `/api/map/explore?lat=${lat}&lng=${lng}&radius=${radius}`);
}

/**
 * 随机漫步
 */
export function randomWalk(lat, lng, mood = null, token = null) {
  let url = '/api/map/random?';
  if (lat !== null) url += `lat=${lat}&`;
  if (lng !== null) url += `lng=${lng}&`;
  if (mood) url += `mood=${encodeURIComponent(mood)}`;
  
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  return sendRequest('GET', url, null, headers);
}

/**
 * 获取推荐流
 */
export function getFeed(lat, lng, mood = null, page = 1, limit = 20, token = null) {
  let url = `/api/map/feed?page=${page}&limit=${limit}`;
  if (lat !== null) url += `&lat=${lat}`;
  if (lng !== null) url += `&lng=${lng}`;
  if (mood) url += `&mood=${encodeURIComponent(mood)}`;
  
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  return sendRequest('GET', url, null, headers);
}

/**
 * 获取聚合数据
 */
export function getClusters(northEast, southWest) {
  return sendRequest('GET', `/api/map/clusters?northEast=${encodeURIComponent(northEast)}&southWest=${encodeURIComponent(southWest)}`);
}

/**
 * 获取故事墙
 */
export function getLocationWall(lat, lng, radius = 50) {
  return sendRequest('GET', `/api/map/wall?lat=${lat}&lng=${lng}&radius=${radius}`);
}

/**
 * 创建举报
 */
export function createReport(token, reportData) {
  return sendRequest('POST', '/api/reports', reportData, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 获取用户举报列表
 */
export function getUserReports(token, page = 1, limit = 20) {
  return sendRequest('GET', `/api/reports/me?page=${page}&limit=${limit}`, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员获取举报列表
 */
export function getReports(token, targetType = null, status = null, page = 1, limit = 20) {
  let url = `/api/reports?page=${page}&limit=${limit}`;
  if (targetType) url += `&targetType=${targetType}`;
  if (status) url += `&status=${status}`;
  
  return sendRequest('GET', url, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员处理举报
 */
export function handleReport(token, reportId, action) {
  return sendRequest('POST', `/api/reports/${reportId}/handle`, { action }, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员设为推荐
 */
export function recommendStory(token, storyId, reason = '优质内容') {
  return sendRequest('POST', `/api/admin/stories/${storyId}/recommend`, { reason }, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员取消推荐
 */
export function unrecommendStory(token, storyId, reason = '不再推荐') {
  return sendRequest('POST', `/api/admin/stories/${storyId}/unrecommend`, { reason }, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员 Shadowban 故事
 */
export function shadowbanStory(token, storyId, reason = '违规内容') {
  return sendRequest('POST', `/api/admin/stories/${storyId}/shadowban`, { reason }, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员恢复故事
 */
export function restoreStory(token, storyId) {
  return sendRequest('POST', `/api/admin/stories/${storyId}/restore`, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员封禁用户
 */
export function banUser(token, userId, reason = '违规用户') {
  return sendRequest('POST', `/api/admin/users/${userId}/ban`, { reason }, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员解封用户
 */
export function unbanUser(token, userId) {
  return sendRequest('POST', `/api/admin/users/${userId}/unban`, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员获取统计数据
 */
export function getAdminStatistics(token) {
  return sendRequest('GET', '/api/admin/statistics', null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 获取通知列表
 */
export function getNotifications(token, page = 1, limit = 10) {
  return sendRequest('GET', `/api/notifications/me?page=${page}&limit=${limit}`, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 获取未读通知数量
 */
export function getUnreadCount(token) {
  return sendRequest('GET', '/api/notifications/me/unread-count', null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 标记所有通知已读
 */
export function markAllAsRead(token) {
  return sendRequest('PUT', '/api/notifications/me/mark-read', null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser(token) {
  return sendRequest('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 获取用户信息
 */
export function getUserById(userId) {
  return sendRequest('GET', `/api/auth/users/${userId}`);
}

/**
 * 更新用户信息
 */
export function updateProfile(token, data) {
  return sendRequest('PUT', '/api/auth/users/me', data, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员获取所有用户
 */
export function getAllUsers(token, page = 1, pageSize = 20, category = 'normal') {
  return sendRequest('GET', `/api/auth/admin/users?page=${page}&pageSize=${pageSize}&category=${category}`, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 管理员获取所有故事
 */
export function getAllStoriesForAdmin(token, page = 1, limit = 20, visibility = null) {
  let url = `/api/stories/admin/all?page=${page}&limit=${limit}`;
  if (visibility) url += `&visibility=${visibility}`;
  
  return sendRequest('GET', url, null, {
    'Authorization': `Bearer ${token}`,
  });
}

/**
 * 获取已创建的用户 ID 列表
 */
export function getUserIds() {
  return userIds;
}

/**
 * 获取已创建的故事 ID 列表
 */
export function getStoryIds() {
  return storyIds;
}

/**
 * 获取已创建的评论 ID 列表
 */
export function getCommentIds() {
  return commentIds;
}

/**
 * 获取已创建的管理员 ID 列表
 */
export function getAdminIds() {
  return adminIds;
}

/**
 * 清空存储的数据 ID（用于重置）
 */
export function clearStoredIds() {
  userIds.length = 0;
  adminIds.length = 0;
  storyIds.length = 0;
  commentIds.length = 0;
  userTokens.length = 0;
  adminTokens.length = 0;
  currentUserIndex = 0;
  currentAdminIndex = 0;
}
