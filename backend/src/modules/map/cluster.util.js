/**
 * GEOhash 空间聚合工具
 * 使用 geohash 前缀作为桶键，返回兼容前端使用的 point / cluster 结构。
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

function encodeGeohash(latitude, longitude, precision = 7) {
  let isEven = true;
  let bit = 0;
  let ch = 0;
  let geohash = '';
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lngMin + lngMax) / 2;
      if (longitude >= mid) {
        ch = (ch << 1) + 1;
        lngMin = mid;
      } else {
        ch <<= 1;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        ch = (ch << 1) + 1;
        latMin = mid;
      } else {
        ch <<= 1;
        latMax = mid;
      }
    }

    isEven = !isEven;
    bit += 1;

    if (bit === 5) {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

function getGeohashPrecision(zoom) {
  const z = zoom ?? 10;
  if (z <= 3) return 2;
  if (z <= 5) return 3;
  if (z <= 7) return 4;
  if (z <= 9) return 5;
  if (z <= 12) return 6;
  if (z <= 15) return 7;
  return 8;
}

function getSphericalCenter(points) {
  let x = 0;
  let y = 0;
  let z = 0;
  const count = points.length;

  points.forEach((p) => {
    const latRad = p.latitude * Math.PI / 180;
    const lngRad = p.longitude * Math.PI / 180;
    x += Math.cos(latRad) * Math.cos(lngRad);
    y += Math.cos(latRad) * Math.sin(lngRad);
    z += Math.sin(latRad);
  });

  x /= count;
  y /= count;
  z /= count;

  const lng = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const lat = Math.atan2(z, hyp);

  return {
    latitude: lat * 180 / Math.PI,
    longitude: lng * 180 / Math.PI
  };
}

export function clusterPoints(points, options = {}) {
  const zoom = typeof options === 'object' ? options.zoom : undefined;
  const precision = typeof options === 'object'
    ? (options.precision ?? getGeohashPrecision(zoom))
    : getGeohashPrecision();

  if (!Array.isArray(points) || points.length === 0) return [];

  const buckets = new Map();

  points.forEach((point) => {
    const { latitude, longitude } = point;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (latitude === 0 || longitude === 0) return;

    const geohash = encodeGeohash(latitude, longitude, precision);
    if (!buckets.has(geohash)) {
      buckets.set(geohash, []);
    }
    buckets.get(geohash).push({
      ...point,
      _geohash: geohash
    });
  });

  const result = [];

  buckets.forEach((bucketPoints, geohash) => {
    if (bucketPoints.length === 1) {
      const p = bucketPoints[0];
      result.push({
        type: 'point',
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        emotionTag: p.emotionTag,
        geohash,
        pointIds: p.id === undefined || p.id === null ? [] : [p.id],
        ...(p.isTimeCapsule !== undefined && { isTimeCapsule: p.isTimeCapsule }),
        ...(p.unlockAt !== undefined && { unlockAt: p.unlockAt }),
        ...(p.isUnlocked !== undefined && { isUnlocked: p.isUnlocked }),
      });
      return;
    }

    const center = getSphericalCenter(bucketPoints);
    const pointIds = bucketPoints
      .map((item) => item.id)
      .filter((id) => id !== undefined && id !== null);

    result.push({
      type: 'cluster',
      latitude: center.latitude,
      longitude: center.longitude,
      count: pointIds.length || bucketPoints.length,
      pointIds,
      geohash
    });
  });

  return result;
}

export { encodeGeohash, getGeohashPrecision };
