import { Story } from '../story/story.model.js';
import { Like } from '../like/like.model.js';
import { User } from '../auth/auth.model.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';
import { getVisibilityTimeCondition } from '../../common/utils/visibility-time.util.js';
import { safeParseJSONB } from '../../common/utils/jsonb.util.js';

// ===================== 常量配置 =====================
const RECOMMENDATION = {
  CANDIDATE_POOL_SIZE: 300,
  FEED_PAGE_SIZE: 20,
  RANDOM_WALK_TOP_N: 30,
  MAX_EXPLORE_RADIUS: 500000, // 500km，随机漫步可全国范围
  SPATIAL_WEIGHT: 0.4,
  TEMPORAL_WEIGHT: 0.35,
  EMOTIONAL_WEIGHT: 0.25,
  TEMPORAL_HALF_LIFE_DAYS: 7,
  SPATIAL_DECAY_KM: 50,
  HOT_ZONE_THRESHOLD: 5
};

// ===================== 工具函数 =====================
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

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const normalizeStoryId = (storyId) => {
  if (storyId === undefined || storyId === null) {
    return null;
  }

  return typeof storyId === 'bigint'
    ? storyId.toString()
    : String(storyId).trim();
};

// ===================== 用户偏好 =====================
async function getUserPreferredEmotionTags(userId, limit = 50) {
  if (!userId) return {};
  const likes = await Like.findAll({
    where: { userId },
    include: [{
      model: Story,
      as: 'story',
      required: false,
      attributes: ['emotionTag']
    }],
    order: [['createdAt', 'DESC']],
    limit
  });
  const tagCounts = {};
  for (const like of likes) {
    const tag = like.story?.emotionTag;
    if (tag) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  return tagCounts;
}

// ===================== 候选故事池 =====================
async function fetchCandidateStories(options = {}) {
  const { lat, lng, radius = RECOMMENDATION.MAX_EXPLORE_RADIUS } = options;
  const where = {
    visibility: 'public',
    location: { [Op.not]: null },
    [Op.and]: [getVisibilityTimeCondition()]
  };

  let replacements = {};
  let spatialCondition = null;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    spatialCondition = sequelize.literal(`
      ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
        :radius
      )
    `);
    replacements = { lat, lng, radius };
    where[Op.and].push(spatialCondition);
  }

  const stories = await Story.findAll({
    where,
    replacements: Object.keys(replacements).length ? replacements : undefined,
    attributes: ['id', 'content', 'images', 'location', 'locationName', 'emotionTag', 'isRecommended', 'createdAt'],
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'avatarUrl', 'vip']
    }],
    order: [['createdAt', 'DESC']],
    limit: RECOMMENDATION.CANDIDATE_POOL_SIZE
  });

  return stories.map(s => {
    const plain = s.get({ plain: true });
    // 确保雪花ID始终为字符串，防止JS精度丢失导致负数截断
    plain.id = normalizeStoryId(plain.id);
    return {
      ...plain,
      _coords: parsePoint(s.location)
    };
  });
}

// ===================== 评分函数 =====================
function computeSpatialScore(story, userLat, userLng, gridCountMap) {
  const { lat, lng } = story._coords || parsePoint(story.location);
  let distanceScore = 1;
  if (userLat != null && userLng != null && Number.isFinite(userLat) && Number.isFinite(userLng)) {
    const distKm = haversineKm(userLat, userLng, lat, lng);
    distanceScore = 1 / (1 + distKm / RECOMMENDATION.SPATIAL_DECAY_KM);
  }
  const gridKey = `${Math.round(lat * 50)}_${Math.round(lng * 50)}`;
  const gridCount = gridCountMap[gridKey] || 0;
  const hotZoneBonus = Math.min(0.3, (gridCount / RECOMMENDATION.HOT_ZONE_THRESHOLD) * 0.1);
  const adminBonus = story.isRecommended ? 0.2 : 0;
  return Math.min(1, distanceScore + hotZoneBonus + adminBonus);
}

function computeTemporalScore(story) {
  const createdAt = story.createdAt ? new Date(story.createdAt) : new Date();
  const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-ageDays * Math.LN2 / RECOMMENDATION.TEMPORAL_HALF_LIFE_DAYS);
}

