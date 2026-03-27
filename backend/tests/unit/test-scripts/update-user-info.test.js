/**
 * 修改用户信息接口测试脚本
 * 测试 PUT /api/auth/users/me 接口
 */

import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PREFIX = 'update_user_test_';

// 测试用户
let accessToken = null;
let testUserId = null;
let testUsername = null;
let testEmail = null;

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
  let content = `# EchoStar API 测试报告 - 修改用户信息接口\n\n`;
  content += `**测试时间**: ${now}\n\n`;
  content += `**服务器地址**: ${BASE_URL}\n\n`;
  content += `**请求总数**: ${requestRecords.length}\n\n`;
  content += `---\n\n`;

  requestRecords.forEach((record, idx) => {
    content += `## ${idx + 1}. ${record.请求类型} ${record.接口地址}\n\n`;
    content += `**测试说明**: ${record.测试说明 || '无'}\n\n`;
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
 * 保存请求记录到文件
 */
async function saveRequestRecords() {
  const fs = await import('fs');
  const path = await import('path');
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'request-records');
  const reportPath = path.join(reportDir, `update_user_info.request-${now}.md`);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, generateReportContent());
  console.log(`[INFO] 请求记录已保存: ${reportPath}`);
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
    
    if (data !== null && data !== undefined) {
      config.data = data;
    }
    
    const response = await axios(config);

    recordRequest(
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
    recordRequest(
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

/**
 * 生成测试报告（控制台输出）
 */
function generateTestReport() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║      EchoStar API 测试报告 - 修改用户信息接口       ║`);
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

// ==================== 测试准备 ====================

async function setupTestUser() {
  const timestamp = Date.now();
  testUsername = `${TEST_PREFIX}user_${timestamp}`;
  testEmail = `${TEST_PREFIX}${timestamp}@test.com`;
  const password = 'Test123456';

  console.log(`[INFO] 创建测试用户: ${testUsername}`);
  console.log(`[INFO] 测试邮箱: ${testEmail}`);

  // 使用 register_2 接口（不需要验证码）
  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username: testUsername,
    email: testEmail,
    password
  }, {}, false, '创建测试用户（无需验证码）');

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    accessToken = registerRes.data?.data?.accessToken;
    testUserId = registerRes.data?.data?.user?.id;
    console.log(`[INFO] 测试用户创建成功: ${testUsername}, ID=${testUserId}`);
    return true;
  }

  console.log(`[ERROR] 注册失败: ${JSON.stringify(registerRes.data)}`);
  return false;
}

// ==================== 测试用例 ====================

/**
 * 1. 获取当前用户信息（修改前）
 */
async function testGetCurrentUserBefore() {
  console.log('\n========== 1. 获取当前用户信息（修改前） ==========\n');

  const res = await sendRequest('GET', `${BASE_URL}/api/auth/me`, null, {}, true, '获取当前用户信息（修改前）');
  assert(res.status === 200, '获取用户信息成功');
  
  if (res.status === 200) {
    console.log(`[INFO] 修改前用户名: ${res.data?.data?.username}`);
    console.log(`[INFO] 修改前简介: ${res.data?.data?.bio}`);
  }
}

/**
 * 2. 修改用户信息测试
 */
async function testUpdateProfile() {
  console.log('\n========== 2. 修改用户信息测试 ==========\n');

  const newUsername = `${TEST_PREFIX}updated_${Date.now()}`;
  const newBio = '这是测试更新的个人简介';

  const res = await sendRequest('PUT', `${BASE_URL}/api/auth/users/me`, {
    username: newUsername,
    bio: newBio
  }, {}, true, '正常测试：修改用户名和简介');
  
  assert(res.status === 200, '修改个人信息成功');

  if (res.status === 200) {
    testUsername = newUsername;
    console.log(`[INFO] 用户名已更新为: ${testUsername}`);
  }
}

/**
 * 3. 获取当前用户信息（修改后）
 */
async function testGetCurrentUserAfter() {
  console.log('\n========== 3. 获取当前用户信息（修改后） ==========\n');

  const res = await sendRequest('GET', `${BASE_URL}/api/auth/me`, null, {}, true, '获取当前用户信息（修改后）');
  assert(res.status === 200, '获取用户信息成功');
  
  if (res.status === 200) {
    console.log(`[INFO] 修改后用户名: ${res.data?.data?.username}`);
    console.log(`[INFO] 修改后简介: ${res.data?.data?.bio}`);
  }
}

/**
 * 4. 注销账号
 */
async function testDeleteAccount() {
  console.log('\n========== 4. 注销账号 ==========\n');

  const res = await sendRequest('DELETE', `${BASE_URL}/api/auth/me`, null, {}, true, '注销测试账号');
  assert(res.status === 200, '注销账号成功');
  console.log('[INFO] 测试账号已注销');
}

// ==================== 主函数 ====================

async function main() {
  const now = new Date().toISOString();
  console.log(`[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║              EchoStar API 测试开始                  ║`);
  console.log(`[${now}] ║            模块: 修改用户信息接口                    ║`);
  console.log(`[${now}] ╚════════════════════════════════════════════════════╝`);
  console.log(`[${now}] 目标服务器: ${BASE_URL}`);
  console.log(`[${now}] 测试时间: ${now}\n`);

  try {
    // 测试准备
    console.log('========== 测试准备 ==========\n');
    const userSetup = await setupTestUser();
    if (!userSetup) {
      console.error('[ERROR] 无法创建测试用户，测试终止');
      return;
    }

    // 执行测试
    await testGetCurrentUserBefore();   // 1. 获取修改前信息
    await testUpdateProfile();           // 2. 修改用户信息
    await testGetCurrentUserAfter();     // 3. 获取修改后信息
    await testDeleteAccount();           // 4. 注销账号

    // 生成报告
    generateTestReport();
    await saveRequestRecords();

    console.log(`\n[${new Date().toISOString()}] 测试完成！`);

  } catch (error) {
    console.error('[ERROR] 测试执行出错:', error);
  }
}

// 执行测试
main();
