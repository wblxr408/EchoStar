/**
 * EchoStar 后端压力测试 - 简化版（性能测试）
 * 专注于接口性能测试，要求服务器已关闭限流（使用 server.no-limit.js 启动）
 * 
 * 使用方法（通过 run-test.bat）：
 *   run-test.bat --mode performance
 *   run-test.bat --mode performance --reset
 * 
 * 直接使用 k6：
 *   TEST_MODE=performance k6 run --out json=tests/k6/test-reports/performance-test/result.json tests/k6/test-scripts/stress-test-simple.js
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

// 从配置中获取参数
const loadVus = config.concurrency.load;
const loadDurationStr = config.duration.load;
const loadDurationSec = parseDuration(loadDurationStr);

// k6 配置选项（使用动态配置）
export const options = {
  // 分阶段压力测试
  stages: [
    // 预热阶段
    { duration: '30s', target: Math.max(10, Math.floor(loadVus * 0.2)) },
    // 负载测试
    { duration: `${Math.floor(loadDurationSec * 0.4)}s`, target: loadVus },
    // 压力测试
    { duration: `${Math.floor(loadDurationSec * 0.4)}s`, target: loadVus * 2 },
    // 峰值测试
    { duration: '30s', target: loadVus * 4 },
    // 恢复阶段
    { duration: '30s', target: 0 },
  ],
  // 性能阈值
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.05'],
    // 按接口分类的阈值
    'http_req_duration{group:::auth}': ['p(95)<800'],
    'http_req_duration{group:::story}': ['p(95)<1500'],
    'http_req_duration{group:::map}': ['p(95)<2000'],
    'http_req_duration{group:::comment}': ['p(95)<500'],
    'http_req_duration{group:::favorite}': ['p(95)<500'],
    'http_req_duration{group:::like}': ['p(95)<500'],
    'http_req_duration{group:::notification}': ['p(95)<500'],
    'http_req_duration{group:::recommendation}': ['p(95)<2000'],
    'http_req_duration{group:::misc}': ['p(95)<200'],
  },
};

const BASE_URL = config.baseUrl;

// 测试数据
let testUsers = [];
let testStories = [];
let userTokens = [];
let adminToken = null;

/**
 * Setup: 创建基础测试数据
 */
