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
  COLLABORATIVE_RECALL_LIMIT: 90,
  UNDEREXPOSED_RECALL_LIMIT: 100,
  TRENDING_RECALL_LIMIT: 120,
  ADMIN_RECALL_LIMIT: 50,
  FALLBACK_RECALL_LIMIT: 120,
  TEMPORAL_HALF_LIFE_DAYS: 6,
  TRENDING_TIME_WINDOW_DAYS: 7,
  SPATIAL_DECAY_KM: 35,
  MAX_RERANK_SCAN: 80,
  CURATED_LIMIT_TOP10: 2,
  CURATED_LIMIT_TOP20: 4,
  MMR_LAMBDA: 0.74,
  BANDIT_EPSILON: 0.12,
  WEIGHTS: {
    spatial: 0.28,
    emotion: 0.18,
    engagement: 0.10,
    freshness: 0.18,
    author: 0.06,
    novelty: 0.10,
    exploration: 0.07,
    curation: 0.03
  }
};

const RECALL_BUCKETS = {
  LOCAL_FRESH: 'local_fresh',
  PREFERENCE_MATCH: 'preference_match',
  COLLABORATIVE_FILTERING: 'preference_match',
  UNDEREXPOSED_QUALITY: 'underexposed_quality',
  TRENDING: 'trending',
  ADMIN_CURATED: 'admin_curated',
  FALLBACK: 'fallback'
};

