/**
 * Story 模块测试脚本
 * 
 * 测试接口：
 *   - POST /api/stories - 发布故事
 *   - GET /api/stories/:id - 查看故事详情
 *   - GET /api/stories/me/list - 我的故事列表
 *   - GET /api/stories/search - 搜索故事
 *   - POST /api/stories/:id - 修改故事内容
 *   - PUT /api/stories/:id/visibility - 修改故事可见性
 *   - DELETE /api/stories/:id - 删除故事
 *   - GET /api/stories/upload-token - 获取OSS上传凭证
 *   - POST /api/stories/:id/unlock - 解锁时光胶囊
 *   - GET /api/stories/admin/all - 管理员获取所有帖子
 * 
 * 测试流程：
 *   1. 创建普通用户和管理员用户
 *   2. 测试发布故事接口（各种边界测试）
 *   3. 测试查看故事详情（各种边界测试）
 *   4. 测试我的故事列表（各种边界测试）
 *   5. 测试搜索故事（各种边界测试）
 *   6. 测试修改故事内容（各种边界测试）
 *   7. 测试修改故事可见性（各种边界测试）
 *   8. 测试删除故事（各种边界测试）
 *   9. 测试获取OSS上传凭证
 *   10. 测试解锁时光胶囊
 *   11. 测试管理员获取所有帖子
 * 
 * 使用方式：
 *   node story.test.js          # 正常运行（不重置环境）
 *   node story.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import pg from 'pg';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PREFIX = 'story_test_';
const SHOULD_RESET = process.argv.includes('--reset');

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'echostar',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456'
};

// 测试用户
let userToken = null;
let userId = null;
let userEmail = null;
let userPassword = 'Test123456';

let adminToken = null;
let adminUserId = null;
let adminEmail = null;

// 测试故事
let storyId = null;
let timeCapsuleStoryId = null;

// 请求记录
const requestRecords = [];
let requestCounter = 0;

// 测试统计
const stats = { total: 0, passed: 0, failed: 0, errors: [] };

// ==================== 工具函数 ====================

function recordRequest(method, url, headers, body, status, response, testDescription = '') {
  requestCounter++;
  requestRecords.push({
    序号: requestCounter,
    请求类型: method,
    接口地址: url,
    返回状态: status,
    请求头: headers,
    请求体: body || null,
    返回内容: response,
    测试说明: testDescription
  });
}

async function sendRequest(method, url, data = null, customHeaders = {}, token = null, testDescription = '') {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const config = { method, url, headers, validateStatus: () => true };
    if (data !== null && data !== undefined) config.data = data;
    const response = await axios(config);
    recordRequest(method.toUpperCase(), url, { ...headers }, data, response.status, response.data, testDescription);
    return response;
  } catch (error) {
    recordRequest(method.toUpperCase(), url, { ...headers }, data, error.response?.status || 500, error.response?.data || { error: error.message }, testDescription);
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

async function setupTestUser() {
  const timestamp = Date.now();
  const username = `${TEST_PREFIX}user_${timestamp}`;
  userEmail = `${TEST_PREFIX}${timestamp}@test.com`;

  console.log(`\n[账号创建] 普通用户: ${username}`);

  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username,
    email: userEmail,
    password: userPassword
  }, {}, null, '创建测试用户（无需验证码）');

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    userId = registerRes.data?.data?.user?.id;
    userToken = registerRes.data?.data?.accessToken;
    console.log(`[INFO] 普通用户创建成功: ID=${userId}`);
    return true;
  }
  console.log(`[WARN] 用户创建失败: ${registerRes.status}`);
  return false;
}

async function setupAdminUser() {
  const timestamp = Date.now();
  const username = `${TEST_PREFIX}admin_${timestamp}`;
  adminEmail = `${TEST_PREFIX}admin_${timestamp}@test.com`;
  const password = 'Admin123456';

  console.log(`\n[账号创建] 管理员: ${username}`);

  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username,
    email: adminEmail,
    password
  }, {}, null, '创建管理员用户（无需验证码）');

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    adminUserId = registerRes.data?.data?.user?.id;
    
    const promoted = await promoteUserToAdmin(adminUserId);
    
    if (promoted) {
      const loginRes = await sendRequest('POST', `${BASE_URL}/api/auth/admin/login`, {
        email: adminEmail,
        password
      }, {}, null, '管理员登录');
      
      if (loginRes.status === 200 || loginRes.data?.code === 0) {
        adminToken = loginRes.data?.data?.accessToken;
        console.log(`[INFO] 管理员创建并登录成功: ID=${adminUserId}`);
        return true;
      }
    }
  }
  console.log(`[WARN] 管理员创建失败`);
  return false;
}

// ==================== Story 接口测试 ====================

/**
 * 1. 发布故事测试
 */
