import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { safeParseJSONB } from '../../common/utils/jsonb.util.js';
import { getVisibilityTimeCondition } from '../../common/utils/visibility-time.util.js';
import { User } from '../auth/auth.model.js';
import { Comment } from '../comment/comment.model.js';
import { Favorite } from '../favorite/favorite.model.js';
import { Like } from '../like/like.model.js';
import { Story } from '../story/story.model.js';

const RECOMMENDATION = {
  CANDIDATE_POOL_SIZE: 320,
  FEED_PAGE_SIZE: 20,
  RANDOM_WALK_TOP_N: 24,
  MAX_EXPLORE_RADIUS: 500000,
  LOCAL_RECALL_RADIUS: 150000,
  RECENT_LOCAL_LIMIT: 140,
  PREFERENCE_RECALL_LIMIT: 120,
  AUTHOR_RECALL_LIMIT: 60,
  TRENDING_RECALL_LIMIT: 120,
  ADMIN_RECALL_LIMIT: 50,
  FALLBACK_RECALL_LIMIT: 120,
  TEMPORAL_HALF_LIFE_DAYS: 6,
  SPATIAL_DECAY_KM: 35,
  MAX_RERANK_SCAN: 80,
  WEIGHTS: {
    spatial: 0.22,
    emotion: 0.22,
    engagement: 0.18,
    freshness: 0.14,
    author: 0.08,
    novelty: 0.06,
    exploration: 0.06,
    curation: 0.04
  }
};

const STORY_ATTRIBUTES = [
  'id',
  'userId',
  'content',
  'images',
  'location',
  'locationName',
  'emotionTag',
  'isRecommended',
  'isTimeCapsule',
  'unlockAt',
  'viewCount',
  'createdAt'
];

const UNLOCKED_CONDITION = sequelize.literal(`
  NOT (
    is_time_capsule = true
    AND unlock_at IS NOT NULL
    AND unlock_at > NOW()
  )
`);

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

const incrementCounter = (target, key, weight = 1) => {
  if (!key) return;
  target[key] = (target[key] || 0) + weight;
};

const toTopKeys = (counter, limit) => Object.entries(counter || {})
  .sort((a, b) => b[1] - a[1])
  .slice(0, limit)
  .map(([key]) => key);

function buildGridKey(story) {
  const { lat, lng } = story._coords || parsePoint(story.location);
  return `${Math.round(lat * 30)}_${Math.round(lng * 30)}`;
}

async function getUserInteractionProfile(userId, limit = 80) {
  if (!userId) {
    return {
      emotionCounts: {},
      authorCounts: {},
      interactedStoryIds: new Set(),
      totalEmotionInteractions: 0,
      totalAuthorInteractions: 0
    };
  }

  const storyInclude = [{
    model: Story,
    as: 'story',
    required: false,
    attributes: ['id', 'emotionTag', 'userId']
  }];

  const [likes, favorites, comments] = await Promise.all([
    Like.findAll({
      where: { userId },
      include: storyInclude,
      order: [['createdAt', 'DESC']],
      limit
    }),
    Favorite.findAll({
      where: { userId },
      include: storyInclude,
      order: [['createdAt', 'DESC']],
      limit
    }),
    Comment.findAll({
      where: { userId, status: 'active' },
      include: storyInclude,
      order: [['createdAt', 'DESC']],
      limit
    })
  ]);

  const emotionCounts = {};
  const authorCounts = {};
  const interactedStoryIds = new Set();

  const consume = (items, weight) => {
    for (const item of items) {
      const story = item.story;
      if (!story) continue;
      const storyId = normalizeStoryId(story.id);
      interactedStoryIds.add(storyId);
      incrementCounter(emotionCounts, story.emotionTag, weight);
      incrementCounter(authorCounts, String(story.userId), weight);
    }
  };

  consume(likes, 1);
  consume(favorites, 1.3);
  consume(comments, 1.1);

  return {
    emotionCounts,
    authorCounts,
    interactedStoryIds,
    totalEmotionInteractions: Object.values(emotionCounts).reduce((sum, value) => sum + value, 0),
    totalAuthorInteractions: Object.values(authorCounts).reduce((sum, value) => sum + value, 0)
  };
}

