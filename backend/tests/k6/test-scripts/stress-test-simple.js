/**
 * EchoStar 后端压力测试 - 场景化行为脚本（性能测试）
 *
 * 设计原则：
 *   - 场景化用户行为：每个 VU 模拟一次用户会话（登录 → 浏览 → 互动 → 退出）
 *   - 85/15 读写比：浏览阶段 85% 读操作，互动阶段 15% 写操作
 *   - 80/20 法则：核心接口承载 80% 流量，低频接口（管理员）单独测试
 *   - 指数分布思考时间：模拟真实用户行为的快慢差异
 *   - 数据有效性校验：优先选择 public 可见的故事，避免无意义 404
 *   - 错误分类监控：区分 4xx / 5xx / 429，辅助定位问题
 *   - k6 tags 驱动指标：通过 tags 实现按接口细分，自动出现在 summary-export 中
 *
 * 使用方法（通过 run-test.bat）：
 *   run-test.bat --mode performance
 *   run-test.bat --mode performance --reset
 *
 * 直接使用 k6：
 *   TEST_MODE=performance k6 run tests/k6/test-scripts/stress-test-simple.js
 *   k6 run --env PROFILE=peak tests/k6/test-scripts/stress-test-simple.js
 */

import { sleep } from 'k6';
import http from 'k6/http';
import { check, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import {
  config, ACTION_WEIGHTS, READ_ACTIONS, WRITE_ACTIONS,
  chooseByWeight, ENDPOINT_THRESHOLDS, parseDuration,
  pickByDist, distMode, HOT_RATIO, sortByPopularity,
} from './config.js';
import { randomInt, randomExp } from './data-generator.js';

// ===================== 自定义指标 =====================
// 使用 k6 tags 实现按接口细分的响应时间（自动生成 http_req_duration{endpoint:xxx}）
// 无需手动创建 Trend 对象，k6 自动收集和管理

// 错误分类计数
const error4xx = new Rate('errors_4xx');
const error5xx = new Rate('errors_5xx');
const errorOther = new Rate('errors_other');

// 性能拐点检测：使用 Counter 跨 VU 汇总（k6 自动聚合所有 VU 的数据）
const p95BreachCounter = new Counter('p95_breach_count');
const totalRequestCounter = new Counter('total_request_checks');

// ===================== 工具函数 =====================

/**
 * 安全解析 JSON，防止 Snowflake ID (BIGINT) 精度丢失
 */
function safeJsonParse(raw) {
  const fixed = raw.replace(/"([^"]+)"\s*:\s*(\d{15,})\b/g, '"$1":"$2"');
  return JSON.parse(fixed);
}

/**
 * 为 HTTP 请求参数注入 endpoint tag
 * k6 会自动生成 http_req_duration{endpoint:xxx} 指标
 */
function tagParams(params, endpoint) {
  if (!params) return { tags: { endpoint } };
  if (!params.tags) return { ...params, tags: { endpoint } };
  return { ...params, tags: { ...params.tags, endpoint } };
}

// ===================== k6 配置 =====================
const currentProfile = config.profile;
const loadVus = config.concurrency.load;
const loadDurationStr = config.duration.load;
const loadDurationSec = parseDuration(loadDurationStr);

// 生成按接口细分的阈值（基于 ENDPOINT_THRESHOLDS 自动生成）
const endpointThresholds = {};
for (const [ep, threshold] of Object.entries(ENDPOINT_THRESHOLDS)) {
  endpointThresholds[`http_req_duration{endpoint:${ep}}`] = [`p(95)<${threshold}`];
}

// 使用 config 中定义的 stages（如未通过 --env 覆盖 profile）
// 阶梯拐点测试使用宽松阈值（仅监控不中断），其他 profile 使用标准阈值
const isRampProfile = config.profileName === 'ramp';

