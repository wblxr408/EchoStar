/**
 * Notification 模块测试脚本
 * 测试所有通知相关接口
 * 
 * 使用方式：
 *   node notification.test.js          # 正常运行（不重置环境）
 *   node notification.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PREFIX = 'notification_test_';
const SHOULD_RESET = process.argv.includes('--reset');

// 用户A - 故事作者（通知接收者）
let userAToken = null;
let userAId = null;

// 用户B - 互动者（通知触发者）
let userBToken = null;
let userBId = null;

let testStoryId = null;
let testNotificationId = null;

// 请求记录
const requestRecords = [];
let requestCounter = 0;

// 测试统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// ==================== 工具函数 ====================

/**
 * 记录请求
 */
function recordRequest(method, url, headers, body, status, response) {
  requestCounter++;
  const record = {
    序号: requestCounter,
    请求类型: method,
    接口地址: url,
    返回状态: status,
    请求头: headers,
    请求体: body || null,
    返回内容: response
  };
  requestRecords.push(record);
  return record;
}

/**
 * 生成测试报告文件内容（按请求顺序依次记录）
 */
function generateReportContent() {
  const now = new Date().toISOString();
  let content = `# EchoStar API 测试报告 - Notification模块\n\n`;
  content += `**测试时间**: ${now}\n\n`;
  content += `**服务器地址**: ${BASE_URL}\n\n`;
  content += `**请求总数**: ${requestRecords.length}\n\n`;
  content += `---\n\n`;

  // 按请求顺序依次输出
  requestRecords.forEach((record, idx) => {
    content += `## ${idx + 1}. ${record.请求类型} ${record.接口地址}\n\n`;
    content += `**序号**: ${record.序号}\n\n`;
    content += `**返回状态**: ${record.返回状态}\n\n`;
    content += `**请求头**:\n\`\`\`json\n${JSON.stringify(record.请求头, null, 2)}\n\`\`\`\n\n`;
    if (record.请求体) {
      content += `**请求体**:\n\`\`\`json\n${JSON.stringify(record.请求体, null, 2)}\n\`\`\`\n\n`;
    }
    content += `**返回内容**:\n\`\`\`json\n${JSON.stringify(record.返回内容, null, 2)}\n\`\`\`\n\n`;
    content += `---\n\n`;
  });

  return content;
}

/**
 * 生成测试报告（控制台输出）
 */
