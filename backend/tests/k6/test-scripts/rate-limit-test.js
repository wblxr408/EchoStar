/**
 * EchoStar 后端限流测试
 *
 * 设计原则：
 *   - 均匀压力分布：各模块按比例均匀触发限流，确保所有 limiter 被覆盖
 *   - 429 响应验证：检查限流响应格式（code=429, message 非空）
 *   - 不检查失败率：429 是预期行为
 *   - 低数据量 setup：减少 setup 阶段消耗的限流配额
 *   - k6 tags 驱动指标：通过 tags 自动生成按 limiter 类型细分的响应时间指标
 *
 * 权重分配（按 limiter 类型均匀分布）：
 *   auth(25%)        → strictLimiter
 *   story(15%)       → generalLimiter
 *   like(13%)        → generalLimiter
 *   comment(12%)     → generalLimiter
 *   favorite(10%)    → generalLimiter
 *   map(10%)         → looseLimiter
 *   notification(5%) → generalLimiter
 *   report(10%)      → generalLimiter
 *
 * 使用方法（通过 run-test.bat）：
 *   run-test.bat --mode rate-limit
 *   run-test.bat --mode rate-limit --reset
 */

import { sleep } from 'k6';
import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';
import { config, RATE_LIMIT_WEIGHTS, chooseByWeight, parseDuration } from './config.js';
import { randomInt } from './data-generator.js';

// ===================== 自定义指标 =====================
const rate429 = new Rate('rate_429');
const totalRequests = new Rate('rate_success');

// ===================== 工具函数 =====================

function safeJsonParse(raw) {
  const fixed = raw.replace(/"([^"]+)"\s*:\s*(\d{15,})\b/g, '"$1":"$2"');
  return JSON.parse(fixed);
}

/**
 * 为 HTTP 请求参数注入 endpoint + limiter tag
 * k6 自动生成:
 *   http_req_duration{endpoint:auth,limiter:strict}
 *   http_req_duration{endpoint:story,limiter:general}
 *   http_req_duration{endpoint:map,limiter:loose}
 */
function tagParams(params, endpoint, limiter) {
  const tags = { endpoint, limiter };
  if (!params) return { tags };
  if (!params.tags) return { ...params, tags };
  return { ...params, tags: { ...params.tags, ...tags } };
}

// ===================== k6 配置 =====================
const currentProfile = config.profile;
const loadVus = config.concurrency.load;
const loadDurationStr = config.duration.load;
const loadDurationSec = parseDuration(loadDurationStr);

export const options = {
  stages: [
    // 预热 - 低并发，请求应全部成功
    { duration: `${Math.max(15, Math.floor(loadDurationSec * 0.15))}s`, target: Math.max(10, Math.floor(loadVus * 0.2)) },
    // 逐渐增加 - 应开始触发限流
    { duration: `${Math.max(30, Math.floor(loadDurationSec * 0.35))}s`, target: loadVus },
    // 持续高负载 - 大部分请求应被限流
    { duration: `${Math.max(30, Math.floor(loadDurationSec * 0.35))}s`, target: loadVus * 2 },
    // 冷却
    { duration: `${Math.max(15, Math.floor(loadDurationSec * 0.15))}s`, target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    // 按 limiter 类型细分的阈值
    'http_req_duration{limiter:strict}': ['p(95)<800'],
    'http_req_duration{limiter:general}': ['p(95)<1000'],
    'http_req_duration{limiter:loose}': ['p(95)<2000'],
    // 按模块细分的阈值
    'http_req_duration{endpoint:auth}': ['p(95)<800'],
    'http_req_duration{endpoint:story}': ['p(95)<1500'],
    'http_req_duration{endpoint:map}': ['p(95)<2000'],
    'http_req_duration{endpoint:comment}': ['p(95)<500'],
    'http_req_duration{endpoint:favorite}': ['p(95)<500'],
    'http_req_duration{endpoint:like}': ['p(95)<500'],
    'http_req_duration{endpoint:notification}': ['p(95)<500'],
    'http_req_duration{endpoint:report}': ['p(95)<500'],
    // 不设置 http_req_failed 阈值，因为 429 是预期行为
  },
};

const BASE_URL = config.baseUrl;

// ===================== 429 响应验证 =====================

function checkRateLimitResponse(res) {
  if (res.status !== 429) return true;
  try {
    const body = safeJsonParse(res.body);
    return body.code === 429 && typeof body.message === 'string' && body.message.length > 0;
  } catch (e) {
    return false;
  }
}

/**
 * 记录限流测试请求（仅 Rate 分类，响应时间由 k6 tags 自动收集）
 */
function recordRLResponse(res) {
  if (res.status === 429) {
    rate429.add(1);
  } else {
    rate429.add(0);
  }
  totalRequests.add(res.status >= 200 && res.status < 400 ? 1 : 0);
}

// ===================== Setup =====================

export function setup() {
  console.log('=== Rate Limit Test - Data Preparation ===');

  const setupData = {
    users: [],
    stories: [],
    tokens: [],
  };

  // 创建少量测试用户（减少 setup 阶段消耗的限流配额）
  const userCount = Math.min(50, config.users.count);
  console.log(`Creating ${userCount} test users...`);

  for (let i = 0; i < userCount; i++) {
    if (i % 10 === 0) {
      console.log(`[Setup] Users: ${i}/${userCount}`);
    }
    const ts = Date.now();
    const userData = {
      email: `rltest_${i}_${ts}@test.com`,
      password: `Test@${i}Password`,
      username: `rltest_${i}_${ts}`,
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

    if (i % 10 === 0) sleep(0.05);
  }

  console.log(`[Setup] Created ${setupData.users.length} users`);

  // 创建少量测试故事
  if (setupData.users.length > 0) {
    const storyCount = Math.min(200, config.stories.count);
    console.log(`Creating ${storyCount} test stories...`);

    for (let i = 0; i < storyCount; i++) {
      const userIndex = i % setupData.users.length;
      const user = setupData.users[userIndex];
      const token = user.token;

      if (token) {
        const location = {
          lat: 39.8 + Math.random() * 0.3,
          lng: 116.2 + Math.random() * 0.4,
        };
        const storyData = {
          content: `限流测试故事 #${i} - ${Date.now()}`,
          images: [],
          location: location,
          emotionTag: ['开心', '难过', '治愈', '打卡'][i % 4],
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
              });
            }
          } catch (e) {}
        }
      }

      if (i % 20 === 0) sleep(0.05);
    }
  }

  console.log(`[Setup] Created ${setupData.stories.length} stories`);

  return setupData;
}

