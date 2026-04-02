/**
 * Report 模块测试脚本
 * 测试所有举报相关接口
 * 
 * 使用方式：
 *   node report.test.js          # 正常运行（不重置环境）
 *   node report.test.js --reset  # 先重置环境再测试
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
const TEST_PREFIX = 'report_test_';
const SHOULD_RESET = process.argv.includes('--reset');
let accessToken = null;
let testUserId = null;
let testStoryId = null;
let testCommentId = null;
let testReportId = null;
let adminAccessToken = null;

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
  let content = `# EchoStar API 测试报告 - Report模块\n\n`;
  content += `**测试时间**: ${now}\n\n`;
  content += `**服务器地址**: ${BASE_URL}\n\n`;
  content += `---\n\n`;

  let sectionCounter = 0;
  requestRecords.forEach((record, idx) => {
    sectionCounter++;
    content += `## ${sectionCounter}. ${getTestName(record)}\n\n`;
    content += `**序号**: ${record.序号}\n\n`;
    content += `**请求类型**: ${record.请求类型}\n\n`;
    content += `**接口地址**: ${record.接口地址}\n\n`;
    content += `**测试说明**: ${record.测试说明 || '无'}\n\n`;
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

function getTestName(record) {
  const url = record.接口地址;
  const method = record.请求类型;

  if (url.includes('/statistics')) return '获取举报统计测试';
  if (url.endsWith('/reports/stories')) return '获取故事举报列表测试';
  if (url.endsWith('/reports/comments')) return '获取评论举报列表测试';
  if (url.includes('/handle')) {
    if (record.返回状态 === 403) return '处理举报-无管理员权限测试';
    if (record.请求体?.action === 'approve') return '批准举报测试';
    if (record.请求体?.action === 'reject') return '拒绝举报测试';
    return '处理举报测试';
  }
  if (url.includes('/me')) return '获取用户举报列表测试';
  if (method === 'POST' && url.endsWith('/reports')) {
    if (record.请求体?.targetType === 'story') {
      if (!record.请求体?.targetId) return '举报故事-缺少目标ID测试';
      if (record.请求体?.targetId === 999999) return '举报不存在的故事测试';
      if (!record.请求体?.reason) return '举报故事-缺少原因测试';
      return '举报故事测试';
    }
    if (record.请求体?.targetType === 'comment') return '举报评论测试';
    if (!record.请求体?.targetType) return '举报-缺少类型测试';
    return '创建举报测试';
  }
  if (method === 'GET' && url.includes('/api/reports?')) {
    if (record.返回状态 === 403) return '管理员获取举报列表-无权限测试';
    return '管理员获取举报列表测试';
  }
  if (method === 'GET' && url.endsWith('/reports')) {
    if (record.返回状态 === 403) return '管理员获取举报列表-无权限测试';
    return '获取举报列表测试';
  }
  return '接口测试';
}

/**
 * 生成测试报告（控制台输出）
 */
