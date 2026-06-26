import { Story } from '../story/story.model.js';
import { User } from '../auth/auth.model.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';
import { getVisibilityTimeCondition } from '../../common/utils/visibility-time.util.js';
import { clusterPoints, getGeohashPrecision } from './cluster.util.js';
import { safeParseJSONB } from '../../common/utils/jsonb.util.js';

const CONSTANTS = {
  DEFAULT_RADIUS: 50,
  MAX_EXPLORE_LIMIT: 500,
  MAX_WALL_LIMIT: 50,
  PUBLIC_VISIBILITY: 'public'
};

const parsePoint = (locationVal) => {
  if (!locationVal) return { lat: 0, lng: 0 };
  
  if (locationVal.type === 'Point' && Array.isArray(locationVal.coordinates)) {
    return { lng: locationVal.coordinates[0], lat: locationVal.coordinates[1] };
  }

  const locStr = String(locationVal);
  const match = locStr.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
  if (match) {
    return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
  }

  return { lat: 0, lng: 0 };
};

const normalizeStoryId = (storyId) => {
  if (storyId === undefined || storyId === null) {
    return null;
  }

  return typeof storyId === 'bigint'
    ? storyId.toString()
    : String(storyId).trim();
};

const MapServiceUtil = {
  STORY_ATTRIBUTES: [
    'id',
    'content',
    'images',
    'location',
    'locationName',
    'emotionTag',
    'isTimeCapsule',
    'unlockAt',
    'isRecommended',
    'fontFamily',
    'fontEffect',
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

  formatStory(story, options = {}) {
    if (!story) return null;

    const { lat, lng } = parsePoint(story.location);
    const rawImages = safeParseJSONB(story.images, []);

    return {
      id: normalizeStoryId(story.id),
      content: story.content,
      images: options.summary && rawImages.length > 1 ? [rawImages[0]] : rawImages,
      username: story.author?.username || story.username || '',
      avatar: story.author?.avatarUrl || story.avatar || null,
      author: story.author
        ? {
            id: story.author.id,
            username: story.author.username || '匿名用户',
            avatar: story.author.avatarUrl || null,
            vip: story.author.vip || 0
          }
        : null,
      location: {
        latitude: lat,
        longitude: lng
      },
      locationName: story.locationName,
      emotionTag: normalizeMapEmotionTag(story.emotionTag),
      isTimeCapsule: !!story.isTimeCapsule,
      unlockAt: story.unlockAt || null,
      isUnlocked: !story.isTimeCapsule || (story.unlockAt && new Date(story.unlockAt) <= new Date()),
      isRecommended: story.isRecommended,
      fontFamily: story.fontFamily || null,
      fontEffect: story.fontEffect || null,
      createdAt: story.createdAt
    };
  }
};

const MAP_EMOTION_ALIASES = {
  happy: ["happy", "\u5f00\u5fc3"],
  sad: ["sad", "\u96be\u8fc7"],
  peaceful: ["peaceful", "\u6cbb\u6108"],
  neutral: ["neutral", "\u5e73\u9759"],
  excited: ["excited", "\u6253\u5361"],
};

const MAP_EMOTION_TAG_BY_KEY = {
  happy: "\u5f00\u5fc3",
  sad: "\u96be\u8fc7",
  peaceful: "\u6cbb\u6108",
  neutral: "\u5e73\u9759",
  excited: "\u6253\u5361",
};

function normalizeMapEmotionKey(value) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) {
    return '';
  }

  return Object.entries(MAP_EMOTION_ALIASES).find(([, aliases]) =>
    aliases.includes(normalizedValue)
  )?.[0] || normalizedValue;
}

function normalizeMapEmotionTag(value) {
  const normalizedKey = normalizeMapEmotionKey(value);
  return MAP_EMOTION_TAG_BY_KEY[normalizedKey] || String(value || '').trim();
}

function buildStoryFilterWhere(options = {}) {
  const where = {};
  const normalizedEmotionTag = String(options.emotionTag || '').trim();

  if (normalizedEmotionTag) {
    const aliases =
      MAP_EMOTION_ALIASES[normalizeMapEmotionKey(normalizedEmotionTag)] ||
      [normalizedEmotionTag];
    where.emotionTag = aliases.length === 1 ? aliases[0] : { [Op.in]: aliases };
  }

  if (options.createdAfter || options.createdBefore) {
    where.createdAt = {};

    if (options.createdAfter) {
      where.createdAt[Op.gte] = new Date(options.createdAfter);
    }

    if (options.createdBefore) {
      where.createdAt[Op.lte] = new Date(options.createdBefore);
    }
  }

  return where;
}

