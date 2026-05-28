import { MapService } from './map.service.js';
import { RecommendationService } from '../recommendation/recommendation.service.js';
import { safeParseJSONB } from '../../common/utils/jsonb.util.js';

function parseMapQueryFilters(query = {}) {
  const filters = {};
  const normalizedEmotionTag = String(query.emotionTag || '').trim();

  if (normalizedEmotionTag) {
    filters.emotionTag = normalizedEmotionTag;
  }

  if (query.createdAfter) {
    const createdAfter = new Date(query.createdAfter);
    if (Number.isNaN(createdAfter.getTime())) {
      return { error: 'createdAfter 参数格式无效' };
    }
    filters.createdAfter = createdAfter.toISOString();
  }

  if (query.createdBefore) {
    const createdBefore = new Date(query.createdBefore);
    if (Number.isNaN(createdBefore.getTime())) {
      return { error: 'createdBefore 参数格式无效' };
    }
    filters.createdBefore = createdBefore.toISOString();
  }

  if (
    filters.createdAfter &&
    filters.createdBefore &&
    new Date(filters.createdAfter) > new Date(filters.createdBefore)
  ) {
    return { error: '时间区间无效，开始时间不能晚于结束时间' };
  }

  return { filters };
}

/**
 * 范围查询故事
 */
export const exploreStories = async (req, res, next) => {
  try {
    const MAX_EXPLORE_RADIUS = 50000;
    const { lat, lng, radius = 1000, page, limit, summary } = req.query;
    const { filters, error: filterError } = parseMapQueryFilters(req.query);

    if (!lat || !lng) {
      return res.status(400).json({
        code: 4000,
        message: '缺少经纬度参数'
      });
    }

    // 验证参数范围
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusNum = parseInt(radius);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        code: 4000,
        message: '纬度参数无效，范围应为 -90 到 90'
      });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        code: 4000,
        message: '经度参数无效，范围应为 -180 到 180'
      });
    }

    if (isNaN(radiusNum) || radiusNum < 10 || radiusNum > MAX_EXPLORE_RADIUS) {
      return res.status(400).json({
        code: 4000,
        message: `半径参数无效，范围应为 10 到 ${MAX_EXPLORE_RADIUS} 米`
      });
    }

    // 解析可选参数
    if (filterError) {
      return res.status(400).json({
        code: 4000,
        message: filterError
      });
    }

    const isSummary = summary === '1' || summary === 'true';
    const opts = { summary: isSummary, ...filters };
    if (page != null) opts.page = parseInt(page);
    if (limit != null) opts.limit = parseInt(limit);
    const usePagination = opts.page != null || opts.limit != null;

    const result = await MapService.exploreStories(
      latitude,
      longitude,
      radiusNum,
      opts
    );

    if (usePagination) {
      res.json({ code: 0, data: result }); // { stories, pagination }
    } else {
      res.json({ code: 0, data: { stories: result } }); // 向后兼容
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 随机漫步（加权推荐：空间 + 时间 + 情感）
 */
export const randomWalk = async (req, res, next) => {
  try {
    const { lat, lng, mood } = req.query;
    const userId = req.user?.id;

    // 验证经纬度参数格式（如果提供了的话）
    if (lat !== undefined && lat !== null && isNaN(parseFloat(lat))) {
      return res.status(400).json({
        code: 4000,
        message: '纬度参数无效，必须是有效的数字'
      });
    }

    if (lng !== undefined && lng !== null && isNaN(parseFloat(lng))) {
      return res.status(400).json({
        code: 4000,
        message: '经度参数无效，必须是有效的数字'
      });
    }

    const latitude = lat != null ? parseFloat(lat) : null;
    const longitude = lng != null ? parseFloat(lng) : null;

    // 验证经纬度范围（如果提供了有效数值）
    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      return res.status(400).json({
        code: 4000,
        message: '纬度参数无效，范围应为 -90 到 90'
      });
    }

    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      return res.status(400).json({
        code: 4000,
        message: '经度参数无效，范围应为 -180 到 180'
      });
    }

    // 验证mood参数
    const validMoods = ['开心', '难过', '治愈', '打卡'];
    if (mood && !validMoods.includes(mood)) {
      return res.status(400).json({
        code: 4000,
        message: `无效的情感标签，有效值为：${validMoods.join('、')}`
      });
    }

    const moodFilter = mood || null;

    const result = await RecommendationService.randomWalk({
      userId,
      lat: Number.isFinite(latitude) ? latitude : undefined,
      lng: Number.isFinite(longitude) ? longitude : undefined,
      moodFilter
    });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 同地点故事墙
 */
export const getLocationWall = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        code: 4000,
        message: '缺少经纬度参数'
      });
    }

    // 验证参数范围
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusNum = parseInt(radius);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        code: 4000,
        message: '纬度参数无效，范围应为 -90 到 90'
      });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        code: 4000,
        message: '经度参数无效，范围应为 -180 到 180'
      });
    }

    if (isNaN(radiusNum) || radiusNum < 10 || radiusNum > 5000) {
      return res.status(400).json({
        code: 4000,
        message: '半径参数无效，范围应为 10 到 5000 米'
      });
    }

    const stories = await MapService.getLocationWall(
      latitude,
      longitude,
      radiusNum
    );

    res.json({ code: 0, data: { stories } });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取聚合数据
 */
