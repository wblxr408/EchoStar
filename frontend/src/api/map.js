import api from './index';

/**
 * 地图相关 API
 */
export const mapApi = {
  /**
   * 范围查询故事
   */
  exploreStories(latitude, longitude, radius = 1000) {
    return api.get('/map/explore', {
      params: { latitude, longitude, radius }
    });
  },

  /**
   * 随机漫步
   */
  randomWalk() {
    return api.get('/map/random');
  },

  /**
   * 同地点故事墙
   */
  getLocationWall(latitude, longitude, radius = 50) {
    return api.get('/map/wall', {
      params: { latitude, longitude, radius }
    });
  },

  /**
   * 获取聚合数据
   */
  getClusterData(northEast, southWest) {
    return api.get('/map/clusters', {
      params: {
        northEast: JSON.stringify(northEast),
        southWest: JSON.stringify(southWest)
      }
    });
  }
};