async function testCreateStory() {
  console.log('\n========== 1. 发布故事测试 ==========\n');

  // 1.1 正常发布故事
  console.log('\n--- 1.1 正常发布故事 ---');
  const res1 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '这是一个测试故事',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    location: { lat: 39.90923, lng: 116.397428 },
    // locationName: '北京天安门', // TODO: 后端 validator 缺少此字段定义，暂时移除
    emotionTag: '开心'
  }, {}, userToken, '正常测试：发布一个普通故事');
  
  if (res1.status === 200 || res1.status === 201) {
    storyId = res1.data?.data?.id;
    console.log(`[INFO] 故事发布成功: ID=${storyId}`);
  }
  assert(res1.status === 200 || res1.status === 201, '发布故事成功');

  // 1.2 边界测试：无Token发布
  console.log('\n--- 1.2 边界测试：无Token发布 ---');
  const res2 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '无Token测试',
    images: [],
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '开心'
  }, {}, null, '边界测试：无Token发布故事');
  assert(res2.status === 401, '无Token返回401');

  // 1.3 边界测试：内容为空
  console.log('\n--- 1.3 边界测试：内容为空 ---');
  const res3 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '',
    images: [],
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '开心'
  }, {}, userToken, '边界测试：故事内容为空');
  assert(res3.status === 400, '内容为空返回400');

  // 1.4 边界测试：内容过长（超过1000字）
  console.log('\n--- 1.4 边界测试：内容过长 ---');
  const longContent = 'a'.repeat(1001);
  const res4 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: longContent,
    images: [],
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '开心'
  }, {}, userToken, '边界测试：故事内容超过1000字');
  assert(res4.status === 400, '内容过长返回400');

  // 1.5 边界测试：缺少location
  console.log('\n--- 1.5 边界测试：缺少location ---');
  const res5 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '测试缺少位置',
    images: [],
    emotionTag: '开心'
  }, {}, userToken, '边界测试：缺少位置参数');
  assert(res5.status === 400, '缺少location返回400');

  // 1.6 边界测试：缺少emotionTag
  console.log('\n--- 1.6 边界测试：缺少emotionTag ---');
  const res6 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '测试缺少情感标签',
    images: [],
    location: { lat: 39.90923, lng: 116.397428 }
  }, {}, userToken, '边界测试：缺少情感标签');
  assert(res6.status === 400, '缺少emotionTag返回400');

  // 1.7 边界测试：无效的emotionTag
  console.log('\n--- 1.7 边界测试：无效的emotionTag ---');
  const res7 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '测试无效情感标签',
    images: [],
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '无效标签'
  }, {}, userToken, '边界测试：无效的情感标签');
  assert(res7.status === 400, '无效emotionTag返回400');

  // 1.8 边界测试：纬度超出范围
  console.log('\n--- 1.8 边界测试：纬度超出范围 ---');
  const res8 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '测试纬度超出',
    images: [],
    location: { lat: 100, lng: 116.397428 },
    emotionTag: '开心'
  }, {}, userToken, '边界测试：纬度超出范围');
  assert(res8.status === 400, '纬度超出范围返回400');

  // 1.9 边界测试：经度超出范围
  console.log('\n--- 1.9 边界测试：经度超出范围 ---');
  const res9 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '测试经度超出',
    images: [],
    location: { lat: 39.90923, lng: 200 },
    emotionTag: '开心'
  }, {}, userToken, '边界测试：经度超出范围');
  assert(res9.status === 400, '经度超出范围返回400');

  // 1.10 边界测试：图片数组超过9张
  console.log('\n--- 1.10 边界测试：图片超过9张 ---');
  const tooManyImages = Array(10).fill('https://example.com/image.jpg');
  const res10 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '测试图片过多',
    images: tooManyImages,
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '开心'
  }, {}, userToken, '边界测试：图片数量超过9张');
  assert(res10.status === 400, '图片超过9张返回400');

  // 1.11 边界测试：图片URL格式无效
  console.log('\n--- 1.11 边界测试：图片URL格式无效 ---');
  const res11 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '测试无效图片URL',
    images: ['invalid-url'],
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '开心'
  }, {}, userToken, '边界测试：图片URL格式无效');
  assert(res11.status === 400, '无效图片URL返回400');

  // 1.12 发布时光胶囊故事
  console.log('\n--- 1.12 发布时光胶囊故事 ---');
  const unlockTime = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 一年后解锁
  const res12 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '这是一个时光胶囊故事',
    images: [],
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '治愈',
    isTimeCapsule: true,
    unlockAt: unlockTime
  }, {}, userToken, '正常测试：发布时光胶囊故事');
  
  if (res12.status === 200 || res12.status === 201) {
    timeCapsuleStoryId = res12.data?.data?.id;
    console.log(`[INFO] 时光胶囊故事发布成功: ID=${timeCapsuleStoryId}`);
  }
  assert(res12.status === 200 || res12.status === 201, '发布时光胶囊成功');

  // 1.13 边界测试：时光胶囊解锁时间在过去
  console.log('\n--- 1.13 边界测试：解锁时间在过去 ---');
  const pastTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const res13 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '测试过去解锁时间',
    images: [],
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '开心',
    isTimeCapsule: true,
    unlockAt: pastTime
  }, {}, userToken, '边界测试：时光胶囊解锁时间在过去');
  assert(res13.status === 400, '解锁时间在过去返回400');

  // 1.14 边界测试：无效的visibility值
  console.log('\n--- 1.14 边界测试：无效的visibility值 ---');
  const res14 = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '测试无效可见性',
    images: [],
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '开心',
    visibility: 'invalid'
  }, {}, userToken, '边界测试：无效的visibility值');
  assert(res14.status === 400 || res14.status === 500, '无效visibility返回400/500');
}

