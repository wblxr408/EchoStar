/**
 * Auth 模块测试脚本
 * 测试所有认证相关接口
 * 
 * 使用方式：
 *   node auth.test.js          # 正常运行（不重置环境）
 *   node auth.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import readline from 'readline';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_RESULTS_DIR = process.env.TEST_RESULTS_DIR || join(__dirname, '..', 'test-results');
const TEST_PREFIX = 'auth_test_';
const SHOULD_RESET = process.argv.includes('--reset');

// 真实邮箱（用于需要验证码的测试）
const REAL_EMAIL = '2097922846@qq.com';

// 测试用户
let accessToken = null;        // 用户1的token（register_2创建）
let testUserId = null;         // 用户1的ID
let testUsername = null;       // 用户1的用户名
let testEmail = null;          // 用户1的邮箱

let user2AccessToken = null;   // 用户2的token（register创建）
let user2UserId = null;        // 用户2的ID
let user2Username = null;      // 用户2的用户名

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
  let content = `# EchoStar API 测试报告 - Auth模块\n\n`;
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
 * 生成测试报告（控制台输出）
 */
function generateTestReport() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║          EchoStar API 测试报告 - Auth模块           ║`);
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
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(TEST_RESULTS_DIR, 'request-records');
  const reportPath = path.join(reportDir, `auth.request-${now}.md`);
  
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
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(TEST_RESULTS_DIR, 'test-reports');
  const reportPath = path.join(reportDir, `auth.test.report-${now}.txt`);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  let reportContent = '';
  requestRecords.forEach(record => {
    const time = new Date().toISOString();
    const status = record.返回状态 >= 200 && record.返回状态 < 300 ? 'PASS' : 
                   record.返回状态 >= 400 && record.返回状态 < 500 ? 'FAIL' : 'ERROR';
    reportContent += `[${time}] [${status}] ${record.请求类型} ${record.接口地址} - 状态码: ${record.返回状态} - ${record.测试说明}\n`;
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
 * 终端输入等待
 */
async function waitForInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ==================== 测试准备 ====================

/**
 * 创建测试用户1（使用 register_2，无需验证码）
 */
async function setupTestUser1() {
  const timestamp = Date.now();
  testUsername = `${TEST_PREFIX}user1_${timestamp}`;
  testEmail = `${TEST_PREFIX}${timestamp}@test.com`;
  const password = 'Test123456';

  console.log(`\n[INFO] 创建测试用户1: ${testUsername}`);
  console.log(`[INFO] 测试邮箱: ${testEmail}`);

  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username: testUsername,
    email: testEmail,
    password
  }, {}, false, '创建测试用户1（无需验证码）');

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    accessToken = registerRes.data?.data?.accessToken;
    testUserId = registerRes.data?.data?.user?.id;
    console.log(`[INFO] 测试用户1创建成功: ${testUsername}, ID=${testUserId}`);
    return true;
  }

  console.log(`[ERROR] 注册失败: ${JSON.stringify(registerRes.data)}`);
  return false;
}

/**
 * 创建测试用户2（使用 register，需要验证码）
 */
async function setupTestUser2() {
  const timestamp = Date.now();
  user2Username = `${TEST_PREFIX}user2_${timestamp}`;
  const password = 'Test123456';

  console.log(`\n[INFO] 创建测试用户2: ${user2Username}`);
  console.log(`[INFO] 测试邮箱: ${REAL_EMAIL}`);

  // 1. 先发送验证码
  console.log('\n>>> 正在发送注册验证码...');
  const sendCodeRes = await sendRequest('POST', `${BASE_URL}/api/auth/send-code`, {
    email: REAL_EMAIL
  }, {}, false, '发送注册验证码');

  if (sendCodeRes.status !== 200 && sendCodeRes.data?.code !== 0) {
    console.log(`[ERROR] 发送验证码失败: ${JSON.stringify(sendCodeRes.data)}`);
    return false;
  }

  console.log(`[INFO] 验证码已发送到 ${REAL_EMAIL}`);

  // 2. 等待用户输入验证码
  const verificationCode = await waitForInput('\n========================================\n>>> 请输入注册验证码: ');
  console.log('========================================\n');

  if (!verificationCode || !verificationCode.trim()) {
    console.log('[WARN] 未输入验证码，跳过用户2创建');
    return false;
  }

  // 3. 使用验证码注册
  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register`, {
    username: user2Username,
    email: REAL_EMAIL,
    password,
    verificationCode: verificationCode.trim()
  }, {}, false, '创建测试用户2（需要验证码）');

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    user2AccessToken = registerRes.data?.data?.accessToken;
    user2UserId = registerRes.data?.data?.user?.id;
    console.log(`[INFO] 测试用户2创建成功: ${user2Username}, ID=${user2UserId}`);
    return true;
  }

  console.log(`[ERROR] 注册失败: ${JSON.stringify(registerRes.data)}`);
  return false;
}