export const options = {
  stages: currentProfile.stages || [
    { duration: '30s', target: Math.max(10, Math.floor(loadVus * 0.25)) },
    { duration: `${Math.floor(loadDurationSec * 0.4)}s`, target: loadVus },
    { duration: `${Math.floor(loadDurationSec * 0.4)}s`, target: Math.floor(loadVus * 1.5) },
    { duration: '30s', target: 0 },
  ],
  thresholds: isRampProfile ? {
    // 阶梯拐点测试：宽松阈值，故意压过拐点观察行为
    'http_req_duration': ['p(95)<10000'],
    'errors_5xx': ['rate<0.05'],
    // 不设 http_req_failed 和接口细分阈值（高并发下预期会超限）
  } : {
    // 其他 profile：标准性能阈值
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.05'],
    'errors_5xx': ['rate<0.01'],
    // 按接口细分的阈值（自动从 ENDPOINT_THRESHOLDS 生成）
    ...endpointThresholds,
  },
};

const BASE_URL = config.baseUrl;

// ===================== 数据有效性 =====================

// 预过滤的公开故事缓存（setup 阶段填充，避免每次请求重复 filter）
let _publicStories = [];

/**
 * 从数据集中获取有效的公开故事
 * 使用热度分布选择：热门故事被更频繁地访问
 * @param {Object} data - setup 数据
 * @returns {Object|null} 选中的故事
 */
function getValidStory(data) {
  if (!_publicStories || _publicStories.length === 0) return null;
  return pickByDist(_publicStories, distMode);
}

/**
 * 获取一个用户（带 token 保证）
 * 使用热度分布选择：活跃用户被更频繁地选中
 * @param {Object} data - setup 数据
 * @returns {Object|null} 选中的用户
 */
function getRandomUser(data) {
  if (!data.users || data.users.length === 0) return null;
  return pickByDist(data.users, distMode);
}

/**
 * 确保用户有 token，没有则登录获取
 */
function ensureToken(user) {
  if (user.token) return user.token;

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), { headers: { 'Content-Type': 'application/json' } });

  if (loginRes.status === 200) {
    try {
      const body = safeJsonParse(loginRes.body);
      if (body.code === 0 && body.data && body.data.accessToken) {
        user.token = body.data.accessToken;
        return user.token;
      }
    } catch (e) {}
  }
  return null;
}

/**
 * 记录请求指标（错误分类 + 性能拐点检测）
 * 响应时间指标通过 k6 tags 自动收集，无需手动记录
 */
function recordMetrics(actionName, res) {
  // 错误分类
  if (res.status >= 400 && res.status < 500) {
    error4xx.add(1);
    error5xx.add(0);
  } else if (res.status >= 500) {
    error4xx.add(0);
    error5xx.add(1);
  } else {
    error4xx.add(0);
    error5xx.add(0);
  }
  errorOther.add(res.status === 0 ? 1 : 0);

  // 性能拐点检测（跨 VU 汇总）
  totalRequestCounter.add(1);
  const threshold = ENDPOINT_THRESHOLDS[actionName] || 1000;
  if (res.timings.duration > threshold * 1.5) {
    p95BreachCounter.add(1);
    console.warn(`[PERF] ${actionName} response ${res.timings.duration.toFixed(0)}ms exceeds 1.5x threshold (${threshold}ms)`);
  }
}

// ===================== Setup =====================

