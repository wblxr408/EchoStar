/**
 * Comment 模块测试脚本
 * 测试所有评论相关接口
 * 
 * 使用方式：
 *   node comment.test.js          # 正常运行（不重置环境）
 *   node comment.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PREFIX = 'comment_test_';
const SHOULD_RESET = process.argv.includes('--reset');
let accessToken = null;
let testUserId = null;
let testStoryId = null;
let testCommentId = null;

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
  let content = `# EchoStar API 测试报告 - Comment模块\n\n`;
  content += `**测试时间**: ${now}\n\n`;
  content += `**服务器地址**: ${BASE_URL}\n\n`;
  content += `---\n\n`;

  // 按功能分组
  const groups = {};
  requestRecords.forEach(record => {
    const pathParts = record.接口地址.split('/');
    let groupKey = '其他';
    
    if (record.接口地址.includes('/search')) groupKey = '搜索评论';
    else if (record.接口地址.includes('/me')) groupKey = '我的评论';
    else if (record.接口地址.includes('/story/')) groupKey = '故事评论列表';
    else if (record.接口地址.includes('/count')) groupKey = '评论统计';
    else if (record.请求类型 === 'POST') groupKey = '创建评论';
    else if (record.请求类型 === 'DELETE') groupKey = '删除评论';
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(record);
  });

  let sectionCounter = 0;
  for (const [group, records] of Object.entries(groups)) {
    sectionCounter++;
    content += `## ${sectionCounter}. ${group}\n\n`;
    
    records.forEach((record, idx) => {
      content += `### ${sectionCounter}.${idx + 1} ${record.接口地址.split('/').pop()} - ${getTestName(record)}\n\n`;
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
  if (url.includes('/search')) return '搜索评论测试';
  if (url.includes('/me')) return '获取用户评论测试';
  if (url.includes('/story/')) return '获取故事评论测试';
  if (url.includes('/count')) return '统计评论数量测试';
  if (record.请求类型 === 'POST') {
    if (record.请求体?.content?.length < 1) return '评论内容为空测试';
    if (record.请求体?.storyId === null) return '缺少故事ID测试';
    return '创建评论测试';
  }
  if (record.请求类型 === 'DELETE') {
    if (url.includes('999999')) return '删除不存在评论测试';
    return '删除评论测试';
  }
  return '接口测试';
}

/**
 * 生成测试报告（控制台输出）
 */
function generateTestReport() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║     EchoStar API 测试报告 - Comment模块     ║`);
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
  
  // 获取脚本所在目录的绝对路径
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // 从 test-method 目录向上找到 tests 目录，再定位到 test-results
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'request-records');
  const reportPath = path.join(reportDir, `comment.request-${now}.md`);
  
  // 确保目录存在
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
  
  // 获取脚本所在目录的绝对路径
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'test-reports');
  const reportPath = path.join(reportDir, `comment.test.report-${now}.txt`);
  
  // 确保目录存在
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
      validateStatus: () => true // 接受所有状态码
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

/**
 * 注册测试用户并登录
 */
async function setupTestUser() {
  const timestamp = Date.now();
  const username = `${TEST_PREFIX}user_${timestamp}`;
  const email = `${TEST_PREFIX}${timestamp}@test.com`;
  const password = 'Test123456';

  // 注册
  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username,
    email,
    password
  }, {}, '创建测试用户（为评论模块测试创建数据基础）');

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    accessToken = registerRes.data?.data?.accessToken;
    testUserId = registerRes.data?.data?.user?.id;
    console.log(`[INFO] 测试用户创建成功: ${username}, ID=${testUserId}`);
    return true;
  }
  
  console.log(`[ERROR] 注册失败: ${JSON.stringify(registerRes.data)}`);
  return false;
}

/**
 * 创建测试故事
 */
async function setupTestStory() {
  const storyRes = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: `测试故事用于评论测试 ${Date.now()}`,
    images: ['https://example.com/test-image.jpg'],
    emotionTag: '开心',
    location: {
      lat: 39.90923,
      lng: 116.397428
    }
  }, {}, '创建测试故事（为评论模块测试创建数据基础）');

  if (storyRes.status === 200 || storyRes.status === 201) {
    testStoryId = storyRes.data?.data?.id;
    console.log(`[INFO] 测试故事创建成功: ID=${testStoryId}`);
    return true;
  }
  console.log(`[WARN] 测试故事创建失败 (状态: ${storyRes.status})，尝试使用现有故事`);
  
  // 尝试获取现有故事
  const storiesRes = await sendRequest('GET', `${BASE_URL}/api/stories/me/list`, {}, '获取现有故事列表（备用数据）');
  if (storiesRes.status === 200 && storiesRes.data?.data?.stories?.length > 0) {
    testStoryId = storiesRes.data.data.stories[0].id;
    console.log(`[INFO] 使用现有故事: ID=${testStoryId}`);
    return true;
  }
  
  return false;
}

// ==================== 测试用例 ====================

/**
 * 1. 创建评论测试
 */
async function testCreateComment() {
  console.log('\n========== 1. 创建评论测试 ==========\n');

  // 1.1 正常创建评论
  const res1 = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    storyId: testStoryId,
    content: '这是一条测试评论'
  }, {}, '正常测试：创建评论');
  assert(res1.status === 200 || res1.status === 201, '创建评论成功');
  testCommentId = res1.data?.data?.id;

  // 1.2 创建多条评论用于分页测试
  for (let i = 0; i < 5; i++) {
    await sendRequest('POST', `${BASE_URL}/api/comments`, {
      storyId: testStoryId,
      content: `测试评论 #${i + 1}`
    }, {}, '创建多条评论（为评论列表分页测试创建数据基础）');
  }
  console.log('[INFO] 创建了5条额外评论用于分页测试');

  // 1.3 边界测试：内容为空
  const res2 = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    storyId: testStoryId,
    content: ''
  }, {}, '边界测试：评论内容为空（content为空字符串）');
  assert(res2.status === 400 || res2.status === 500, '内容为空应该失败');

  // 1.4 边界测试：缺少故事ID
  const res3 = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    content: '没有故事ID的评论'
  }, {}, '边界测试：缺少故事ID（请求体缺少storyId字段）');
  assert(res3.status === 400 || res3.status === 500, '缺少故事ID应该失败');

  // 1.5 边界测试：不存在的故事ID
  const res4 = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    storyId: 999999,
    content: '评论不存在的故事'
  }, {}, '边界测试：评论不存在的故事（storyId=999999）');
  assert(res4.status === 400 || res4.status === 404 || res4.status === 500, '评论不存在的故事应该失败');

  // 1.6 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res5 = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    storyId: testStoryId,
    content: '无Token评论'
  }, {}, '边界测试：无Token创建评论');
  assert(res5.status === 401, '无Token创建评论应该返回401');
  accessToken = tempToken;
}

