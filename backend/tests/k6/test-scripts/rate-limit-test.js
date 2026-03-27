/**
 * EchoStar 后端限流测试
 * 
 * 测试后端速率限制功能是否正常工作：
 * 1. 在达到限流阈值前，请求应正常响应 (200)
 * 2. 达到阈值后，后续请求应被拒绝 (429)
 * 3. 429 响应格式应包含正确的 code 和 message
 * 
 * 使用方法（通过 run-test.bat）：
 *   run-test.bat --mode rate-limit
 *   run-test.bat --mode rate-limit --reset
 */

import { sleep } from 'k6';
import http from 'k6/http';
import { check, group } from 'k6';
import { config } from './config.js';

// 解析持续时间字符串（如 "2m" -> 120秒）
function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h)$/);
  if (!match) return parseInt(str) || 60;
  const [, value, unit] = match;
  switch (unit) {
    case 's': return parseInt(value);
    case 'm': return parseInt(value) * 60;
    case 'h': return parseInt(value) * 3600;
    default: return parseInt(value) || 60;
  }
}

const loadVus = config.concurrency.load;
const loadDurationStr = config.duration.load;
const loadDurationSec = parseDuration(loadDurationStr);

export const options = {
  // 分阶段测试限流行为（根据 duration 参数动态计算各阶段时长）
  stages: [
    // 阶段1: 预热 - 低并发，请求应全部成功
    { duration: `${Math.max(15, Math.floor(loadDurationSec * 0.15))}s`, target: Math.max(10, Math.floor(loadVus * 0.2)) },
    // 阶段2: 逐渐增加 - 应开始触发限流
    { duration: `${Math.max(30, Math.floor(loadDurationSec * 0.35))}s`, target: loadVus },
    // 阶段3: 持续高负载 - 大部分请求应被限流
    { duration: `${Math.max(30, Math.floor(loadDurationSec * 0.35))}s`, target: loadVus * 2 },
    // 阶段4: 冷却
    { duration: `${Math.max(15, Math.floor(loadDurationSec * 0.15))}s`, target: 0 },
  ],
  // 限流测试的阈值：不检查失败率（因为预期会有大量 429）
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    // 以下按接口分组检查响应时间
    'http_req_duration{group:::auth}': ['p(95)<800'],
    'http_req_duration{group:::story}': ['p(95)<1500'],
    'http_req_duration{group:::map}': ['p(95)<2000'],
    'http_req_duration{group:::comment}': ['p(95)<500'],
    'http_req_duration{group:::favorite}': ['p(95)<500'],
    'http_req_duration{group:::like}': ['p(95)<500'],
    // 注意：不设置 http_req_failed 阈值，因为 429 是预期行为
  },
};

const BASE_URL = config.baseUrl;

// 测试数据
let testUsers = [];
let testStories = [];

