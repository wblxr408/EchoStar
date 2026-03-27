/**
 * EchoStar 后端压力测试主脚本
 * 
 * 测试流程：
 * 1. Setup 阶段：创建大量用户、管理员、故事等测试数据
 * 2. 负载测试：模拟正常用户行为
 * 3. 压力测试：增加并发数测试系统极限
 * 4. 峰值测试：短时间大量请求
 * 5. Teardown：生成测试报告
 * 
 * 使用方法：
 *   k6 run tests/k6/test-scripts/stress-test.js
 *
 * 自定义参数示例：
 *   k6 run --env USER_COUNT=10000 --env STORY_COUNT=50000 tests/k6/test-scripts/stress-test.js
 */

import { sleep } from 'k6';
import { config } from './config.js';
import * as api from './api-client.js';
import * as generator from './data-generator.js';
import { initTest, finalizeTest, startPhase, endPhase, updateDataCreated, generateJsonReport, generateMarkdownReport, resetTestResults } from './report-generator.js';

// k6 配置选项
export const options = {
  // 设置测试阶段
  stages: [
    // 数据准备阶段：低并发创建数据
    { duration: config.duration.setup, target: config.concurrency.setup },
    // 负载测试阶段
    { duration: config.duration.load, target: config.concurrency.load },
    // 压力测试阶段
    { duration: config.duration.stress, target: config.concurrency.stress },
    // 峰值测试阶段
    { duration: config.duration.spike, target: config.concurrency.spike },
    // 冷却阶段
    { duration: config.duration.cooldown, target: 0 },
  ],
  // 性能阈值设置
  thresholds: {
    // 整体性能阈值
    'http_req_duration': [
      `p(95)<${config.thresholds.p95}`,
      `p(99)<${config.thresholds.p99}`,
    ],
    // 按接口分组的阈值
    'http_req_duration{endpoint:/api/auth/login}': ['p(95)<1000'],
    'http_req_duration{endpoint:/api/stories}': ['p(95)<1500'],
    'http_req_duration{endpoint:/api/map/explore}': ['p(95)<2000'],
    // 错误率阈值
    'http_req_failed': [`rate<${config.thresholds.errorRate}`],
  },
  // 不保存请求体以节省内存
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
 * 用于创建大量测试数据
 */
export function setup() {
  console.log('=== 开始数据准备阶段 ===');
  console.log(`计划创建: ${config.users.count} 用户, ${config.users.adminCount} 管理员, ${config.stories.count} 故事`);
  
  const setupData = {
    users: [],
    admins: [],
    stories: [],
  };
  
  // 1. 创建普通用户
  console.log('\n--- 创建普通用户 ---');
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
      
      // 避免 API 限流
      if (i % 10 === 0) sleep(0.01);
    }
    
    console.log(`用户批次 ${batch + 1}/${userBatches} 完成，已创建 ${setupData.users.length} 个用户`);
    
    // 每批次后短暂休息
    sleep(0.1);
  }
  
  // 2. 创建管理员（需要特殊处理：直接在数据库设置 role 为 admin）
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
  
  // 3. 创建故事（需要用户令牌）
  console.log('\n--- 创建故事 ---');
  
  // 如果没有用户，尝试登录已创建的用户获取令牌
  if (setupData.users.length === 0) {
    console.log('没有已创建的用户，跳过故事创建');
  } else {
    const storyBatchSize = config.stories.batchSize;
    const storyBatches = Math.ceil(config.stories.count / storyBatchSize);
    
    for (let batch = 0; batch < storyBatches; batch++) {
      const startIndex = batch * storyBatchSize;
      const batchSize = Math.min(storyBatchSize, config.stories.count - startIndex);
      
      for (let i = 0; i < batchSize; i++) {
        // 轮流使用不同用户创建故事
        const userIndex = i % setupData.users.length;
        const user = setupData.users[userIndex];
        
        if (!user || !user.token) {
          // 如果没有令牌，尝试登录
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
  
  console.log('\n=== 数据准备完成 ===');
  console.log(`用户: ${setupData.users.length}`);
  console.log(`管理员: ${setupData.admins.length}`);
  console.log(`故事: ${setupData.stories.length}`);
  
  return setupData;
}

/**
 * 默认函数：每个虚拟用户执行的测试逻辑
 */
export default function (data) {
  // 根据当前 VU 数确定测试阶段
  const vuCount = __VU;
  
  // 轮询执行不同类型的请求
  const action = Math.floor(Math.random() * 100);
  
  // 如果没有测试数据，跳过
  if (!data || !data.users || data.users.length === 0) {
    sleep(1);
    return;
  }
  
  try {
    if (action < 30) {
      // 30% - 读操作：获取故事详情
      testReadStory(data);
    } else if (action < 45) {
      // 15% - 读操作：地图探索
      testMapExplore(data);
    } else if (action < 55) {
      // 10% - 读操作：推荐流
      testRecommendationFeed(data);
    } else if (action < 65) {
      // 10% - 写操作：点赞
      testLike(data);
    } else if (action < 75) {
      // 10% - 写操作：收藏
      testFavorite(data);
    } else if (action < 85) {
      // 10% - 写操作：评论
      testComment(data);
    } else if (action < 92) {
      // 7% - 读操作：搜索
      testSearch(data);
    } else if (action < 96) {
      // 4% - 读操作：获取用户信息
      testGetUser(data);
    } else {
      // 4% - 管理员操作
      testAdminAction(data);
    }
  } catch (e) {
    console.log(`测试异常: ${e.message}`);
  }
  
  // 随机等待
  sleep(Math.random() * 0.5 + 0.1);
}

/**
 * 测试读取故事详情
 */
function testReadStory(data) {
  if (data.stories.length === 0) return;
  
  const storyIndex = Math.floor(Math.random() * data.stories.length);
  const story = data.stories[storyIndex];
  
  // 可选认证
  let token = null;
  if (data.users.length > 0 && Math.random() > 0.3) {
    const userIndex = Math.floor(Math.random() * data.users.length);
    token = data.users[userIndex].token;
  }
  
  api.getStory(token, story.id);
}

/**
 * 测试地图探索
 */
function testMapExplore(data) {
  const location = generator.generateRandomLatLng();
  const radius = generator.randomInt(100, 2000);
  
  api.exploreStories(location.lat, location.lng, radius);
}

/**
 * 测试推荐流
 */
function testRecommendationFeed(data) {
  const location = generator.generateRandomLatLng();
  const mood = generator.generateEmotionTag();
  
  let token = null;
  if (data.users.length > 0 && Math.random() > 0.3) {
    const userIndex = Math.floor(Math.random() * data.users.length);
    token = data.users[userIndex].token;
  }
  
  const page = generator.randomInt(1, 5);
  const limit = generator.randomInt(10, 30);
  
  api.getFeed(location.lat, location.lng, mood, page, limit, token);
}

/**
 * 测试点赞
 */
function testLike(data) {
  if (data.users.length === 0 || data.stories.length === 0) return;
  
  const userIndex = Math.floor(Math.random() * data.users.length);
  const user = data.users[userIndex];
  const storyIndex = Math.floor(Math.random() * data.stories.length);
  const story = data.stories[storyIndex];
  
  if (!user.token) {
    const loginResult = api.loginUser(user.email, user.password);
    if (loginResult.success) {
      user.token = loginResult.token;
    } else {
      return;
    }
  }
  
  // 使用 toggle 接口
  api.toggleLike(user.token, story.id);
  
  // 检查点赞状态
  api.checkIsLiked(story.id, user.token);
  
  // 获取点赞数量
  api.getLikeCount(story.id);
}

/**
 * 测试收藏
 */
function testFavorite(data) {
  if (data.users.length === 0 || data.stories.length === 0) return;
  
  const userIndex = Math.floor(Math.random() * data.users.length);
  const user = data.users[userIndex];
  const storyIndex = Math.floor(Math.random() * data.stories.length);
  const story = data.stories[storyIndex];
  
  if (!user.token) {
    const loginResult = api.loginUser(user.email, user.password);
    if (loginResult.success) {
      user.token = loginResult.token;
    } else {
      return;
    }
  }
  
  api.toggleFavorite(user.token, story.id);
  api.checkIsFavorited(story.id, user.token);
  api.getFavoriteCount(story.id);
}

/**
 * 测试评论
 */
function testComment(data) {
  if (data.users.length === 0 || data.stories.length === 0) return;
  
  const userIndex = Math.floor(Math.random() * data.users.length);
  const user = data.users[userIndex];
  const storyIndex = Math.floor(Math.random() * data.stories.length);
  const story = data.stories[storyIndex];
  
  if (!user.token) {
    const loginResult = api.loginUser(user.email, user.password);
    if (loginResult.success) {
      user.token = loginResult.token;
    } else {
      return;
    }
  }
  
  // 创建评论
  const commentData = generator.generateCommentData(story.id);
  api.createComment(user.token, commentData);
  
  // 获取评论列表
  api.getCommentsByStoryId(story.id, 1, 10);
  
  // 获取评论数量
  api.getCommentCount(story.id);
}

/**
 * 测试搜索
 */
function testSearch(data) {
  const keywords = ['开心', '天气', '今天', '这里', '朋友', '美食', '旅行', '打卡'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  
  api.searchStories(keyword, 1, 20);
}

/**
 * 测试获取用户信息
 */
function testGetUser(data) {
  if (data.users.length === 0) return;
  
  const userIndex = Math.floor(Math.random() * data.users.length);
  const user = data.users[userIndex];
  
  // 获取用户公开信息
  api.getUserById(user.id);
  
  // 获取当前用户信息（需要认证）
  if (user.token) {
    api.getCurrentUser(user.token);
  }
}

/**
 * 测试管理员操作
 */
function testAdminAction(data) {
  if (data.admins.length === 0 || data.stories.length === 0) return;
  
  const adminIndex = Math.floor(Math.random() * data.admins.length);
  const admin = data.admins[adminIndex];
  
  if (!admin.token) {
    const loginResult = api.loginAdmin(admin.email, admin.password);
    if (loginResult.success) {
      admin.token = loginResult.token;
    } else {
      return;
    }
  }
  
  const storyIndex = Math.floor(Math.random() * data.stories.length);
  const story = data.stories[storyIndex];
  
  // 获取统计数据
  api.getAdminStatistics(admin.token);
  
  // 管理员获取所有故事
  api.getAllStoriesForAdmin(admin.token, 1, 20);
  
  // 随机执行管理员操作
  const adminAction = Math.floor(Math.random() * 4);
  
  switch (adminAction) {
    case 0:
      api.recommendStory(admin.token, story.id);
      break;
    case 1:
      api.unrecommendStory(admin.token, story.id);
      break;
    case 2:
      api.getAllUsers(admin.token, 1, 20);
      break;
    case 3:
      // 获取举报列表
      api.getReports(admin.token, null, 'pending', 1, 20);
      break;
  }
}

/**
 * Teardown 函数：测试结束后执行
 * 生成测试报告
 */
export function teardown(data) {
  console.log('\n=== 开始生成测试报告 ===');
  
  // 等待所有请求完成
  sleep(2);
  
  // 生成报告
  const jsonReport = generateJsonReport();
  const markdownReport = generateMarkdownReport();
  
  // 保存报告到文件（通过 k6 的 exec 功能）
  console.log('\n=== JSON 报告 ===');
  console.log(jsonReport.substring(0, 2000) + '...');
  
  console.log('\n=== Markdown 报告 ===');
  console.log(markdownReport.substring(0, 3000) + '...');
  
  console.log('\n=== 测试完成 ===');
  console.log(`用户总数: ${data.users.length}`);
  console.log(`管理员总数: ${data.admins.length}`);
  console.log(`故事总数: ${data.stories.length}`);
}
