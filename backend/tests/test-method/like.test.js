/**
 * Like 模块测试脚本
 * 测试所有点赞相关接口
 * 
 * 使用方式：
 *   node like.test.js          # 正常运行（不重置环境）
 *   node like.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PREFIX = 'like_test_';
const SHOULD_RESET = process.argv.includes('--reset');
let accessToken = null;
let testUserId = null;
let testStoryId = null;
let secondStoryId = null;
let testLikeId = null;

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
 * 生成测试报告文件内容
 */
function generateReportContent() {
  const now = new Date().toISOString();
  let content = `# EchoStar API 测试报告 - Like模块\n\n`;
  content += `**测试时间**: ${now}\n\n`;
  content += `**服务器地址**: ${BASE_URL}\n\n`;
  content += `---\n\n`;

  const groups = {};
  requestRecords.forEach(record => {
    let groupKey = '其他';
    
    if (record.接口地址.includes('/check-multiple')) groupKey = '批量检查点赞状态';
    else if (record.接口地址.includes('/check')) groupKey = '检查点赞状态';
    else if (record.接口地址.includes('/count')) groupKey = '点赞统计';
    else if (record.接口地址.includes('/me')) groupKey = '我的点赞';
    else if (record.接口地址.includes('/story/')) groupKey = '故事点赞列表';
    else if (record.请求类型 === 'POST' && record.接口地址.includes('/create')) groupKey = '创建点赞';
    else if (record.请求类型 === 'POST') groupKey = '点赞/取消点赞切换';
    else if (record.请求类型 === 'DELETE') groupKey = '取消点赞';
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(record);
  });

  let sectionCounter = 0;
  for (const [group, records] of Object.entries(groups)) {
    sectionCounter++;
    content += `## ${sectionCounter}. ${group}\n\n`;
    
    records.forEach((record, idx) => {
      content += `### ${sectionCounter}.${idx + 1} ${getTestName(record)}\n\n`;
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
    return '批量检查点赞状态测试';
  }
  if (url.includes('/check')) return '检查是否已点赞测试';
  if (url.includes('/count')) return '统计点赞数量测试';
  if (url.includes('/me')) return '获取用户点赞列表测试';
  if (url.includes('/story/')) return '获取故事点赞列表测试';
  if (record.请求类型 === 'POST' && url.includes('/create')) {
    if (record.请求体?.storyId === 999999) return '点赞不存在的故事测试';
    if (!record.请求体?.storyId) return '缺少故事ID测试';
    return '明确创建点赞测试';
  }
  if (record.请求类型 === 'POST') return '点赞切换测试';
  if (record.请求类型 === 'DELETE') {
    if (url.includes('999999')) return '取消不存在的点赞测试';
    return '取消点赞测试';
  }
  return '接口测试';
}

/**
 * 生成测试报告（控制台输出）
 */
function generateTestReport() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║          EchoStar API 测试报告 - Like模块           ║`);
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
  const reportPath = path.join(reportDir, `like_request_${now}.md`);
  
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
  const reportPath = path.join(reportDir, `like_test_report_${now}.txt`);
  
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
async function sendRequest(method, url, data = null, customHeaders = {}) {
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

async function setupTestUser() {
  const timestamp = Date.now();
  const username = `${TEST_PREFIX}user_${timestamp}`;
  const email = `${TEST_PREFIX}${timestamp}@test.com`;
  const password = 'Test123456';

  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register`, {
    username,
    email,
    password
  });

  if (registerRes.status === 200 || registerRes.status === 201) {
    accessToken = registerRes.data?.data?.accessToken;
    testUserId = registerRes.data?.data?.user?.id;
    console.log(`[INFO] 测试用户创建成功: ${username}, ID=${testUserId}`);
    return true;
  }
  
  const loginRes = await sendRequest('POST', `${BASE_URL}/api/auth/login`, {
    email,
    password
  });
  
  if (loginRes.status === 200) {
    accessToken = loginRes.data?.data?.accessToken;
    testUserId = loginRes.data?.data?.user?.id;
    console.log(`[INFO] 测试用户登录成功: ${username}, ID=${testUserId}`);
    return true;
  }
  
  return false;
}

