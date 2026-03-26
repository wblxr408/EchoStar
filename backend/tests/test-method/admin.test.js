/**
 * Admin 模块测试脚本
 * 
 * 账号职责：
 *   - admin01: 管理员，执行管理员操作
 *   - user01: 普通用户，被封禁测试对象
 *   - user02: 普通用户，故事被 shadowban 测试对象
 *   - user03: 普通用户，访问被 shadowban 的故事
 * 
 * 测试流程：
 *   1. 创建 admin01，创建 user01，发布故事 "user01 story"
 *   2. 封禁 user01（边界测试），验证封禁后权限
 *   3. 创建 user02，发布故事 "user02story"，封禁故事（边界测试）
 *   4. 创建 user03，访问 user02 的故事，验证 shadowban 效果
 *   5. 解封 user01，解封 user02 的故事
 *   6. user01 发布新故事，user03 评论 user02 的故事
 *   7. admin01 查看 statistics（边界测试）
 * 
 * 使用方式：
 *   node admin.test.js          # 正常运行（不重置环境）
 *   node admin.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import pg from 'pg';
import readline from 'readline';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PREFIX = 'admin_test_';
const SHOULD_RESET = process.argv.includes('--reset');

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'echostar',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456'
};

// 账号
let adminToken = null;
let adminUserId = null;
let adminUsername = 'admin01';
let adminEmail = null;
let adminPassword = 'Admin123456';

let user01Token = null;
let user01Id = null;
let user01Username = 'user01';
let user01Email = null;
let user01Password = 'Test123456';

let user02Token = null;
let user02Id = null;
let user02Username = 'user02';

let user03Token = null;
let user03Id = null;
let user03Username = 'user03';

// 测试故事
let user01StoryId = null;     // user01 发布的故事
let user02StoryId = null;     // user02 发布的故事

// 请求记录
const requestRecords = [];
let requestCounter = 0;

// 测试统计
const stats = { total: 0, passed: 0, failed: 0, errors: [] };

// ==================== 工具函数 ====================

function recordRequest(method, url, headers, body, status, response) {
  requestCounter++;
  requestRecords.push({
    序号: requestCounter,
    请求类型: method,
    接口地址: url,
    返回状态: status,
    请求头: headers,
    请求体: body || null,
    返回内容: response
  });
}

async function sendRequest(method, url, data = null, customHeaders = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const config = { method, url, headers, validateStatus: () => true };
    if (data !== null && data !== undefined) config.data = data;
    const response = await axios(config);
    recordRequest(method.toUpperCase(), url, { ...headers }, data, response.status, response.data);
    return response;
  } catch (error) {
    recordRequest(method.toUpperCase(), url, { ...headers }, data, error.response?.status || 500, error.response?.data || { error: error.message });
    return error.response || { status: 500, data: { error: error.message } };
  }
}

function assert(condition, message) {
  stats.total++;
  const now = new Date().toISOString();
  if (condition) {
    stats.passed++;
    console.log(`[${now}] [PASS] ${message}`);
  } else {
    stats.failed++;
    stats.errors.push(message);
    console.log(`[${now}] [FAIL] ${message}`);
  }
}

async function waitForInput(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

async function waitForContinue(prompt = '按回车继续...') {
  await waitForInput(`\n>>> ${prompt}`);
}

// ==================== 数据库操作 ====================

async function promoteUserToAdmin(userId) {
  const pool = new Pool(DB_CONFIG);
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
      ['admin', userId]
    );
    if (result.rows.length > 0) {
      console.log(`[INFO] 用户 ${result.rows[0].username} 已提升为管理员`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[ERROR] 数据库操作失败:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// ==================== 测试准备 ====================

async function setupAdminUser() {
  const timestamp = Date.now();
  adminEmail = `${TEST_PREFIX}admin_${timestamp}@test.com`;
  const password = adminPassword;

  console.log(`\n[账号创建] 管理员: ${adminUsername}`);

  // 使用 register_2 接口（不需要验证码）
  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username: adminUsername,
    email: adminEmail,
    password
  });

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    adminUserId = registerRes.data?.data?.user?.id;
    console.log(`[INFO] 管理员账号创建成功: ID=${adminUserId}`);

    const promoted = await promoteUserToAdmin(adminUserId);

    if (promoted) {
      const loginRes = await sendRequest('POST', `${BASE_URL}/api/auth/admin/login`, { email: adminEmail, password });
      if (loginRes.status === 200 || loginRes.data?.code === 0) {
        adminToken = loginRes.data?.data?.accessToken;
        console.log(`[INFO] 管理员登录成功`);
        return true;
      }
    } else {
      console.log('\n' + '='.repeat(60));
      console.log(`[需要手动操作] 请提升以下用户为管理员:`);
      console.log(`  用户名: ${adminUsername}, ID: ${adminUserId}`);
      console.log(`  SQL: UPDATE users SET role = 'admin' WHERE id = ${adminUserId};`);
      console.log('='.repeat(60));
      await waitForContinue('完成数据库操作后按回车继续...');

      const loginRes = await sendRequest('POST', `${BASE_URL}/api/auth/admin/login`, { email: adminEmail, password });
      if (loginRes.status === 200 || loginRes.data?.code === 0) {
        adminToken = loginRes.data?.data?.accessToken;
        return true;
      }
    }
  }
  return false;
}

async function setupUser01() {
  const timestamp = Date.now();
  user01Email = `${TEST_PREFIX}user01_${timestamp}@test.com`;
  const password = user01Password;

  console.log(`\n[账号创建] 普通用户: ${user01Username}`);

  // 使用 register_2 接口（不需要验证码）
  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username: user01Username,
    email: user01Email,
    password
  });

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    user01Id = registerRes.data?.data?.user?.id;
    user01Token = registerRes.data?.data?.accessToken;
    console.log(`[INFO] 普通用户创建成功: ID=${user01Id}`);
    return true;
  }
  return false;
}

async function setupUser02() {
  const timestamp = Date.now();
  const email = `${TEST_PREFIX}user02_${timestamp}@test.com`;
  const password = 'Test123456';

  console.log(`\n[账号创建] 普通用户: ${user02Username}`);

  // 使用 register_2 接口（不需要验证码）
  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username: user02Username,
    email,
    password
  });

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    user02Id = registerRes.data?.data?.user?.id;
    user02Token = registerRes.data?.data?.accessToken;
    console.log(`[INFO] 普通用户创建成功: ID=${user02Id}`);
    return true;
  }
  return false;
}

async function setupUser03() {
  const timestamp = Date.now();
  const email = `${TEST_PREFIX}user03_${timestamp}@test.com`;
  const password = 'Test123456';

  console.log(`\n[账号创建] 普通用户: ${user03Username}`);

  // 使用 register_2 接口（不需要验证码）
  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username: user03Username,
    email,
    password
  });

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    user03Id = registerRes.data?.data?.user?.id;
    user03Token = registerRes.data?.data?.accessToken;
    console.log(`[INFO] 普通用户创建成功: ID=${user03Id}`);
    return true;
  }
  return false;
}

async function setupUser01Story() {
  console.log(`\n[故事创建] 由 ${user01Username} 发布故事 "user01 story"...`);
  
  const storyRes = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: 'user01 story',
    images: ['https://example.com/test-image.jpg'],
    emotionTag: '开心',
    location: { lat: 39.90923, lng: 116.397428 }
  }, {}, user01Token);

  if (storyRes.status === 200 || storyRes.status === 201) {
    user01StoryId = storyRes.data?.data?.id;
    console.log(`[INFO] user01 故事创建成功: ID=${user01StoryId}`);
    return true;
  }
  console.log(`[WARN] 故事创建失败: ${storyRes.status}`);
  return false;
}

async function setupUser02Story() {
  console.log(`\n[故事创建] 由 ${user02Username} 发布故事 "user02story"...`);
  
  const storyRes = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: 'user02story',
    images: ['https://example.com/test-image.jpg'],
    emotionTag: '开心',
    location: { lat: 39.90923, lng: 116.397428 }
  }, {}, user02Token);

  if (storyRes.status === 200 || storyRes.status === 201) {
    user02StoryId = storyRes.data?.data?.id;
    console.log(`[INFO] user02 故事创建成功: ID=${user02StoryId}`);
    return true;
  }
  console.log(`[WARN] 故事创建失败: ${storyRes.status}`);
  return false;
}

// ==================== Admin 接口测试 ====================

/**
 * 1. 封禁用户测试（各种边界测试）
 * POST /api/admin/users/:userId/ban
 */
