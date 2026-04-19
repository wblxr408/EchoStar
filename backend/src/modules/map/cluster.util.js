/**
 * 点聚合算法工具【优化版】
 * 真正的地理网格分桶算法 O(n) | 球面三维坐标平均真实中心 | 兼容原有返回格式
 */

/**
 * 【核心】经纬度转网格索引（网格分桶实现）
 */
function getGridIndex(lat, lng, gridSize) {
  const METERS_PER_DEGREE = 111319.9; // WGS84 米数与经纬度换算
  const gridStep = gridSize / METERS_PER_DEGREE;
  const x = Math.floor(lng / gridStep);
  const y = Math.floor(lat / gridStep);
  return `${x}_${y}`;
}

/**
 * 【新增】球面三维坐标平均 → 计算真实簇中心（解决高纬度偏移）
 * 替代原简单经纬度算术平均，符合地理精度要求
 */
function getSphericalCenter(points) {
  let x = 0, y = 0, z = 0;
  const count = points.length;
  // 1. 把经纬度（WGS84）转成三维笛卡尔坐标
  points.forEach(p => {
    const latRad = p.latitude * Math.PI / 180;
    const lngRad = p.longitude * Math.PI / 180;
    x += Math.cos(latRad) * Math.cos(lngRad);
    y += Math.cos(latRad) * Math.sin(lngRad);
    z += Math.sin(latRad);
  });

  // 2. 计算三维坐标的平均值
  x /= count;
  y /= count;
  z /= count;

  // 3. 把平均后的三维坐标转回经纬度
  const lng = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const lat = Math.atan2(z, hyp);

  return {
    latitude: lat * 180 / Math.PI,
    longitude: lng * 180 / Math.PI
  };
}

/**
 * 【优化后】点聚合函数
 * 🔥 完全兼容原有入参、出参格式，调用层无需修改
 * @param {Array} points - [{id, latitude, longitude, emotionTag}]
 * @param {Number} gridSize - 动态网格大小（米）
 * @returns 原格式：point / cluster
 */
export function clusterPoints(points, gridSize = 100) {
  if (!points || points.length === 0) return [];

  // 网格分桶存储：key=网格ID，value=桶内点位
  const gridBuckets = new Map();

  // 🔥 单次遍历 O(n) 完成分桶（性能核心）
  points.forEach(point => {
    // 过滤无效坐标（0,0）/非法坐标
    const { latitude, longitude } = point;
    if (!latitude || !longitude || latitude === 0 || longitude === 0) return;

    const gridId = getGridIndex(latitude, longitude, gridSize);
    if (!gridBuckets.has(gridId)) {
      gridBuckets.set(gridId, []);
    }
    gridBuckets.get(gridId).push(point);
  });

  const result = [];
  // 遍历分桶，生成兼容原格式的数据
  gridBuckets.forEach(bucketPoints => {
    // 单点：原样返回（和你原代码结构完全一致）
    if (bucketPoints.length === 1) {
      const p = bucketPoints[0];
      result.push({
        type: 'point',
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        emotionTag: p.emotionTag,
        ...(p.isTimeCapsule !== undefined && { isTimeCapsule: p.isTimeCapsule }),
        ...(p.unlockAt !== undefined && { unlockAt: p.unlockAt }),
        ...(p.isUnlocked !== undefined && { isUnlocked: p.isUnlocked }),
        ...(p.fontFamily !== undefined && { fontFamily: p.fontFamily }),
        ...(p.fontEffect !== undefined && { fontEffect: p.fontEffect }),
      });
      return;
    }

    // 聚合点：用球面三维坐标平均计算真实中心
    const center = getSphericalCenter(bucketPoints);

    // 这是一个聚合点 (cluster)，按照 PM 要求，只保留必要的属性，删除 pointIds, emotionTags 和 mainEmotion 冗余属性
    result.push({
      type: 'cluster',
      latitude: center.latitude,
      longitude: center.longitude,
      count: bucketPoints.length
    });
  });

  return result;
}