async function setupTestStories() {
  // 创建第一个测试故事
  const story1Res = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: `测试故事1用于点赞测试 ${Date.now()}`,
    images: ['https://example.com/test-image1.jpg'],
    emotionTag: '开心',
    location: {
      lat: 39.90923,
      lng: 116.397428
    }
  });

  if (story1Res.status === 200 || story1Res.status === 201) {
    testStoryId = story1Res.data?.data?.id;
    console.log(`[INFO] 测试故事1创建成功: ID=${testStoryId}`);
  }

  // 创建第二个测试故事
  const story2Res = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: `测试故事2用于点赞测试 ${Date.now()}`,
    images: ['https://example.com/test-image2.jpg'],
    emotionTag: '治愈',
    location: {
      lat: 39.91923,
      lng: 116.407428
    }
  });

  if (story2Res.status === 200 || story2Res.status === 201) {
    secondStoryId = story2Res.data?.data?.id;
    console.log(`[INFO] 测试故事2创建成功: ID=${secondStoryId}`);
  }

  return testStoryId && secondStoryId;
}

// ==================== 测试用例 ====================

/**
 * 1. 点赞/取消点赞切换测试
 */
async function testToggleLike() {
  console.log('\n========== 1. 点赞/取消点赞切换测试 ==========\n');

  // 1.1 第一次点赞（创建点赞）
  const res1 = await sendRequest('POST', `${BASE_URL}/api/likes`, {
    storyId: testStoryId
  });
  assert(res1.status === 200 || res1.status === 201, '第一次点赞成功');
  assert(res1.data?.data?.isLiked === true, '返回已点赞状态');

  // 1.2 第二次点赞（取消点赞）
  const res2 = await sendRequest('POST', `${BASE_URL}/api/likes`, {
    storyId: testStoryId
  });
  assert(res2.status === 200, '第二次点赞触发取消');
  assert(res2.data?.data?.isLiked === false, '返回未点赞状态');

  // 1.3 第三次点赞（重新点赞）
  const res3 = await sendRequest('POST', `${BASE_URL}/api/likes`, {
    storyId: testStoryId
  });
  assert(res3.status === 200 || res3.status === 201, '第三次重新点赞成功');
  testLikeId = res3.data?.data?.id;

  // 1.4 边界测试：点赞不存在的故事
  const res4 = await sendRequest('POST', `${BASE_URL}/api/likes`, {
    storyId: 999999
  });
  assert(res4.status === 404 || res4.status === 400 || res4.status === 500, '点赞不存在的故事应该失败');

  // 1.5 边界测试：缺少故事ID
  const res5 = await sendRequest('POST', `${BASE_URL}/api/likes`, {});
  assert(res5.status === 400 || res5.status === 500, '缺少故事ID应该失败');

  // 1.6 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res6 = await sendRequest('POST', `${BASE_URL}/api/likes`, {
    storyId: testStoryId
  });
  assert(res6.status === 401, '无Token点赞应该返回401');
  accessToken = tempToken;
}

/**
 * 2. 明确创建点赞测试
 */
async function testCreateLike() {
  console.log('\n========== 2. 明确创建点赞测试 ==========\n');

  // 2.1 正常创建点赞（使用第二个故事）
  const res1 = await sendRequest('POST', `${BASE_URL}/api/likes/create`, {
    storyId: secondStoryId
  });
  assert(res1.status === 200 || res1.status === 201, '创建点赞成功');

  // 2.2 重复创建点赞（应该失败）
  const res2 = await sendRequest('POST', `${BASE_URL}/api/likes/create`, {
    storyId: secondStoryId
  });
  assert(res2.status === 400 || res2.status === 500, '重复创建点赞应该失败');

  // 2.3 边界测试：点赞不存在的故事
  const res3 = await sendRequest('POST', `${BASE_URL}/api/likes/create`, {
    storyId: 999999
  });
  assert(res3.status === 404 || res3.status === 400 || res3.status === 500, '点赞不存在的故事应该失败');

  // 2.4 边界测试：缺少故事ID
  const res4 = await sendRequest('POST', `${BASE_URL}/api/likes/create`, {});
  assert(res4.status === 400 || res4.status === 500, '缺少故事ID应该失败');

  // 2.5 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res5 = await sendRequest('POST', `${BASE_URL}/api/likes/create`, {
    storyId: testStoryId
  });
  assert(res5.status === 401, '无Token创建点赞应该返回401');
  accessToken = tempToken;
}