// ===================== 限流测试 Action 实现 =====================

function randomUser(data) {
  return data.users[Math.floor(Math.random() * data.users.length)];
}

function randomStory(data) {
  return data.stories[Math.floor(Math.random() * data.stories.length)];
}

// limiter 分类映射
const actionLimiterMap = {
  auth: 'strict',
  story: 'general',
  like: 'general',
  favorite: 'general',
  comment: 'general',
  map: 'loose',
  notification: 'general',
  report: 'general',
};

/**
 * Auth - 触发 strictLimiter (权重 25%)
 */
function rlTestAuth(data) {
  const user = randomUser(data);
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), tagParams({ headers: { 'Content-Type': 'application/json' } }, 'auth', 'strict'));

  check(res, {
    'auth: status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'auth: 429 has correct format': (r) => checkRateLimitResponse(r),
  });
  recordRLResponse(res);

  // 获取用户信息
  const userRes = http.get(`${BASE_URL}/api/auth/users/${user.id}`, tagParams(null, 'auth', 'strict'));
  check(userRes, {
    'auth: get user 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
  recordRLResponse(userRes);
}

/**
 * Story - 触发 generalLimiter (权重 15%)
 */
function rlTestStory(data) {
  const story = randomStory(data);
  const res = http.get(`${BASE_URL}/api/stories/${story.id}`, tagParams(null, 'story', 'general'));
  check(res, {
    'story: status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'story: 429 has correct format': (r) => checkRateLimitResponse(r),
  });
  recordRLResponse(res);

  const keywords = ['开心', '测试', '故事', '打卡'];
  const keyword = keywords[randomInt(0, keywords.length - 1)];
  const searchRes = http.get(`${BASE_URL}/api/stories/search?keyword=${encodeURIComponent(keyword)}&page=1&limit=20`, tagParams(null, 'story', 'general'));
  check(searchRes, {
    'story: search 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
  recordRLResponse(searchRes);
}

/**
 * Like - 触发 generalLimiter (权重 13%)
 */
function rlTestLike(data) {
  const user = randomUser(data);
  const story = randomStory(data);
  if (user.token) {
    const res = http.post(`${BASE_URL}/api/likes`, JSON.stringify({ storyId: story.id }), tagParams({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    }, 'like', 'general'));
    check(res, {
      'like: status 200 or 429': (r) => r.status === 200 || r.status === 429,
      'like: 429 has correct format': (r) => checkRateLimitResponse(r),
    });
    recordRLResponse(res);
  }

  const countRes = http.get(`${BASE_URL}/api/likes/${story.id}/count`, tagParams(null, 'like', 'general'));
  check(countRes, {
    'like: count 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
  recordRLResponse(countRes);
}

/**
 * Favorite - 触发 generalLimiter (权重 10%)
 */
function rlTestFavorite(data) {
  const user = randomUser(data);
  const story = randomStory(data);
  if (user.token) {
    const res = http.post(`${BASE_URL}/api/favorites`, JSON.stringify({ storyId: story.id }), tagParams({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    }, 'favorite', 'general'));
    check(res, {
      'favorite: status 200 or 429': (r) => r.status === 200 || r.status === 429,
      'favorite: 429 has correct format': (r) => checkRateLimitResponse(r),
    });
    recordRLResponse(res);
  }
}

/**
 * Comment - 触发 generalLimiter (权重 12%)
 */
function rlTestComment(data) {
  const user = randomUser(data);
  const story = randomStory(data);
  if (user.token) {
    const res = http.post(`${BASE_URL}/api/comments`, JSON.stringify({
      storyId: story.id,
      content: `限流测试评论 ${Date.now()}`,
    }), tagParams({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    }, 'comment', 'general'));
    check(res, {
      'comment: status 200 or 429': (r) => r.status === 200 || r.status === 429,
      'comment: 429 has correct format': (r) => checkRateLimitResponse(r),
    });
    recordRLResponse(res);
  }

  const listRes = http.get(`${BASE_URL}/api/comments/story/${story.id}?page=1&limit=10`, tagParams(null, 'comment', 'general'));
  check(listRes, {
    'comment: list 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
  recordRLResponse(listRes);
}

/**
 * Map - 触发 looseLimiter (权重 10%)
 */
function rlTestMap(data) {
  const lat = 39.9 + Math.random() * 0.1;
  const lng = 116.3 + Math.random() * 0.2;

  const exploreRes = http.get(`${BASE_URL}/api/map/explore?lat=${lat}&lng=${lng}&radius=1000`, tagParams(null, 'map', 'loose'));
  check(exploreRes, {
    'map: explore 200 or 429': (r) => r.status === 200 || r.status === 429,
    'map: explore 429 format': (r) => checkRateLimitResponse(r),
  });
  recordRLResponse(exploreRes);

  const feedRes = http.get(`${BASE_URL}/api/map/feed?lat=${lat}&lng=${lng}&page=1&limit=20`, tagParams(null, 'map', 'loose'));
  check(feedRes, {
    'map: feed 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
  recordRLResponse(feedRes);
}

/**
 * Notification - 触发 generalLimiter (权重 5%)
 */
function rlTestNotification(data) {
  const user = randomUser(data);
  if (!user.token) return;

  const res = http.get(`${BASE_URL}/api/v1/notifications/me?page=1&limit=10`, tagParams(
    { headers: { 'Authorization': `Bearer ${user.token}` } },
    'notification', 'general',
  ));
  check(res, {
    'notification: 200 or 429': (r) => r.status === 200 || r.status === 429,
    'notification: 429 format': (r) => checkRateLimitResponse(r),
  });
  recordRLResponse(res);
}

/**
 * Report - 触发 generalLimiter (权重 10%)
 */
function rlTestReport(data) {
  const user = randomUser(data);
  const story = randomStory(data);
  if (!user.token) return;

  const reasons = ['内容不当', '涉嫌抄袭', '虚假信息', '恶意内容', '其他问题'];
  const res = http.post(`${BASE_URL}/api/reports`, JSON.stringify({
    targetType: 'story',
    targetId: story.id,
    reason: reasons[randomInt(0, reasons.length - 1)],
  }), tagParams({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.token}`,
    },
  }, 'report', 'general'));
  check(res, {
    'report: 200 or 429': (r) => r.status === 200 || r.status === 429,
    'report: 429 format': (r) => checkRateLimitResponse(r),
  });
  recordRLResponse(res);
}

// Action 分发映射
const rlActionMap = {
  auth: rlTestAuth,
  story: rlTestStory,
  like: rlTestLike,
  favorite: rlTestFavorite,
  comment: rlTestComment,
  map: rlTestMap,
  notification: rlTestNotification,
  report: rlTestReport,
};

// ===================== 主测试函数 =====================

export default function (data) {
  if (!data || data.users.length === 0) {
    sleep(1);
    return;
  }

  // 基于权重随机选择模块
  const actionName = chooseByWeight(RATE_LIMIT_WEIGHTS);
  const actionFn = rlActionMap[actionName];

  if (actionFn) {
    group(actionName, () => actionFn(data));
  }

  sleep(Math.random() * 0.2 + 0.05);
}

// ===================== Teardown =====================

export function teardown(data) {
  console.log('\n=== Rate Limit Test Completed ===');
  console.log(`Created users: ${data.users.length}`);
  console.log(`Created stories: ${data.stories.length}`);
  console.log('\nKey metrics to check:');
  console.log('  1. rate_429 should be > 0 (rate limiting triggered)');
  console.log('  2. 429 response format checks should all pass');
  console.log('  3. Response times for successful requests should be acceptable');
  console.log('  4. Check http_req_duration{limiter:strict/general/loose} for limiter-specific timing');
}