/**
 * 2. 查看故事详情测试
 */
async function testGetStoryById() {
  console.log('\n========== 2. 查看故事详情测试 ==========\n');

  // 2.1 正常查看故事详情
  console.log('\n--- 2.1 正常查看故事详情 ---');
  if (storyId) {
    const res1 = await sendRequest('GET', `${BASE_URL}/api/stories/${storyId}`, null, {}, userToken, '正常测试：查看故事详情');
    assert(res1.status === 200, '查看故事详情成功');
    assert(res1.data?.data?.id === storyId, '返回正确的故事ID');
  } else {
    console.log('[SKIP] 跳过正常查看测试（故事创建失败）');
  }

  // 2.2 边界测试：查看不存在的故事
  console.log('\n--- 2.2 边界测试：查看不存在的故事 ---');
  const res2 = await sendRequest('GET', `${BASE_URL}/api/stories/999999`, null, {}, null, '边界测试：查看不存在的故事');
  assert(res2.status === 404 || res2.status === 500, '不存在的故事返回404/500');

  // 2.3 边界测试：无效的故事ID格式
  console.log('\n--- 2.3 边界测试：无效的故事ID格式 ---');
  const res3 = await sendRequest('GET', `${BASE_URL}/api/stories/invalid`, null, {}, null, '边界测试：无效的故事ID格式');
  assert(res3.status === 400 || res3.status === 500, '无效ID格式返回400/500');

  // 2.4 无Token查看故事（可选认证，应该也能查看）
  console.log('\n--- 2.4 无Token查看故事 ---');
  if (storyId) {
    const res4 = await sendRequest('GET', `${BASE_URL}/api/stories/${storyId}`, null, {}, null, '正常测试：无Token查看公开故事');
    assert(res4.status === 200, '无Token可查看公开故事');
  } else {
    console.log('[SKIP] 跳过无Token查看测试（故事创建失败）');
  }
}