function buildBaseWhere(options = {}) {
  const {
    lat,
    lng,
    radius,
    moodFilter,
    emotionTags,
    authorIds,
    adminOnly,
    excludeStoryIds
  } = options;

  const where = {
    visibility: 'public',
    location: { [Op.not]: null },
    [Op.and]: [getVisibilityTimeCondition(), UNLOCKED_CONDITION]
  };

  if (moodFilter) {
    where.emotionTag = moodFilter;
  } else if (Array.isArray(emotionTags) && emotionTags.length > 0) {
    where.emotionTag = { [Op.in]: emotionTags };
  }

  if (Array.isArray(authorIds) && authorIds.length > 0) {
    where.userId = { [Op.in]: authorIds };
  }

  if (adminOnly) {
    where.isRecommended = true;
  }

  if (Array.isArray(excludeStoryIds) && excludeStoryIds.length > 0) {
    where.id = { [Op.notIn]: excludeStoryIds };
  }

  let replacements;
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Number.isFinite(radius) &&
    radius > 0
  ) {
    where[Op.and].push(sequelize.literal(`
      ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
        :radius
      )
    `));
    replacements = { lat, lng, radius };
  }

  return { where, replacements };
}

async function fetchStoriesByRecall(options = {}) {
  const {
    lat,
    lng,
    radius,
    moodFilter,
    emotionTags,
    authorIds,
    adminOnly = false,
    excludeStoryIds,
    limit = RECOMMENDATION.CANDIDATE_POOL_SIZE,
    order = [['createdAt', 'DESC']]
  } = options;

  const { where, replacements } = buildBaseWhere({
    lat,
    lng,
    radius,
    moodFilter,
    emotionTags,
    authorIds,
    adminOnly,
    excludeStoryIds
  });

  const stories = await Story.findAll({
    where,
    replacements,
    attributes: STORY_ATTRIBUTES,
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'avatarUrl', 'vip', 'status']
    }],
    order,
    limit
  });

  return stories.map((story) => {
    const plain = story.get({ plain: true });
    plain.id = normalizeStoryId(plain.id);
    plain._coords = parsePoint(story.location);
    return plain;
  });
}

function mergeCandidateStories(candidateGroups = []) {
  const merged = [];
  const seen = new Set();

  for (const group of candidateGroups) {
    for (const story of group || []) {
      const storyId = normalizeStoryId(story.id);
      if (!storyId || seen.has(storyId)) continue;
      seen.add(storyId);
      merged.push(story);
      if (merged.length >= RECOMMENDATION.CANDIDATE_POOL_SIZE) {
        return merged;
      }
    }
  }

  return merged;
}