// ==================== 测试用例 ====================

/**
 * 1. 用户登录测试
 */
async function testLogin() {
  console.log('\n========== 1. 用户登录测试 ==========\n');

  // 1.1 正常登录
  const res1 = await sendRequest('POST', `${BASE_URL}/api/auth/login`, {
    email: testEmail,
    password: 'Test123456'
  }, {}, false, '正常测试：使用正确的邮箱和密码登录');
  assert(res1.status === 200 || res1.data?.code === 0, '用户登录成功');

  // 1.2 边界测试：错误密码
  const res2 = await sendRequest('POST', `${BASE_URL}/api/auth/login`, {
    email: testEmail,
    password: 'WrongPassword123'
  }, {}, false, '边界测试：使用错误密码登录');
  assert(res2.status !== 200, '错误密码登录应该失败');

  // 1.3 边界测试：缺少密码
  const res3 = await sendRequest('POST', `${BASE_URL}/api/auth/login`, {
    email: testEmail
  }, {}, false, '边界测试：缺少密码参数登录');
  assert(res3.status === 400 || res3.status === 500, '缺少密码登录应该失败');
}

/**
 * 2. 获取当前用户信息测试
 */
async function testGetCurrentUser() {
  console.log('\n========== 2. 获取当前用户信息测试 ==========\n');

  // 2.1 正常获取
  const res1 = await sendRequest('GET', `${BASE_URL}/api/auth/me`, null, {}, true, '正常测试：使用有效Token获取当前用户信息');
  assert(res1.status === 200, '获取当前用户信息成功');
  assert(res1.data?.data?.id === testUserId, '用户ID匹配');

  // 2.2 边界测试：无Token访问
  const res2 = await sendRequest('GET', `${BASE_URL}/api/auth/me`, null, {}, false, '边界测试：缺少Token访问用户信息接口');
  assert(res2.status === 401, '无Token获取用户信息应该返回401');
}

/**
 * 3. 修改个人信息测试
 */
async function testUpdateProfile() {
  console.log('\n========== 3. 修改个人信息测试 ==========\n');

  const newUsername = `${TEST_PREFIX}updated_${Date.now()}`;
  const newBio = '这是测试更新的个人简介';

  // 3.1 正常修改个人信息
  const res1 = await sendRequest('PUT', `${BASE_URL}/api/auth/users/me`, {
    username: newUsername,
    bio: newBio
  }, {}, true, '正常测试：修改用户名和简介');
  assert(res1.status === 200, '修改个人信息成功');

  // 更新本地存储的用户名
  if (res1.status === 200) {
    testUsername = newUsername;
    console.log(`[INFO] 用户名已更新为: ${testUsername}`);
  }

  // 3.2 边界测试：无Token修改
  const res2 = await sendRequest('PUT', `${BASE_URL}/api/auth/users/me`, {
    bio: '无Token测试'
  }, {}, false, '边界测试：缺少Token修改个人信息');
  assert(res2.status === 401, '无Token修改个人信息应该返回401');
}

/**
 * 4. 查看其他用户信息测试
 */
async function testGetUserById() {
  console.log('\n========== 4. 查看其他用户信息测试 ==========\n');

  // 4.1 正常查看用户信息
  const res1 = await sendRequest('GET', `${BASE_URL}/api/auth/users/${testUserId}`, null, {}, false, '正常测试：查看用户信息');
  assert(res1.status === 200, '获取用户信息成功');
  assert(res1.data?.data?.id === testUserId, '返回正确的用户ID');

  // 4.2 边界测试：不存在的用户
  const res2 = await sendRequest('GET', `${BASE_URL}/api/auth/users/999999`, null, {}, false, '边界测试：查看不存在的用户');
  assert(res2.status === 404, '不存在的用户应该返回404');
}

/**
 * 5. 修改密码测试
 */