export function setup() {
  const profileName = config.profileName;
  const profile = config.profile;
  console.log(`=== Starting Setup (Profile: ${profileName}) ===`);
  console.log(`  VUs: ${profile.vus}, Duration: ${profile.duration}`);
  console.log(`  Data Scale: users=${profile.dataScale.users}, stories=${profile.dataScale.stories}`);
  console.log(`  Access Distribution: ${distMode} (hot ratio: ${(HOT_RATIO * 100).toFixed(0)}%)`);
  if (distMode === 'pareto') {
    console.log(`  → Top ${(HOT_RATIO * 100).toFixed(0)}% stories/users receive ~80% of all requests`);
  } else if (distMode === 'zipfian') {
    console.log(`  → Top 5% stories/users receive ~50% of all requests (steeper head)`);
  } else {
    console.log(`  → All stories/users accessed with equal probability`);
  }

  const setupData = {
    users: [],
    stories: [],
    tokens: [],
    notifiedUsers: [],
    commentIds: [],
    storyComments: {},
  };

  // 创建测试用户
  const userCount = Math.min(1000, config.users.count);
  console.log(`Creating ${userCount} test users...`);

  for (let i = 0; i < userCount; i++) {
    if (i % 100 === 0) {
      console.log(`[Setup] Users: ${i}/${userCount}`);
    }
    const ts = Date.now();
    const userData = {
      email: `loadtest_${profileName}_${i}_${ts}@test.com`,
      password: `Test@${i}Password`,
      username: `loadtest_${profileName}_${i}_${ts}`,
    };

    const response = http.post(`${BASE_URL}/api/auth/register_2`, JSON.stringify(userData), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 200 || response.status === 201) {
      try {
        const body = safeJsonParse(response.body);
        if (body.code === 0 && body.data) {
          setupData.users.push({
            id: body.data.user.id,
            email: userData.email,
            password: userData.password,
            token: body.data.accessToken,
          });
          if (body.data.accessToken) {
            setupData.tokens.push({
              userId: body.data.user.id,
              token: body.data.accessToken,
            });
          }
        }
      } catch (e) {}
    }

    if (i % 20 === 0) sleep(0.05);
  }

  console.log(`[Setup] Created ${setupData.users.length} users`);

  // 创建测试故事
  if (setupData.users.length > 0) {
    const storyCount = Math.min(5000, config.stories.count);
    console.log(`Creating ${storyCount} test stories...`);

    // 热门故事比例：前 hotRatio 的故事模拟"热门内容"（更丰富的内容、带图片占位符）
    const hotStoryCount = Math.floor(storyCount * HOT_RATIO);
    const emotions = ['开心', '难过', '治愈', '打卡', '感动', '惊喜', '孤独', '自由'];

    for (let i = 0; i < storyCount; i++) {
      const userIndex = i % setupData.users.length;
      const user = setupData.users[userIndex];

      let token = user.token;
      if (!token) {
        token = ensureToken(user);
      }

      if (token) {
        const location = {
          lat: 39.8 + Math.random() * 0.3,
          lng: 116.2 + Math.random() * 0.4,
        };
        const isHot = i < hotStoryCount;
        const storyData = {
          content: isHot
            ? `热门故事 #${i} - 这是一条精心编辑的故事内容，${Date.now()}`
            : `压力测试故事 #${i} - ${Date.now()}`,
          images: isHot ? [`placeholder_hot_${i}.jpg`] : [],
          location: location,
          emotionTag: emotions[isHot ? (i % emotions.length) : (i % 4)],
          isTimeCapsule: false,
          visibility: 'public',
        };

        const response = http.post(`${BASE_URL}/api/stories`, JSON.stringify(storyData), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 200 || response.status === 201) {
          try {
            const body = safeJsonParse(response.body);
            if (body.code === 0 && body.data) {
              setupData.stories.push({
                id: String(body.data.id),
                visibility: 'public',
                images: storyData.images || [],
                emotionTag: storyData.emotionTag || null,
              });
            }
          } catch (e) {}
        }
      }

      if (i % 50 === 0) sleep(0.05);
    }
  }

  console.log(`[Setup] Created ${setupData.stories.length} stories`);

  // 按热度排序故事数组（热门故事排在前面，供 pickByDist 使用）
  if (setupData.stories.length > 0 && distMode !== 'uniform') {
    setupData.stories = sortByPopularity(setupData.stories, HOT_RATIO);
    const hotCount = Math.floor(setupData.stories.length * HOT_RATIO);
    console.log(`[Setup] Sorted stories by popularity: top ${hotCount} are "hot" stories`);
  }

  // 预过滤公开故事并缓存（避免每次请求重复 filter）
  _publicStories = setupData.stories.filter(s => s.visibility === 'public');
  console.log(`[Setup] Public stories available: ${_publicStories.length}`);

  // 创建评论数据（为 list_comments 接口提供数据）
  if (setupData.stories.length > 0 && setupData.users.length > 1) {
    const commentCount = Math.min(200, setupData.stories.length);
    console.log(`[Setup] Creating comments (max ${commentCount})...`);
    let createdComments = 0;

    for (let i = 0; i < commentCount; i++) {
      const story = setupData.stories[i % setupData.stories.length];
      const commenterIndex = (i + 1) % setupData.users.length;
      const commenter = setupData.users[commenterIndex];

      // 故事作者索引为 i % users.length，评论者索引为 (i+1) % users.length，天然不同
      if (commenter && commenter.token) {
        const commentRes = http.post(`${BASE_URL}/api/comments`, JSON.stringify({
          storyId: story.id,
          content: `压力测试评论 ${i} - ${Date.now()}`,
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${commenter.token}`,
          },
        });

        if (commentRes.status === 200) {
          createdComments++;
          try {
            const body = safeJsonParse(commentRes.body);
            if (body.code === 0 && body.data && body.data.id) {
              const cid = String(body.data.id);
              setupData.commentIds.push({ id: cid, userId: commenter.id, token: commenter.token });
              if (!setupData.storyComments[story.id]) {
                setupData.storyComments[story.id] = [];
              }
              setupData.storyComments[story.id].push(cid);
            }
          } catch (e) {}
        }
      }

      if (i % 20 === 0) sleep(0.05);
    }
    console.log(`[Setup] Created ${createdComments} comments`);
  }

  // 创建通知数据：通过点赞操作触发通知
  if (setupData.stories.length > 0 && setupData.users.length > 1) {
    const maxLikes = Math.min(200, setupData.stories.length);
    console.log(`[Setup] Creating likes for notification data (max ${maxLikes})...`);
    let likeCount = 0;

    for (let i = 0; i < maxLikes; i++) {
      const story = setupData.stories[i];
      if (!story) continue;

      // 故事作者索引为 i % users.length，liker 索引为 (i+1) % users.length，天然不同
      const likerIndex = (i + 1) % setupData.users.length;
      const liker = setupData.users[likerIndex];
      const authorIndex = i % setupData.users.length;
      const author = setupData.users[authorIndex];

      if (liker && liker.token && author) {
        const likeRes = http.post(`${BASE_URL}/api/likes`, JSON.stringify({ storyId: story.id }), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${liker.token}`,
          },
        });

        if (likeRes.status === 200) {
          likeCount++;
          if (!setupData.notifiedUsers.find(u => String(u.id) === String(author.id))) {
            setupData.notifiedUsers.push(author);
          }
        }
      }

      if (i % 20 === 0) sleep(0.05);
    }
    console.log(`[Setup] Created ${likeCount} likes, ${setupData.notifiedUsers.length} users have notifications`);
  }

  console.log(`\n=== Setup Complete ===`);
  console.log(`  Users: ${setupData.users.length}`);
  console.log(`  Stories: ${setupData.stories.length}`);
  console.log(`  Comments: ${setupData.commentIds.length}`);
  console.log(`  Users with notifications: ${setupData.notifiedUsers.length}`);

  return setupData;
}