/**
 * 2. 获取故事评论列表测试
 */
async function testGetCommentsByStoryId() {
  console.log('\n========== 2. 获取故事评论列表测试 ==========\n');

  // 2.1 正常获取评论列表
  const res1 = await sendRequest('GET', `${BASE_URL}/api/comments/story/${testStoryId}`, {}, '正常测试：获取故事评论列表');
  assert(res1.status === 200, '获取评论列表成功');
  assert(Array.isArray(res1.data?.data?.comments), '返回评论数组');
  assert(res1.data?.data?.pagination, '返回分页信息');

  // 2.2 分页测试
  const res2 = await sendRequest('GET', `${BASE_URL}/api/comments/story/${testStoryId}?page=1&limit=3`, {}, '正常测试：分页获取评论列表（limit=3）');
  assert(res2.status === 200, '分页获取评论成功');
  assert(res2.data?.data?.comments?.length <= 3, '分页限制生效');

  // 2.3 边界测试：不存在的故事
  const res3 = await sendRequest('GET', `${BASE_URL}/api/comments/story/999999`, {}, '边界测试：获取不存在故事的评论（storyId=999999）');
  // 可能返回空列表或错误，取决于实现
  assert(res3.status === 200 || res3.status === 404, '不存在的故事返回正确状态');

  // 2.4 边界测试：无效的故事ID格式
  const res4 = await sendRequest('GET', `${BASE_URL}/api/comments/story/invalid`, {}, '边界测试：无效的故事ID格式（storyId=invalid）');
  assert(res4.status === 400 || res4.status === 500, '无效故事ID格式应该失败');
}

/**
 * 3. 获取当前用户评论列表测试
 */
async function testGetUserComments() {
  console.log('\n========== 3. 获取当前用户评论列表测试 ==========\n');

  // 3.1 正常获取
  const res1 = await sendRequest('GET', `${BASE_URL}/api/comments/me`, {}, '正常测试：获取当前用户评论列表');
  assert(res1.status === 200, '获取用户评论列表成功');
  assert(Array.isArray(res1.data?.data?.comments), '返回评论数组');

  // 3.2 分页测试
  const res2 = await sendRequest('GET', `${BASE_URL}/api/comments/me?page=1&limit=5`, {}, '正常测试：分页获取用户评论（limit=5）');
  assert(res2.status === 200, '分页获取用户评论成功');
  assert(res2.data?.data?.comments?.length <= 5, '分页限制生效');

  // 3.3 边界测试：无Token访问
  const tempToken = accessToken;
  accessToken = null;
  const res3 = await sendRequest('GET', `${BASE_URL}/api/comments/me`, {}, '边界测试：无Token获取用户评论');
  assert(res3.status === 401, '无Token获取用户评论应该返回401');
  accessToken = tempToken;
}

/**
 * 4. 统计评论数量测试
 */