async function testBanUser() {
  console.log('\n========== 1. 封禁用户测试（边界测试） ==========\n');
  console.log(`[INFO] 封禁对象: ${user01Username} (ID=${user01Id})`);

  // 1.1 边界：无Token封禁
  console.log('\n--- 1.1 无Token封禁 ---');
  const res1 = await sendRequest('POST', `${BASE_URL}/api/admin/users/${user01Id}/ban`, {
    reason: '无Token封禁测试'
  }, {}, null);
  assert(res1.status === 401, '无Token返回401');

  // 1.2 边界：使用 user01 自己的 token 封禁自己
  console.log('\n--- 1.2 user01 封禁自己（使用自己的token） ---');
  const res2 = await sendRequest('POST', `${BASE_URL}/api/admin/users/${user01Id}/ban`, {
    reason: '自己封禁自己'
  }, {}, user01Token);
  assert(res2.status === 403, '普通用户封禁返回403');

  // 1.3 边界：admin01 封禁自己
  console.log('\n--- 1.3 admin01 封禁自己 ---');
  const res3 = await sendRequest('POST', `${BASE_URL}/api/admin/users/${adminUserId}/ban`, {
    reason: '管理员封禁自己'
  }, {}, adminToken);
  assert(res3.status === 403 || res3.status === 400, '封禁管理员返回400/403');

  // 1.4 边界：封禁不存在的用户
  console.log('\n--- 1.4 封禁不存在的用户 ---');
  const res4 = await sendRequest('POST', `${BASE_URL}/api/admin/users/999999/ban`, {
    reason: '测试'
  }, {}, adminToken);
  assert(res4.status === 404, '不存在的用户返回404');

  // 1.5 正常封禁：admin01 封禁 user01
  console.log('\n--- 1.5 admin01 正常封禁 user01 ---');
  const res5 = await sendRequest('POST', `${BASE_URL}/api/admin/users/${user01Id}/ban`, {
    reason: 'user01 违规，进行封禁'
  }, {}, adminToken);
  assert(res5.status === 200, '封禁用户成功');
  console.log(`[INFO] user01 已被封禁`);

  // 1.6 边界：重复封禁
  console.log('\n--- 1.6 重复封禁 ---');
  const res6 = await sendRequest('POST', `${BASE_URL}/api/admin/users/${user01Id}/ban`, {
    reason: '重复封禁'
  }, {}, adminToken);
  assert(res6.status === 400, '重复封禁返回400');
}