function generateTestReport() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║         EchoStar API 测试报告 - Report模块          ║`);
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
  const reportPath = path.join(reportDir, `report.request-${now}.md`);
  
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
  const reportPath = path.join(reportDir, `report.test.report-${now}.txt`);
  
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
async function sendRequest(method, url, data = null, customHeaders = {}, useToken = true, testDescription = '') {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  if (useToken && accessToken) {
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
  }, {}, false, '创建测试用户（无需验证码）');

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    accessToken = registerRes.data?.data?.accessToken;
    testUserId = registerRes.data?.data?.user?.id;
    console.log(`[INFO] 测试用户创建成功: ${username}, ID=${testUserId}`);
    return true;
  }
  
  console.error('[ERROR] register_2 注册失败');
  return false;
}

async function setupTestStory() {
  const storyRes = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: `测试故事用于举报测试 ${Date.now()}`,
    images: ['https://example.com/test-image.jpg'],
    emotionTag: '开心',
    location: {
      lat: 39.90923,
      lng: 116.397428
    }
  }, {}, true, '创建测试故事（用于后续举报测试）');

  if (storyRes.status === 200 || storyRes.status === 201) {
    testStoryId = storyRes.data?.data?.id;
    console.log(`[INFO] 测试故事创建成功: ID=${testStoryId}`);
    return true;
  }
  
  return false;
}

async function setupTestComment() {
  const commentRes = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    storyId: testStoryId,
    content: `测试评论用于举报测试 ${Date.now()}`
  }, {}, true, '创建测试评论（用于后续举报测试）');

  if (commentRes.status === 200 || commentRes.status === 201) {
    testCommentId = commentRes.data?.data?.id;
    console.log(`[INFO] 测试评论创建成功: ID=${testCommentId}`);
    return true;
  }
  
  return false;
}

// ==================== 测试用例 ====================

/**
 * 1. 创建举报测试
 */
async function testCreateReport() {
  console.log('\n========== 1. 创建举报测试 ==========\n');

  // 1.1 正常举报故事
  const res1 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'story',
    targetId: testStoryId,
    reason: '测试举报故事原因'
  }, {}, true, '正常测试：举报一个存在的故事');
  assert(res1.status === 201, '举报故事成功');
  testReportId = res1.data?.data?.id;

  // 1.2 重复举报同一故事（应该失败）
  const res2 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'story',
    targetId: testStoryId,
    reason: '重复举报测试'
  }, {}, true, '边界测试：重复举报同一故事');
  assert(res2.status === 400, '重复举报同一故事应该失败');

  // 1.3 举报评论
  const res3 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'comment',
    targetId: testCommentId,
    reason: '测试举报评论原因'
  }, {}, true, '正常测试：举报一个存在的评论');
  assert(res3.status === 201, '举报评论成功');

  // 1.4 边界测试：举报不存在的故事
  const res4 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'story',
    targetId: 999999,
    reason: '举报不存在的故事'
  }, {}, true, '边界测试：举报不存在的故事（targetId=999999）');
  assert(res4.status === 404 || res4.status === 400, '举报不存在的故事应该失败');

  // 1.5 边界测试：举报不存在的评论
  const res5 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'comment',
    targetId: 999999,
    reason: '举报不存在的评论'
  }, {}, true, '边界测试：举报不存在的评论（targetId=999999）');
  assert(res5.status === 404 || res5.status === 400, '举报不存在的评论应该失败');

  // 1.6 边界测试：缺少targetType
  const res6 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetId: testStoryId,
    reason: '缺少类型测试'
  }, {}, true, '边界测试：创建举报时缺少targetType参数');
  assert(res6.status === 400, '缺少targetType应该失败');

  // 1.7 边界测试：缺少targetId
  const res7 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'story',
    reason: '缺少目标ID测试'
  }, {}, true, '边界测试：创建举报时缺少targetId参数');
  assert(res7.status === 400, '缺少targetId应该失败');

  // 1.8 边界测试：缺少reason
  const res8 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'story',
    targetId: testStoryId
  }, {}, true, '边界测试：创建举报时缺少reason参数');
  assert(res8.status === 400, '缺少reason应该失败');

  // 1.9 边界测试：无效的targetType
  const res9 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'invalid',
    targetId: testStoryId,
    reason: '无效类型测试'
  }, {}, true, '边界测试：创建举报时使用无效的targetType值');
  assert(res9.status === 400, '无效的targetType应该失败');

  // 1.10 边界测试：reason超长
  const longReason = 'a'.repeat(501);
  const res10 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'story',
    targetId: testStoryId,
    reason: longReason
  }, {}, true, '边界测试：创建举报时reason超过500字符限制');
  assert(res10.status === 400, 'reason超长应该失败');

  // 1.11 边界测试：无Token访问
  const res11 = await sendRequest('POST', `${BASE_URL}/api/reports`, {
    targetType: 'story',
    targetId: testStoryId,
    reason: '无Token测试'
  }, {}, false, '边界测试：未登录时创建举报（应返回401）');
  assert(res11.status === 401, '无Token创建举报应该返回401');
}

/**
 * 2. 获取用户举报列表测试
 */
async function testGetUserReports() {
  console.log('\n========== 2. 获取用户举报列表测试 ==========\n');

  // 2.1 正常获取
  const res1 = await sendRequest('GET', `${BASE_URL}/api/reports/me`, null, {}, true, '正常测试：获取当前用户的举报列表');
  assert(res1.status === 200, '获取用户举报列表成功');
  assert(Array.isArray(res1.data?.data?.reports), '返回举报数组');

  // 2.2 分页测试
  const res2 = await sendRequest('GET', `${BASE_URL}/api/reports/me?page=1&limit=5`, null, {}, true, '正常测试：分页获取用户举报列表（page=1, limit=5）');
  assert(res2.status === 200, '分页获取举报列表成功');
  assert(res2.data?.data?.pagination, '返回分页信息');

  // 2.3 边界测试：无效分页参数
  const res3 = await sendRequest('GET', `${BASE_URL}/api/reports/me?page=-1&limit=5`, null, {}, true, '边界测试：使用无效分页参数（page=-1）');
  assert(res3.status === 200 || res3.status === 400, '无效分页参数处理正确');

  // 2.4 边界测试：无Token访问
  const res4 = await sendRequest('GET', `${BASE_URL}/api/reports/me`, null, {}, false, '边界测试：未登录时获取举报列表（应返回401）');
  assert(res4.status === 401, '无Token获取举报列表应该返回401');
}

/**
 * 3. 管理员获取举报列表测试（普通用户无权限）
 */
async function testGetReportsAsAdmin() {
  console.log('\n========== 3. 管理员获取举报列表测试 ==========\n');

  // 3.1 普通用户访问管理员接口（应该返回403）
  const res1 = await sendRequest('GET', `${BASE_URL}/api/reports?targetType=story&status=pending`, null, {}, true, '边界测试：普通用户访问管理员举报列表接口（应返回403）');
  assert(res1.status === 403, '普通用户访问管理员接口应该返回403');

  // 3.2 测试缺少targetType参数
  const res2 = await sendRequest('GET', `${BASE_URL}/api/reports?status=pending`, null, {}, true, '边界测试：获取举报列表时缺少targetType参数');
  assert(res2.status === 403 || res2.status === 400, '缺少targetType参数处理正确');

  // 3.3 测试无效的targetType
  const res3 = await sendRequest('GET', `${BASE_URL}/api/reports?targetType=invalid&status=pending`, null, {}, true, '边界测试：获取举报列表时使用无效的targetType值');
  assert(res3.status === 403 || res3.status === 400, '无效targetType参数处理正确');

  // 3.4 测试无效的status
  const res4 = await sendRequest('GET', `${BASE_URL}/api/reports?targetType=story&status=invalid`, null, {}, true, '边界测试：获取举报列表时使用无效的status值');
  assert(res4.status === 403 || res4.status === 400, '无效status参数处理正确');

  // 3.5 无Token访问
  const res5 = await sendRequest('GET', `${BASE_URL}/api/reports?targetType=story&status=pending`, null, {}, false, '边界测试：未登录时访问管理员举报列表接口（应返回401）');
  assert(res5.status === 401, '无Token访问管理员接口应该返回401');
}

/**
 * 4. 处理举报测试（普通用户无权限）
 */
async function testHandleReport() {
  console.log('\n========== 4. 处理举报测试 ==========\n');

  // 4.1 普通用户尝试批准举报（应该返回403）
  const res1 = await sendRequest('POST', `${BASE_URL}/api/reports/${testReportId}/handle`, {
    action: 'approve'
  }, {}, true, '边界测试：普通用户批准举报（应返回403）');
  assert(res1.status === 403, '普通用户批准举报应该返回403');

  // 4.2 普通用户尝试拒绝举报（应该返回403）
  const res2 = await sendRequest('POST', `${BASE_URL}/api/reports/${testReportId}/handle`, {
    action: 'reject'
  }, {}, true, '边界测试：普通用户拒绝举报（应返回403）');
  assert(res2.status === 403, '普通用户拒绝举报应该返回403');

  // 4.3 边界测试：无效的action
  const res3 = await sendRequest('POST', `${BASE_URL}/api/reports/${testReportId}/handle`, {
    action: 'invalid'
  }, {}, true, '边界测试：处理举报时使用无效的action值');
  assert(res3.status === 403 || res3.status === 400, '无效action处理正确');

  // 4.4 边界测试：缺少action
  const res4 = await sendRequest('POST', `${BASE_URL}/api/reports/${testReportId}/handle`, {}, {}, true, '边界测试：处理举报时缺少action参数');
  assert(res4.status === 403 || res4.status === 400, '缺少action处理正确');

  // 4.5 边界测试：不存在的举报ID
  const res5 = await sendRequest('POST', `${BASE_URL}/api/reports/999999/handle`, {
    action: 'approve'
  }, {}, true, '边界测试：处理不存在的举报（reportId=999999）');
  assert(res5.status === 403 || res5.status === 404, '处理不存在的举报返回正确状态');

  // 4.6 无Token访问
  const res6 = await sendRequest('POST', `${BASE_URL}/api/reports/${testReportId}/handle`, {
    action: 'approve'
  }, {}, false, '边界测试：未登录时处理举报（应返回401）');
  assert(res6.status === 401, '无Token处理举报应该返回401');
}

/**
 * 5. 获取举报统计测试（普通用户无权限）
 */
async function testGetStatistics() {
  console.log('\n========== 5. 获取举报统计测试 ==========\n');

  // 5.1 普通用户访问统计接口（应该返回403）
  const res1 = await sendRequest('GET', `${BASE_URL}/api/reports/statistics`, null, {}, true, '边界测试：普通用户访问举报统计接口（应返回403）');
  assert(res1.status === 403, '普通用户访问统计接口应该返回403');

  // 5.2 无Token访问
  const res2 = await sendRequest('GET', `${BASE_URL}/api/reports/statistics`, null, {}, false, '边界测试：未登录时访问举报统计接口（应返回401）');
  assert(res2.status === 401, '无Token访问统计接口应该返回401');
}

/**
 * 6. 综合边界测试
 */
async function testEdgeCases() {
  console.log('\n========== 6. 综合边界测试 ==========\n');

  // 6.1 创建新故事用于重复举报测试
  const storyRes = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: `边界测试故事 ${Date.now()}`,
    images: ['https://example.com/test-image.jpg'],
    emotionTag: '开心',
    location: { lat: 39.90923, lng: 116.397428 }
  }, {}, true, '创建测试故事（用于重复举报边界测试）');
  const newStoryId = storyRes.data?.data?.id;

  if (newStoryId) {
    // 6.2 举报新故事
    const reportRes = await sendRequest('POST', `${BASE_URL}/api/reports`, {
      targetType: 'story',
      targetId: newStoryId,
      reason: '边界测试举报'
    }, {}, true, '正常测试：举报新创建的故事');
    assert(reportRes.status === 201, '边界测试-举报新故事成功');

    // 6.3 再次举报同一故事
    const dupRes = await sendRequest('POST', `${BASE_URL}/api/reports`, {
      targetType: 'story',
      targetId: newStoryId,
      reason: '边界测试-重复举报'
    }, {}, true, '边界测试：重复举报同一故事（应返回400）');
    assert(dupRes.status === 400, '边界测试-重复举报应该失败');
  }

  // 6.4 测试举报列表空结果
  const emptyRes = await sendRequest('GET', `${BASE_URL}/api/reports/me?page=1000&limit=10`, null, {}, true, '边界测试：获取不存在的分页（page=1000）');
  assert(emptyRes.status === 200, '边界测试-空结果页返回成功');
}

/**
 * 7. 获取故事举报列表测试（管理员接口，普通用户无权限）
 * GET /api/reports/stories
 */
async function testGetStoryReports() {
  console.log('\n========== 7. 获取故事举报列表测试 ==========\n');

  // 7.1 普通用户访问故事举报列表（应该返回403）
  const res1 = await sendRequest('GET', `${BASE_URL}/api/reports/stories`, null, {}, true, '边界测试：普通用户访问故事举报列表接口（应返回403）');
  assert(res1.status === 403, '普通用户访问故事举报列表应该返回403');

  // 7.2 无Token访问
  const res2 = await sendRequest('GET', `${BASE_URL}/api/reports/stories`, null, {}, false, '边界测试：未登录时访问故事举报列表接口（应返回401）');
  assert(res2.status === 401, '无Token访问故事举报列表应该返回401');
}

/**
 * 8. 获取评论举报列表测试（管理员接口，普通用户无权限）
 * GET /api/reports/comments
 */
async function testGetCommentReports() {
  console.log('\n========== 8. 获取评论举报列表测试 ==========\n');

  // 8.1 普通用户访问评论举报列表（应该返回403）
  const res1 = await sendRequest('GET', `${BASE_URL}/api/reports/comments`, null, {}, true, '边界测试：普通用户访问评论举报列表接口（应返回403）');
  assert(res1.status === 403, '普通用户访问评论举报列表应该返回403');

  // 8.2 无Token访问
  const res2 = await sendRequest('GET', `${BASE_URL}/api/reports/comments`, null, {}, false, '边界测试：未登录时访问评论举报列表接口（应返回401）');
  assert(res2.status === 401, '无Token访问评论举报列表应该返回401');
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
  console.log(`[${now}] ║               模块: Report (举报)                   ║`);
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

    const commentSetup = await setupTestComment();
    if (!commentSetup) {
      console.error('[WARN] 无法创建测试评论，跳过评论相关测试');
    }

    // 执行测试
    await testCreateReport();
    await testGetUserReports();
    await testGetReportsAsAdmin();
    await testHandleReport();
    await testGetStatistics();
    await testEdgeCases();
    await testGetStoryReports();
    await testGetCommentReports();

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
