import { Story } from '../story/story.model.js';
import { User } from '../auth/auth.model.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';
import { getVisibilityTimeCondition } from '../../common/utils/visibility-time.util.js';
import { clusterPoints } from './cluster.util.js';
import { safeParseJSONB } from '../../common/utils/jsonb.util.js';

// ===================== 常量配置 =====================
const CONSTANTS = {
  DEFAULT_RADIUS: 50,
  MAX_EXPLORE_LIMIT: 50,
  MAX_WALL_LIMIT: 50,
  PUBLIC_VISIBILITY: 'public'
};

// ===================== 核心工具：手动解析 POINT 字符串（绕过所有SQL坑） =====================
const parsePoint = (locationVal) => {
  if (!locationVal) return { lat: 0, lng: 0 };
  
  // 兼容 GeoJSON 对象格式
  if (locationVal.type === 'Point' && Array.isArray(locationVal.coordinates)) {
    return { lng: locationVal.coordinates[0], lat: locationVal.coordinates[1] };
  }

  // 兼容 WKT 字符串格式 "POINT (0 0)"
  const locStr = String(locationVal);
  const match = locStr.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
  if (match) {
    return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
  }

  return { lat: 0, lng: 0 };
};

// ===================== 公共工具方法 =====================
const MapServiceUtil = {
  // ✅ 核心修改：不做SQL计算，直接查原始 location 字段
  STORY_ATTRIBUTES: [
    'id',
    'content',
    'images',
    'location', // 直接查原始字段
    'locationName',  // ✅ 新增：地点名称
    'emotionTag',
    'isRecommended',
    'createdAt'
  ],

  getDWithinCondition() {
    return sequelize.literal(`
      ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
        :radius
      )
    `);
  },

  getBoundsCondition() {
    return sequelize.literal(`
      location && ST_MakeEnvelope(:swLng, :swLat, :neLng, :neLat, 4326)
    `);
  },

  // ✅ 核心修改：用 JS 手动解析经纬度
  formatStory(story) {
    if (!story) return null;

    // 手动解析 location
    const { lat, lng } = parsePoint(story.location);

    return {
      id: story.id,
      content: story.content,
      images: safeParseJSONB(story.images, []),
      username: story.author?.username || story.username || '',
      avatar: story.author?.avatarUrl || story.avatar || null,
      author: story.author
        ? {
            id: story.author.id,
            username: story.author.username || '匿名用户',
            avatar: story.author.avatarUrl || null
          }
        : null,
      location: {
        latitude: lat,
        longitude: lng
      },
      locationName: story.locationName,  // ✅ 新增：地点名称
      emotionTag: story.emotionTag,
      isRecommended: story.isRecommended,
      createdAt: story.createdAt
    };
  }
};

// ===================== 核心地图服务 =====================
export const MapService = {
  async exploreStories(latitude, longitude, radius) {
    const stories = await Story.findAll({
      where: {
        visibility: CONSTANTS.PUBLIC_VISIBILITY,
        location: { [Op.not]: null },
        [Op.and]: [
          MapServiceUtil.getDWithinCondition(),
          getVisibilityTimeCondition()
        ]
      },
      replacements: { lat: latitude, lng: longitude, radius },
      attributes: MapServiceUtil.STORY_ATTRIBUTES,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: CONSTANTS.MAX_EXPLORE_LIMIT
    });

    return stories.map(s => ({
      ...MapServiceUtil.formatStory(s),
      content: s.content.length > 100 ? s.content.substring(0, 100) + '...' : s.content
    }));
  },

  /**
   * 随机漫步 ✅ 带调试，必解决
   */
  async randomWalk() {
    console.log('🎲 【随机漫步】开始查询...');

    const story = await Story.findOne({
      where: {
        visibility: CONSTANTS.PUBLIC_VISIBILITY,
        location: { [Op.not]: null },
        [Op.and]: [getVisibilityTimeCondition()]
      },
      order: [
        [sequelize.literal('is_recommended DESC NULLS LAST')],
        [sequelize.random()]
      ],
      attributes: MapServiceUtil.STORY_ATTRIBUTES,
      logging: console.log // 打印SQL
    });

    // ✅ 核心调试：看原始 location 到底是什么
    console.log('🎲 【随机漫步】原始 story.location:', story?.location);
    console.log('🎲 【随机漫步】完整 dataValues:', story?.dataValues);

    if (!story) return null;

    const { lat, lng } = parsePoint(story.location);
    console.log('🎲 【随机漫步】解析后的经纬度:', { lat, lng });

    return {
      location: { latitude: lat, longitude: lng },
      story: MapServiceUtil.formatStory(story)
    };
  },

  async getLocationWall(latitude, longitude, radius = CONSTANTS.DEFAULT_RADIUS) {
    const stories = await Story.findAll({
      where: {
        visibility: CONSTANTS.PUBLIC_VISIBILITY,
        location: { [Op.not]: null },
        [Op.and]: [
          MapServiceUtil.getDWithinCondition(),
          getVisibilityTimeCondition()
        ]
      },
      replacements: { lat: latitude, lng: longitude, radius },
      attributes: MapServiceUtil.STORY_ATTRIBUTES,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: CONSTANTS.MAX_WALL_LIMIT
    });

    return stories.map(MapServiceUtil.formatStory).filter(Boolean);
  },

   // ===================== 优化：根据 zoom 动态计算聚合网格大小 =====================
  getDynamicGridSize(zoom) {
    const z = zoom ?? 10;
    if (z <= 5) return 15000;
    if (z <= 7) return 8000;
    if (z <= 9) return 3000;
    if (z <= 11) return 1500;
    if (z <= 13) return 800;
    if (z <= 14) return 300;
    return 150;
  },

  async getClusterData(bounds, zoom) {
    const { northEast, southWest } = bounds;
    const stories = await Story.findAll({
      where: {
        visibility: CONSTANTS.PUBLIC_VISIBILITY,
        location: { [Op.not]: null },
        [Op.and]: [
          MapServiceUtil.getBoundsCondition(),
          getVisibilityTimeCondition()
        ]
      },
      replacements: {
        swLng: southWest.lng,
        swLat: southWest.lat,
        neLng: northEast.lng,
        neLat: northEast.lat
      },
      attributes: ['id', 'location', 'emotionTag']
    });

    // 🔥 传入动态计算的网格大小（根据 zoom 级别）
    const gridSize = this.getDynamicGridSize(zoom);
    const points = stories.map(s => {
      const { lat, lng } = parsePoint(s.location);
      return {
        id: s.id,
        latitude: lat,
        longitude: lng,
        emotionTag: s.emotionTag
      };
    });

    console.log(`[Cluster] zoom=${zoom}, gridSize=${gridSize}m, points=${points.length}`);
    return clusterPoints(points, gridSize);
  },

  formatStory: MapServiceUtil.formatStory
};