// ===================== 读操作实现 =====================

/**
 * 获取故事详情（权重 30%，最高频读操作）
 */
function actionGetStory(token, data) {
  const story = getValidStory(data);
  if (!story) return;

  const res = http.get(`${BASE_URL}/api/stories/${story.id}`, tagParams(
    token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined,
    'get_story',
  ));

  check(res, {
    'get_story status 200': (r) => r.status === 200,
    'get_story < 500ms': (r) => r.timings.duration < 500,
  });
  recordMetrics('get_story', res);
}

/**
 * 地图范围探索（权重 15%）
 */
function actionMapExplore(token, data) {
  const lat = 39.8 + Math.random() * 0.3;
  const lng = 116.2 + Math.random() * 0.4;
  const radius = randomInt(200, 2000);

  const res = http.get(`${BASE_URL}/api/map/explore?lat=${lat}&lng=${lng}&radius=${radius}`, tagParams(null, 'map_explore'));

  check(res, {
    'map_explore status 200': (r) => r.status === 200,
    'map_explore < 1200ms': (r) => r.timings.duration < 1200,
  });
  recordMetrics('map_explore', res);
}

/**
 * 推荐信息流（权重 10%）
 */
function actionMapFeed(token, data) {
  const lat = 39.8 + Math.random() * 0.3;
  const lng = 116.2 + Math.random() * 0.4;
  const mood = ['开心', '难过', '治愈', '打卡'][randomInt(0, 3)];
  const page = randomInt(1, 5);

  const res = http.get(`${BASE_URL}/api/v1/map/feed?lat=${lat}&lng=${lng}&mood=${encodeURIComponent(mood)}&page=${page}&limit=20`, tagParams(null, 'map_feed'));

  check(res, {
    'map_feed status 200': (r) => r.status === 200,
    'map_feed < 1200ms': (r) => r.timings.duration < 1200,
  });
  recordMetrics('map_feed', res);
}