async function testChangePassword() {
  console.log('\n========== 5. 修改密码测试 ==========\n');

  // 5.1 正常修改密码
  const res1 = await sendRequest('PUT', `${BASE_URL}/api/auth/users/me/password`, {
    oldPassword: 'Test123456',
    newPassword: 'NewTest123456'
  }, {}, true, '正常测试：使用正确的旧密码修改密码');
  assert(res1.status === 200, '修改密码成功');

  // 5.2 使用新密码登录验证
  const loginRes = await sendRequest('POST', `${BASE_URL}/api/auth/login`, {
    email: testEmail,
    password: 'NewTest123456'
  }, {}, false, '验证修改后的新密码可以登录');
  assert(loginRes.status === 200, '使用新密码登录成功');

  // 更新token
  if (loginRes.data?.data?.accessToken) {
    accessToken = loginRes.data.data.accessToken;
  }

  // 5.3 边界测试：错误旧密码
  const res2 = await sendRequest('PUT', `${BASE_URL}/api/auth/users/me/password`, {
    oldPassword: 'WrongPassword',
    newPassword: 'AnotherPassword'
  }, {}, true, '边界测试：使用错误的旧密码修改密码');
  assert(res2.status !== 200, '错误旧密码修改应该失败');

  // 5.4 边界测试：无Token访问
  const res3 = await sendRequest('PUT', `${BASE_URL}/api/auth/users/me/password`, {
    oldPassword: 'NewTest123456',
    newPassword: 'Test123456'
  }, {}, false, '边界测试：缺少Token修改密码');
  assert(res3.status === 401, '无Token修改密码应该返回401');

  // 恢复原密码
  const restoreRes = await sendRequest('PUT', `${BASE_URL}/api/auth/users/me/password`, {
    oldPassword: 'NewTest123456',
    newPassword: 'Test123456'
  }, {}, true, '恢复原密码');
  if (restoreRes.status === 200) {
    console.log('[INFO] 密码已恢复为 Test123456');
  }
}

/**
 * 6. 管理员登录测试
 */
async function testAdminLogin() {
  console.log('\n========== 6. 管理员登录测试 ==========\n');

  // 6.1 普通用户尝试管理员登录
  const res1 = await sendRequest('POST', `${BASE_URL}/api/auth/admin/login`, {
    email: testEmail,
    password: 'Test123456'
  }, {}, false, '边界测试：普通用户尝试管理员登录');
  assert(res1.status !== 200, '普通用户管理员登录应该失败');

  // 6.2 边界测试：缺少密码
  const res2 = await sendRequest('POST', `${BASE_URL}/api/auth/admin/login`, {
    email: 'admin@test.com'
  }, {}, false, '边界测试：缺少密码管理员登录');
  assert(res2.status === 400 || res2.status === 500, '缺少密码管理员登录应该失败');
}

/**
 * 7. 发送验证码测试
 */
async function testSendVerificationCode() {
  console.log('\n========== 7. 发送验证码测试 ==========\n');

  // 7.1 正常发送验证码
  const res1 = await sendRequest('POST', `${BASE_URL}/api/auth/send-code`, {
    email: testEmail
  }, {}, false, '正常测试：发送验证码到有效邮箱');
  assert(res1.status === 200 || res1.data?.code === 0, '发送验证码成功');

  // 7.2 边界测试：缺少邮箱
  const res2 = await sendRequest('POST', `${BASE_URL}/api/auth/send-code`, {}, {}, false, '边界测试：缺少邮箱参数发送验证码');
  assert(res2.status === 400 || res2.status === 500, '缺少邮箱发送验证码应该失败');

  // 7.3 边界测试：无效邮箱格式
  const res3 = await sendRequest('POST', `${BASE_URL}/api/auth/send-code`, {
    email: 'invalid-email'
  }, {}, false, '边界测试：使用无效邮箱格式发送验证码');
  assert(res3.status === 400 || res3.status === 500, '无效邮箱格式应该失败');
}

/**
 * 8. 忘记密码测试（使用用户2的真实邮箱）
 */