const REASON_TAG_META = {
  nearby_fresh: { label: '附近新鲜', tone: 'blue' },
  emotion_match: { label: '情绪匹配', tone: 'amber' },
  low_exposure: { label: '低曝光发现', tone: 'green' },
  trending_now: { label: '正在热门', tone: 'red' },
  admin_pick: { label: '人工精选', tone: 'gold' },
  exploration_pick: { label: '探索推荐', tone: 'green' }
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

function formatReasonTag(code) {
  const meta = REASON_TAG_META[code];
  if (!meta) return null;
  return {
    code,
    label: meta.label,
    tone: meta.tone
  };
}

function buildReasonTags(item) {
  const tags = [];
  const seen = new Set();

  const pushTag = (code) => {
    if (!code || seen.has(code)) return;
    const formatted = formatReasonTag(code);
    if (!formatted) return;
    seen.add(code);
    tags.push(formatted);
  };

  switch (item.bucket) {
    case RECALL_BUCKETS.LOCAL_FRESH:
      pushTag('nearby_fresh');
      break;
    case RECALL_BUCKETS.PREFERENCE_MATCH:
      pushTag('emotion_match');
      break;
    case RECALL_BUCKETS.UNDEREXPOSED_QUALITY:
      pushTag('low_exposure');
      break;
    case RECALL_BUCKETS.TRENDING:
      pushTag('trending_now');
      break;
    case RECALL_BUCKETS.ADMIN_CURATED:
      pushTag('admin_pick');
      break;
    default:
      break;
  }

  if (item.bucket !== RECALL_BUCKETS.LOCAL_FRESH && item.spatial >= 0.75) {
    pushTag('nearby_fresh');
  }
  if (item.bucket !== RECALL_BUCKETS.PREFERENCE_MATCH && item.emotion >= 0.78) {
    pushTag('emotion_match');
  }
  if (item.bucket !== RECALL_BUCKETS.UNDEREXPOSED_QUALITY && item.exploration >= 0.7) {
    pushTag('low_exposure');
  }
  if (item.bucket !== RECALL_BUCKETS.TRENDING && item.engagement >= 0.72) {
    pushTag('trending_now');
  }
  if (item.story.isRecommended && item.bucket !== RECALL_BUCKETS.ADMIN_CURATED) {
    pushTag('admin_pick');
  }
  if (item.banditExplored) {
    pushTag('exploration_pick');
  }

  if (tags.length === 0) {
    const fallbackCode = item.spatial >= item.engagement
      ? 'nearby_fresh'
      : 'trending_now';
    pushTag(fallbackCode);
  }

  return tags.slice(0, 3);
}

function buildPrimaryReason(item) {
  switch (item.bucket) {
    case RECALL_BUCKETS.LOCAL_FRESH:
      return item.distanceMeters != null
        ? `你附近 ${Math.round(item.distanceMeters)} 米内的新鲜内容`
        : '你附近刚发布的新鲜内容';
    case RECALL_BUCKETS.PREFERENCE_MATCH:
      return '与你近期偏好的情绪内容更匹配';
    case RECALL_BUCKETS.UNDEREXPOSED_QUALITY:
      return '低曝光但值得被发现的优质内容';
    case RECALL_BUCKETS.TRENDING:
      return '近期互动热度较高的热门内容';
    case RECALL_BUCKETS.ADMIN_CURATED:
      return '管理员精选的优质内容';
    default:
      return '为你综合排序的推荐内容';
  }
}

function buildTimeWindow(item) {
  if (item.bucket !== RECALL_BUCKETS.TRENDING) {
    return null;
  }

  return {
    unit: 'day',
    value: RECOMMENDATION.TRENDING_TIME_WINDOW_DAYS
  };
}

function computeItemSimilarity(left, right) {
  if (!left || !right) return 0;
  let similarity = 0;

  if (left.story.userId && right.story.userId && String(left.story.userId) === String(right.story.userId)) {
    similarity += 0.35;
  }
  if (left.story.emotionTag && right.story.emotionTag && left.story.emotionTag === right.story.emotionTag) {
    similarity += 0.3;
  }
  if (left.gridKey && right.gridKey && left.gridKey === right.gridKey) {
    similarity += 0.2;
  }

  const textA = String(left.story.content || '');
  const textB = String(right.story.content || '');
  if (textA && textB && (textA.includes(textB.slice(0, 12)) || textB.includes(textA.slice(0, 12)))) {
    similarity += 0.15;
  }

  return Math.min(1, similarity);
}

function applyBanditExploration(item, options = {}) {
  const epsilon = options.epsilon ?? RECOMMENDATION.BANDIT_EPSILON;
  const shouldExplore = Math.random() < epsilon;
  const exploreBoost = shouldExplore ? (0.06 + item.exploration * 0.08) : 0;
  return {
    shouldExplore,
    banditBoost: exploreBoost
  };
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

async function fetchCollaborativeStories(options = {}) {
  const { userId, moodFilter, limit = RECOMMENDATION.COLLABORATIVE_RECALL_LIMIT } = options;
  if (!userId) {
    return [];
  }

  const likedRows = await Like.findAll({
    where: { userId },
    attributes: [['story_id', 'storyId']],
    raw: true,
    limit: 100
  });

  const baseStoryIds = likedRows
    .map((row) => normalizeStoryId(row.storyId))
    .filter(Boolean);

  if (baseStoryIds.length === 0) {
    return [];
  }

  const peerLikes = await Like.findAll({
    where: {
      userId: { [Op.ne]: userId },
      story_id: { [Op.in]: baseStoryIds }
    },
    attributes: ['userId'],
    raw: true
  });

  const peerUserIds = [...new Set(peerLikes.map((row) => row.userId).filter(Boolean))];
  if (peerUserIds.length === 0) {
    return [];
  }

  const peerStoryLikes = await Like.findAll({
    where: {
      userId: { [Op.in]: peerUserIds },
      story_id: { [Op.notIn]: baseStoryIds }
    },
    attributes: [
      ['story_id', 'storyId'],
      [sequelize.fn('COUNT', sequelize.col('story_id')), 'score']
    ],
    group: ['story_id'],
    order: [[sequelize.literal('score'), 'DESC']],
    raw: true,
    limit
  });

  const candidateStoryIds = peerStoryLikes
    .map((row) => normalizeStoryId(row.storyId))
    .filter(Boolean);

  if (candidateStoryIds.length === 0) {
    return [];
  }

  const where = {
    id: { [Op.in]: candidateStoryIds },
    visibility: 'public',
    location: { [Op.not]: null },
    [Op.and]: [getVisibilityTimeCondition(), UNLOCKED_CONDITION]
  };

  if (moodFilter) {
    where.emotionTag = moodFilter;
  }

  const stories = await Story.findAll({
    where,
    attributes: STORY_ATTRIBUTES,
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username', 'avatarUrl', 'vip', 'status']
    }]
  });

  const scoreMap = peerStoryLikes.reduce((acc, row) => {
    acc[normalizeStoryId(row.storyId)] = Number(row.score || 0);
    return acc;
  }, {});

  return stories
    .map((story) => {
      const plain = story.get({ plain: true });
      plain.id = normalizeStoryId(plain.id);
      plain._coords = parsePoint(story.location);
      plain._collabScore = scoreMap[plain.id] || 0;
      return plain;
    })
    .sort((a, b) => (b._collabScore || 0) - (a._collabScore || 0))
    .slice(0, limit);
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

async function fetchUnderexposedStories(options = {}) {
  const {
    lat,
    lng,
    moodFilter,
    excludeStoryIds,
    limit = RECOMMENDATION.UNDEREXPOSED_RECALL_LIMIT
  } = options;

  const { where, replacements } = buildBaseWhere({
    lat,
    lng,
    radius: Number.isFinite(lat) && Number.isFinite(lng) ? RECOMMENDATION.LOCAL_RECALL_RADIUS : undefined,
    moodFilter,
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
    order: [
      ['createdAt', 'DESC'],
      ['viewCount', 'ASC']
    ],
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

function assignBucketToStory(story, bucket) {
  return {
    ...story,
    _bucket: story._bucket || bucket
  };
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
        }).then((stories) => stories.map((story) => assignBucketToStory(story, RECALL_BUCKETS.LOCAL_FRESH)))
      : fetchStoriesByRecall({
          moodFilter,
          limit: RECOMMENDATION.RECENT_LOCAL_LIMIT,
          order: [['createdAt', 'DESC']]
        }).then((stories) => stories.map((story) => assignBucketToStory(story, RECALL_BUCKETS.LOCAL_FRESH))),
    moodFilter || preferredEmotionTags.length > 0
      ? fetchStoriesByRecall({
          moodFilter,
          emotionTags: preferredEmotionTags,
          limit: RECOMMENDATION.PREFERENCE_RECALL_LIMIT,
          order: [['createdAt', 'DESC']]
        }).then((stories) => stories.map((story) => assignBucketToStory(story, RECALL_BUCKETS.PREFERENCE_MATCH)))
      : Promise.resolve([]),
    preferredAuthorIds.length > 0
      ? fetchStoriesByRecall({
          moodFilter,
          authorIds: preferredAuthorIds,
          limit: RECOMMENDATION.AUTHOR_RECALL_LIMIT,
          order: [['createdAt', 'DESC']]
        }).then((stories) => stories.map((story) => assignBucketToStory(story, RECALL_BUCKETS.PREFERENCE_MATCH)))
      : Promise.resolve([]),
    fetchCollaborativeStories({
      userId,
      moodFilter,
      limit: RECOMMENDATION.COLLABORATIVE_RECALL_LIMIT
    }).then((stories) => stories.map((story) => assignBucketToStory(story, RECALL_BUCKETS.COLLABORATIVE_FILTERING))),
    fetchUnderexposedStories({
      lat,
      lng,
      moodFilter,
      limit: RECOMMENDATION.UNDEREXPOSED_RECALL_LIMIT
    }).then((stories) => stories.map((story) => assignBucketToStory(story, RECALL_BUCKETS.UNDEREXPOSED_QUALITY))),
    fetchStoriesByRecall({
      moodFilter,
      limit: RECOMMENDATION.TRENDING_RECALL_LIMIT,
      order: [
        [sequelize.literal('is_recommended DESC NULLS LAST')],
        ['viewCount', 'DESC'],
        ['createdAt', 'DESC']
      ]
    }).then((stories) => stories.map((story) => assignBucketToStory(story, RECALL_BUCKETS.TRENDING))),
    fetchStoriesByRecall({
      moodFilter,
      adminOnly: true,
      limit: RECOMMENDATION.ADMIN_RECALL_LIMIT,
      order: [['createdAt', 'DESC']]
    }).then((stories) => stories.map((story) => assignBucketToStory(story, RECALL_BUCKETS.ADMIN_CURATED)))
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

    const fallbackTagged = fallbackStories.map((story) => assignBucketToStory(story, RECALL_BUCKETS.FALLBACK));
    candidates = mergeCandidateStories([...candidateGroups, fallbackTagged]);
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

function computeDistanceMeters(story, userLat, userLng) {
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return null;
  }

  const { lat, lng } = story._coords || parsePoint(story.location);
  return Math.round(haversineKm(userLat, userLng, lat, lng) * 1000);
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
      bucket: story._bucket || RECALL_BUCKETS.FALLBACK,
      distanceMeters: computeDistanceMeters(story, userLat, userLng),
      metrics: engagementInputs,
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
  let curatedCount = 0;

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
      const diversityPenalty = selected.length === 0
        ? 0
        : Math.max(...selected.map((picked) => computeItemSimilarity(item, picked))) * (1 - RECOMMENDATION.MMR_LAMBDA);
      const explorationBonus = selected.length < 6 ? item.exploration * 0.04 : 0;
      const bandit = applyBanditExploration(item);
      const curatedOverTop10 = selected.length < 10 && curatedCount >= RECOMMENDATION.CURATED_LIMIT_TOP10;
      const curatedOverTop20 = selected.length < 20 && curatedCount >= RECOMMENDATION.CURATED_LIMIT_TOP20;
      const curatedPenalty = item.bucket === RECALL_BUCKETS.ADMIN_CURATED && (curatedOverTop10 || curatedOverTop20)
        ? 100
        : 0;
      const rerankScore = item.total - authorPenalty - emotionPenalty - gridPenalty - curatedPenalty - diversityPenalty + explorationBonus + bandit.banditBoost;

      if (rerankScore > bestScore) {
        bestScore = rerankScore;
        bestIndex = i;
        item.banditExplored = bandit.shouldExplore;
        item.banditBoost = bandit.banditBoost;
        item.mmrPenalty = diversityPenalty;
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
    if (picked.bucket === RECALL_BUCKETS.ADMIN_CURATED) {
      curatedCount += 1;
    }
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
  const item = options.rankedItem || null;
  const metrics = item?.metrics || {};
  const recommendation = item ? {
    bucket: item.bucket,
    reasonTags: buildReasonTags(item),
    primaryReason: buildPrimaryReason(item),
    sortModeApplied: options.sortModeApplied || 'recommend',
    distanceMeters: item.distanceMeters ?? null,
    isCurated: item.bucket === RECALL_BUCKETS.ADMIN_CURATED || !!story.isRecommended,
    timeWindow: buildTimeWindow(item),
    rankTrace: options.includeRankTrace ? {
      total: Number(item.total.toFixed(4)),
      rerankScore: Number((item.rerankScore ?? item.total).toFixed(4)),
      mmrPenalty: Number((item.mmrPenalty ?? 0).toFixed(4)),
      banditBoost: Number((item.banditBoost ?? 0).toFixed(4)),
      banditExplored: !!item.banditExplored,
      spatial: Number(item.spatial.toFixed(4)),
      emotion: Number(item.emotion.toFixed(4)),
      engagement: Number(item.engagement.toFixed(4)),
      freshness: Number(item.freshness.toFixed(4)),
      author: Number(item.author.toFixed(4)),
      novelty: Number(item.novelty.toFixed(4)),
      exploration: Number(item.exploration.toFixed(4)),
      curation: Number(item.curation.toFixed(4))
    } : undefined
  } : null;

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
    likeCount: metrics.likeCount || 0,
    favoriteCount: metrics.favoriteCount || 0,
    commentCount: metrics.commentCount || 0,
    viewCount: metrics.viewCount || Number(story.viewCount || 0),
    fontFamily: story.fontFamily || null,
    fontEffect: story.fontEffect || null,
    createdAt: story.createdAt,
    recommendation
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
        rankedItem: picked,
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        moodFilter,
        sortModeApplied: 'recommend'
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
      stories: pageItems.map((item) => ({
        ...formatStoryForResponse(item.story, {
          summary,
          rankedItem: item,
          sortModeApplied: 'recommend'
        }),
        content: item.story.content?.length > 100 ? `${item.story.content.substring(0, 100)}...` : item.story.content
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