/**
 * 2. 封禁后 user01 权限测试
 * 验证被封禁用户是否还能使用各项功能
 */
async function testUser01AfterBanned() {
  console.log('\n========== 2. user01 被封禁后的权限测试 ==========\n');
  console.log(`[INFO] 测试 user01 (ID=${user01Id}) 被封禁后的各项操作权限`);

  // 2.1 尝试登录
  console.log('\n--- 2.1 user01 尝试登录 ---');
  const loginRes = await sendRequest('POST', `${BASE_URL}/api/auth/login`, {
    email: user01Email,
    password: user01Password
  }, {}, null);
  console.log(`[结果] 登录状态码: ${loginRes.status}`);

  // 2.2 使用 user01 的 token 发布故事
  console.log('\n--- 2.2 user01 发布故事 ---');
  const storyRes = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: 'user01 banned story',
    images: ['https://example.com/test.jpg'],
    emotionTag: '开心'
  }, {}, user01Token);
  console.log(`[结果] 发布故事状态码: ${storyRes.status}`);

  // 2.3 user01 评论 user02 的故事（测试封禁后是否能操作其他用户的故事）
  console.log('\n--- 2.3 user01 评论 user02 的故事 "user01 self-comment" ---');
  const commentRes = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    storyId: user02StoryId,
    content: 'user01 self-comment'
  }, {}, user01Token);
  console.log(`[结果] 评论状态码: ${commentRes.status}`);

  // 2.4 user01 点赞 user02 的故事
  console.log('\n--- 2.4 user01 点赞 user02 的故事 ---');
  const likeRes = await sendRequest('POST', `${BASE_URL}/api/likes`, {
    storyId: user02StoryId
  }, {}, user01Token);
  console.log(`[结果] 点赞状态码: ${likeRes.status}`);

  // 2.5 user01 收藏 user02 的故事
  console.log('\n--- 2.5 user01 收藏 user02 的故事 ---');
  const favoriteRes = await sendRequest('POST', `${BASE_URL}/api/favorites`, {
    storyId: user02StoryId
  }, {}, user01Token);
  console.log(`[结果] 收藏状态码: ${favoriteRes.status}`);

  // 2.6 user01 获取用户信息
  console.log('\n--- 2.6 user01 获取用户信息 ---');
  const meRes = await sendRequest('GET', `${BASE_URL}/api/auth/me`, null, {}, user01Token);
  console.log(`[结果] 获取用户信息状态码: ${meRes.status}`);

  // 2.7 user01 访问故事列表（使用搜索接口）
  console.log('\n--- 2.7 user01 访问故事列表 ---');
  const storiesRes = await sendRequest('GET', `${BASE_URL}/api/stories/search?keyword=test&page=1&limit=10`, null, {}, user01Token);
  console.log(`[结果] 访问故事列表状态码: ${storiesRes.status}`);

  // 2.8 user01 查看自己的故事
  console.log('\n--- 2.8 user01 查看自己的故事 ---');
  const mineRes = await sendRequest('GET', `${BASE_URL}/api/stories/me/list?page=1&limit=10`, null, {}, user01Token);
  console.log(`[结果] 查看自己故事状态码: ${mineRes.status}`);

  // 2.9 user01 查看通知
  console.log('\n--- 2.9 user01 查看通知 ---');
  const notifRes = await sendRequest('GET', `${BASE_URL}/api/notifications/me?page=1&limit=10`, null, {}, user01Token);
  console.log(`[结果] 查看通知状态码: ${notifRes.status}`);

  // 2.10 user01 查看收藏列表
  console.log('\n--- 2.10 user01 查看收藏列表 ---');
  const favListRes = await sendRequest('GET', `${BASE_URL}/api/favorites/me?page=1&limit=10`, null, {}, user01Token);
  console.log(`[结果] 查看收藏列表状态码: ${favListRes.status}`);
}