export function setup() {
  console.log('=== Starting Data Preparation ===');
  
  const setupData = {
    users: [],
    admins: [],
    stories: [],
    tokens: [],
    notifiedUsers: [],
  };
  
  // 创建测试用户
  const userCount = Math.min(1000, config.users.count);
  console.log(`Creating ${userCount} test users...`);
  
  for (let i = 0; i < userCount; i++) {
    // Progress log every 10 users
    if (i % 10 === 0) {
      console.log(`[Setup] Creating users: ${i}/${userCount}`);
    }
    const userData = {
      email: `loadtest_user_${i}_${Date.now()}@test.com`,
      password: `Test@${i}Password`,
      username: `loadtest_user_${i}_${Date.now()}`,
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
    
    if (i % 20 === 0) sleep(0.05);
  }
  
  console.log(`[Setup] Created ${setupData.users.length} users`);

  // 创建测试故事
  if (setupData.users.length > 0) {
    const storyCount = Math.min(5000, config.stories.count);
    console.log(`Creating ${storyCount} test stories...`);

    for (let i = 0; i < storyCount; i++) {
      const userIndex = i % setupData.users.length;
      const user = setupData.users[userIndex];

      let token = user.token;
      if (!token) {
        // 登录获取 token
        const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
          email: user.email,
          password: user.password,
        }), { headers: { 'Content-Type': 'application/json' } });

        if (loginRes.status === 200) {
          try {
            const loginBody = JSON.parse(loginRes.body);
            if (loginBody.code === 0 && loginBody.data) {
              token = loginBody.data.accessToken;
              user.token = token;
            }
          } catch (e) {}
        }
      }

      if (token) {
        const location = generateBeijingLocation();
        const storyData = {
          content: `压力测试故事 #${i} - ${Date.now()}`,
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
      
      if (i % 50 === 0) {
        sleep(0.05);
      }
    }
  }
  
  console.log(`[Setup] Created ${setupData.stories.length} stories`);

  // 创建通知数据：通过点赞操作触发通知（通知模块数据存储在 Redis，无法 SQL 插入）
  if (setupData.stories.length > 0 && setupData.users.length > 1) {
    const maxLikes = Math.min(200, setupData.stories.length);
    console.log(`[Setup] Creating likes to generate notification data (max ${maxLikes})...`);
    let likeCount = 0;

    for (let i = 0; i < maxLikes; i++) {
      const story = setupData.stories[i];
      if (!story) continue;

      const likerIndex = (i + 1) % setupData.users.length;
      const liker = setupData.users[likerIndex];

      if (liker && liker.token && String(story.userId) !== String(liker.id)) {
        const likeRes = http.post(`${BASE_URL}/api/likes`, JSON.stringify({ storyId: story.id }), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${liker.token}`,
          },
        });

        if (likeRes.status === 200) {
          likeCount++;
          if (!setupData.notifiedUsers.find(u => String(u.id) === String(story.userId))) {
            const author = setupData.users.find(u => String(u.id) === String(story.userId));
            if (author) setupData.notifiedUsers.push(author);
          }
        }
      }

      if (i % 20 === 0) sleep(0.05);
    }
    console.log(`[Setup] Created ${likeCount} likes, ${setupData.notifiedUsers.length} users have notifications`);
  }
  
  return setupData;
}

/**
 * 生成北京地区随机坐标
 */
function generateBeijingLocation() {
  return {
    lat: 39.8 + Math.random() * 0.3,
    lng: 116.2 + Math.random() * 0.4,
  };
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
  
  // 认证模块测试
  if (action < 18) {
    group('auth', () => {
      testAuth(data);
    });
  }
  // 故事模块测试
  else if (action < 40) {
    group('story', () => {
      testStory(data);
    });
  }
  // 点赞模块测试
  else if (action < 53) {
    group('like', () => {
      testLike(data);
    });
  }
  // 收藏模块测试
  else if (action < 62) {
    group('favorite', () => {
      testFavorite(data);
    });
  }
  // 评论模块测试
  else if (action < 71) {
    group('comment', () => {
      testComment(data);
    });
  }
  // 地图模块测试（仅 explore + wall，推荐接口移至 recommendation 组）
  else if (action < 87) {
    group('map', () => {
      testMap(data);
    });
  }
  // 通知模块测试 - 查询列表 + 标记单条已读
  else if (action < 89) {
    group('notification', () => {
      testNotification(data);
    });
  }
  // 通知模块测试 - 标记全部已读
  else if (action < 90) {
    group('notification', () => {
      testNotificationMarkAll(data);
    });
  }
  // 推荐模块测试
  else if (action < 93) {
    group('recommendation', () => {
      testRecommendation(data);
    });
  }
  // 其他测试
  else {
    group('misc', () => {
      testMisc(data);
    });
  }
  
  sleep(Math.random() * 0.3 + 0.1);
}

/**
 * 认证模块测试
 */
function testAuth(data) {
  // 用户登录
  if (data.users.length > 0) {
    const userIndex = Math.floor(Math.random() * data.users.length);
    const user = data.users[userIndex];
    
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), { headers: { 'Content-Type': 'application/json' } });
    
    check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    // 获取当前用户信息
    if (loginRes.status === 200) {
      try {
        const body = JSON.parse(loginRes.body);
        if (body.code === 0 && body.data && body.data.accessToken) {
          const token = body.data.accessToken;
          
          const meRes = http.get(`${BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          check(meRes, {
            'get current user status is 200': (r) => r.status === 200,
            'get current user response time < 300ms': (r) => r.timings.duration < 300,
          });
        }
      } catch (e) {}
    }
  }
  
  // 查看用户信息
  if (data.users.length > 0) {
    const userIndex = Math.floor(Math.random() * data.users.length);
    const user = data.users[userIndex];
    
    const userRes = http.get(`${BASE_URL}/api/auth/users/${user.id}`);
    
    check(userRes, {
      'get user info status is 200': (r) => r.status === 200,
      'get user info response time < 300ms': (r) => r.timings.duration < 300,
    });
  }
}

/**
 * 故事模块测试
 */
function testStory(data) {
  if (data.stories.length === 0) return;
  
  const storyIndex = Math.floor(Math.random() * data.stories.length);
  const story = data.stories[storyIndex];
  
  // 获取故事详情
  const storyRes = http.get(`${BASE_URL}/api/stories/${story.id}`);
  
  check(storyRes, {
    'get story status is 200': (r) => r.status === 200,
    'get story response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // 搜索故事
  const keywords = ['开心', '测试', '故事', '打卡'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  
  const searchRes = http.get(`${BASE_URL}/api/stories/search?keyword=${encodeURIComponent(keyword)}&page=1&limit=20`);
  
  check(searchRes, {
    'search story status is 200': (r) => r.status === 200,
    'search story response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  // 我的故事列表（需要认证）
  if (data.users.length > 0) {
    const userIndex = Math.floor(Math.random() * data.users.length);
    const user = data.users[userIndex];
    
    if (user.token) {
      const myStoriesRes = http.get(`${BASE_URL}/api/stories/me/list?page=1&limit=20`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
      });
      
      check(myStoriesRes, {
        'get my stories status is 200': (r) => r.status === 200,
        'get my stories response time < 500ms': (r) => r.timings.duration < 500,
      });
    }
  }
}

/**
 * 点赞模块测试
 */
function testLike(data) {
  if (data.stories.length === 0 || data.users.length === 0) return;
  
  const userIndex = Math.floor(Math.random() * data.users.length);
  const user = data.users[userIndex];
  const storyIndex = Math.floor(Math.random() * data.stories.length);
  const story = data.stories[storyIndex];
  
  if (!user.token) {
    // 登录
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), { headers: { 'Content-Type': 'application/json' } });
    
    if (loginRes.status === 200) {
      try {
        const body = JSON.parse(loginRes.body);
        if (body.code === 0 && body.data && body.data.accessToken) {
          user.token = body.data.accessToken;
        }
      } catch (e) {}
    }
  }
  
  if (user.token) {
    // 点赞
    const likeRes = http.post(`${BASE_URL}/api/likes`, JSON.stringify({ storyId: story.id }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    });
    
    check(likeRes, {
      'toggle like status is 200': (r) => r.status === 200,
      'toggle like response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    // 检查点赞状态
    const checkRes = http.get(`${BASE_URL}/api/likes/${story.id}/check`, {
      headers: { 'Authorization': `Bearer ${user.token}` },
    });
    
    check(checkRes, {
      'check like status is 200': (r) => r.status === 200,
      'check like response time < 300ms': (r) => r.timings.duration < 300,
    });
  }
  
  // 获取点赞数量（无需认证）
  const countRes = http.get(`${BASE_URL}/api/likes/${story.id}/count`);
  
  check(countRes, {
    'get like count status is 200': (r) => r.status === 200,
    'get like count response time < 300ms': (r) => r.timings.duration < 300,
  });
}

/**
 * 收藏模块测试
 */
function testFavorite(data) {
  if (data.stories.length === 0 || data.users.length === 0) return;
  
  const userIndex = Math.floor(Math.random() * data.users.length);
  const user = data.users[userIndex];
  const storyIndex = Math.floor(Math.random() * data.stories.length);
  const story = data.stories[storyIndex];
  
  if (!user.token) {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), { headers: { 'Content-Type': 'application/json' } });
    
    if (loginRes.status === 200) {
      try {
        const body = JSON.parse(loginRes.body);
        if (body.code === 0 && body.data && body.data.accessToken) {
          user.token = body.data.accessToken;
        }
      } catch (e) {}
    }
  }
  
  if (user.token) {
    // 收藏
    const favRes = http.post(`${BASE_URL}/api/favorites`, JSON.stringify({ storyId: story.id }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    });
    
    check(favRes, {
      'toggle favorite status is 200': (r) => r.status === 200,
      'toggle favorite response time < 500ms': (r) => r.timings.duration < 500,
    });
  }
  
  // 获取收藏数量（无需认证）
  const countRes = http.get(`${BASE_URL}/api/favorites/${story.id}/count`);
  
  check(countRes, {
    'get favorite count status is 200': (r) => r.status === 200,
    'get favorite count response time < 300ms': (r) => r.timings.duration < 300,
  });
}

/**
 * 评论模块测试
 */
function testComment(data) {
  if (data.stories.length === 0 || data.users.length === 0) return;
  
  const userIndex = Math.floor(Math.random() * data.users.length);
  const user = data.users[userIndex];
  const storyIndex = Math.floor(Math.random() * data.stories.length);
  const story = data.stories[storyIndex];
  
  if (!user.token) {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), { headers: { 'Content-Type': 'application/json' } });
    
    if (loginRes.status === 200) {
      try {
        const body = JSON.parse(loginRes.body);
        if (body.code === 0 && body.data && body.data.accessToken) {
          user.token = body.data.accessToken;
        }
      } catch (e) {}
    }
  }
  
  if (user.token) {
    // 创建评论
    const commentRes = http.post(`${BASE_URL}/api/comments`, JSON.stringify({
      storyId: story.id,
      content: `压力测试评论 ${Date.now()}`,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    });
    
    check(commentRes, {
      'create comment status is 200': (r) => r.status === 200,
      'create comment response time < 500ms': (r) => r.timings.duration < 500,
    });
  }
  
  // 获取评论列表（无需认证）
  const listRes = http.get(`${BASE_URL}/api/comments/story/${story.id}?page=1&limit=10`);
  
  check(listRes, {
    'get comments status is 200': (r) => r.status === 200,
    'get comments response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // 获取评论数量
  const countRes = http.get(`${BASE_URL}/api/comments/${story.id}/count`);
  
  check(countRes, {
    'get comment count status is 200': (r) => r.status === 200,
    'get comment count response time < 300ms': (r) => r.timings.duration < 300,
  });
}

/**
 * 地图模块测试
 */
function testMap(data) {
  const lat = 39.9 + Math.random() * 0.1;
  const lng = 116.3 + Math.random() * 0.2;
  
  // 范围查询
  const exploreRes = http.get(`${BASE_URL}/api/map/explore?lat=${lat}&lng=${lng}&radius=1000`);
  
  check(exploreRes, {
    'explore stories status is 200': (r) => r.status === 200,
    'explore stories response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  // 故事墙
  const wallRes = http.get(`${BASE_URL}/api/map/wall?lat=${lat}&lng=${lng}&radius=50`);
  
  check(wallRes, {
    'location wall status is 200': (r) => r.status === 200,
    'location wall response time < 1000ms': (r) => r.timings.duration < 1000,
  });
}

/**
 * 其他测试
 */
function testMisc(data) {
  // 健康检查
  const healthRes = http.get(`${BASE_URL}/health`);
  
  check(healthRes, {
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
}

/**
 * 通知模块测试（简化版：仅查询接口，数据由 setup 中点赞操作自动产生）
 */
function testNotification(data) {
  if (!data.notifiedUsers || data.notifiedUsers.length === 0) return;

  const user = data.notifiedUsers[Math.floor(Math.random() * data.notifiedUsers.length)];
  if (!user || !user.token) return;

  // 获取通知列表
  const page = Math.floor(Math.random() * 3) + 1;
  const listRes = http.get(`${BASE_URL}/api/v1/notifications/me?page=${page}&limit=10`, {
    headers: { 'Authorization': `Bearer ${user.token}` },
  });

  check(listRes, {
    'get notifications status is 200': (r) => r.status === 200,
    'get notifications response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 从列表中取一条标记已读
  if (listRes.status === 200) {
    try {
      const body = JSON.parse(listRes.body);
      if (body.code === 0 && body.data && body.data.notifications && body.data.notifications.length > 0) {
        const noticeId = body.data.notifications[0].id;
        const markReadRes = http.put(`${BASE_URL}/api/v1/notifications/${noticeId}/mark-read`, null, {
          headers: { 'Authorization': `Bearer ${user.token}` },
        });

        check(markReadRes, {
          'mark notification read status is 200': (r) => r.status === 200,
          'mark notification read response time < 500ms': (r) => r.timings.duration < 500,
        });
      }
    } catch (e) {}
  }
}

/**
 * 通知模块测试 - 标记全部已读
 */
function testNotificationMarkAll(data) {
  if (!data.notifiedUsers || data.notifiedUsers.length === 0) return;

  const user = data.notifiedUsers[Math.floor(Math.random() * data.notifiedUsers.length)];
  if (!user || !user.token) return;

  const markAllRes = http.put(`${BASE_URL}/api/v1/notifications/me/mark-read`, null, {
    headers: { 'Authorization': `Bearer ${user.token}` },
  });

  check(markAllRes, {
    'mark all notifications read status is 200': (r) => r.status === 200,
    'mark all notifications read response time < 500ms': (r) => r.timings.duration < 500,
  });
}

/**
 * 推荐模块测试（简化版：仅测接口响应性能，不验证推荐准确性）
 * 使用可选认证（optionalAuth），有无 Token 均可
 */
function testRecommendation(data) {
  const lat = 39.9 + Math.random() * 0.1;
  const lng = 116.3 + Math.random() * 0.2;
  const moods = ['开心', '难过', '治愈', '打卡'];
  const mood = moods[Math.floor(Math.random() * moods.length)];

  // 随机漫步推荐
  const walkRes = http.get(`${BASE_URL}/api/v1/map/random?lat=${lat}&lng=${lng}&mood=${encodeURIComponent(mood)}`);

  check(walkRes, {
    'recommendation random status is 200': (r) => r.status === 200,
    'recommendation random response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  // 推荐信息流
  const page = Math.floor(Math.random() * 5) + 1;
  const feedRes = http.get(`${BASE_URL}/api/v1/map/feed?lat=${lat}&lng=${lng}&mood=${encodeURIComponent(mood)}&page=${page}&limit=20`);

  check(feedRes, {
    'recommendation feed status is 200': (r) => r.status === 200,
    'recommendation feed response time < 2000ms': (r) => r.timings.duration < 2000,
  });
}

/**
 * Teardown: 输出统计
 */
export function teardown(data) {
  console.log('\n=== Test Completed ===');
  console.log(`Created users: ${data.users.length}`);
  console.log(`Created stories: ${data.stories.length}`);
  console.log(`Users with notifications: ${data.notifiedUsers ? data.notifiedUsers.length : 0}`);
}