/**
 * 3. 取消点赞测试
 */
async function testDeleteLike() {
  console.log('\n========== 3. 取消点赞测试 ==========\n');

  // 3.1 正常取消点赞
  const res1 = await sendRequest('DELETE', `${BASE_URL}/api/likes/${secondStoryId}`);
  assert(res1.status === 200, '取消点赞成功');

  // 3.2 重复取消点赞
  const res2 = await sendRequest('DELETE', `${BASE_URL}/api/likes/${secondStoryId}`);
  assert(res2.status === 400 || res2.status === 404 || res2.status === 500, '重复取消点赞应该失败');

  // 3.3 边界测试：取消不存在的故事点赞
  const res3 = await sendRequest('DELETE', `${BASE_URL}/api/likes/999999`);
  assert(res3.status === 400 || res3.status === 404 || res3.status === 500, '取消不存在的点赞应该失败');

  // 3.4 边界测试：无效的故事ID
  const res4 = await sendRequest('DELETE', `${BASE_URL}/api/likes/invalid`);
  assert(res4.status === 400 || res4.status === 500, '无效故事ID应该失败');

  // 3.5 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res5 = await sendRequest('DELETE', `${BASE_URL}/api/likes/${testStoryId}`);
  assert(res5.status === 401, '无Token取消点赞应该返回401');
  accessToken = tempToken;
}

/**
 * 4. 获取用户点赞列表测试
 */
async function testGetUserLikes() {
  console.log('\n========== 4. 获取用户点赞列表测试 ==========\n');

  // 4.1 正常获取
  const res1 = await sendRequest('GET', `${BASE_URL}/api/likes/me`);
  assert(res1.status === 200, '获取用户点赞列表成功');
  assert(Array.isArray(res1.data?.data?.likes), '返回点赞数组');

  // 4.2 分页测试
  const res2 = await sendRequest('GET', `${BASE_URL}/api/likes/me?page=1&limit=5`);
  assert(res2.status === 200, '分页获取点赞列表成功');
  assert(res2.data?.data?.pagination, '返回分页信息');

  // 4.3 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res3 = await sendRequest('GET', `${BASE_URL}/api/likes/me`);
  assert(res3.status === 401, '无Token获取点赞列表应该返回401');
  accessToken = tempToken;
}

/**
 * 5. 获取故事点赞列表测试
 */
async function testGetLikesByStoryId() {
  console.log('\n========== 5. 获取故事点赞列表测试 ==========\n');

  // 5.1 正常获取
  const res1 = await sendRequest('GET', `${BASE_URL}/api/likes/story/${testStoryId}`);
  assert(res1.status === 200, '获取故事点赞列表成功');
  assert(Array.isArray(res1.data?.data?.likes), '返回点赞数组');

  // 5.2 分页测试
  const res2 = await sendRequest('GET', `${BASE_URL}/api/likes/story/${testStoryId}?page=1&limit=5`);
  assert(res2.status === 200, '分页获取故事点赞成功');

  // 5.3 边界测试：不存在的故事
  const res3 = await sendRequest('GET', `${BASE_URL}/api/likes/story/999999`);
  assert(res3.status === 200 || res3.status === 404, '不存在的故事返回正确状态');

  // 5.4 边界测试：无效的故事ID
  const res4 = await sendRequest('GET', `${BASE_URL}/api/likes/story/invalid`);
  assert(res4.status === 400 || res4.status === 500, '无效故事ID应该失败');
}

/**
 * 6. 检查是否已点赞测试
 */