/**
 * 3. 封禁故事测试（边界测试）
 * POST /api/admin/stories/:storyId/shadowban
 */
async function testShadowbanStory() {
  console.log('\n========== 3. 封禁故事测试（边界测试） ==========\n');
  console.log(`[INFO] 封禁对象: user02 的故事 (ID=${user02StoryId})`);

  // 3.1 边界：无Token封禁故事
  console.log('\n--- 3.1 无Token封禁故事 ---');
  const res1 = await sendRequest('POST', `${BASE_URL}/api/admin/stories/${user02StoryId}/shadowban`, {
    reason: '无Token封禁测试'
  }, {}, null);
  assert(res1.status === 401, '无Token返回401');

  // 3.2 边界：使用普通用户 token 封禁故事
  console.log('\n--- 3.2 user02 封禁自己的故事 ---');
  const res2 = await sendRequest('POST', `${BASE_URL}/api/admin/stories/${user02StoryId}/shadowban`, {
    reason: '用户封禁自己的故事'
  }, {}, user02Token);
  assert(res2.status === 403, '普通用户封禁故事返回403');

  // 3.3 边界：封禁不存在的故事
  console.log('\n--- 3.3 封禁不存在的故事 ---');
  const res3 = await sendRequest('POST', `${BASE_URL}/api/admin/stories/999999/shadowban`, {
    reason: '测试'
  }, {}, adminToken);
  assert(res3.status === 404, '不存在的故事返回404');

  // 3.4 正常封禁：admin01 封禁 user02 的故事
  console.log('\n--- 3.4 admin01 正常封禁 user02 的故事 ---');
  const res4 = await sendRequest('POST', `${BASE_URL}/api/admin/stories/${user02StoryId}/shadowban`, {
    reason: 'user02 的故事违规，进行 shadowban'
  }, {}, adminToken);
  assert(res4.status === 200, '封禁故事成功');
  console.log(`[INFO] user02 的故事已被封禁`);

  // 3.5 边界：重复封禁故事
  console.log('\n--- 3.5 重复封禁故事 ---');
  const res5 = await sendRequest('POST', `${BASE_URL}/api/admin/stories/${user02StoryId}/shadowban`, {
    reason: '重复封禁'
  }, {}, adminToken);
  assert(res5.status === 400, '重复封禁返回400');
}