/**
 * 3. 我的故事列表测试
 */
async function testGetMyStories() {
  console.log('\n========== 3. 我的故事列表测试 ==========\n');

  // 3.1 正常获取我的故事列表
  console.log('\n--- 3.1 正常获取我的故事列表 ---');
  const res1 = await sendRequest('GET', `${BASE_URL}/api/stories/me/list?page=1&limit=10`, null, {}, userToken, '正常测试：获取我的故事列表');
  assert(res1.status === 200, '获取我的故事列表成功');

  // 3.2 边界测试：无Token获取
  console.log('\n--- 3.2 边界测试：无Token获取我的故事列表 ---');
  const res2 = await sendRequest('GET', `${BASE_URL}/api/stories/me/list`, null, {}, null, '边界测试：无Token获取我的故事列表');
  assert(res2.status === 401, '无Token返回401');

  // 3.3 测试分页参数
  console.log('\n--- 3.3 测试分页参数 ---');
  const res3 = await sendRequest('GET', `${BASE_URL}/api/stories/me/list?page=2&limit=5`, null, {}, userToken, '正常测试：使用分页参数获取故事列表');
  assert(res3.status === 200, '分页参数正常');

  // 3.4 边界测试：无效的分页参数
  console.log('\n--- 3.4 边界测试：无效的分页参数 ---');
  const res4 = await sendRequest('GET', `${BASE_URL}/api/stories/me/list?page=-1&limit=10`, null, {}, userToken, '边界测试：使用负数页码');
  assert(res4.status === 200, '负数页码返回空列表或正常处理');
}

/**
 * 4. 搜索故事测试
 */
async function testSearchStories() {
  console.log('\n========== 4. 搜索故事测试 ==========\n');

  // 4.1 正常搜索故事
  console.log('\n--- 4.1 正常搜索故事 ---');
  const res1 = await sendRequest('GET', `${BASE_URL}/api/stories/search?keyword=测试&page=1&limit=10`, null, {}, userToken, '正常测试：搜索故事');
  assert(res1.status === 200, '搜索故事成功');

  // 4.2 边界测试：缺少关键词
  console.log('\n--- 4.2 边界测试：缺少搜索关键词 ---');
  const res2 = await sendRequest('GET', `${BASE_URL}/api/stories/search?page=1&limit=10`, null, {}, null, '边界测试：缺少搜索关键词');
  assert(res2.status === 400, '缺少关键词返回400');

  // 4.3 边界测试：空关键词
  console.log('\n--- 4.3 边界测试：空搜索关键词 ---');
  const res3 = await sendRequest('GET', `${BASE_URL}/api/stories/search?keyword=&page=1&limit=10`, null, {}, null, '边界测试：空搜索关键词');
  assert(res3.status === 400, '空关键词返回400');

  // 4.4 无Token搜索（可选认证）
  console.log('\n--- 4.4 无Token搜索故事 ---');
  const res4 = await sendRequest('GET', `${BASE_URL}/api/stories/search?keyword=故事&page=1&limit=10`, null, {}, null, '正常测试：无Token搜索故事');
  assert(res4.status === 200, '无Token可搜索故事');
}

