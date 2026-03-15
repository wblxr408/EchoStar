import api from './index';
import { mapApiProxy } from './mockProxy';

/**
 * 地图相关 API
 */
export const mapApi = {
  /**
   * 范围查询故事
   */
  exploreStories(latitude, longitude, radius = 1000) {
    if (mapApiProxy) {
      return mapApiProxy.exploreStories(latitude, longitude, radius);
    }
    return api.get('/map/explore', {
      params: { latitude, longitude, radius }
    });
  },

  /**
   * 随机漫步
   */
  randomWalk() {
    if (mapApiProxy) {
      return mapApiProxy.randomWalk();
    }
    return api.get('/map/random');
  },

  /**
   * 同地点故事墙
   */
  getLocationWall(latitude, longitude, radius = 50) {
    if (mapApiProxy) {
      return mapApiProxy.getLocationWall(latitude, longitude, radius);
    }
    return api.get('/map/wall', {
      params: { latitude, longitude, radius }
    });
  },

  /**
   * 获取聚合数据
   */
  getClusterData(northEast, southWest) {
    if (mapApiProxy) {
      return mapApiProxy.getClusterData(northEast, southWest);
    }
    return api.get('/map/clusters', {
      params: {
        northEast: JSON.stringify(northEast),
        southWest: JSON.stringify(southWest)
      }
    });
  }
};