/**
 * 4. user03 访问被封禁故事测试
 * 验证 shadowban 后故事是否对其他用户不可见
 */
async function testUser03AccessShadowbannedStory() {
  console.log('\n========== 4. user03 访问被封禁故事测试 ==========\n');
  console.log(`[INFO] user03 访问 user02 被封禁的故事 (ID=${user02StoryId})`);

  // 4.1 user03 访问故事列表
  console.log('\n--- 4.1 user03 访问故事列表 ---');
  const storiesRes = await sendRequest('GET', `${BASE_URL}/api/stories/search?keyword=user02&page=1&limit=10`, null, {}, user03Token);
  console.log(`[结果] 故事列表中是否包含 user02 的故事: 需检查返回数据`);

  // 4.2 user03 查看 user02 故事的详情
  console.log('\n--- 4.2 user03 查看 user02 故事详情 ---');
  const detailRes = await sendRequest('GET', `${BASE_URL}/api/stories/${user02StoryId}`, null, {}, user03Token);
  console.log(`[结果] 查看故事详情状态码: ${detailRes.status}`);

  // 4.3 user03 评论 user02 的故事
  console.log('\n--- 4.3 user03 评论 user02 的故事 ---');
  const commentRes = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    storyId: user02StoryId,
    content: 'user03 comment on shadowbanned story'
  }, {}, user03Token);
  console.log(`[结果] 评论状态码: ${commentRes.status}`);

  // 4.4 user03 点赞 user02 的故事
  console.log('\n--- 4.4 user03 点赞 user02 的故事 ---');
  const likeRes = await sendRequest('POST', `${BASE_URL}/api/likes`, {
    storyId: user02StoryId
  }, {}, user03Token);
  console.log(`[结果] 点赞状态码: ${likeRes.status}`);

  // 4.5 user03 收藏 user02 的故事
  console.log('\n--- 4.5 user03 收藏 user02 的故事 ---');
  const favoriteRes = await sendRequest('POST', `${BASE_URL}/api/favorites`, {
    storyId: user02StoryId
  }, {}, user03Token);
  console.log(`[结果] 收藏状态码: ${favoriteRes.status}`);

  // 4.6 user03 查看 user02 故事的评论列表
  console.log('\n--- 4.6 user03 查看 user02 故事的评论列表 ---');
  const commentsRes = await sendRequest('GET', `${BASE_URL}/api/comments/story/${user02StoryId}?page=1&limit=10`, null, {}, user03Token);
  console.log(`[结果] 查看评论列表状态码: ${commentsRes.status}`);
}

/**
 * 5. 解封用户和故事
 */
async function testUnban() {
  console.log('\n========== 5. 解封用户和故事测试 ==========\n');

  // 5.1 解封 user01
  console.log('\n--- 5.1 解封 user01 ---');
  const unbanUserRes = await sendRequest('POST', `${BASE_URL}/api/admin/users/${user01Id}/unban`, {}, {}, adminToken);
  assert(unbanUserRes.status === 200, '解封用户成功');
  console.log(`[INFO] user01 已解封`);

  // 5.2 边界：重复解封用户
  console.log('\n--- 5.2 重复解封用户 ---');
  const unbanUserAgain = await sendRequest('POST', `${BASE_URL}/api/admin/users/${user01Id}/unban`, {}, {}, adminToken);
  assert(unbanUserAgain.status === 400, '重复解封用户返回400');

  // 5.3 解封 user02 的故事
  console.log('\n--- 5.3 解封 user02 的故事 ---');
  const unbanStoryRes = await sendRequest('POST', `${BASE_URL}/api/admin/stories/${user02StoryId}/restore`, {}, {}, adminToken);
  assert(unbanStoryRes.status === 200, '解封故事成功');
  console.log(`[INFO] user02 的故事已解封`);

  // 5.4 边界：重复解封故事
  console.log('\n--- 5.4 重复解封故事 ---');
  const unbanStoryAgain = await sendRequest('POST', `${BASE_URL}/api/admin/stories/${user02StoryId}/restore`, {}, {}, adminToken);
  assert(unbanStoryAgain.status === 400, '重复解封故事返回400');
}