/**
 * 5. 修改故事内容测试
 */
async function testModifyStory() {
  console.log('\n========== 5. 修改故事内容测试 ==========\n');

  // 5.1 正常修改故事
  console.log('\n--- 5.1 正常修改故事内容 ---');
  if (storyId) {
    const res1 = await sendRequest('POST', `${BASE_URL}/api/stories/${storyId}`, {
      content: '这是修改后的故事内容',
      emotionTag: '治愈'
    }, {}, userToken, '正常测试：修改故事内容');
    assert(res1.status === 200, '修改故事成功');
  } else {
    console.log('[SKIP] 跳过正常修改测试（故事创建失败）');
  }

  // 5.2 边界测试：无Token修改
  console.log('\n--- 5.2 边界测试：无Token修改故事 ---');
  if (storyId) {
    const res2 = await sendRequest('POST', `${BASE_URL}/api/stories/${storyId}`, {
      content: '无Token修改测试'
    }, {}, null, '边界测试：无Token修改故事');
    assert(res2.status === 401, '无Token返回401');
  } else {
    const res2 = await sendRequest('POST', `${BASE_URL}/api/stories/999998`, {
      content: '无Token修改测试'
    }, {}, null, '边界测试：无Token修改故事');
    assert(res2.status === 401, '无Token返回401');
  }

  // 5.3 边界测试：修改不存在的故事�
  console.log('\n--- 5.3 边界测试：修改不存在的故事 ---');
  const res3 = await sendRequest('POST', `${BASE_URL}/api/stories/999999`, {
    content: '修改不存在的故事'
  }, {}, userToken, '边界测试：修改不存在的故事');
  assert(res3.status === 404 || res3.status === 500, '不存在的故事返回404/500');

  // 5.4 边界测试：修改其他用户的故事
  console.log('\n--- 5.4 边界测试：修改其他用户的故事 ---');
  // 创建另一个用户并尝试修改
  const timestamp = Date.now();
  const otherEmail = `${TEST_PREFIX}other_${timestamp}@test.com`;
  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username: `${TEST_PREFIX}other_${timestamp}`,
    email: otherEmail,
    password: 'Test123456'
  }, {}, null, '创建另一个测试用户');
  
  if (registerRes.status === 200 && storyId) {
    const otherToken = registerRes.data?.data?.accessToken;
    const res4 = await sendRequest('POST', `${BASE_URL}/api/stories/${storyId}`, {
      content: '修改别人的故事'
    }, {}, otherToken, '边界测试：修改其他用户的故事');
    assert(res4.status === 403 || res4.status === 500, '修改他人故事返回403/500');
  } else {
    console.log('[SKIP] 跳过修改他人故事测试');
  }

  // 5.5 边界测试：无效的emotionTag
  console.log('\n--- 5.5 边界测试：修改为无效的emotionTag ---');
  if (storyId) {
    const res5 = await sendRequest('POST', `${BASE_URL}/api/stories/${storyId}`, {
      content: '测试内容',
      emotionTag: '无效标签'
    }, {}, userToken, '边界测试：修改为无效的情感标签');
    assert(res5.status === 400 || res5.status === 500, '无效emotionTag返回400/500');
  } else {
    console.log('[SKIP] 跳过无效emotionTag测试（故事创建失败）');
  }
}

/**
 * 6. 修改故事可见性测试
 */
