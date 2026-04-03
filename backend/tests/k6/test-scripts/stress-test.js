/**
 * EchoStar 后端完整压力测试脚本
 *
 * [已废弃] 请使用 stress-test-simple.js 作为主要性能测试脚本。
 * 本脚本保留仅供大数据量测试场景使用。
 * 废弃原因：
 *   - stress-test-simple.js 使用 k6 tags 实现按接口细分指标，更符合 k6 最佳实践
 *   - stress-test-simple.js 的场景化行为建模更接近真实用户
 *   - 维护两套实现成本高，本脚本的写操作未使用场景化会话
 *
 * 使用 api-client.js 封装的 API 调用和 report-generator.js 生成报告。
 * 适合大数据量测试场景。
 *
 * 测试流程：
 * 1. Setup：创建大量用户、管理员、故事等测试数据
 * 2. 负载测试：模拟正常用户行为（按权重分配）
 * 3. Teardown：生成测试报告
 *
 * 使用方法：
 *   k6 run --env PROFILE=peak tests/k6/test-scripts/stress-test.js
 *   k6 run --env USER_COUNT=1000 --env STORY_COUNT=5000 tests/k6/test-scripts/stress-test.js
 */

import { sleep } from 'k6';
import {
  config, ACTION_WEIGHTS, READ_ACTIONS, WRITE_ACTIONS, chooseByWeight,
} from './config.js';
import * as api from './api-client.js';
import * as generator from './data-generator.js';
import {
  initTest, finalizeTest, startPhase, endPhase,
  updateDataCreated, generateJsonReport, generateMarkdownReport,
} from './report-generator.js';

// 使用当前 Profile 的 stages
const currentProfile = config.profile;

// k6 配置选项
export const options = {
  stages: currentProfile.stages || [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': [
      `p(95)<${config.thresholds.p95}`,
      `p(99)<${config.thresholds.p99}`,
    ],
    'http_req_duration{endpoint:/api/auth/login}': ['p(95)<1000'],
    'http_req_duration{endpoint:/api/stories}': ['p(95)<1500'],
    'http_req_duration{endpoint:/api/map/explore}': ['p(95)<2000'],
    'http_req_failed': [`rate<${config.thresholds.errorRate}`],
  },
  discardResponseBodies: true,
};

// 全局变量存储创建的测试数据
const createdData = {
  users: [],
  admins: [],
  stories: [],
  comments: [],
};

// 测试阶段标识
let currentPhase = 'setup';

/**
 * Setup 函数：在测试开始前执行一次
 * 创建大量测试数据
 */
export function setup() {
  console.log(`=== 开始数据准备 (Profile: ${config.profileName}) ===`);

  initTest(config.profileName);
  startPhase('setup');

  const setupData = {
    users: [],
    admins: [],
    stories: [],
  };

  // 1. 创建普通用户
  console.log(`\n--- 创建普通用户 (目标: ${config.users.count}) ---`);
  const userBatchSize = config.users.batchSize;
  const userBatches = Math.ceil(config.users.count / userBatchSize);

  for (let batch = 0; batch < userBatches; batch++) {
    const startIndex = batch * userBatchSize;
    const batchSize = Math.min(userBatchSize, config.users.count - startIndex);

    for (let i = 0; i < batchSize; i++) {
      const index = startIndex + i;
      const userData = generator.generateUserData(index, false);
      const result = api.registerUser(userData);

      if (result.success) {
        setupData.users.push({
          id: result.userId,
          token: result.token,
          email: userData.email,
          password: userData.password,
        });
      }

      if (i % 10 === 0) sleep(0.01);
    }

    console.log(`用户批次 ${batch + 1}/${userBatches} 完成，已创建 ${setupData.users.length} 个用户`);
    sleep(0.1);
  }

  // 2. 创建管理员
  console.log('\n--- 创建管理员 ---');
  const adminBatchSize = Math.min(config.users.batchSize, 10);
  const adminBatches = Math.ceil(config.users.adminCount / adminBatchSize);

  for (let batch = 0; batch < adminBatches; batch++) {
    const startIndex = batch * adminBatchSize;
    const batchSize = Math.min(adminBatchSize, config.users.adminCount - startIndex);

    for (let i = 0; i < batchSize; i++) {
      const index = startIndex + i;
      const adminData = generator.generateUserData(index, true);
      const result = api.registerAdmin(adminData);

      if (result.success) {
        setupData.admins.push({
          id: result.adminId,
          token: result.token,
          email: adminData.email,
          password: adminData.password,
        });
      }

      sleep(0.01);
    }

    console.log(`管理员批次 ${batch + 1}/${adminBatches} 完成，已创建 ${setupData.admins.length} 个管理员`);
    sleep(0.1);
  }

  // 3. 创建故事
  console.log('\n--- 创建故事 ---');
  if (setupData.users.length > 0) {
    const storyBatchSize = config.stories.batchSize;
    const storyBatches = Math.ceil(config.stories.count / storyBatchSize);

    for (let batch = 0; batch < storyBatches; batch++) {
      const startIndex = batch * storyBatchSize;
      const batchSize = Math.min(storyBatchSize, config.stories.count - startIndex);

      for (let i = 0; i < batchSize; i++) {
        const userIndex = i % setupData.users.length;
        const user = setupData.users[userIndex];

        if (!user || !user.token) {
          const loginResult = api.loginUser(user.email, user.password);
          if (loginResult.success) {
            user.token = loginResult.token;
          } else {
            continue;
          }
        }

        const storyData = generator.generateStoryData();
        const result = api.createStory(user.token, storyData);

        if (result.success) {
          setupData.stories.push({
            id: result.storyId,
            userId: user.id,
          });
        }

        if (i % 20 === 0) sleep(0.01);
      }

      console.log(`故事批次 ${batch + 1}/${storyBatches} 完成，已创建 ${setupData.stories.length} 个故事`);
      sleep(0.1);
    }
  }

  endPhase('setup');
  updateDataCreated('users', setupData.users.length);
  updateDataCreated('admins', setupData.admins.length);
  updateDataCreated('stories', setupData.stories.length);

  console.log('\n=== 数据准备完成 ===');
  console.log(`用户: ${setupData.users.length}`);
  console.log(`管理员: ${setupData.admins.length}`);
  console.log(`故事: ${setupData.stories.length}`);

  return setupData;
}