async function testForgotPassword() {
  console.log('\n========== 8. 忘记密码测试 ==========\n');

  if (!user2UserId) {
    console.log('[WARN] 用户2未创建，跳过忘记密码测试');
    return;
  }

  console.log(`[INFO] 此测试将发送验证码到邮箱: ${REAL_EMAIL}`);

  // 8.1 发送验证码
  console.log('\n>>> 正在发送忘记密码验证码...');
  const res1 = await sendRequest('POST', `${BASE_URL}/api/auth/send-code`, {
    email: REAL_EMAIL
  }, {}, false, '发送忘记密码验证码');

  if (res1.status !== 200 && res1.data?.code !== 0) {
    console.log(`[WARN] 发送验证码失败: ${JSON.stringify(res1.data)}`);
    return;
  }

  console.log(`[INFO] 验证码已发送到 ${REAL_EMAIL}`);

  // 8.2 等待用户输入验证码
  const verificationCode = await waitForInput('\n========================================\n>>> 请输入忘记密码收到的验证码: ');
  console.log('========================================\n');

  if (!verificationCode || !verificationCode.trim()) {
    console.log('[WARN] 未输入验证码，跳过忘记密码测试');
    return;
  }

  // 8.3 使用验证码重置密码
  const newPassword = 'NewTest123456';
  const res2 = await sendRequest('POST', `${BASE_URL}/api/auth/forgot-password`, {
    email: REAL_EMAIL,
    password: newPassword,
    verificationCode: verificationCode.trim()
  }, {}, false, '正常测试：使用验证码重置密码');

  if (res2.status === 200 || res2.data?.code === 0) {
    console.log('[INFO] 密码重置成功！');
    assert(true, '使用验证码重置密码成功');

    // 8.4 使用新密码登录验证
    const loginRes = await sendRequest('POST', `${BASE_URL}/api/auth/login`, {
      email: REAL_EMAIL,
      password: newPassword
    }, {}, false, '验证重置后的新密码可以登录');
    assert(loginRes.status === 200 || loginRes.data?.code === 0, '使用新密码登录成功');

    // 8.5 将密码改回原密码
    if (loginRes.data?.data?.accessToken) {
      const tempToken = accessToken;
      accessToken = loginRes.data.data.accessToken;

      const restoreRes = await sendRequest('PUT', `${BASE_URL}/api/auth/users/me/password`, {
        oldPassword: newPassword,
        newPassword: 'Test123456'
      }, {}, true, '恢复原密码');

      if (restoreRes.status === 200 || restoreRes.data?.code === 0) {
        console.log('[INFO] 密码已恢复为 Test123456');
      }
      accessToken = tempToken;
    }
  } else {
    console.log(`[WARN] 密码重置失败: ${JSON.stringify(res2.data)}`);
    assert(false, '使用验证码重置密码失败');
  }

  // 8.6 边界测试：错误验证码
  const res3 = await sendRequest('POST', `${BASE_URL}/api/auth/forgot-password`, {
    email: REAL_EMAIL,
    password: 'NewTest123456',
    verificationCode: '00000'
  }, {}, false, '边界测试：使用错误的验证码重置密码');
  assert(res3.status !== 200, '错误验证码重置密码应该失败');

  // 8.7 边界测试：缺少验证码
  const res4 = await sendRequest('POST', `${BASE_URL}/api/auth/forgot-password`, {
    email: REAL_EMAIL,
    password: 'NewTest123456'
  }, {}, false, '边界测试：缺少验证码参数重置密码');
  assert(res4.status === 400 || res4.status === 500, '缺少验证码应该失败');
}

/**
 * 9. 获取头像上传凭证测试
 * GET /api/auth/avatar/upload-token
 */
async function testGetAvatarUploadToken() {
  console.log('\n========== 9. 获取头像上传凭证测试 ==========\n');

  // 9.1 正常获取上传凭证
  const res1 = await sendRequest('GET', `${BASE_URL}/api/auth/avatar/upload-token`, null, {}, true, '正常测试：使用有效Token获取头像上传凭证');
  assert(res1.status === 200, '获取头像上传凭证成功');
  if (res1.status === 200) {
    console.log(`[INFO] 上传凭证返回数据: ${JSON.stringify(res1.data?.data).substring(0, 200)}`);
  }

  // 9.2 边界测试：无Token获取上传凭证
  const res2 = await sendRequest('GET', `${BASE_URL}/api/auth/avatar/upload-token`, null, {}, false, '边界测试：未登录时获取头像上传凭证（应返回401）');
  assert(res2.status === 401, '无Token获取上传凭证应该返回401');
}

/**
 * 10. 注销账号测试
 */
async function testDeleteAccount() {
  console.log('\n========== 9. 注销账号测试 ==========\n');

  // 9.1 边界测试：无Token注销
  const res1 = await sendRequest('DELETE', `${BASE_URL}/api/auth/me`, null, {}, false, '边界测试：缺少Token注销账号');
  assert(res1.status === 401, '无Token注销账号应该返回401');

  // 9.2 正常注销账号（用户1）
  const res2 = await sendRequest('DELETE', `${BASE_URL}/api/auth/me`, null, {}, true, '正常测试：注销测试用户1');
  assert(res2.status === 200, '注销账号成功');
  console.log('[INFO] 测试用户1已注销');
}

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
  console.log(`[${now}] ║                模块: Auth (认证)                    ║`);
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
    console.log('========== 测试准备 ==========');
    
    // 创建测试用户1（无需验证码）
    const user1Setup = await setupTestUser1();
    if (!user1Setup) {
      console.error('[ERROR] 无法创建测试用户1，测试终止');
      return;
    }

    // 创建测试用户2（需要验证码）
    console.log('\n[INFO] 即将创建测试用户2，需要您输入验证码');
    await setupTestUser2();

    // ========== 执行测试 ==========
    await testLogin();                    // 1. 登录测试
    await testGetCurrentUser();           // 2. 获取当前用户信息
    await testUpdateProfile();            // 3. 修改个人信息
    await testGetUserById();              // 4. 查看其他用户信息
    await testChangePassword();           // 5. 修改密码
    await testAdminLogin();               // 6. 管理员登录
    await testSendVerificationCode();     // 7. 发送验证码
    await testForgotPassword();           // 8. 忘记密码
    await testGetAvatarUploadToken();     // 9. 获取头像上传凭证
    await testDeleteAccount();            // 10. 注销账号

    // 生成报告
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