async function testUpdateVisibility() {
  console.log('\n========== 6. 修改故事可见性测试 ==========\n');

  // 6.1 正常修改可见性
  console.log('\n--- 6.1 正常修改可见性 ---');
  if (storyId) {
    const res1 = await sendRequest('PUT', `${BASE_URL}/api/stories/${storyId}/visibility`, {
      visibility: 'public'
    }, {}, userToken, '正常测试：修改故事可见性为public');
    assert(res1.status === 200, '修改可见性成功');
  } else {
    console.log('[SKIP] 跳过正常修改可见性测试（故事创建失败）');
  }

  // 6.2 边界测试：无Token修改
  console.log('\n--- 6.2 边界测试：无Token修改可见性 ---');
  if (storyId) {
    const res2 = await sendRequest('PUT', `${BASE_URL}/api/stories/${storyId}/visibility`, {
      visibility: 'public'
    }, {}, null, '边界测试：无Token修改可见性');
    assert(res2.status === 401, '无Token返回401');
  } else {
    const res2 = await sendRequest('PUT', `${BASE_URL}/api/stories/999998/visibility`, {
      visibility: 'public'
    }, {}, null, '边界测试：无Token修改可见性');
    assert(res2.status === 401, '无Token返回401');
  }

  // 6.3 边界测试：无效的visibility值
  console.log('\n--- 6.3 边界测试：无效的visibility值 ---');
  if (storyId) {
    const res3 = await sendRequest('PUT', `${BASE_URL}/api/stories/${storyId}/visibility`, {
      visibility: 'invalid'
    }, {}, userToken, '边界测试：无效的visibility值');
    assert(res3.status === 400 || res3.status === 500, '无效visibility返回400/500');
  } else {
    console.log('[SKIP] 跳过无效visibility测试（故事创建失败）');
  }

  // 6.4 边界测试：缺少visibility参数
  console.log('\n--- 6.4 边界测试：缺少visibility参数 ---');
  if (storyId) {
    const res4 = await sendRequest('PUT', `${BASE_URL}/api/stories/${storyId}/visibility`, {}, {}, userToken, '边界测试：缺少visibility参数');
    assert(res4.status === 400 || res4.status === 500, '缺少visibility返回400/500');
  } else {
    console.log('[SKIP] 跳过缺少visibility测试（故事创建失败）');
  }

  // 6.5 边界测试：修改不存在的故事的可见性
  console.log('\n--- 6.5 边界测试：修改不存在的故事可见性 ---');
  const res5 = await sendRequest('PUT', `${BASE_URL}/api/stories/999999/visibility`, {
    visibility: 'public'
  }, {}, userToken, '边界测试：修改不存在的故事可见性');
  assert(res5.status === 404 || res5.status === 500, '不存在的故事返回404/500');
}

/**
 * 7. 删除故事测试
 */
async function testDeleteStory() {
  console.log('\n========== 7. 删除故事测试 ==========\n');

  // 先创建一个用于删除测试的故事
  const createRes = await sendRequest('POST', `${BASE_URL}/api/stories`, {
    content: '这是要被删除的故事',
    images: [],
    location: { lat: 39.90923, lng: 116.397428 },
    emotionTag: '开心'
  }, {}, userToken, '创建用于删除测试的故事');
  
  let deleteStoryId = null;
  if (createRes.status === 200 || createRes.status === 201) {
    deleteStoryId = createRes.data?.data?.id;
  }

  // 7.1 正常删除故事
  console.log('\n--- 7.1 正常删除故事 ---');
  if (deleteStoryId) {
    const res1 = await sendRequest('DELETE', `${BASE_URL}/api/stories/${deleteStoryId}`, null, {}, userToken, '正常测试：删除故事');
    assert(res1.status === 200, '删除故事成功');
  } else {
    console.log('[SKIP] 跳过正常删除测试（故事创建失败）');
  }

  // 7.2 边界测试：无Token删除
  console.log('\n--- 7.2 边界测试：无Token删除故事 ---');
  if (storyId) {
    const res2 = await sendRequest('DELETE', `${BASE_URL}/api/stories/${storyId}`, null, {}, null, '边界测试：无Token删除故事');
    assert(res2.status === 401, '无Token返回401');
  } else {
    const res2 = await sendRequest('DELETE', `${BASE_URL}/api/stories/999998`, null, {}, null, '边界测试：无Token删除故事');
    assert(res2.status === 401, '无Token返回401');
  }

  // 7.3 边界测试：删除不存在的故事
  console.log('\n--- 7.3 边界测试：删除不存在的故事 ---');
  const res3 = await sendRequest('DELETE', `${BASE_URL}/api/stories/999999`, null, {}, userToken, '边界测试：删除不存在的故事');
  assert(res3.status === 404 || res3.status === 500, '不存在的故事返回404/500');

  // 7.4 边界测试：重复删除
  console.log('\n--- 7.4 边界测试：重复删除 ---');
  if (deleteStoryId) {
    const res4 = await sendRequest('DELETE', `${BASE_URL}/api/stories/${deleteStoryId}`, null, {}, userToken, '边界测试：重复删除已删除的故事');
    assert(res4.status === 404 || res4.status === 500, '重复删除返回404/500');
  } else {
    console.log('[SKIP] 跳过重复删除测试（故事创建失败）');
  }
}