function generateTestReport() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║       EchoStar API 测试报告 - Notification模块      ║`);
  console.log(`[${now}] ╚════════════════════════════════════════════════════╝`);
  console.log(`[${now}] 目标服务器: ${BASE_URL}`);
  console.log(`[${now}] 测试时间: ${now}`);
  console.log(`[${now}] 总计: ${stats.total} | 通过: ${stats.passed} | 失败: ${stats.failed}`);
  console.log(`[${now}] ${'='.repeat(50)}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n[${now}] 错误详情:`);
    stats.errors.forEach((err, idx) => {
      console.log(`[${now}] ${idx + 1}. ${err}`);
    });
  }
}

/**
 * 保存请求记录到文件
 */
async function saveRequestRecords() {
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'request-records');
  const reportPath = path.join(reportDir, `notification_request_${now}.md`);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, generateReportContent());
  console.log(`[INFO] 请求记录已保存: ${reportPath}`);
  return reportPath;
}

/**
 * 保存测试报告
 */
async function saveTestReport() {
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'test-reports');
  const reportPath = path.join(reportDir, `notification_test_report_${now}.txt`);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  let reportContent = '';
  requestRecords.forEach(record => {
    const time = new Date().toISOString();
    const status = record.返回状态 >= 200 && record.返回状态 < 300 ? 'PASS' : 
                   record.返回状态 >= 400 && record.返回状态 < 500 ? 'FAIL' : 'ERROR';
    reportContent += `[${time}] [${status}] ${record.请求类型} ${record.接口地址} - 状态码: ${record.返回状态}\n`;
  });
  
  reportContent += `\n[${new Date().toISOString()}] 测试统计: 总计=${stats.total}, 通过=${stats.passed}, 失败=${stats.failed}\n`;
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`[INFO] 测试报告已保存: ${reportPath}`);
  return reportPath;
}

/**
 * 发送请求并记录
 * @param {string} method - HTTP方法
 * @param {string} url - 请求URL
 * @param {object} data - 请求体
 * @param {object} customHeaders - 自定义请求头
 * @param {string} userKey - 使用哪个用户的token: 'A' 或 'B'，默认 'A'
 */
async function sendRequest(method, url, data = null, customHeaders = {}, userKey = 'A') {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  // 根据用户选择使用对应的token
  const token = userKey === 'B' ? userBToken : userAToken;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const config = {
      method,
      url,
      headers,
      validateStatus: () => true
    };
    
    if (data !== null && data !== undefined) {
      config.data = data;
    }
    
    const response = await axios(config);

    const record = recordRequest(
      method.toUpperCase(),
      url,
      { ...headers },
      data,
      response.status,
      response.data
    );

    return response;
  } catch (error) {
    const record = recordRequest(
      method.toUpperCase(),
      url,
      { ...headers },
      data,
      error.response?.status || 500,
      error.response?.data || { error: error.message }
    );

    return error.response || { status: 500, data: { error: error.message } };
  }
}

/**
 * 断言测试结果
 */
function assert(condition, message) {
  stats.total++;
  const now = new Date().toISOString();
  if (condition) {
    stats.passed++;
    console.log(`[${now}] [PASS] ${message}`);
    return true;
  } else {
    stats.failed++;
    stats.errors.push(message);
    console.log(`[${now}] [FAIL] ${message}`);
    return false;
  }
}

// ==================== 测试准备 ====================

/**
 * 注册/登录单个用户
 */
async function setupUser(suffix) {
  const timestamp = Date.now();
  const username = `${TEST_PREFIX}user_${suffix}_${timestamp}`;
  const email = `${TEST_PREFIX}${suffix}_${timestamp}@test.com`;
  const password = 'Test123456';

  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register`, {
    username,
    email,
    password
  }, {}, null); // 不使用token

  if (registerRes.status === 200 || registerRes.status === 201) {
    return {
      token: registerRes.data?.data?.accessToken,
      userId: registerRes.data?.data?.user?.id,
      username
    };
  }
  
  // 如果注册失败，尝试登录
  const loginRes = await sendRequest('POST', `${BASE_URL}/api/auth/login`, {
    email,
    password
  }, {}, null);
  
  if (loginRes.status === 200) {
    return {
      token: loginRes.data?.data?.accessToken,
      userId: loginRes.data?.data?.user?.id,
      username
    };
  }
  
  return null;
}

/**
 * 创建两个测试用户
 */
async function setupTestUsers() {
  console.log('[INFO] 创建用户A（故事作者/通知接收者）...');
  const userA = await setupUser('A');
  if (!userA) {
    console.error('[ERROR] 用户A创建失败');
    return false;
  }
  userAToken = userA.token;
  userAId = userA.userId;
  console.log(`[INFO] 用户A创建成功: ID=${userAId}`);

  console.log('[INFO] 创建用户B（互动者/通知触发者）...');
  const userB = await setupUser('B');
  if (!userB) {
    console.error('[ERROR] 用户B创建失败');
    return false;
  }
  userBToken = userB.token;
  userBId = userB.userId;
  console.log(`[INFO] 用户B创建成功: ID=${userBId}`);

  return true;
}

/**
 * 用户A创建测试故事
 */