async function testCheckIsLiked() {
  console.log('\n========== 6. 检查是否已点赞测试 ==========\n');

  // 6.1 已点赞的故事
  const res1 = await sendRequest('GET', `${BASE_URL}/api/likes/${testStoryId}/check`);
  assert(res1.status === 200, '检查点赞状态成功');
  assert(typeof res1.data?.data?.isLiked === 'boolean', '返回点赞状态');

  // 6.2 未点赞的故事
  const res2 = await sendRequest('GET', `${BASE_URL}/api/likes/${secondStoryId}/check`);
  assert(res2.status === 200, '检查未点赞故事成功');

  // 6.3 边界测试：不存在的故事
  const res3 = await sendRequest('GET', `${BASE_URL}/api/likes/999999/check`);
  assert(res3.status === 200 || res3.status === 404, '不存在的故事返回正确状态');

  // 6.4 边界测试：无效的故事ID
  const res4 = await sendRequest('GET', `${BASE_URL}/api/likes/invalid/check`);
  assert(res4.status === 400 || res4.status === 500, '无效故事ID应该失败');

  // 6.5 无Token访问（可选认证，应该成功）
  const tempToken = accessToken;
  accessToken = null;
  const res5 = await sendRequest('GET', `${BASE_URL}/api/likes/${testStoryId}/check`);
  assert(res5.status === 200, '无Token检查点赞状态应该成功');
  accessToken = tempToken;
}

/**
 * 7. 统计点赞数量测试
 */
async function testGetLikeCount() {
  console.log('\n========== 7. 统计点赞数量测试 ==========\n');

  // 7.1 正常统计
  const res1 = await sendRequest('GET', `${BASE_URL}/api/likes/${testStoryId}/count`);
  assert(res1.status === 200, '统计点赞数量成功');
  assert(typeof res1.data?.data?.likeCount === 'number', '返回点赞数量');

  // 7.2 边界测试：不存在的故事
  const res2 = await sendRequest('GET', `${BASE_URL}/api/likes/999999/count`);
  assert(res2.status === 200 || res2.status === 404, '不存在的故事统计返回正确状态');

  // 7.3 边界测试：无效的故事ID
  const res3 = await sendRequest('GET', `${BASE_URL}/api/likes/invalid/count`);
  assert(res3.status === 400 || res3.status === 500, '无效故事ID应该失败');
}

/**
 * 8. 批量检查点赞状态测试
 */
async function testCheckMultipleLiked() {
  console.log('\n========== 8. 批量检查点赞状态测试 ==========\n');

  // 8.1 正常批量检查
  const res1 = await sendRequest('POST', `${BASE_URL}/api/likes/check-multiple`, {
    storyIds: [testStoryId, secondStoryId, 999999]
  });
  assert(res1.status === 200, '批量检查点赞状态成功');
  assert(Array.isArray(res1.data?.data), '返回状态数组');

  // 8.2 边界测试：空数组
  const res2 = await sendRequest('POST', `${BASE_URL}/api/likes/check-multiple`, {
    storyIds: []
  });
  assert(res2.status === 200 || res2.status === 400, '空数组处理正确');

  // 8.3 边界测试：缺少storyIds
  const res3 = await sendRequest('POST', `${BASE_URL}/api/likes/check-multiple`, {});
  assert(res3.status === 400, '缺少storyIds应该返回400');

  // 8.4 边界测试：无效的storyIds格式
  const res4 = await sendRequest('POST', `${BASE_URL}/api/likes/check-multiple`, {
    storyIds: 'invalid'
  });
  assert(res4.status === 400, '无效的storyIds格式应该返回400');

  // 8.5 无Token访问（可选认证，应该成功）
  const tempToken = accessToken;
  accessToken = null;
  const res5 = await sendRequest('POST', `${BASE_URL}/api/likes/check-multiple`, {
    storyIds: [testStoryId]
  });
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
  console.log(`[${now}] ║              EchoStar API 测试开始                  ║`);
  console.log(`[${now}] ║                模块: Like (点赞)                    ║`);
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
    await testToggleLike();
    await testCreateLike();
    await testDeleteLike();
    await testGetUserLikes();
    await testGetLikesByStoryId();
    await testCheckIsLiked();
    await testGetLikeCount();
    await testCheckMultipleLiked();

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