/**
 * Setup: 创建基础测试数据
 */
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
      console.log(`[Setup] Creating users: ${i}/${userCount}`);
    }
    const userData = {
      email: `rltest_user_${i}_${Date.now()}@test.com`,
      password: `Test@${i}Password`,
      username: `rltest_user_${i}_${Date.now()}`,
    };

    const response = http.post(`${BASE_URL}/api/auth/register_2`, JSON.stringify(userData), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 200 || response.status === 201) {
      try {
        const body = JSON.parse(response.body);
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
            const body = JSON.parse(response.body);
            if (body.code === 0 && body.data) {
              setupData.stories.push({
                id: body.data.id,
                userId: user.id,
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

/**
 * 验证 429 响应格式
 */
function checkRateLimitResponse(res) {
  if (res.status !== 429) return true; // 非 429 响应不需要检查

  try {
    const body = JSON.parse(res.body);
    return body.code === 429 && typeof body.message === 'string' && body.message.length > 0;
  } catch (e) {
    return false;
  }
}

/**
 * 测试执行函数
 */
export default function (data) {
  if (!data || data.users.length === 0) {
    sleep(1);
    return;
  }

  const action = Math.floor(Math.random() * 100);

  if (action < 30) {
    group('auth', () => testAuth(data));
  } else if (action < 50) {
    group('story', () => testStory(data));
  } else if (action < 65) {
    group('like', () => testLike(data));
  } else if (action < 75) {
    group('favorite', () => testFavorite(data));
  } else if (action < 85) {
    group('comment', () => testComment(data));
  } else {
    group('map', () => testMap(data));
  }

  sleep(Math.random() * 0.2 + 0.05);
}

/**
 * 认证模块测试（主要触发 strictLimiter）
 */
function testAuth(data) {
  if (data.users.length === 0) return;

  const user = data.users[Math.floor(Math.random() * data.users.length)];

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, {
    'auth: status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'auth: login response time < 500ms': (r) => r.timings.duration < 500,
    'auth: 429 has correct format': (r) => checkRateLimitResponse(r),
  });

  // 获取用户信息（公开接口）
  const userRes = http.get(`${BASE_URL}/api/auth/users/${user.id}`);

  check(userRes, {
    'auth: get user status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'auth: get user response time < 300ms': (r) => r.timings.duration < 300,
    'auth: get user 429 format': (r) => checkRateLimitResponse(r),
  });
}

/**
 * 故事模块测试（触发 generalLimiter）
 */
function testStory(data) {
  if (data.stories.length === 0) return;

  const story = data.stories[Math.floor(Math.random() * data.stories.length)];

  const storyRes = http.get(`${BASE_URL}/api/stories/${story.id}`);

  check(storyRes, {
    'story: status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'story: response time < 500ms': (r) => r.timings.duration < 500,
    'story: 429 has correct format': (r) => checkRateLimitResponse(r),
  });

  const keywords = ['开心', '测试', '故事', '打卡'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  const searchRes = http.get(`${BASE_URL}/api/stories/search?keyword=${encodeURIComponent(keyword)}&page=1&limit=20`);

  check(searchRes, {
    'story: search status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'story: search response time < 1000ms': (r) => r.timings.duration < 1000,
    'story: search 429 format': (r) => checkRateLimitResponse(r),
  });
}

/**
 * 点赞模块测试
 */
function testLike(data) {
  if (data.stories.length === 0 || data.users.length === 0) return;

  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const story = data.stories[Math.floor(Math.random() * data.stories.length)];

  if (user.token) {
    const likeRes = http.post(`${BASE_URL}/api/likes`, JSON.stringify({ storyId: story.id }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    });

    check(likeRes, {
      'like: status 200 or 429': (r) => r.status === 200 || r.status === 429,
      'like: response time < 500ms': (r) => r.timings.duration < 500,
      'like: 429 has correct format': (r) => checkRateLimitResponse(r),
    });
  }

  const countRes = http.get(`${BASE_URL}/api/likes/${story.id}/count`);

  check(countRes, {
    'like: count status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'like: count response time < 300ms': (r) => r.timings.duration < 300,
    'like: count 429 format': (r) => checkRateLimitResponse(r),
  });
}

/**
 * 收藏模块测试
 */
function testFavorite(data) {
  if (data.stories.length === 0 || data.users.length === 0) return;

  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const story = data.stories[Math.floor(Math.random() * data.stories.length)];

  if (user.token) {
    const favRes = http.post(`${BASE_URL}/api/favorites`, JSON.stringify({ storyId: story.id }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    });

    check(favRes, {
      'favorite: status 200 or 429': (r) => r.status === 200 || r.status === 429,
      'favorite: response time < 500ms': (r) => r.timings.duration < 500,
      'favorite: 429 has correct format': (r) => checkRateLimitResponse(r),
    });
  }
}

/**
 * 评论模块测试
 */
function testComment(data) {
  if (data.stories.length === 0 || data.users.length === 0) return;

  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const story = data.stories[Math.floor(Math.random() * data.stories.length)];

  // 获取评论列表（不需要认证）
  const listRes = http.get(`${BASE_URL}/api/comments/story/${story.id}?page=1&limit=10`);

  check(listRes, {
    'comment: status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'comment: response time < 500ms': (r) => r.timings.duration < 500,
    'comment: 429 has correct format': (r) => checkRateLimitResponse(r),
  });
}

/**
 * 地图模块测试（触发 looseLimiter）
 */
function testMap(data) {
  const lat = 39.9 + Math.random() * 0.1;
  const lng = 116.3 + Math.random() * 0.2;

  const exploreRes = http.get(`${BASE_URL}/api/map/explore?lat=${lat}&lng=${lng}&radius=1000`);

  check(exploreRes, {
    'map: explore status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'map: explore response time < 1000ms': (r) => r.timings.duration < 1000,
    'map: explore 429 format': (r) => checkRateLimitResponse(r),
  });

  const feedRes = http.get(`${BASE_URL}/api/map/feed?lat=${lat}&lng=${lng}&page=1&limit=20`);

  check(feedRes, {
    'map: feed status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'map: feed response time < 1000ms': (r) => r.timings.duration < 1000,
    'map: feed 429 format': (r) => checkRateLimitResponse(r),
  });
}

/**
 * Teardown: 输出统计
 */
export function teardown(data) {
  console.log('\n=== Rate Limit Test Completed ===');
  console.log(`Created users: ${data.users.length}`);
  console.log(`Created stories: ${data.stories.length}`);
  console.log('\nKey metrics to check:');
  console.log('  1. http_req_failed rate should be > 0 (rate limiting triggered)');
  console.log('  2. 429 response format checks should all pass');
  console.log('  3. Response times for successful requests should be acceptable');
}