/**
 * 搜索故事（权重 12%）
 */
function actionSearchStory(token, data) {
  const keywords = ['开心', '测试', '故事', '打卡', '旅行', '美食'];
  const keyword = keywords[randomInt(0, keywords.length - 1)];

  const res = http.get(`${BASE_URL}/api/stories/search?keyword=${encodeURIComponent(keyword)}&page=1&limit=20`, tagParams(null, 'search_story'));

  check(res, {
    'search_story status 200': (r) => r.status === 200,
    'search_story < 800ms': (r) => r.timings.duration < 800,
  });
  recordMetrics('search_story', res);
}

/**
 * 获取评论列表（权重 8%）
 */
function actionListComments(token, data) {
  const story = getValidStory(data);
  if (!story) return;

  const page = randomInt(1, 3);
  const res = http.get(`${BASE_URL}/api/comments/story/${story.id}?page=${page}&limit=10`, tagParams(null, 'list_comments'));

  check(res, {
    'list_comments status 200': (r) => r.status === 200,
    'list_comments < 800ms': (r) => r.timings.duration < 800,
  });
  recordMetrics('list_comments', res);
}

/**
 * 获取用户信息（权重 5%）
 */
function actionGetUser(token, data) {
  const user = getRandomUser(data);
  if (!user) return;

  const res = http.get(`${BASE_URL}/api/auth/users/${user.id}`, tagParams(null, 'get_user'));

  check(res, {
    'get_user status 200': (r) => r.status === 200,
    'get_user < 500ms': (r) => r.timings.duration < 500,
  });
  recordMetrics('get_user', res);
}

/**
 * 通知列表（权重 3%）
 * 使用当前会话用户的 token 获取自己的通知（即使为空也正常返回）
 */
function actionListNotifications(token, data) {
  if (!token) return;

  const page = randomInt(1, 3);
  const res = http.get(`${BASE_URL}/api/v1/notifications/me?page=${page}&limit=10`, tagParams(
    { headers: { 'Authorization': `Bearer ${token}` } },
    'list_notifications',
  ));

  check(res, {
    'list_notifications status 200': (r) => r.status === 200,
    'list_notifications < 800ms': (r) => r.timings.duration < 800,
  });
  recordMetrics('list_notifications', res);
}

/**
 * 健康检查（权重 1%）
 */
function actionHealthCheck(token, data) {
  const res = http.get(`${BASE_URL}/health`, tagParams(null, 'health_check'));

  check(res, {
    'health_check status 200': (r) => r.status === 200,
    'health_check < 100ms': (r) => r.timings.duration < 100,
  });
  recordMetrics('health_check', res);
}

/**
 * 聚合数据（权重 1%）
 */
function actionMapClusters(token, data) {
  const lat = 39.9 + Math.random() * 0.1;
  const lng = 116.3 + Math.random() * 0.2;
  const northEast = JSON.stringify({ lat: lat + 0.05, lng: lng + 0.05 });
  const southWest = JSON.stringify({ lat: lat - 0.05, lng: lng - 0.05 });

  const res = http.get(`${BASE_URL}/api/map/clusters?northEast=${encodeURIComponent(northEast)}&southWest=${encodeURIComponent(southWest)}`, tagParams(null, 'map_clusters'));

  check(res, {
    'map_clusters status 200': (r) => r.status === 200,
    'map_clusters < 1200ms': (r) => r.timings.duration < 1200,
  });
  recordMetrics('map_clusters', res);
}