export const getClusterData = async (req, res, next) => {
  try {
    const { northEast, southWest, zoom } = req.query;
    const { filters, error: filterError } = parseMapQueryFilters(req.query);

    if (!northEast || !southWest) {
      return res.status(400).json({
        code: 4000,
        message: '缺少边界参数'
      });
    }

    const bounds = {
      northEast: safeParseJSONB(northEast, null),
      southWest: safeParseJSONB(southWest, null)
    };

    if (bounds.northEast === null || bounds.southWest === null) {
      return res.status(400).json({
        code: 4000,
        message: '边界参数格式错误，应为有效的 JSON'
      });
    }

    // 验证边界参数
    if (!bounds.northEast || typeof bounds.northEast !== 'object') {
      return res.status(400).json({
        code: 4000,
        message: 'northEast 参数格式错误'
      });
    }

    if (!bounds.southWest || typeof bounds.southWest !== 'object') {
      return res.status(400).json({
        code: 4000,
        message: 'southWest 参数格式错误'
      });
    }

    // 验证经纬度范围
    const { lat: neLat, lng: neLng } = bounds.northEast;
    const { lat: swLat, lng: swLng } = bounds.southWest;

    if (typeof neLat !== 'number' || neLat < -90 || neLat > 90) {
      return res.status(400).json({
        code: 4000,
        message: 'northEast.lat 参数无效，范围应为 -90 到 90'
      });
    }

    if (typeof neLng !== 'number' || neLng < -180 || neLng > 180) {
      return res.status(400).json({
        code: 4000,
        message: 'northEast.lng 参数无效，范围应为 -180 到 180'
      });
    }

    if (typeof swLat !== 'number' || swLat < -90 || swLat > 90) {
      return res.status(400).json({
        code: 4000,
        message: 'southWest.lat 参数无效，范围应为 -90 到 90'
      });
    }

    if (typeof swLng !== 'number' || swLng < -180 || swLng > 180) {
      return res.status(400).json({
        code: 4000,
        message: 'southWest.lng 参数无效，范围应为 -180 到 180'
      });
    }

    // 解析 zoom 参数
    if (filterError) {
      return res.status(400).json({
        code: 4000,
        message: filterError
      });
    }

    const zoomNum = zoom ? parseInt(zoom, 10) : 10;

    const clusters = await MapService.getClusterData(
      bounds,
      zoomNum,
      filters,
    );
    res.json({ code: 0, data: clusters });
  } catch (error) {
    next(error);
  }
};

/**
 * 消息推荐流（加权推荐：空间 + 时间 + 情感）
 */
export const getRecommendationFeed = async (req, res, next) => {
  try {
    const { lat, lng, mood, page = 1, limit = 20, summary } = req.query;
    const userId = req.user?.id;

    // 验证经纬度参数格式（如果提供了的话）
    if (lat !== undefined && lat !== null && isNaN(parseFloat(lat))) {
      return res.status(400).json({
        code: 4000,
        message: '纬度参数无效，必须是有效的数字'
      });
    }

    if (lng !== undefined && lng !== null && isNaN(parseFloat(lng))) {
      return res.status(400).json({
        code: 4000,
        message: '经度参数无效，必须是有效的数字'
      });
    }

    const latitude = lat != null ? parseFloat(lat) : null;
    const longitude = lng != null ? parseFloat(lng) : null;

    // 验证经纬度范围（如果提供了有效数值）
    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      return res.status(400).json({
        code: 4000,
        message: '纬度参数无效，范围应为 -90 到 90'
      });
    }

    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      return res.status(400).json({
        code: 4000,
        message: '经度参数无效，范围应为 -180 到 180'
      });
    }

    // 验证mood参数
    const validMoods = ['开心', '难过', '治愈', '打卡'];
    if (mood && !validMoods.includes(mood)) {
      return res.status(400).json({
        code: 4000,
        message: `无效的情感标签，有效值为：${validMoods.join('、')}`
      });
    }

    const moodFilter = mood || null;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const isSummary = summary === '1' || summary === 'true';

    const result = await RecommendationService.getFeed({
      userId,
      lat: Number.isFinite(latitude) ? latitude : undefined,
      lng: Number.isFinite(longitude) ? longitude : undefined,
      moodFilter,
      page: pageNum,
      limit: limitNum,
      summary: isSummary
    });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};
