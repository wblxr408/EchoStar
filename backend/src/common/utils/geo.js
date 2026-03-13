/**
 * 地理位置工具函数
 */

/**
 * 计算两点之间的距离（Haversine 公式）
 * @param {Number} lat1 - 纬度1
 * @param {Number} lng1 - 经度1
 * @param {Number} lat2 - 纬度2
 * @param {Number} lng2 - 经度2
 * @returns {Number} 距离（单位：米）
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 格式化距离显示
 * @param {Number} meters - 距离（米）
 * @returns {String} 格式化后的距离字符串
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 判断点是否在矩形边界内
 * @param {Number} lat - 纬度
 * @param {Number} lng - 经度
 * @param {Object} bounds - 边界 {northEast, southWest}
 * @returns {Boolean}
 */
export function isPointInBounds(lat, lng, bounds) {
  return (
    lat >= bounds.southWest.latitude &&
    lat <= bounds.northEast.latitude &&
    lng >= bounds.southWest.longitude &&
    lng <= bounds.northEast.longitude
  );
}