// ===================== 写操作实现 =====================

/**
 * 登录（权重 3%）
 */
function actionLogin(token, data) {
  const user = getRandomUser(data);
  if (!user) return;

  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), tagParams({ headers: { 'Content-Type': 'application/json' } }, 'login'));

  check(res, {
    'login status 200': (r) => r.status === 200,
    'login < 1000ms': (r) => r.timings.duration < 1000,
  });
  recordMetrics('login', res);

  // 更新 token
  if (res.status === 200) {
    try {
      const body = safeJsonParse(res.body);
      if (body.code === 0 && body.data && body.data.accessToken) {
        user.token = body.data.accessToken;
      }
    } catch (e) {}
  }
}

/**
 * 注册（权重 1%）
 */
function actionRegister(token, data) {
  const ts = Date.now();
  const res = http.post(`${BASE_URL}/api/auth/register_2`, JSON.stringify({
    email: `reg_${ts}@test.com`,
    password: `Test@${randomInt(100, 999)}Password`,
    username: `reg_${ts}`,
  }), tagParams({ headers: { 'Content-Type': 'application/json' } }, 'register'));

  check(res, {
    'register status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'register < 1500ms': (r) => r.timings.duration < 1500,
  });
  recordMetrics('register', res);
}

/**
 * 创建评论（权重 3%）
 * 故事 404 时自动重试一次（使用另一个故事）
 */
function actionCreateComment(token, data) {
  if (!token) return;
  let story = getValidStory(data);
  if (!story) return;

  const body = JSON.stringify({
    storyId: story.id,
    content: `场景测试评论 ${Date.now()}`,
  });
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  let res = http.post(`${BASE_URL}/api/comments`, body, tagParams({ headers }, 'create_comment'));

  // 故事可能已被 shadowban，重试一次
  if (res.status === 404) {
    story = getValidStory(data);
    if (story) {
      const retryBody = JSON.stringify({
        storyId: story.id,
        content: `场景测试评论 ${Date.now()}`,
      });
      res = http.post(`${BASE_URL}/api/comments`, retryBody, tagParams({ headers }, 'create_comment'));
    }
  }

  check(res, {
    'create_comment status 200': (r) => r.status === 200,
    'create_comment < 1000ms': (r) => r.timings.duration < 1000,
  });
  recordMetrics('create_comment', res);
}

/**
 * 点赞/取消点赞（权重 3%）
 */
function actionLikeToggle(token, data) {
  if (!token) return;
  const story = getValidStory(data);
  if (!story) return;

  const res = http.post(`${BASE_URL}/api/likes`, JSON.stringify({ storyId: story.id }), tagParams({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }, 'like_toggle'));

  check(res, {
    'like_toggle status 200': (r) => r.status === 200,
    'like_toggle < 1000ms': (r) => r.timings.duration < 1000,
  });
  recordMetrics('like_toggle', res);
}

/**
 * 收藏/取消收藏（权重 2%）
 */
function actionFavoriteToggle(token, data) {
  if (!token) return;
  const story = getValidStory(data);
  if (!story) return;

  const res = http.post(`${BASE_URL}/api/favorites`, JSON.stringify({ storyId: story.id }), tagParams({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }, 'favorite_toggle'));

  check(res, {
    'favorite_toggle status 200': (r) => r.status === 200,
    'favorite_toggle < 1000ms': (r) => r.timings.duration < 1000,
  });
  recordMetrics('favorite_toggle', res);
}

/**
 * 创建故事（权重 1.5%）
 */