async function setupTestStory() {
  const storyRes = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: `测试故事用于通知测试 ${Date.now()}`,
    images: ['https://example.com/test-image.jpg'],
    emotionTag: '开心',
    location: {
      lat: 39.90923,
      lng: 116.397428
    }
  }, {}, 'A'); // 用户A创建故事

  if (storyRes.status === 200 || storyRes.status === 201) {
    testStoryId = storyRes.data?.data?.id;
    console.log(`[INFO] 用户A的测试故事创建成功: ID=${testStoryId}`);
    return true;
  }

  console.log(`[WARN] 故事创建失败，尝试使用现有故事`);
  
  // 尝试获取用户A的现有故事
  const storiesRes = await sendRequest('GET', `${BASE_URL}/api/stories/me/list`, null, {}, 'A');
  if (storiesRes.status === 200 && storiesRes.data?.data?.stories?.length > 0) {
    testStoryId = storiesRes.data.data.stories[0].id;
    console.log(`[INFO] 使用用户A的现有故事: ID=${testStoryId}`);
    return true;
  }
  
  return false;
}

/**
 * 用户B互动用户A的故事，产生通知
 * 操作序列：点赞 -> 评论1 -> 收藏 -> 取消点赞 -> 评论2 -> 取消收藏 -> 再次点赞 -> 评论3 -> 再次收藏
 */
async function userBInteractions() {
  console.log('\n========== 用户B互动操作 ==========\n');

  // 1. 点赞
  console.log('[1] 用户B点赞...');
  await sendRequest('POST', `${BASE_URL}/api/likes`, { storyId: testStoryId }, {}, 'B');

  // 2. 评论"用户B评论1"
  console.log('[2] 用户B评论"用户B评论1"...');
  await sendRequest('POST', `${BASE_URL}/api/comments`, { storyId: testStoryId, content: '用户B评论1' }, {}, 'B');

  // 3. 收藏
  console.log('[3] 用户B收藏...');
  await sendRequest('POST', `${BASE_URL}/api/favorites`, { storyId: testStoryId }, {}, 'B');

  // 4. 取消点赞
  console.log('[4] 用户B取消点赞...');
  await sendRequest('DELETE', `${BASE_URL}/api/likes/${testStoryId}`, null, {}, 'B');

  // 5. 评论"用户B评论2"
  console.log('[5] 用户B评论"用户B评论2"...');
  await sendRequest('POST', `${BASE_URL}/api/comments`, { storyId: testStoryId, content: '用户B评论2' }, {}, 'B');

  // 6. 取消收藏
  console.log('[6] 用户B取消收藏...');
  await sendRequest('DELETE', `${BASE_URL}/api/favorites/${testStoryId}`, null, {}, 'B');

  // 7. 再次点赞
  console.log('[7] 用户B再次点赞...');
  await sendRequest('POST', `${BASE_URL}/api/likes`, { storyId: testStoryId }, {}, 'B');

  // 8. 评论"用户B评论3"
  console.log('[8] 用户B评论"用户B评论3"...');
  await sendRequest('POST', `${BASE_URL}/api/comments`, { storyId: testStoryId, content: '用户B评论3' }, {}, 'B');

  // 9. 再次收藏
  console.log('[9] 用户B再次收藏...');
  await sendRequest('POST', `${BASE_URL}/api/favorites`, { storyId: testStoryId }, {}, 'B');

  // 等待通知创建
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('\n[INFO] 用户B互动操作完成\n');
}

// ==================== 测试用例 ====================

/**
 * 1. 获取通知列表测试
 */
async function testGetNotifications() {
  console.log('\n========== 1. 获取通知列表测试 ==========\n');

  const res = await sendRequest('GET', `${BASE_URL}/api/notifications/me`, null, {}, 'A');
  assert(res.status === 200, '获取通知列表成功');
  assert(Array.isArray(res.data?.data?.notifications), '返回通知数组');
  
  const count = res.data?.data?.notifications?.length || 0;
  console.log(`[INFO] 用户A收到 ${count} 条通知`);
  
  // 保存第一个通知ID
  if (count > 0) {
    testNotificationId = res.data.data.notifications[0].id;
    console.log(`[INFO] 通知示例: type=${res.data.data.notifications[0].type}, content=${res.data.data.notifications[0].content}`);
  }
}

/**
 * 2. 获取未读通知数量测试
 */
async function testGetUnreadCount() {
  console.log('\n========== 2. 获取未读通知数量测试 ==========\n');

  const res = await sendRequest('GET', `${BASE_URL}/api/notifications/me/unread-count`, null, {}, 'A');
  assert(res.status === 200, '获取未读数量成功');
  console.log(`[INFO] 用户A未读通知数量: ${res.data?.data?.unreadCount}`);
}