async function recallCandidateStories(options = {}) {
  const { userId, lat, lng, moodFilter } = options;
  const profile = await getUserInteractionProfile(userId);
  const preferredEmotionTags = moodFilter ? [] : toTopKeys(profile.emotionCounts, 3);
  const preferredAuthorIds = toTopKeys(profile.authorCounts, 2)
    .map((id) => parseInt(id, 10))
    .filter(Number.isFinite);

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const recallTasks = [
    hasCoords
      ? fetchStoriesByRecall({
          lat,
          lng,
          radius: RECOMMENDATION.LOCAL_RECALL_RADIUS,
          moodFilter,
          limit: RECOMMENDATION.RECENT_LOCAL_LIMIT,
          order: [['createdAt', 'DESC']]
        })
      : fetchStoriesByRecall({
          moodFilter,
          limit: RECOMMENDATION.RECENT_LOCAL_LIMIT,
          order: [['createdAt', 'DESC']]
        }),
    moodFilter || preferredEmotionTags.length > 0
      ? fetchStoriesByRecall({
          moodFilter,
          emotionTags: preferredEmotionTags,
          limit: RECOMMENDATION.PREFERENCE_RECALL_LIMIT,
          order: [['createdAt', 'DESC']]
        })
      : Promise.resolve([]),
    preferredAuthorIds.length > 0
      ? fetchStoriesByRecall({
          moodFilter,
          authorIds: preferredAuthorIds,
          limit: RECOMMENDATION.AUTHOR_RECALL_LIMIT,
          order: [['createdAt', 'DESC']]
        })
      : Promise.resolve([]),
    fetchStoriesByRecall({
      moodFilter,
      limit: RECOMMENDATION.TRENDING_RECALL_LIMIT,
      order: [
        [sequelize.literal('is_recommended DESC NULLS LAST')],
        ['viewCount', 'DESC'],
        ['createdAt', 'DESC']
      ]
    }),
    fetchStoriesByRecall({
      moodFilter,
      adminOnly: true,
      limit: RECOMMENDATION.ADMIN_RECALL_LIMIT,
      order: [['createdAt', 'DESC']]
    })
  ];

  const candidateGroups = await Promise.all(recallTasks);
  let candidates = mergeCandidateStories(candidateGroups);

  if (candidates.length < RECOMMENDATION.CANDIDATE_POOL_SIZE) {
    const fallbackStories = await fetchStoriesByRecall({
      moodFilter,
      excludeStoryIds: candidates.map((story) => story.id),
      limit: RECOMMENDATION.FALLBACK_RECALL_LIMIT,
      order: [['createdAt', 'DESC']]
    });

    candidates = mergeCandidateStories([...candidateGroups, fallbackStories]);
  }

  return { candidates, profile };
}