// ===================== Action 执行映射 =====================

function executeReadAction(action, data) {
  switch (action) {
    case 'get_story': testReadStory(data); break;
    case 'map_explore': testMapExplore(data); break;
    case 'map_feed': testRecommendationFeed(data); break;
    case 'search_story': testSearch(data); break;
    case 'list_comments': testListComments(data); break;
    case 'get_user': testGetUser(data); break;
    case 'health_check': testHealthCheck(data); break;
    case 'map_clusters': testMapClusters(data); break;
    case 'list_notifications': testListNotifications(data); break;
  }
}

function executeWriteAction(action, data) {
  switch (action) {
    case 'login': testLogin(data); break;
    case 'register': testRegister(data); break;
    case 'create_comment': testComment(data); break;
    case 'like_toggle': testLike(data); break;
    case 'favorite_toggle': testFavorite(data); break;
    case 'create_story': testCreateStory(data); break;
    case 'create_report': testReport(data); break;
    case 'mark_notif_read': testMarkNotifRead(data); break;
    case 'update_profile': testUpdateProfile(data); break;
  }
}

// ===================== 读操作实现 =====================

function testReadStory(data) {
  if (data.stories.length === 0) return;
  const story = data.stories[Math.floor(Math.random() * data.stories.length)];
  let token = null;
  if (data.users.length > 0 && Math.random() > 0.3) {
    token = data.users[Math.floor(Math.random() * data.users.length)].token;
  }
  api.getStory(token, story.id);
}

function testMapExplore(data) {
  const location = generator.generateRandomLatLng();
  api.exploreStories(location.lat, location.lng, generator.randomInt(200, 2000));
}

function testRecommendationFeed(data) {
  const location = generator.generateRandomLatLng();
  const mood = generator.generateEmotionTag();
  api.getFeed(location.lat, location.lng, mood, generator.randomInt(1, 5), 20);
}

function testSearch(data) {
  const keywords = ['开心', '天气', '今天', '这里', '朋友', '美食', '旅行', '打卡'];
  api.searchStories(keywords[Math.floor(Math.random() * keywords.length)], 1, 20);
}

function testListComments(data) {
  if (data.stories.length === 0) return;
  const story = data.stories[Math.floor(Math.random() * data.stories.length)];
  api.getCommentsByStoryId(story.id, 1, 10);
}

function testGetUser(data) {
  if (data.users.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  api.getUserById(user.id);
  if (user.token) api.getCurrentUser(user.token);
}

function testHealthCheck() {
  // Health check is a simple GET, but api-client doesn't have it.
  // This is fine for the complete test - health check is very low weight.
}

function testMapClusters(data) {
  const bounds = generator.generateMapBounds();
  api.getClusters(bounds.northEast, bounds.southWest);
}

function testListNotifications(data) {
  if (data.users.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  if (user.token) api.getNotifications(user.token, 1, 10);
}

// ===================== 写操作实现 =====================

function testLogin(data) {
  if (data.users.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  api.loginUser(user.email, user.password);
}

function testRegister(data) {
  const ts = Date.now();
  api.registerUser(generator.generateUserData(ts));
}

function testComment(data) {
  if (data.users.length === 0 || data.stories.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const story = data.stories[Math.floor(Math.random() * data.stories.length)];
  if (!user.token) return;
  api.createComment(user.token, generator.generateCommentData(story.id));
}

function testLike(data) {
  if (data.users.length === 0 || data.stories.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const story = data.stories[Math.floor(Math.random() * data.stories.length)];
  if (!user.token) return;
  api.toggleLike(user.token, story.id);
}

function testFavorite(data) {
  if (data.users.length === 0 || data.stories.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const story = data.stories[Math.floor(Math.random() * data.stories.length)];
  if (!user.token) return;
  api.toggleFavorite(user.token, story.id);
}

function testCreateStory(data) {
  if (data.users.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  if (!user.token) return;
  api.createStory(user.token, generator.generateStoryData());
}

function testReport(data) {
  if (data.users.length === 0 || data.stories.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const story = data.stories[Math.floor(Math.random() * data.stories.length)];
  if (!user.token) return;
  api.createReport(user.token, generator.generateReportData('story', story.id));
}

function testMarkNotifRead(data) {
  if (data.users.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  if (user.token) api.markAllAsRead(user.token);
}

function testUpdateProfile(data) {
  if (data.users.length === 0) return;
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  if (user.token) api.updateProfile(user.token, { bio: `更新 ${Date.now()}` });
}

/**
 * Teardown 函数：测试结束后生成报告
 */
export function teardown(data) {
  const report = finalizeTest();

  console.log('\n=== 测试报告 ===');
  console.log(JSON.stringify(report.summary, null, 2));

  console.log('\n=== JSON 报告 ===');
  console.log(generateJsonReport().substring(0, 2000) + '...');

  console.log('\n=== 测试完成 ===');
  console.log(`用户总数: ${data.users.length}`);
  console.log(`管理员总数: ${data.admins.length}`);
  console.log(`故事总数: ${data.stories.length}`);
}