export const MapService = {
  /**
   * 范围查询故事
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} radius - 米
   * @param {Object} options - { page, limit, summary }
   *   page/limit 存在时启用分页，返回 { stories, pagination }
   *   summary 为 true 时 images 只返回第一张
   *   不传分页参数时保持向后兼容，直接返回数组
   */
  async exploreStories(latitude, longitude, radius, options = {}) {
    const { page, limit, summary } = options;
    const usePagination = page != null || limit != null;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || CONSTANTS.MAX_EXPLORE_LIMIT, 1), CONSTANTS.MAX_EXPLORE_LIMIT);
    const optionalWhere = buildStoryFilterWhere(options);

    const queryOpts = {
      where: {
        visibility: CONSTANTS.PUBLIC_VISIBILITY,
        location: { [Op.not]: null },
        ...optionalWhere,
        [Op.and]: [
          MapServiceUtil.getDWithinCondition(),
          getVisibilityTimeCondition(),
          sequelize.literal(`NOT (is_time_capsule = true AND unlock_at IS NOT NULL AND unlock_at > NOW())`)
        ]
      },
      replacements: { lat: latitude, lng: longitude, radius },
      attributes: MapServiceUtil.STORY_ATTRIBUTES,
      include: [({
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl', 'vip']
      })],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
    };

    if (usePagination) {
      queryOpts.offset = (pageNum - 1) * limitNum;
    }

    let stories;
    let pagination;

    if (usePagination) {
      const { count, rows } = await Story.findAndCountAll(queryOpts);
      stories = rows;
      pagination = {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      };
    } else {
      stories = await Story.findAll(queryOpts);
    }

    const formatted = stories.map(s => ({
      ...MapServiceUtil.formatStory(s, { summary }),
      content: s.content.length > 100 ? s.content.substring(0, 100) + '...' : s.content
    }));

    if (usePagination) {
      return { stories: formatted, pagination };
    }
    return formatted;
  },

  async randomWalk() {
    console.log('🎲 【随机漫步】开始查询...');

    const story = await Story.findOne({
      where: {
        visibility: CONSTANTS.PUBLIC_VISIBILITY,
        location: { [Op.not]: null },
        [Op.and]: [
          getVisibilityTimeCondition(),
          sequelize.literal(`NOT (is_time_capsule = true AND unlock_at IS NOT NULL AND unlock_at > NOW())`)
        ]
      },
      order: [
        [sequelize.literal('is_recommended DESC NULLS LAST')],
        [sequelize.random()]
      ],
      attributes: MapServiceUtil.STORY_ATTRIBUTES,
      logging: console.log
    });

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
          getVisibilityTimeCondition(),
          sequelize.literal(`NOT (is_time_capsule = true AND unlock_at IS NOT NULL AND unlock_at > NOW())`)
        ]
      },
      replacements: { lat: latitude, lng: longitude, radius },
      attributes: MapServiceUtil.STORY_ATTRIBUTES,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl', 'vip']
      }],
      order: [['createdAt', 'DESC']],
      limit: CONSTANTS.MAX_WALL_LIMIT
    });

    return stories.map(MapServiceUtil.formatStory).filter(Boolean);
  },

  getGeohashPrecision(zoom) {
    return getGeohashPrecision(zoom);
  },

  async getClusterData(bounds, zoom, options = {}) {
    const { northEast, southWest } = bounds;
    const optionalWhere = buildStoryFilterWhere(options);
    const stories = await Story.findAll({
      where: {
        visibility: CONSTANTS.PUBLIC_VISIBILITY,
        location: { [Op.not]: null },
        ...optionalWhere,
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
      attributes: ['id', 'location', 'emotionTag', 'isTimeCapsule', 'unlockAt', 'fontFamily', 'fontEffect']
    });

    const precision = this.getGeohashPrecision(zoom);
    const points = stories.map(s => {
      const { lat, lng } = parsePoint(s.location);
      const isLocked = s.isTimeCapsule && (!s.unlockAt || new Date(s.unlockAt) > new Date());
      return {
        id: normalizeStoryId(s.id),
        latitude: lat,
        longitude: lng,
        emotionTag: normalizeMapEmotionTag(s.emotionTag),
        isTimeCapsule: !!s.isTimeCapsule,
        unlockAt: s.unlockAt || null,
        isUnlocked: !s.isTimeCapsule || (s.unlockAt && new Date(s.unlockAt) <= new Date()),
        isLocked,
        fontFamily: s.fontFamily || null,
        fontEffect: s.fontEffect || null
      };
    });

    console.log(`[Cluster] zoom=${zoom}, geohashPrecision=${precision}, points=${points.length}`);
    return clusterPoints(points, { zoom, precision });
  },

  formatStory: MapServiceUtil.formatStory
};
