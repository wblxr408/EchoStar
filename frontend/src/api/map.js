import api from './index';
import { mapApiProxy } from './mockProxy';

/**
 * 地图相关 API
 */
export const mapApi = {
  /**
   * 范围查询故事
   */
  exploreStories(lat, lng, radius = 1000) {
    if (mapApiProxy) {
      return mapApiProxy.exploreStories(lat, lng, radius);
    }
    return api.get('/v1/map/explore', {
      params: { lat, lng, radius }
    });
  },

  /**
   * 随机漫步（加权推荐：空间+时间+情感）
   * @param {number} [lat] - 用户纬度
   * @param {number} [lng] - 用户经度
   * @param {string} [mood] - 情绪筛选：开心|难过|治愈|打卡
   */
  randomWalk(lat, lng, mood) {
    if (mapApiProxy) {
      return mapApiProxy.randomWalk();
    }
    const params = { _t: Date.now() };
    if (lat != null && lng != null) {
      params.lat = lat;
      params.lng = lng;
    }
    if (mood) params.mood = mood;
    return api.get('/v1/map/random', { params });
  },

  /**
   * 消息推荐流（加权推荐）
   * @param {number} [lat] - 用户纬度
   * @param {number} [lng] - 用户经度
   * @param {string} [mood] - 情绪筛选
   * @param {number} [page] - 页码
   * @param {number} [limit] - 每页条数
   */
  getRecommendationFeed({ lat, lng, mood, page = 1, limit = 20 } = {}) {
    if (mapApiProxy) {
      return Promise.resolve({ data: { stories: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } } });
    }
    const params = { page, limit };
    if (lat != null && lng != null) {
      params.lat = lat;
      params.lng = lng;
    }
    if (mood) params.mood = mood;
    return api.get('/v1/map/feed', { params });
  },

  /**
   * 同地点故事墙
   */
  getLocationWall(lat, lng, radius = 50) {
    if (mapApiProxy) {
      return mapApiProxy.getLocationWall(lat, lng, radius);
    }
    return api.get('/v1/map/wall', {
      params: { lat, lng, radius }
    });
  },

  /**
   * 获取聚合数据
   * @param {Object} northEast - 东北角坐标 { lat, lng }
   * @param {Object} southWest - 西南角坐标 { lat, lng }
   * @param {number} zoom - 当前缩放级别
   */
  getClusterData(northEast, southWest, zoom) {
    if (mapApiProxy) {
      return mapApiProxy.getClusterData(northEast, southWest, zoom);
    }
    return api.get('/v1/map/clusters', {
      params: {
        northEast: JSON.stringify(northEast),
        southWest: JSON.stringify(southWest),
        zoom
      }
    });
  },

  /**
   * 获取公告列表
   */
  getAnnouncements() {
    if (mapApiProxy) {
      return mapApiProxy.getAnnouncements();
    }
    return api.get('/v1/announcements');
  },

  /**
   * 创建公告（管理员）
   */
  createAnnouncement(data) {
    return api.post('/v1/announcements', data);
  }
};