async function testGetCommentCount() {
  console.log('\n========== 4. 统计评论数量测试 ==========\n');

  // 4.1 正常统计
  const res1 = await sendRequest('GET', `${BASE_URL}/api/comments/${testStoryId}/count`, {}, '正常测试：统计评论数量');
  assert(res1.status === 200, '统计评论数量成功');
  assert(typeof res1.data?.data?.commentCount === 'number', '返回评论数量');

  // 4.2 边界测试：不存在的故事
  const res2 = await sendRequest('GET', `${BASE_URL}/api/comments/999999/count`, {}, '边界测试：统计不存在故事的评论数（storyId=999999）');
  assert(res2.status === 200 || res2.status === 404, '不存在的故事统计返回正确状态');

  // 4.3 边界测试：无效的故事ID
  const res3 = await sendRequest('GET', `${BASE_URL}/api/comments/invalid/count`, {}, '边界测试：无效故事ID格式（storyId=invalid）');
  assert(res3.status === 400 || res3.status === 500, '无效故事ID格式应该失败');
}

/**
 * 5. 搜索评论测试
 */
async function testSearchComments() {
  console.log('\n========== 5. 搜索评论测试 ==========\n');

  // 5.1 正常搜索
  const res1 = await sendRequest('GET', `${BASE_URL}/api/comments/search?keyword=测试`, {}, '正常测试：搜索评论（keyword=测试）');
  assert(res1.status === 200, '搜索评论成功');
  assert(Array.isArray(res1.data?.data?.comments), '返回评论数组');

  // 5.2 分页搜索
  const res2 = await sendRequest('GET', `${BASE_URL}/api/comments/search?keyword=测试&page=1&limit=3`, {}, '正常测试：分页搜索评论（limit=3）');
  assert(res2.status === 200, '分页搜索成功');

  // 5.3 边界测试：缺少关键词
  const res3 = await sendRequest('GET', `${BASE_URL}/api/comments/search`, {}, '边界测试：缺少搜索关键词参数');
  assert(res3.status === 400, '缺少搜索关键词应该返回400');

  // 5.4 边界测试：空关键词
  const res4 = await sendRequest('GET', `${BASE_URL}/api/comments/search?keyword=`, {}, '边界测试：空关键词搜索（keyword为空字符串）');
  assert(res4.status === 400 || res4.status === 200, '空关键词处理正确');
}

/**
 * 6. 删除评论测试
 */
async function testDeleteComment() {
  console.log('\n========== 6. 删除评论测试 ==========\n');

  // 先创建一条新评论用于删除测试
  const createRes = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    storyId: testStoryId,
    content: '准备删除的评论'
  }, {}, '创建评论（为删除测试创建数据基础）');
  const commentToDelete = createRes.data?.data?.id;

  // 6.1 正常删除
  if (commentToDelete) {
    const res1 = await sendRequest('DELETE', `${BASE_URL}/api/comments/${commentToDelete}`, {}, '正常测试：删除评论');
    assert(res1.status === 200, '删除评论成功');
  }

  // 6.2 边界测试：删除不存在的评论
  const res2 = await sendRequest('DELETE', `${BASE_URL}/api/comments/999999`, {}, '边界测试：删除不存在的评论（commentId=999999）');
  assert(res2.status === 404 || res2.status === 400 || res2.status === 500, '删除不存在的评论应该失败');

  // 6.3 边界测试：删除无效ID
  const res3 = await sendRequest('DELETE', `${BASE_URL}/api/comments/invalid`, {}, '边界测试：删除无效ID评论（commentId=invalid）');
  assert(res3.status === 400 || res3.status === 500, '删除无效ID评论应该失败');

  // 6.4 边界测试：无Token删除
  const tempToken = accessToken;
  accessToken = null;
  const res4 = await sendRequest('DELETE', `${BASE_URL}/api/comments/${testCommentId || 1}`, {}, '边界测试：无Token删除评论');
  assert(res4.status === 401, '无Token删除评论应该返回401');
  accessToken = tempToken;

  // 6.5 重复删除
  if (commentToDelete) {
    const res5 = await sendRequest('DELETE', `${BASE_URL}/api/comments/${commentToDelete}`, {}, '边界测试：重复删除已删除的评论');
    assert(res5.status === 404 || res5.status === 400 || res5.status === 500, '重复删除应该失败');
  }
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
  console.log(`[${now}] ║       EchoStar API 测试开始                         ║`);
  console.log(`[${now}] ║       模块: Comment (评论)                          ║`);
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

    const storySetup = await setupTestStory();
    if (!storySetup) {
      console.error('[ERROR] 无法创建测试故事，测试终止');
      return;
    }

    // 执行测试
    await testCreateComment();
    await testGetCommentsByStoryId();
    await testGetUserComments();
    await testGetCommentCount();
    await testSearchComments();
    await testDeleteComment();

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
