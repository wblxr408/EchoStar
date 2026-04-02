/**
 * Favorite 模块测试脚本
 * 测试所有收藏相关接口
 * 
 * 使用方式：
 *   node favorite.test.js          # 正常运行（不重置环境）
 *   node favorite.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_RESULTS_DIR = process.env.TEST_RESULTS_DIR || join(__dirname, '..', 'test-results');
const TEST_PREFIX = 'favorite_test_';
const SHOULD_RESET = process.argv.includes('--reset');
let accessToken = null;
let testUserId = null;
let testStoryId = null;
let secondStoryId = null;
let testFavoriteId = null;

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
function recordRequest(method, url, headers, body, status, response, testDescription = '') {
  requestCounter++;
  const record = {
    序号: requestCounter,
    请求类型: method,
    接口地址: url,
    返回状态: status,
    请求头: headers,
    请求体: body || null,
    返回内容: response,
    测试说明: testDescription
  };
  requestRecords.push(record);
  return record;
}

/**
 * 生成测试报告文件内容
 */
function generateReportContent() {
  const now = new Date().toISOString();
  let content = `# EchoStar API 测试报告 - Favorite模块\n\n`;
  content += `**测试时间**: ${now}\n\n`;
  content += `**服务器地址**: ${BASE_URL}\n\n`;
  content += `---\n\n`;

  const groups = {};
  requestRecords.forEach(record => {
    let groupKey = '其他';
    
    if (record.接口地址.includes('/check-multiple')) groupKey = '批量检查收藏状态';
    else if (record.接口地址.includes('/check')) groupKey = '检查收藏状态';
    else if (record.接口地址.includes('/count')) groupKey = '收藏统计';
    else if (record.接口地址.includes('/me')) groupKey = '我的收藏';
    else if (record.接口地址.includes('/story/')) groupKey = '故事收藏列表';
    else if (record.请求类型 === 'POST' && record.接口地址.includes('/create')) groupKey = '创建收藏';
    else if (record.请求类型 === 'POST') groupKey = '收藏/取消收藏切换';
    else if (record.请求类型 === 'DELETE') groupKey = '取消收藏';
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(record);
  });

  let sectionCounter = 0;
  for (const [group, records] of Object.entries(groups)) {
    sectionCounter++;
    content += `## ${sectionCounter}. ${group}\n\n`;
    
    records.forEach((record, idx) => {
      content += `### ${sectionCounter}.${idx + 1} ${getTestName(record)}\n\n`;
      content += `**测试说明**: ${record.测试说明 || '无'}\n\n`;
      content += `**序号**: ${record.序号}\n\n`;
      content += `**请求类型**: ${record.请求类型}\n\n`;
      content += `**接口地址**: ${record.接口地址}\n\n`;
      content += `**返回状态**: ${record.返回状态}\n\n`;
      content += `**请求头**:\n\`\`\`json\n${JSON.stringify(record.请求头, null, 2)}\n\`\`\`\n\n`;
      if (record.请求体) {
        content += `**请求体**:\n\`\`\`json\n${JSON.stringify(record.请求体, null, 2)}\n\`\`\`\n\n`;
      }
      content += `**返回内容**:\n\`\`\`json\n${JSON.stringify(record.返回内容, null, 2)}\n\`\`\`\n\n`;
      content += `---\n\n`;
    });
  }

  return content;
}

function getTestName(record) {
  const url = record.接口地址;
  if (url.includes('/check-multiple')) {
    if (!record.请求体?.storyIds) return '缺少故事ID数组测试';
    if (!Array.isArray(record.请求体?.storyIds)) return '无效的故事ID数组测试';
    return '批量检查收藏状态测试';
  }
  if (url.includes('/check')) return '检查是否已收藏测试';
  if (url.includes('/count')) return '统计收藏数量测试';
  if (url.includes('/me')) return '获取用户收藏列表测试';
  if (url.includes('/story/')) return '获取故事收藏列表测试';
  if (record.请求类型 === 'POST' && url.includes('/create')) {
    if (record.请求体?.storyId === 999999) return '收藏不存在的故事测试';
    if (!record.请求体?.storyId) return '缺少故事ID测试';
    return '明确创建收藏测试';
  }
  if (record.请求类型 === 'POST') return '收藏切换测试';
  if (record.请求类型 === 'DELETE') {
    if (url.includes('999999')) return '取消不存在的收藏测试';
    return '取消收藏测试';
  }
  return '接口测试';
}