async function fetchStoryMetrics(storyIds = []) {
  if (storyIds.length === 0) {
    return {
      likeCounts: {},
      favoriteCounts: {},
      commentCounts: {}
    };
  }

  const [likes, favorites, comments] = await Promise.all([
    Like.findAll({
      where: { story_id: { [Op.in]: storyIds } },
      attributes: [
        ['story_id', 'storyId'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['story_id'],
      raw: true
    }),
    Favorite.findAll({
      where: { story_id: { [Op.in]: storyIds } },
      attributes: [
        ['story_id', 'storyId'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['story_id'],
      raw: true
    }),
    Comment.findAll({
      where: { story_id: { [Op.in]: storyIds }, status: 'active' },
      attributes: [
        ['story_id', 'storyId'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['story_id'],
      raw: true
    })
  ]);

  const buildMap = (rows) => rows.reduce((acc, row) => {
    acc[normalizeStoryId(row.storyId)] = Number(row.count || 0);
    return acc;
  }, {});

  return {
    likeCounts: buildMap(likes),
    favoriteCounts: buildMap(favorites),
    commentCounts: buildMap(comments)
  };
}

function buildGridCountMap(stories) {
  return stories.reduce((acc, story) => {
    const key = buildGridKey(story);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function computeSpatialScore(story, userLat, userLng) {
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return 0.6;
  }

  const { lat, lng } = story._coords || parsePoint(story.location);
  const distKm = haversineKm(userLat, userLng, lat, lng);
  return Math.exp(-distKm / RECOMMENDATION.SPATIAL_DECAY_KM);
}

function computeFreshnessScore(story) {
  const createdAt = story.createdAt ? new Date(story.createdAt) : new Date();
  const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-ageDays * Math.LN2 / RECOMMENDATION.TEMPORAL_HALF_LIFE_DAYS);
}

function computeEmotionScore(story, profile, moodFilter) {
  if (moodFilter) {
    return story.emotionTag === moodFilter ? 1 : 0;
  }

  if (!profile.totalEmotionInteractions) {
    return story.emotionTag ? 0.6 : 0.5;
  }

  const matchWeight = (profile.emotionCounts[story.emotionTag] || 0) / profile.totalEmotionInteractions;
  return Math.min(1, 0.35 + matchWeight * 2.5);
}

function computeAuthorScore(story, profile) {
  const authorId = String(story.author?.id || story.userId || '');
  const affinity = profile.totalAuthorInteractions
    ? (profile.authorCounts[authorId] || 0) / profile.totalAuthorInteractions
    : 0;

  let score = 0.45 + Math.min(0.28, affinity * 1.8);

  if (story.author?.vip) {
    score += 0.08;
  }

  if (story.author?.status === 'recommended') {
    score += 0.08;
  }

  if (story.isRecommended) {
    score += 0.08;
  }

  return Math.min(1, score);
}

function computeEngagementInputs(story, metrics) {
  const storyId = normalizeStoryId(story.id);
  const likeCount = metrics.likeCounts[storyId] || 0;
  const favoriteCount = metrics.favoriteCounts[storyId] || 0;
  const commentCount = metrics.commentCounts[storyId] || 0;
  const viewCount = Number(story.viewCount || 0);
  const rawEngagement = likeCount + favoriteCount * 1.6 + commentCount * 1.8 + Math.log1p(viewCount) * 0.35;

  return { likeCount, favoriteCount, commentCount, viewCount, rawEngagement };
}

function computeNoveltyScore(story, profile) {
  const storyId = normalizeStoryId(story.id);
  if (profile.interactedStoryIds.has(storyId)) {
    return 0.08;
  }

  const authorId = String(story.author?.id || story.userId || '');
  const authorSeen = profile.authorCounts[authorId] || 0;
  if (authorSeen >= 3) {
    return 0.55;
  }

  return 0.92;
}

function computeExplorationScore(story, engagementInputs, gridCountMap, maxGridCount) {
  const gridKey = buildGridKey(story);
  const gridDensity = gridCountMap[gridKey] || 1;
  const sparseAreaScore = 1 - Math.min(1, gridDensity / Math.max(1, maxGridCount));
  const coldStartScore = 1 - Math.min(1, engagementInputs.rawEngagement / 6);
  return (sparseAreaScore + coldStartScore) / 2;
}

function scoreCandidates(stories, options = {}) {
  const { userLat, userLng, moodFilter, profile, metrics } = options;
  const gridCountMap = buildGridCountMap(stories);
  const maxGridCount = Math.max(1, ...Object.values(gridCountMap));

  const engagementByStory = {};
  let maxEngagement = 1;
  for (const story of stories) {
    const storyId = normalizeStoryId(story.id);
    const inputs = computeEngagementInputs(story, metrics);
    engagementByStory[storyId] = inputs;
    maxEngagement = Math.max(maxEngagement, inputs.rawEngagement);
  }

  return stories.map((story) => {
    const storyId = normalizeStoryId(story.id);
    const engagementInputs = engagementByStory[storyId];

    const spatial = computeSpatialScore(story, userLat, userLng);
    const emotion = computeEmotionScore(story, profile, moodFilter);
    const engagement = Math.min(1, engagementInputs.rawEngagement / maxEngagement);
    const freshness = computeFreshnessScore(story);
    const author = computeAuthorScore(story, profile);
    const novelty = computeNoveltyScore(story, profile);
    const exploration = computeExplorationScore(story, engagementInputs, gridCountMap, maxGridCount);
    const curation = story.isRecommended ? 1 : 0;

    const total =
      spatial * RECOMMENDATION.WEIGHTS.spatial +
      emotion * RECOMMENDATION.WEIGHTS.emotion +
      engagement * RECOMMENDATION.WEIGHTS.engagement +
      freshness * RECOMMENDATION.WEIGHTS.freshness +
      author * RECOMMENDATION.WEIGHTS.author +
      novelty * RECOMMENDATION.WEIGHTS.novelty +
      exploration * RECOMMENDATION.WEIGHTS.exploration +
      curation * RECOMMENDATION.WEIGHTS.curation;

    return {
      story,
      total,
      spatial,
      emotion,
      engagement,
      freshness,
      author,
      novelty,
      exploration,
      curation,
      gridKey: buildGridKey(story)
    };
  }).sort((a, b) => b.total - a.total);
}

function rerankStories(scoredStories, options = {}) {
  const { moodFilter } = options;
  const selected = [];
  const remaining = [...scoredStories];
  const authorCounts = {};
  const emotionCounts = {};
  const gridCounts = {};

  while (remaining.length > 0) {
    const scanLimit = Math.min(remaining.length, RECOMMENDATION.MAX_RERANK_SCAN);
    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < scanLimit; i += 1) {
      const item = remaining[i];
      const authorId = String(item.story.author?.id || item.story.userId || '');
      const emotionTag = item.story.emotionTag || '';
      const authorPenalty = (authorCounts[authorId] || 0) * 0.1;
      const emotionPenalty = moodFilter ? 0 : (emotionCounts[emotionTag] || 0) * 0.05;
      const gridPenalty = (gridCounts[item.gridKey] || 0) * 0.07;
      const explorationBonus = selected.length < 6 ? item.exploration * 0.04 : 0;
      const rerankScore = item.total - authorPenalty - emotionPenalty - gridPenalty + explorationBonus;

      if (rerankScore > bestScore) {
        bestScore = rerankScore;
        bestIndex = i;
      }
    }

    const [picked] = remaining.splice(bestIndex, 1);
    picked.rerankScore = bestScore;
    selected.push(picked);

    const authorId = String(picked.story.author?.id || picked.story.userId || '');
    const emotionTag = picked.story.emotionTag || '';
    authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;
    emotionCounts[emotionTag] = (emotionCounts[emotionTag] || 0) + 1;
    gridCounts[picked.gridKey] = (gridCounts[picked.gridKey] || 0) + 1;
  }

  return selected;
}

function weightedRandomPick(items) {
  if (!items.length) return null;

  const weights = items.map((item) => Math.max(0.05, item.rerankScore || item.total) * (1 + item.exploration * 0.2));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i += 1) {
    cursor -= weights[i];
    if (cursor <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
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
    fontFamily: story.fontFamily || null,
    fontEffect: story.fontEffect || null,
    createdAt: story.createdAt
  };
}

async function buildRecommendationList(options = {}) {
  const { userId, lat, lng, moodFilter } = options;
  const { candidates, profile } = await recallCandidateStories({ userId, lat, lng, moodFilter });

  if (candidates.length === 0) {
    return [];
  }

  const metrics = await fetchStoryMetrics(candidates.map((story) => story.id));
  const scored = scoreCandidates(candidates, {
    userLat: lat,
    userLng: lng,
    moodFilter,
    profile,
    metrics
  });

  return rerankStories(scored, { moodFilter });
}

export const RecommendationService = {
  async randomWalk(options = {}) {
    const { lat, lng, moodFilter } = options;
    const rankedStories = await buildRecommendationList(options);
    const topStories = rankedStories.slice(0, RECOMMENDATION.RANDOM_WALK_TOP_N);
    const picked = weightedRandomPick(topStories);

    if (!picked) {
      return null;
    }

    const story = picked.story;
    const { lat: storyLat, lng: storyLng } = story._coords || parsePoint(story.location);

    return {
      location: { latitude: storyLat, longitude: storyLng },
      story: formatStoryForResponse(story, {
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        moodFilter
      })
    };
  },

  async getFeed(options = {}) {
    const {
      page = 1,
      limit = RECOMMENDATION.FEED_PAGE_SIZE,
      summary
    } = options;

    const rankedStories = await buildRecommendationList(options);
    const offset = (page - 1) * limit;
    const pageItems = rankedStories.slice(offset, offset + limit);

    return {
      stories: pageItems.map(({ story }) => ({
        ...formatStoryForResponse(story, { summary }),
        content: story.content?.length > 100 ? `${story.content.substring(0, 100)}...` : story.content
      })),
      pagination: {
        total: rankedStories.length,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(rankedStories.length / limit)
      }
    };
  }
};
