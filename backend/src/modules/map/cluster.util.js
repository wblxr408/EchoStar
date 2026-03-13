/**
 * 点聚合算法工具
 * 使用简化的网格聚合算法
 */

/**
 * 计算两点之间的距离（单位：米）
 */
function getDistance(lat1, lng1, lat2, lng2) {
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
 * 点聚合函数
 * @param {Array} points - 点数组 [{id, latitude, longitude, emotion}]
 * @param {Number} gridSize - 网格大小（单位：米，默认 100 米）
 * @returns {Array} 聚合后的点或簇
 */
export function clusterPoints(points, gridSize = 100) {
  if (points.length === 0) return [];

  const clusters = [];
  const processed = new Set();

  points.forEach((point, index) => {
    if (processed.has(index)) return;

    const cluster = {
      center: {
        latitude: point.latitude,
        longitude: point.longitude
      },
      points: [point],
      emotion: point.emotion
    };

    // 查找周围的点
    points.forEach((otherPoint, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;

      const distance = getDistance(
        point.latitude,
        point.longitude,
        otherPoint.latitude,
        otherPoint.longitude
      );

      if (distance <= gridSize) {
        cluster.points.push(otherPoint);
        processed.add(otherIndex);
      }
    });

    processed.add(index);

    // 如果只有一个点，直接返回点信息
    if (cluster.points.length === 1) {
      clusters.push({
        type: 'point',
        id: point.id,
        latitude: point.latitude,
        longitude: point.longitude,
        emotion: point.emotion
      });
    } else {
      // 计算簇的中心点
      const avgLat =
        cluster.points.reduce((sum, p) => sum + p.latitude, 0) /
        cluster.points.length;
      const avgLng =
        cluster.points.reduce((sum, p) => sum + p.longitude, 0) /
        cluster.points.length;

      clusters.push({
        type: 'cluster',
        latitude: avgLat,
        longitude: avgLng,
        count: cluster.points.length,
        pointIds: cluster.points.map(p => p.id),
        emotions: cluster.points.map(p => p.emotion)
      });
    }
  });

  return clusters;
}