/**
 * 6. 解封后操作测试
 */
async function testAfterUnban() {
  console.log('\n========== 6. 解封后操作测试 ==========\n');

  // 6.1 user01 重新登录
  console.log('\n--- 6.1 user01 重新登录 ---');
  const loginRes = await sendRequest('POST', `${BASE_URL}/api/auth/login`, {
    email: user01Email,
    password: user01Password
  }, {}, null);
  if (loginRes.status === 200 || loginRes.data?.code === 0) {
    user01Token = loginRes.data?.data?.accessToken;
    console.log(`[INFO] user01 登录成功，获取新 token`);
  }

  // 6.2 user01 发布故事 "user01 story after unban"
  console.log('\n--- 6.2 user01 发布故事 "user01 story after unban" ---');
  const storyRes = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: 'user01 story after unban',
    images: ['https://example.com/test.jpg'],
    emotionTag: '开心',
    "location": {
      "lat": 39.90923,
      "lng": 116.397428
    }
  }, {}, user01Token);
  console.log(`[结果] 发布故事状态码: ${storyRes.status}`);

  // 6.3 user03 评论 user02 的故事 "user03 comment user02 story after unshadowban"
  console.log('\n--- 6.3 user03 评论 user02 的故事 ---');
  const commentRes = await sendRequest('POST', `${BASE_URL}/api/comments`, {
    storyId: user02StoryId,
    content: 'user03 comment user02 story after unshadowban'
  }, {}, user03Token);
  console.log(`[结果] 评论状态码: ${commentRes.status}`);
}

/**
 * 7. 获取数据统计测试（边界测试）
 * GET /api/admin/statistics
 */
async function testGetStatistics() {
  console.log('\n========== 7. 获取数据统计测试（边界测试） ==========\n');

  // 7.1 边界：无Token
  console.log('\n--- 7.1 无Token获取统计 ---');
  const res1 = await sendRequest('GET', `${BASE_URL}/api/admin/statistics`, null, {}, null);
  assert(res1.status === 401, '无Token返回401');

  // 7.2 边界：使用普通用户 token
  console.log('\n--- 7.2 普通用户获取统计 ---');
  const res2 = await sendRequest('GET', `${BASE_URL}/api/admin/statistics`, null, {}, user01Token);
  assert(res2.status === 403, '普通用户返回403');

  // 7.3 正常：管理员获取统计
  console.log('\n--- 7.3 管理员获取统计 ---');
  const res3 = await sendRequest('GET', `${BASE_URL}/api/admin/statistics`, null, {}, adminToken);
  assert(res3.status === 200, '管理员获取统计成功');
  assert(typeof res3.data?.data?.totalUsers === 'number', '返回总用户数');
  assert(typeof res3.data?.data?.totalStories === 'number', '返回总故事数');
  console.log(`[INFO] 统计数据: 总用户=${res3.data?.data?.totalUsers}, 总故事=${res3.data?.data?.totalStories}`);
}

// ==================== 保存报告 ====================

async function saveRequestRecords() {
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'request-records');
  const reportPath = path.join(reportDir, `admin_request_${now}.md`);
  
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  fs.writeFileSync(reportPath, generateReportContent());
  console.log(`[INFO] 请求记录已保存: ${reportPath}`);
}

async function saveTestReport() {
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'test-reports');
  const reportPath = path.join(reportDir, `admin_test_report_${now}.txt`);
  
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  let content = `EchoStar Admin模块测试报告\n`;
  content += `测试时间: ${new Date().toISOString()}\n`;
  content += `服务器: ${BASE_URL}\n`;
  content += `${'='.repeat(50)}\n\n`;
  
  requestRecords.forEach(record => {
    const status = record.返回状态 >= 200 && record.返回状态 < 300 ? 'PASS' : 
                   record.返回状态 >= 400 && record.返回状态 < 500 ? 'FAIL' : 'ERROR';
    content += `[${status}] ${record.请求类型} ${record.接口地址} - 状态码: ${record.返回状态}\n`;
  });
  
  content += `\n${'='.repeat(50)}\n`;
  content += `测试统计: 总计=${stats.total}, 通过=${stats.passed}, 失败=${stats.failed}\n`;
  
  if (stats.errors.length > 0) {
    content += `\n错误详情:\n`;
    stats.errors.forEach((err, idx) => {
      content += `  ${idx + 1}. ${err}\n`;
    });
  }
  
  fs.writeFileSync(reportPath, content);
  console.log(`[INFO] 测试报告已保存: ${reportPath}`);
}