/**
 * 生成测试报告（控制台输出）
 */
function generateTestReport() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║         EchoStar API 测试报告 - Favorite模块        ║`);
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
  const reportDir = path.join(TEST_RESULTS_DIR, 'request-records');
  const reportPath = path.join(reportDir, `favorite.request-${now}.md`);
  
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
  const reportDir = path.join(TEST_RESULTS_DIR, 'test-reports');
  const reportPath = path.join(reportDir, `favorite.test.report-${now}.txt`);
  
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
 */
async function sendRequest(method, url, data = null, customHeaders = {}, testDescription = '') {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const config = {
      method,
      url,
      headers,
      validateStatus: () => true
    };
    
    // 只有当 data 存在时才添加 data 属性，避免发送 "null" 字符串
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
      response.data,
      testDescription
    );

    return response;
  } catch (error) {
    const record = recordRequest(
      method.toUpperCase(),
      url,
      { ...headers },
      data,
      error.response?.status || 500,
      error.response?.data || { error: error.message },
      testDescription
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

async function setupTestUser() {
  const timestamp = Date.now();
  const username = `${TEST_PREFIX}user_${timestamp}`;
  const email = `${TEST_PREFIX}${timestamp}@test.com`;
  const password = 'Test123456';

  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username,
    email,
    password
  }, {}, '创建测试用户（为收藏模块测试创建数据基础）');

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    accessToken = registerRes.data?.data?.accessToken;
    testUserId = registerRes.data?.data?.user?.id;
    console.log(`[INFO] 测试用户创建成功: ${username}, ID=${testUserId}`);
    return true;
  }
  
  console.error('[ERROR] register_2 注册失败');
  return false;
}

async function setupTestStories() {
  // 创建第一个测试故事
  const story1Res = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: `测试故事1用于收藏测试 ${Date.now()}`,
    images: ['https://example.com/test-image1.jpg'],
    emotionTag: '开心',
    location: {
      lat: 39.90923,
      lng: 116.397428
    }
  }, {}, '创建测试故事1（为收藏测试创建数据基础）');

  if (story1Res.status === 200 || story1Res.status === 201) {
    testStoryId = story1Res.data?.data?.id;
    console.log(`[INFO] 测试故事1创建成功: ID=${testStoryId}`);
  }

  // 创建第二个测试故事
  const story2Res = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: `测试故事2用于收藏测试 ${Date.now()}`,
    images: ['https://example.com/test-image2.jpg'],
    emotionTag: '治愈',
    location: {
      lat: 39.91923,
      lng: 116.407428
    }
  }, {}, '创建测试故事2（为收藏测试创建数据基础）');

  if (story2Res.status === 200 || story2Res.status === 201) {
    secondStoryId = story2Res.data?.data?.id;
    console.log(`[INFO] 测试故事2创建成功: ID=${secondStoryId}`);
  }

  return testStoryId && secondStoryId;
}

// ==================== 测试用例 ====================

/**
 * 1. 收藏/取消收藏切换测试
 */
async function testToggleFavorite() {
  console.log('\n========== 1. 收藏/取消收藏切换测试 ==========\n');

  // 1.1 第一次收藏（创建收藏）
  const res1 = await sendRequest('POST', `${BASE_URL}/api/favorites`, {
    storyId: testStoryId
  }, {}, '正常测试：收藏故事（第一次，应创建收藏）');
  assert(res1.status === 200 || res1.status === 201, '第一次收藏成功');
  assert(res1.data?.data?.isFavorited === true, '返回已收藏状态');

  // 1.2 第二次收藏（取消收藏）
  const res2 = await sendRequest('POST', `${BASE_URL}/api/favorites`, {
    storyId: testStoryId
  }, {}, '正常测试：再次收藏同一故事（应取消收藏）');
  assert(res2.status === 200, '第二次收藏触发取消');
  assert(res2.data?.data?.isFavorited === false, '返回未收藏状态');

  // 1.3 第三次收藏（重新收藏）
  const res3 = await sendRequest('POST', `${BASE_URL}/api/favorites`, {
    storyId: testStoryId
  }, {}, '正常测试：第三次收藏（应重新创建收藏）');
  assert(res3.status === 200 || res3.status === 201, '第三次重新收藏成功');
  testFavoriteId = res3.data?.data?.id;

  // 1.4 边界测试：收藏不存在的故事
  const res4 = await sendRequest('POST', `${BASE_URL}/api/favorites`, {
    storyId: 999999
  }, {}, '边界测试：收藏不存在的故事（storyId=999999）');
  assert(res4.status === 404 || res4.status === 400 || res4.status === 500, '收藏不存在的故事应该失败');

  // 1.5 边界测试：缺少故事ID
  const res5 = await sendRequest('POST', `${BASE_URL}/api/favorites`, {}, {}, '边界测试：缺少故事ID（请求体为空对象）');
  assert(res5.status === 400 || res5.status === 500, '缺少故事ID应该失败');

  // 1.6 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res6 = await sendRequest('POST', `${BASE_URL}/api/favorites`, {
    storyId: testStoryId
  }, {}, '边界测试：无Token收藏');
  assert(res6.status === 401, '无Token收藏应该返回401');
  accessToken = tempToken;
}

/**
 * 2. 明确创建收藏测试
 */
async function testCreateFavorite() {
  console.log('\n========== 2. 明确创建收藏测试 ==========\n');

  // 2.1 正常创建收藏（使用第二个故事）
  const res1 = await sendRequest('POST', `${BASE_URL}/api/favorites/create`, {
    storyId: secondStoryId
  }, {}, '正常测试：明确创建收藏（/favorites/create）');
  assert(res1.status === 200 || res1.status === 201, '创建收藏成功');

  // 2.2 重复创建收藏（应该失败）
  const res2 = await sendRequest('POST', `${BASE_URL}/api/favorites/create`, {
    storyId: secondStoryId
  }, {}, '边界测试：重复创建收藏（已收藏的故事）');
  assert(res2.status === 400 || res2.status === 500, '重复创建收藏应该失败');

  // 2.3 边界测试：收藏不存在的故事
  const res3 = await sendRequest('POST', `${BASE_URL}/api/favorites/create`, {
    storyId: 999999
  }, {}, '边界测试：创建收藏不存在的故事（storyId=999999）');
  assert(res3.status === 404 || res3.status === 400 || res3.status === 500, '收藏不存在的故事应该失败');

  // 2.4 边界测试：缺少故事ID
  const res4 = await sendRequest('POST', `${BASE_URL}/api/favorites/create`, {}, {}, '边界测试：缺少故事ID（请求体为空对象）');
  assert(res4.status === 400 || res4.status === 500, '缺少故事ID应该失败');

  // 2.5 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res5 = await sendRequest('POST', `${BASE_URL}/api/favorites/create`, {
    storyId: testStoryId
  }, {}, '边界测试：无Token创建收藏');
  assert(res5.status === 401, '无Token创建收藏应该返回401');
  accessToken = tempToken;
}

/**
 * 3. 取消收藏测试
 */
async function testDeleteFavorite() {
  console.log('\n========== 3. 取消收藏测试 ==========\n');

  // 3.1 正常取消收藏
  const res1 = await sendRequest('DELETE', `${BASE_URL}/api/favorites/${secondStoryId}`, {}, '正常测试：取消收藏');
  assert(res1.status === 200, '取消收藏成功');

  // 3.2 重复取消收藏
  const res2 = await sendRequest('DELETE', `${BASE_URL}/api/favorites/${secondStoryId}`, {}, '边界测试：重复取消收藏');
  assert(res2.status === 400 || res2.status === 404 || res2.status === 500, '重复取消收藏应该失败');

  // 3.3 边界测试：取消不存在的故事收藏
  const res3 = await sendRequest('DELETE', `${BASE_URL}/api/favorites/999999`, {}, '边界测试：取消不存在的故事收藏（storyId=999999）');
  assert(res3.status === 400 || res3.status === 404 || res3.status === 500, '取消不存在的收藏应该失败');

  // 3.4 边界测试：无效的故事ID
  const res4 = await sendRequest('DELETE', `${BASE_URL}/api/favorites/invalid`, {}, '边界测试：无效的故事ID（storyId=invalid）');
  assert(res4.status === 400 || res4.status === 500, '无效故事ID应该失败');

  // 3.5 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res5 = await sendRequest('DELETE', `${BASE_URL}/api/favorites/${testStoryId}`, {}, '边界测试：无Token取消收藏');
  assert(res5.status === 401, '无Token取消收藏应该返回401');
  accessToken = tempToken;
}

/**
 * 4. 获取用户收藏列表测试
 */
async function testGetUserFavorites() {
  console.log('\n========== 4. 获取用户收藏列表测试 ==========\n');

  // 4.1 正常获取
  const res1 = await sendRequest('GET', `${BASE_URL}/api/favorites/me`, {}, '正常测试：获取用户收藏列表');
  assert(res1.status === 200, '获取用户收藏列表成功');
  assert(Array.isArray(res1.data?.data?.favorites), '返回收藏数组');

  // 4.2 分页测试
  const res2 = await sendRequest('GET', `${BASE_URL}/api/favorites/me?page=1&limit=5`, {}, '正常测试：分页获取收藏列表（limit=5）');
  assert(res2.status === 200, '分页获取收藏列表成功');
  assert(res2.data?.data?.pagination, '返回分页信息');

  // 4.3 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res3 = await sendRequest('GET', `${BASE_URL}/api/favorites/me`, {}, '边界测试：无Token获取收藏列表');
  assert(res3.status === 401, '无Token获取收藏列表应该返回401');
  accessToken = tempToken;
}

/**
 * 5. 获取故事收藏列表测试
 */
async function testGetFavoritesByStoryId() {
  console.log('\n========== 5. 获取故事收藏列表测试 ==========\n');

  // 5.1 正常获取
  const res1 = await sendRequest('GET', `${BASE_URL}/api/favorites/story/${testStoryId}`, {}, '正常测试：获取故事收藏列表');
  assert(res1.status === 200, '获取故事收藏列表成功');
  assert(Array.isArray(res1.data?.data?.favorites), '返回收藏数组');

  // 5.2 分页测试
  const res2 = await sendRequest('GET', `${BASE_URL}/api/favorites/story/${testStoryId}?page=1&limit=5`, {}, '正常测试：分页获取故事收藏（limit=5）');
  assert(res2.status === 200, '分页获取故事收藏成功');

  // 5.3 边界测试：不存在的故事
  const res3 = await sendRequest('GET', `${BASE_URL}/api/favorites/story/999999`, {}, '边界测试：获取不存在故事的收藏列表');
  assert(res3.status === 200 || res3.status === 404, '不存在的故事返回正确状态');

  // 5.4 边界测试：无效的故事ID
  const res4 = await sendRequest('GET', `${BASE_URL}/api/favorites/story/invalid`, {}, '边界测试：无效故事ID格式（storyId=invalid）');
  assert(res4.status === 400 || res4.status === 500, '无效故事ID应该失败');
}

/**
 * 6. 检查是否已收藏测试
 */
async function testCheckIsFavorited() {
  console.log('\n========== 6. 检查是否已收藏测试 ==========\n');

  // 6.1 已收藏的故事
  const res1 = await sendRequest('GET', `${BASE_URL}/api/favorites/${testStoryId}/check`, {}, '正常测试：检查已收藏故事的收藏状态');
  assert(res1.status === 200, '检查收藏状态成功');
  assert(typeof res1.data?.data?.isFavorited === 'boolean', '返回收藏状态');

  // 6.2 未收藏的故事
  const res2 = await sendRequest('GET', `${BASE_URL}/api/favorites/${secondStoryId}/check`, {}, '正常测试：检查未收藏故事的收藏状态');
  assert(res2.status === 200, '检查未收藏故事成功');

  // 6.3 边界测试：不存在的故事
  const res3 = await sendRequest('GET', `${BASE_URL}/api/favorites/999999/check`, {}, '边界测试：检查不存在故事的收藏状态');
  assert(res3.status === 200 || res3.status === 404, '不存在的故事返回正确状态');

  // 6.4 边界测试：无效的故事ID
  const res4 = await sendRequest('GET', `${BASE_URL}/api/favorites/invalid/check`, {}, '边界测试：无效故事ID格式');
  assert(res4.status === 400 || res4.status === 500, '无效故事ID应该失败');

  // 6.5 无Token访问（可选认证，应该成功）
  const tempToken = accessToken;
  accessToken = null;
  const res5 = await sendRequest('GET', `${BASE_URL}/api/favorites/${testStoryId}/check`, {}, '边界测试：无Token检查收藏状态（可选认证，应成功）');
  assert(res5.status === 200, '无Token检查收藏状态应该成功');
  accessToken = tempToken;
}

/**
 * 7. 统计收藏数量测试
 */
async function testGetFavoriteCount() {
  console.log('\n========== 7. 统计收藏数量测试 ==========\n');

  // 7.1 正常统计
  const res1 = await sendRequest('GET', `${BASE_URL}/api/favorites/${testStoryId}/count`, {}, '正常测试：统计故事收藏数量');
  assert(res1.status === 200, '统计收藏数量成功');
  assert(typeof res1.data?.data?.favoriteCount === 'number', '返回收藏数量');

  // 7.2 边界测试：不存在的故事
  const res2 = await sendRequest('GET', `${BASE_URL}/api/favorites/999999/count`, {}, '边界测试：统计不存在故事的收藏数');
  assert(res2.status === 200 || res2.status === 404, '不存在的故事统计返回正确状态');

  // 7.3 边界测试：无效的故事ID
  const res3 = await sendRequest('GET', `${BASE_URL}/api/favorites/invalid/count`, {}, '边界测试：无效故事ID格式');
  assert(res3.status === 400 || res3.status === 500, '无效故事ID应该失败');
}

/**
 * 8. 批量检查收藏状态测试
 */
async function testCheckMultipleFavorited() {
  console.log('\n========== 8. 批量检查收藏状态测试 ==========\n');

  // 8.1 正常批量检查
  const res1 = await sendRequest('POST', `${BASE_URL}/api/favorites/check-multiple`, {
    storyIds: [testStoryId, secondStoryId, 999999]
  }, {}, '正常测试：批量检查多个故事的收藏状态');
  assert(res1.status === 200, '批量检查收藏状态成功');
  assert(Array.isArray(res1.data?.data), '返回状态数组');

  // 8.2 边界测试：空数组
  const res2 = await sendRequest('POST', `${BASE_URL}/api/favorites/check-multiple`, {
    storyIds: []
  }, {}, '边界测试：storyIds为空数组');
  assert(res2.status === 200 || res2.status === 400, '空数组处理正确');

  // 8.3 边界测试：缺少storyIds
  const res3 = await sendRequest('POST', `${BASE_URL}/api/favorites/check-multiple`, {}, {}, '边界测试：缺少storyIds字段');
  assert(res3.status === 400, '缺少storyIds应该返回400');

  // 8.4 边界测试：无效的storyIds格式
  const res4 = await sendRequest('POST', `${BASE_URL}/api/favorites/check-multiple`, {
    storyIds: 'invalid'
  }, {}, '边界测试：storyIds为非数组（字符串）');
  assert(res4.status === 400, '无效的storyIds格式应该返回400');

  // 8.5 无Token访问（可选认证，应该成功）
  const tempToken = accessToken;
  accessToken = null;
  const res5 = await sendRequest('POST', `${BASE_URL}/api/favorites/check-multiple`, {
    storyIds: [testStoryId]
  }, {}, '边界测试：无Token批量检查收藏（可选认证，应成功）');
  assert(res5.status === 200, '无Token批量检查应该成功');
  accessToken = tempToken;
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
  console.log(`[${now}] ║            EchoStar API 测试开始                    ║`);
  console.log(`[${now}] ║            模块: Favorite (收藏)                    ║`);
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
    // 测试准备
    console.log('========== 测试准备 ==========\n');
    const userSetup = await setupTestUser();
    if (!userSetup) {
      console.error('[ERROR] 无法创建测试用户，测试终止');
      return;
    }

    const storySetup = await setupTestStories();
    if (!storySetup) {
      console.error('[ERROR] 无法创建测试故事，测试终止');
      return;
    }

    // 执行测试
    await testToggleFavorite();
    await testCreateFavorite();
    await testDeleteFavorite();
    await testGetUserFavorites();
    await testGetFavoritesByStoryId();
    await testCheckIsFavorited();
    await testGetFavoriteCount();
    await testCheckMultipleFavorited();

    // 生成报告
    generateTestReport();

    // 保存记录
    await saveRequestRecords();
    await saveTestReport();

    console.log(`\n[${new Date().toISOString()}] 测试完成！`);

  } catch (error) {
    console.error('[ERROR] 测试执行出错:', error);
  }
}

// 执行测试
main();