function actionCreateStory(token, data) {
  if (!token) return;

  const location = {
    lat: 39.8 + Math.random() * 0.3,
    lng: 116.2 + Math.random() * 0.4,
  };
  const res = http.post(`${BASE_URL}/api/stories`, JSON.stringify({
    content: `场景测试创建故事 ${Date.now()}`,
    images: [],
    location: location,
    emotionTag: ['开心', '难过', '治愈', '打卡'][randomInt(0, 3)],
    isTimeCapsule: false,
    visibility: 'public',
  }), tagParams({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }, 'create_story'));

  check(res, {
    'create_story status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'create_story < 1500ms': (r) => r.timings.duration < 1500,
  });
  recordMetrics('create_story', res);
}

/**
 * 举报（权重 0.5%）
 */
function actionCreateReport(token, data) {
  if (!token) return;
  const story = getValidStory(data);
  if (!story) return;

  const reasons = ['内容不当', '涉嫌抄袭', '虚假信息', '恶意内容', '其他问题'];
  const res = http.post(`${BASE_URL}/api/reports`, JSON.stringify({
    targetType: 'story',
    targetId: story.id,
    reason: reasons[randomInt(0, reasons.length - 1)],
  }), tagParams({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }, 'create_report'));

  check(res, {
    'create_report status 200': (r) => r.status === 200,
    'create_report < 1000ms': (r) => r.timings.duration < 1000,
  });
  recordMetrics('create_report', res);
}

/**
 * 标记通知已读（权重 0.5%）
 * 使用当前会话用户的 token 标记自己的通知为已读
 */
function actionMarkNotifRead(token, data) {
  if (!token) return;

  const res = http.put(`${BASE_URL}/api/v1/notifications/me/mark-read`, null, tagParams(
    { headers: { 'Authorization': `Bearer ${token}` } },
    'mark_notif_read',
  ));

  check(res, {
    'mark_notif_read status 200': (r) => r.status === 200,
    'mark_notif_read < 500ms': (r) => r.timings.duration < 500,
  });
  recordMetrics('mark_notif_read', res);
}

/**
 * 更新个人资料（权重 0.5%）
 */
function actionUpdateProfile(token, data) {
  if (!token) return;

  const res = http.put(`${BASE_URL}/api/auth/users/me`, JSON.stringify({
    bio: `更新个人简介 ${Date.now()}`,
  }), tagParams({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }, 'update_profile'));

  check(res, {
    'update_profile status 200': (r) => r.status === 200,
    'update_profile < 1000ms': (r) => r.timings.duration < 1000,
  });
  recordMetrics('update_profile', res);
}

// ===================== Action 分发映射 =====================

const readActionMap = {
  get_story: actionGetStory,
  map_explore: actionMapExplore,
  map_feed: actionMapFeed,
  search_story: actionSearchStory,
  list_comments: actionListComments,
  get_user: actionGetUser,
  list_notifications: actionListNotifications,
  health_check: actionHealthCheck,
  map_clusters: actionMapClusters,
};

const writeActionMap = {
  login: actionLogin,
  register: actionRegister,
  create_comment: actionCreateComment,
  like_toggle: actionLikeToggle,
  favorite_toggle: actionFavoriteToggle,
  create_story: actionCreateStory,
  create_report: actionCreateReport,
  mark_notif_read: actionMarkNotifRead,
  update_profile: actionUpdateProfile,
};

// ===================== 主测试函数 =====================

/**
 * 自然增长写操作（仅用于 ramp 阶梯拐点测试）
 * 模拟生产环境数据持续增长：
 *   - 60% 创建新故事（核心写操作，生成冷数据）
 *   - 25% 创建新评论（对已有故事的互动）
 *   - 8% 点赞/取消点赞
 *   - 7% 收藏/取消收藏
 *
 * 新数据写入数据库后，map_explore/search_story 等聚合查询
 * 会自然返回新数据，使缓存命中率随时间平滑下降，更贴近真实场景。
 */
function naturalGrowthWrite(token, data) {
  const r = Math.random();
  if (r < 0.60) {
    actionCreateStory(token, data);
  } else if (r < 0.85) {
    actionCreateComment(token, data);
  } else if (r < 0.93) {
    actionLikeToggle(token, data);
  } else {
    actionFavoriteToggle(token, data);
  }
}