/**
 * 8. 获取OSS上传凭证测试
 */
async function testGetUploadToken() {
  console.log('\n========== 8. 获取OSS上传凭证测试 ==========\n');

  // 8.1 正常获取上传凭证
  console.log('\n--- 8.1 正常获取OSS上传凭证 ---');
  const res1 = await sendRequest('GET', `${BASE_URL}/api/stories/upload-token`, null, {}, userToken, '正常测试：获取OSS上传凭证');
  assert(res1.status === 200, '获取上传凭证成功');

  // 8.2 边界测试：无Token获取
  console.log('\n--- 8.2 边界测试：无Token获取上传凭证 ---');
  const res2 = await sendRequest('GET', `${BASE_URL}/api/stories/upload-token`, null, {}, null, '边界测试：无Token获取OSS上传凭证');
  assert(res2.status === 401, '无Token返回401');
}

/**
 * 9. 解锁时光胶囊测试
 */
async function testUnlockTimeCapsule() {
  console.log('\n========== 9. 解锁时光胶囊测试 ==========\n');

  // 9.1 边界测试：尝试解锁未到时间的时光胶囊
  console.log('\n--- 9.1 边界测试：尝试解锁未到时间的时光胶囊 ---');
  if (timeCapsuleStoryId) {
    const res1 = await sendRequest('POST', `${BASE_URL}/api/stories/${timeCapsuleStoryId}/unlock`, null, {}, null, '边界测试：解锁未到时间的时光胶囊');
    assert(res1.status === 400 || res1.status === 500, '未到时间解锁返回400/500');
  }

  // 9.2 边界测试：解锁不存在的故事
  console.log('\n--- 9.2 边界测试：解锁不存在的故事 ---');
  const res2 = await sendRequest('POST', `${BASE_URL}/api/stories/999999/unlock`, null, {}, null, '边界测试：解锁不存在的故事');
  assert(res2.status === 404 || res2.status === 500, '不存在的故事返回404/500');

  // 9.3 边界测试：解锁普通故事（非时光胶囊）
  console.log('\n--- 9.3 边界测试：解锁非时光胶囊故事 ---');
  if (storyId) {
    const res3 = await sendRequest('POST', `${BASE_URL}/api/stories/${storyId}/unlock`, null, {}, null, '边界测试：解锁非时光胶囊故事');
    assert(res3.status === 400 || res3.status === 500, '非时光胶囊返回400/500');
  }
}

/**
 * 10. 管理员获取所有帖子测试
 */