function computeEmotionalScore(story, userPreferredTags, moodFilter) {
  const tag = story.emotionTag || '';
  if (moodFilter && tag === moodFilter) return 1;
  if (Object.keys(userPreferredTags || {}).length > 0) {
    const total = Object.values(userPreferredTags).reduce((a, b) => a + b, 0);
    const weight = (userPreferredTags[tag] || 0) / total;
    return 0.3 + 0.7 * Math.min(1, weight * 3);
  }
  return 0.5;
}

// ===================== 主推荐逻辑 =====================
function buildGridCountMap(stories) {
  const map = {};
  for (const s of stories) {
    const { lat, lng } = s._coords || parsePoint(s.location);
    const key = `${Math.round(lat * 50)}_${Math.round(lng * 50)}`;
    map[key] = (map[key] || 0) + 1;
  }
  return map;
}

function scoreAndSortStories(stories, options) {
  const { userLat, userLng, userPreferredTags, moodFilter } = options;
  const gridCountMap = buildGridCountMap(stories);

  const scored = stories.map(story => {
    const spatial = computeSpatialScore(story, userLat, userLng, gridCountMap);
    const temporal = computeTemporalScore(story);
    const emotional = computeEmotionalScore(story, userPreferredTags, moodFilter);
    const total =
      spatial * RECOMMENDATION.SPATIAL_WEIGHT +
      temporal * RECOMMENDATION.TEMPORAL_WEIGHT +
      emotional * RECOMMENDATION.EMOTIONAL_WEIGHT;
    return { story, total, spatial, temporal, emotional };
  });

  scored.sort((a, b) => b.total - a.total);
  return scored;
}

function formatStoryForResponse(story, options = {}) {
  const { lat, lng } = story._coords || parsePoint(story.location);
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
    location: { latitude: lat, longitude: lng },
    locationName: story.locationName,
    emotionTag: story.emotionTag,
    isRecommended: story.isRecommended,
    createdAt: story.createdAt
  };
}

// ===================== 导出服务 =====================
export const RecommendationService = {
  async randomWalk(options = {}) {
    const { userId, lat, lng, moodFilter } = options;
    const userPreferredTags = await getUserPreferredEmotionTags(userId);
    const candidates = await fetchCandidateStories({
      lat: lat ?? 39.9,
      lng: lng ?? 116.4,
      radius: RECOMMENDATION.MAX_EXPLORE_RADIUS
    });

    if (candidates.length === 0) return null;

    const scored = scoreAndSortStories(candidates, {
      userLat: lat,
      userLng: lng,
      userPreferredTags,
      moodFilter
    });

    const topN = scored.slice(0, RECOMMENDATION.RANDOM_WALK_TOP_N);
    const pick = topN[Math.floor(Math.random() * topN.length)];
    if (!pick) return null;

    const { story } = pick;
    const { lat: slat, lng: slng } = story._coords || parsePoint(story.location);

    return {
      location: { latitude: slat, longitude: slng },
      story: formatStoryForResponse(story)
    };
  },

  async getFeed(options = {}) {
    const { userId, lat, lng, moodFilter, page = 1, limit = RECOMMENDATION.FEED_PAGE_SIZE, summary } = options;
    const userPreferredTags = await getUserPreferredEmotionTags(userId);
    const candidates = await fetchCandidateStories({
      lat: lat ?? 39.9,
      lng: lng ?? 116.4,
      radius: RECOMMENDATION.MAX_EXPLORE_RADIUS
    });

    const scored = scoreAndSortStories(candidates, {
      userLat: lat,
      userLng: lng,
      userPreferredTags,
      moodFilter
    });

    const offset = (page - 1) * limit;
    const pageItems = scored.slice(offset, offset + limit);

    return {
      stories: pageItems.map(({ story }) => ({
        ...formatStoryForResponse(story, { summary }),
        content: story.content?.length > 100 ? story.content.substring(0, 100) + '...' : story.content
      })),
      pagination: {
        total: scored.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(scored.length / limit)
      }
    };
  }
};