/**
 * 每个虚拟用户的迭代逻辑（根据 Profile 自动选择模式）：
 *
 * ramp 阶梯拐点测试 — 自然增长模式：
 *   - 95% 执行一次随机读操作（高吞吐、短思考时间）
 *   - 5% 创建新数据（故事/评论/点赞/收藏）
 *   - 数据量随时间线性增长，模拟冷热数据混合
 *
 * 其他 Profile — 场景化行为模式：
 *   - 浏览阶段：3-10 次读操作
 *   - 互动阶段：1-3 次写操作
 *   - 模拟真实用户会话
 */
export default function (data) {
  if (!data || data.users.length === 0) {
    sleep(1);
    return;
  }

  // 确保 _publicStories 已初始化（k6 某些执行器/版本下模块级变量可能未保留 setup 副作用）
  if ((!_publicStories || _publicStories.length === 0) && data.stories && data.stories.length > 0) {
    _publicStories = data.stories.filter(s => s.visibility === 'public');
  }

  // 1. 获取用户身份和 token
  const user = getRandomUser(data);
  const token = ensureToken(user);
  if (!token) {
    sleep(0.5);
    return;
  }

  if (isRampProfile) {
    // ===== 阶梯拐点测试：自然增长模式 =====
    // 95% 读 / 5% 写，短思考时间保持高吞吐
    const r = Math.random();
    if (r < 0.05) {
      group('write', () => naturalGrowthWrite(token, data));
    } else {
      const actionName = chooseByWeight(READ_ACTIONS);
      const actionFn = readActionMap[actionName];
      if (actionFn) {
        group('read', () => actionFn(token, data));
      }
    }
    // 短思考时间（均值 ~0.2s），最大化吞吐以探测拐点
    sleep(randomExp(0.1, 0.3));
  } else {
    // ===== 其他 Profile：场景化行为模式 =====

    // 2. 浏览阶段（3-10 次读操作）
    const browseCount = randomInt(3, 10);
    for (let i = 0; i < browseCount; i++) {
      const actionName = chooseByWeight(READ_ACTIONS);
      const actionFn = readActionMap[actionName];

      if (actionFn) {
        group('read', () => {
          actionFn(token, data);
        });
      }

      // 指数分布思考时间（0.3-2秒，均值约 1秒）
      sleep(randomExp(0.3, 0.7));
    }

    // 3. 互动阶段（1-3 次写操作）
    const interactCount = randomInt(1, 3);
    for (let i = 0; i < interactCount; i++) {
      const actionName = chooseByWeight(WRITE_ACTIONS);
      const actionFn = writeActionMap[actionName];

      if (actionFn) {
        group('write', () => {
          actionFn(token, data);
        });
      }

      // 指数分布思考时间（0.5-3秒，均值约 1.5秒）
      sleep(randomExp(0.5, 1.0));
    }
  }
}

// ===================== Teardown =====================

export function teardown(data) {
  console.log('\n=== Test Completed ===');
  console.log(`Profile: ${config.profileName}`);
  console.log(`Access Distribution: ${distMode}`);
  console.log(`Created users: ${data.users.length}`);
  console.log(`Created stories: ${data.stories.length}`);
  console.log(`Created comments: ${data.commentIds ? data.commentIds.length : 0}`);
  console.log(`Users with notifications: ${data.notifiedUsers ? data.notifiedUsers.length : 0}`);
  if (distMode !== 'uniform') {
    const hotStories = Math.floor(data.stories.length * HOT_RATIO);
    const hotUsers = Math.floor(data.users.length * HOT_RATIO);
    console.log(`Hot set: top ${hotStories} stories + top ${hotUsers} users`);
  }

  // p95_breach_count 和 total_request_checks 由 k6 Counter 自动汇总
  // 在 summary export 中查看这两个指标的值
  console.log('\n  Key metrics in summary:');
  console.log('    p95_breach_count     - requests exceeding 1.5x endpoint threshold');
  console.log('    total_request_checks - total requests evaluated');
}