async function testAdminGetAllStories() {
  console.log('\n========== 10. 管理员获取所有帖子测试 ==========\n');

  // 10.1 管理员正常获取所有帖子
  console.log('\n--- 10.1 管理员正常获取所有帖子 ---');
  const res1 = await sendRequest('GET', `${BASE_URL}/api/stories/admin/all?page=1&limit=20`, null, {}, adminToken, '正常测试：管理员获取所有帖子');
  assert(res1.status === 200, '管理员获取所有帖子成功');

  // 10.2 边界测试：无Token获取
  console.log('\n--- 10.2 边界测试：无Token获取所有帖子 ---');
  const res2 = await sendRequest('GET', `${BASE_URL}/api/stories/admin/all`, null, {}, null, '边界测试：无Token获取所有帖子');
  assert(res2.status === 401, '无Token返回401');

  // 10.3 边界测试：普通用户获取所有帖子
  console.log('\n--- 10.3 边界测试：普通用户获取所有帖子 ---');
  const res3 = await sendRequest('GET', `${BASE_URL}/api/stories/admin/all`, null, {}, userToken, '边界测试：普通用户尝试获取所有帖子');
  assert(res3.status === 403, '普通用户返回403');

  // 10.4 测试按可见性筛选
  console.log('\n--- 10.4 测试按可见性筛选 ---');
  const res4 = await sendRequest('GET', `${BASE_URL}/api/stories/admin/all?visibility=public&page=1&limit=20`, null, {}, adminToken, '正常测试：管理员按可见性筛选帖子');
  assert(res4.status === 200, '按可见性筛选成功');

  // 10.5 测试分页参数
  console.log('\n--- 10.5 测试分页参数 ---');
  const res5 = await sendRequest('GET', `${BASE_URL}/api/stories/admin/all?page=2&limit=10`, null, {}, adminToken, '正常测试：管理员使用分页参数');
  assert(res5.status === 200, '分页参数正常');
}

// ==================== 保存报告 ====================

async function saveRequestRecords() {
  const fs = await import('fs');
  const path = await import('path');
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'request-records');
  const reportPath = path.join(reportDir, `story_request_${now}.md`);
  
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  fs.writeFileSync(reportPath, generateReportContent());
  console.log(`[INFO] 请求记录已保存: ${reportPath}`);
}

async function saveTestReport() {
  const fs = await import('fs');
  const path = await import('path');
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'test-reports');
  const reportPath = path.join(reportDir, `story_test_report_${now}.txt`);
  
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  let content = `EchoStar Story模块测试报告\n`;
  content += `测试时间: ${new Date().toISOString()}\n`;
  content += `服务器: ${BASE_URL}\n`;
  content += `${'='.repeat(50)}\n\n`;
  
  requestRecords.forEach(record => {
    const status = record.返回状态 >= 200 && record.返回状态 < 300 ? 'PASS' : 
                   record.返回状态 >= 400 && record.返回状态 < 500 ? 'FAIL' : 'ERROR';
    content += `[${status}] ${record.请求类型} ${record.接口地址} - 状态码: ${record.返回状态} - ${record.测试说明}\n`;
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
  let content = `# EchoStar API 测试报告 - Story模块\n\n`;
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

function printTestReport() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ╔════════════════════════════════════════════════════╗`);
  console.log(`[${now}] ║          EchoStar API 测试报告 - Story模块         ║`);
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
  console.log(`[${now}] ║              Story 模块测试开始                    ║`);
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

  try {
    // 测试准备
    console.log('========== 测试准备 ==========');
    
    if (!await setupTestUser()) {
      console.error('[ERROR] 无法创建测试用户，测试终止');
      return;
    }

    if (!await setupAdminUser()) {
      console.error('[ERROR] 无法创建管理员用户，测试终止');
      return;
    }

    // 执行测试
    await testCreateStory();          // 1. 发布故事测试
    await testGetStoryById();         // 2. 查看故事详情测试
    await testGetMyStories();         // 3. 我的故事列表测试
    await testSearchStories();        // 4. 搜索故事测试
    await testModifyStory();          // 5. 修改故事内容测试
    await testUpdateVisibility();     // 6. 修改故事可见性测试
    await testDeleteStory();          // 7. 删除故事测试
    await testGetUploadToken();       // 8. 获取OSS上传凭证测试
    await testUnlockTimeCapsule();    // 9. 解锁时光胶囊测试
    await testAdminGetAllStories();   // 10. 管理员获取所有帖子测试

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