/**
 * 3. 标记单条已读测试
 */
async function testMarkAsRead() {
  console.log('\n========== 3. 标记单条已读测试 ==========\n');

  if (!testNotificationId) {
    console.log('[WARN] 没有可用的通知');
    return;
  }

  const res = await sendRequest('PUT', `${BASE_URL}/api/notifications/${testNotificationId}/mark-read`, null, {}, 'A');
  assert(res.status === 200, '标记单条已读成功');
  console.log(`[INFO] 已标记通知 ${testNotificationId} 为已读`);
}

/**
 * 4. 标记全部已读测试
 */
async function testMarkAllAsRead() {
  console.log('\n========== 4. 标记全部已读测试 ==========\n');

  const res = await sendRequest('PUT', `${BASE_URL}/api/notifications/me/mark-read`, null, {}, 'A');
  assert(res.status === 200, '标记全部已读成功');

  // 验证未读数量为0
  const countRes = await sendRequest('GET', `${BASE_URL}/api/notifications/me/unread-count`, null, {}, 'A');
  console.log(`[INFO] 标记全部已读后，未读数量: ${countRes.data?.data?.unreadCount}`);
}

/**
 * 5. 清空所有通知测试
 */
async function testClearAllNotifications() {
  console.log('\n========== 5. 清空所有通知测试 ==========\n');

  const res = await sendRequest('DELETE', `${BASE_URL}/api/notifications/me`, null, {}, 'A');
  assert(res.status === 200, '清空所有通知成功');

  // 验证通知列表为空
  const listRes = await sendRequest('GET', `${BASE_URL}/api/notifications/me`, null, {}, 'A');
  console.log(`[INFO] 清空后通知数量: ${listRes.data?.data?.notifications?.length || 0}`);
}

// ==================== 主函数 ====================

// ==================== 重置环境 ====================

async function resetEnvironment() {
  console.log('[INFO] 正在重置环境...\n');
  
  return new Promise((resolve, reject) => {
    const resetScript = join(__dirname, 'reset-env.js');
    const child = spawn('node', [resetScript], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`重置环境失败，退出码: ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

// ==================== 主函数 ====================

async function main() {
  const now = new Date().toISOString();
  console.log(`[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║              EchoStar API 测试开始                  ║`);
  console.log(`[${now}] ║            模块: Notification (通知)                ║`);
  console.log(`[${now}] ╚════════════════════════════════════════════════════╝`);
  console.log(`[${now}] 目标服务器: ${BASE_URL}`);
  if (SHOULD_RESET) {
    console.log(`[${now}] 模式: 重置环境后测试`);
  }
  console.log(`[${now}] 测试时间: ${now}\n`);

  // 如果需要重置环境
  if (SHOULD_RESET) {
    try {
      await resetEnvironment();
    } catch (error) {
      console.error('[ERROR] 重置环境失败:', error.message);
      return;
    }
  }

  try {
    // ========== 测试准备 ==========
    console.log('========== 测试准备 ==========\n');
    
    const userSetup = await setupTestUsers();
    if (!userSetup) {
      console.error('[ERROR] 无法创建测试用户，测试终止');
      return;
    }

    const storySetup = await setupTestStory();
    if (!storySetup) {
      console.error('[ERROR] 无法创建测试故事，测试终止');
      return;
    }

    // ========== 用户B互动操作 ==========
    await userBInteractions();

    // ========== 用户A通知测试 ==========
    await testGetNotifications();
    await testGetUnreadCount();
    await testMarkAsRead();
    await testMarkAllAsRead();
    await testClearAllNotifications();

    // ========== 生成报告 ==========
    generateTestReport();
    await saveRequestRecords();
    await saveTestReport();

    console.log(`\n[${new Date().toISOString()}] 测试完成！`);

  } catch (error) {
    console.error('[ERROR] 测试执行出错:', error);
  }
}

// 执行测试
main();