function generateReportContent() {
  const now = new Date().toISOString();
  let content = `# EchoStar API 测试报告 - Admin模块\n\n`;
  content += `**测试时间**: ${now}\n\n`;
  content += `**服务器地址**: ${BASE_URL}\n\n`;
  content += `**请求总数**: ${requestRecords.length}\n\n`;
  content += `---\n\n`;

  requestRecords.forEach((record, idx) => {
    content += `## ${idx + 1}. ${record.请求类型} ${record.接口地址}\n\n`;
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

function printTestReport() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║          EchoStar API 测试报告 - Admin模块          ║`);
  console.log(`[${now}] ╚════════════════════════════════════════════════════╝`);
  console.log(`[${now}] 总计: ${stats.total} | 通过: ${stats.passed} | 失败: ${stats.failed}`);
  if (stats.errors.length > 0) {
    console.log(`\n[错误详情]:`);
    stats.errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
  }
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
  console.log(`[${now}] ║              Admin 模块测试开始                     ║`);
  console.log(`[${now}] ╚════════════════════════════════════════════════════╝`);
  console.log(`[${now}] 服务器: ${BASE_URL}`);
  if (SHOULD_RESET) {
    console.log(`[${now}] 模式: 重置环境后测试`);
  }
  console.log();

  // 如果需要重置环境
  if (SHOULD_RESET) {
    try {
      await resetEnvironment();
    } catch (error) {
      console.error('[ERROR] 重置环境失败:', error.message);
      return;
    }
  }

  // 账号职责说明
  console.log('【账号职责】');
  console.log(`  ${adminUsername} - 管理员，执行管理员操作`);
  console.log(`  ${user01Username} - 普通用户，被封禁测试对象`);
  console.log(`  ${user02Username} - 普通用户，故事被 shadowban 测试对象`);
  console.log(`  ${user03Username} - 普通用户，访问被 shadowban 的故事\n`);

  try {
    // 测试准备
    console.log('========== 测试准备 ==========');
    
    if (!await setupAdminUser()) {
      console.error('[ERROR] 无法创建管理员，测试终止');
      return;
    }
    if (!await setupUser01()) {
      console.error('[ERROR] 无法创建普通用户 user01，测试终止');
      return;
    }
    if (!await setupUser01Story()) {
      console.error('[ERROR] 无法创建 user01 的测试故事，测试终止');
      return;
    }
    if (!await setupUser02()) {
      console.error('[ERROR] 无法创建普通用户 user02，测试终止');
      return;
    }
    if (!await setupUser02Story()) {
      console.error('[ERROR] 无法创建 user02 的测试故事，测试终止');
      return;
    }
    if (!await setupUser03()) {
      console.error('[ERROR] 无法创建普通用户 user03，测试终止');
      return;
    }

    // 执行测试
    await testBanUser();                          // 1. 封禁用户测试（边界测试）
    await testUser01AfterBanned();                // 2. user01 被封禁后的权限测试
    await testShadowbanStory();                   // 3. 封禁故事测试（边界测试）
    await testUser03AccessShadowbannedStory();    // 4. user03 访问被封禁故事测试
    await testUnban();                            // 5. 解封用户和故事测试
    await testAfterUnban();                       // 6. 解封后操作测试
    await testGetStatistics();                    // 7. 获取数据统计测试（边界测试）

    // 报告
    printTestReport();
    await saveRequestRecords();
    await saveTestReport();

    console.log(`\n[${new Date().toISOString()}] 测试完成！`);

  } catch (error) {
    console.error('[ERROR] 测试执行出错:', error);
  }
}

main();
