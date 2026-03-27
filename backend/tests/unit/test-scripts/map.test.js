/**
 * Map 模块测试脚本
 * 
 * 测试接口：
 *   - GET /api/map/explore - 范围查询故事
 *   - GET /api/map/wall - 同地点故事墙
 *   - GET /api/map/clusters - 获取聚合数据
 * 
 * 测试流程：
 *   1. 创建用户并发布多个带位置的故事
 *   2. 测试 explore 接口（各种边界测试）
 *   3. 测试 wall 接口（各种边界测试）
 *   4. 测试 clusters 接口（各种边界测试）
 * 
 * 使用方式：
 *   node map.test.js          # 正常运行（不重置环境）
 *   node map.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PREFIX = 'map_test_';
const SHOULD_RESET = process.argv.includes('--reset');

// 测试用户
let userToken = null;
let userId = null;
let userEmail = null;

// 测试故事ID列表
let storyIds = [];

// 北京坐标
const BEIJING_LAT = 39.90923;
const BEIJING_LNG = 116.397428;

// 上海坐标（用于测试不同城市）
const SHANGHAI_LAT = 31.2304;
const SHANGHAI_LNG = 121.4737;

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

// ==================== 测试准备 ====================

async function setupTestUser() {
  const timestamp = Date.now();
  const username = `${TEST_PREFIX}user_${timestamp}`;
  userEmail = `${TEST_PREFIX}${timestamp}@test.com`;
  const password = 'Test123456';

  console.log(`\n[账号创建] 测试用户: ${username}`);

  const registerRes = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username,
    email: userEmail,
    password
  }, {}, null, '创建测试用户（无需验证码）');

  if (registerRes.status === 200 || registerRes.data?.code === 0) {
    userId = registerRes.data?.data?.user?.id;
    userToken = registerRes.data?.data?.accessToken;
    console.log(`[INFO] 用户创建成功: ID=${userId}`);
    return true;
  }
  console.log(`[WARN] 用户创建失败: ${registerRes.status}`);
  return false;
}

async function createTestStories() {
  console.log('\n[故事创建] 创建多个带位置的测试故事...');

  // 创建北京地区的故事 - 多个故事在同一位置附近以触发聚合
  const stories = [
    // 天安门附近的故事（用于聚合测试 - 同一网格内多个故事）
    { content: '北京天安门故事1', lat: 39.90923, lng: 116.397428, emotionTag: '打卡' },
    { content: '北京天安门故事2', lat: 39.90924, lng: 116.397430, emotionTag: '开心' },
    { content: '北京天安门故事3', lat: 39.90925, lng: 116.397432, emotionTag: '治愈' },
    { content: '北京天安门故事4', lat: 39.90926, lng: 116.397434, emotionTag: '打卡' },
    { content: '北京天安门故事5', lat: 39.90927, lng: 116.397436, emotionTag: '开心' },
    // 稍远一点的故事（单独的网格，用于测试 point 类型）
    { content: '北京故宫的故事', lat: 39.9163, lng: 116.3972, emotionTag: '开心' },
  ];

  for (const storyData of stories) {
    const res = await sendRequest('POST', `${BASE_URL}/api/stories`, {
      content: storyData.content,
      images: ['https://example.com/test.jpg'],
      emotionTag: storyData.emotionTag,
      location: { lat: storyData.lat, lng: storyData.lng }
    }, {}, userToken, `创建测试故事: ${storyData.content}`);

    console.log(`[DEBUG] 故事创建响应: status=${res.status}, data=${JSON.stringify(res.data)}`);

    if (res.status === 200 || res.data?.code === 0) {
      const storyId = res.data?.data?.id;
      storyIds.push(storyId);
      console.log(`[INFO] 故事创建成功: ID=${storyId}, 内容="${storyData.content}"`);
    } else {
      console.log(`[WARN] 故事创建失败: ${storyData.content}, status=${res.status}, error=${JSON.stringify(res.data)}`);
    }
  }

  return storyIds.length > 0;
}

// ==================== Map 接口测试 ====================

/**
 * 1. explore 接口测试 - 范围查询故事
 */
async function testExploreStories() {
  console.log('\n========== 1. explore 接口测试（范围查询故事） ==========\n');

  // 1.1 正常查询
  console.log('\n--- 1.1 正常范围查询 ---');
  const res1 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&radius=5000`, 
    null, {}, null, '正常测试：在北京范围内查询故事'
  );
  assert(res1.status === 200, '范围查询成功');
  if (res1.status === 200) {
    console.log(`[INFO] 查询到 ${res1.data?.data?.stories?.length || 0} 个故事`);
  }

  // 1.2 边界测试：缺少lat参数
  console.log('\n--- 1.2 边界测试：缺少纬度参数 ---');
  const res2 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lng=${BEIJING_LNG}&radius=1000`, 
    null, {}, null, '边界测试：缺少纬度参数'
  );
  assert(res2.status === 400, '缺少纬度返回400');

  // 1.3 边界测试：缺少lng参数
  console.log('\n--- 1.3 边界测试：缺少经度参数 ---');
  const res3 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lat=${BEIJING_LAT}&radius=1000`, 
    null, {}, null, '边界测试：缺少经度参数'
  );
  assert(res3.status === 400, '缺少经度返回400');

  // 1.4 边界测试：纬度超出范围
  console.log('\n--- 1.4 边界测试：纬度超出范围（>90） ---');
  const res4 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lat=91&lng=${BEIJING_LNG}&radius=1000`, 
    null, {}, null, '边界测试：纬度超出范围（大于90）'
  );
  assert(res4.status === 400, '纬度超出范围返回400');

  // 1.5 边界测试：纬度超出范围（<-90）
  console.log('\n--- 1.5 边界测试：纬度超出范围（<-90） ---');
  const res5 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lat=-91&lng=${BEIJING_LNG}&radius=1000`, 
    null, {}, null, '边界测试：纬度超出范围（小于-90）'
  );
  assert(res5.status === 400, '纬度超出范围返回400');

  // 1.6 边界测试：经度超出范围
  console.log('\n--- 1.6 边界测试：经度超出范围（>180） ---');
  const res6 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lat=${BEIJING_LAT}&lng=181&radius=1000`, 
    null, {}, null, '边界测试：经度超出范围（大于180）'
  );
  assert(res6.status === 400, '经度超出范围返回400');

  // 1.7 边界测试：半径过小
  console.log('\n--- 1.7 边界测试：半径过小（<10米） ---');
  const res7 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&radius=5`, 
    null, {}, null, '边界测试：半径过小（小于10米）'
  );
  assert(res7.status === 400, '半径过小返回400');

  // 1.8 边界测试：半径过大
  console.log('\n--- 1.8 边界测试：半径过大（>5000米） ---');
  const res8 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&radius=6000`, 
    null, {}, null, '边界测试：半径过大（大于5000米）'
  );
  assert(res8.status === 400, '半径过大返回400');

  // 1.9 边界测试：无效的坐标格式
  console.log('\n--- 1.9 边界测试：无效的坐标格式 ---');
  const res9 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lat=abc&lng=${BEIJING_LNG}&radius=1000`, 
    null, {}, null, '边界测试：纬度为非数字'
  );
  assert(res9.status === 400, '无效坐标格式返回400');

  // 1.10 测试不同城市的查询（上海，应该查不到北京的故事）
  console.log('\n--- 1.10 测试不同城市的查询 ---');
  const res10 = await sendRequest('GET', 
    `${BASE_URL}/api/map/explore?lat=${SHANGHAI_LAT}&lng=${SHANGHAI_LNG}&radius=1000`, 
    null, {}, null, '边界测试：在上海查询（应该查不到北京的故事）'
  );
  assert(res10.status === 200, '不同城市查询成功');
}

/**
 * 2. wall 接口测试 - 同地点故事墙
 */
async function testLocationWall() {
  console.log('\n========== 2. wall 接口测试（同地点故事墙） ==========\n');

  // 2.1 正常查询
  console.log('\n--- 2.1 正常查询故事墙 ---');
  const res1 = await sendRequest('GET', 
    `${BASE_URL}/api/map/wall?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&radius=5000`, 
    null, {}, null, '正常测试：查询北京地区故事墙'
  );
  assert(res1.status === 200, '故事墙查询成功');
  if (res1.status === 200) {
    console.log(`[INFO] 故事墙查询到 ${res1.data?.data?.stories?.length || 0} 个故事`);
  }

  // 2.2 边界测试：缺少lat参数
  console.log('\n--- 2.2 边界测试：缺少纬度参数 ---');
  const res2 = await sendRequest('GET', 
    `${BASE_URL}/api/map/wall?lng=${BEIJING_LNG}&radius=50`, 
    null, {}, null, '边界测试：缺少纬度参数'
  );
  assert(res2.status === 400, '缺少纬度返回400');

  // 2.3 边界测试：缺少lng参数
  console.log('\n--- 2.3 边界测试：缺少经度参数 ---');
  const res3 = await sendRequest('GET', 
    `${BASE_URL}/api/map/wall?lat=${BEIJING_LAT}&radius=50`, 
    null, {}, null, '边界测试：缺少经度参数'
  );
  assert(res3.status === 400, '缺少经度返回400');

  // 2.4 边界测试：纬度超出范围
  console.log('\n--- 2.4 边界测试：纬度超出范围 ---');
  const res4 = await sendRequest('GET', 
    `${BASE_URL}/api/map/wall?lat=100&lng=${BEIJING_LNG}&radius=50`, 
    null, {}, null, '边界测试：纬度超出范围（大于90）'
  );
  assert(res4.status === 400, '纬度超出范围返回400');

  // 2.5 边界测试：经度超出范围
  console.log('\n--- 2.5 边界测试：经度超出范围 ---');
  const res5 = await sendRequest('GET', 
    `${BASE_URL}/api/map/wall?lat=${BEIJING_LAT}&lng=200&radius=50`, 
    null, {}, null, '边界测试：经度超出范围（大于180）'
  );
  assert(res5.status === 400, '经度超出范围返回400');

  // 2.6 边界测试：半径过小
  console.log('\n--- 2.6 边界测试：半径过小 ---');
  const res6 = await sendRequest('GET', 
    `${BASE_URL}/api/map/wall?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&radius=5`, 
    null, {}, null, '边界测试：半径过小（小于10米）'
  );
  assert(res6.status === 400, '半径过小返回400');

  // 2.7 边界测试：半径过大
  console.log('\n--- 2.7 边界测试：半径过大 ---');
  const res7 = await sendRequest('GET', 
    `${BASE_URL}/api/map/wall?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&radius=6000`, 
    null, {}, null, '边界测试：半径过大（大于5000米）'
  );
  assert(res7.status === 400, '半径过大返回400');

  // 2.8 测试默认半径
  console.log('\n--- 2.8 测试默认半径 ---');
  const res8 = await sendRequest('GET', 
    `${BASE_URL}/api/map/wall?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}`, 
    null, {}, null, '正常测试：使用默认半径查询故事墙'
  );
  assert(res8.status === 200, '默认半径查询成功');
}

/**
 * 3. clusters 接口测试 - 获取聚合数据
 */
async function testClusterData() {
  console.log('\n========== 3. clusters 接口测试（获取聚合数据） ==========\n');

  // 大范围查询（lngSpan > 1，网格大小 1000米）
  const northEast = { lat: 41, lng: 118 };
  const southWest = { lat: 39, lng: 116 };

  // 3.1 正常查询 - 大范围
  console.log('\n--- 3.1 正常查询聚合数据（大范围） ---');
  const res1 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?northEast=${JSON.stringify(northEast)}&southWest=${JSON.stringify(southWest)}`, 
    null, {}, null, '正常测试：查询北京地区聚合数据（大范围）'
  );
  assert(res1.status === 200, '聚合数据查询成功');
  if (res1.status === 200) {
    const clusters = res1.data?.data || [];
    console.log(`[INFO] 查询到 ${clusters.length} 个聚合点`);
    const clusterCount = clusters.filter(c => c.type === 'cluster').length;
    const pointCount = clusters.filter(c => c.type === 'point').length;
    console.log(`[INFO] cluster类型: ${clusterCount} 个, point类型: ${pointCount} 个`);
  }

  // 3.2 小范围查询 - 应该触发聚合（因为5个故事在同一位置附近）
  console.log('\n--- 3.2 小范围聚合查询（触发cluster） ---');
  const smallNorthEast = { lat: 39.91, lng: 116.40 };
  const smallSouthWest = { lat: 39.90, lng: 116.39 };
  const res2 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?northEast=${JSON.stringify(smallNorthEast)}&southWest=${JSON.stringify(smallSouthWest)}`, 
    null, {}, null, '正常测试：小范围聚合查询，应触发聚合'
  );
  assert(res2.status === 200, '小范围聚合查询成功');
  if (res2.status === 200) {
    const clusters = res2.data?.data || [];
    console.log(`[INFO] 小范围查询到 ${clusters.length} 个聚合点`);
    const clusterItems = clusters.filter(c => c.type === 'cluster');
    const pointItems = clusters.filter(c => c.type === 'point');
    console.log(`[INFO] cluster类型: ${clusterItems.length} 个, point类型: ${pointItems.length} 个`);
    if (clusterItems.length > 0) {
      console.log(`[INFO] 聚合成功！cluster包含 ${clusterItems[0].count} 个故事`);
    }
  }

  // 3.3 边界测试：缺少northEast参数
  console.log('\n--- 3.3 边界测试：缺少northEast参数 ---');
  const res3 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?southWest=${JSON.stringify(southWest)}`, 
    null, {}, null, '边界测试：缺少northEast参数'
  );
  assert(res3.status === 400, '缺少northEast返回400');

  // 3.4 边界测试：缺少southWest参数
  console.log('\n--- 3.4 边界测试：缺少southWest参数 ---');
  const res4 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?northEast=${JSON.stringify(northEast)}`, 
    null, {}, null, '边界测试：缺少southWest参数'
  );
  assert(res4.status === 400, '缺少southWest返回400');

  // 3.5 边界测试：无效的JSON格式
  console.log('\n--- 3.5 边界测试：无效的JSON格式 ---');
  const res5 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?northEast=invalid&southWest=${JSON.stringify(southWest)}`, 
    null, {}, null, '边界测试：northEast为无效JSON'
  );
  assert(res5.status === 400, '无效JSON格式返回400');

  // 3.6 边界测试：northEast中纬度超出范围
  console.log('\n--- 3.6 边界测试：northEast中纬度超出范围 ---');
  const invalidNorthEast = { lat: 100, lng: 118 };
  const res6 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?northEast=${JSON.stringify(invalidNorthEast)}&southWest=${JSON.stringify(southWest)}`, 
    null, {}, null, '边界测试：northEast纬度超出范围'
  );
  assert(res6.status === 400, 'northEast纬度超出范围返回400');

  // 3.7 边界测试：southWest中经度超出范围
  console.log('\n--- 3.7 边界测试：southWest中经度超出范围 ---');
  const invalidSouthWest = { lat: 39, lng: 200 };
  const res7 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?northEast=${JSON.stringify(northEast)}&southWest=${JSON.stringify(invalidSouthWest)}`, 
    null, {}, null, '边界测试：southWest经度超出范围'
  );
  assert(res7.status === 400, 'southWest经度超出范围返回400');

  // 3.8 边界测试：缺少lat属性
  console.log('\n--- 3.8 边界测试：northEast缺少lat属性 ---');
  const noLatNorthEast = { lng: 118 };
  const res8 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?northEast=${JSON.stringify(noLatNorthEast)}&southWest=${JSON.stringify(southWest)}`, 
    null, {}, null, '边界测试：northEast缺少lat属性'
  );
  assert(res8.status === 400, '缺少lat属性返回400');

  // 3.9 边界测试：缺少lng属性
  console.log('\n--- 3.9 边界测试：southWest缺少lng属性 ---');
  const noLngSouthWest = { lat: 39 };
  const res9 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?northEast=${JSON.stringify(northEast)}&southWest=${JSON.stringify(noLngSouthWest)}`, 
    null, {}, null, '边界测试：southWest缺少lng属性'
  );
  assert(res9.status === 400, '缺少lng属性返回400');

  // 3.10 边界测试：空范围（无故事区域）
  console.log('\n--- 3.10 边界测试：空范围查询 ---');
  const emptyNorthEast = { lat: 20, lng: 120 };
  const emptySouthWest = { lat: 19, lng: 119 };
  const res10 = await sendRequest('GET', 
    `${BASE_URL}/api/map/clusters?northEast=${JSON.stringify(emptyNorthEast)}&southWest=${JSON.stringify(emptySouthWest)}`, 
    null, {}, null, '边界测试：查询无故事区域'
  );
  assert(res10.status === 200, '空范围查询成功');
  if (res10.status === 200) {
    const emptyClusters = res10.data?.data || [];
    console.log(`[INFO] 空区域查询到 ${emptyClusters.length} 个聚合点`);
    assert(emptyClusters.length === 0, '空区域应返回空数组');
  }
}

/**
 * 4. random 接口测试 - 随机漫步（加权推荐）
 * GET /api/map/random?lat&lng&mood
 */
async function testRandomWalk() {
  console.log('\n========== 4. random 接口测试（随机漫步） ==========\n');

  // 4.1 正常查询 - 不带心情
  console.log('\n--- 4.1 正常随机漫步（不带心情） ---');
  const res1 = await sendRequest('GET',
    `${BASE_URL}/api/map/random?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}`,
    null, {}, null, '正常测试：在北京随机漫步（不带心情参数）'
  );
  assert(res1.status === 200, '随机漫步成功');
  if (res1.status === 200) {
    console.log(`[INFO] 随机漫步返回数据: ${JSON.stringify(res1.data?.data).substring(0, 200)}`);
  }

  // 4.2 正常查询 - 带心情参数
  console.log('\n--- 4.2 正常随机漫步（心情=开心） ---');
  const res2 = await sendRequest('GET',
    `${BASE_URL}/api/map/random?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&mood=开心`,
    null, {}, null, '正常测试：在北京随机漫步（心情=开心）'
  );
  assert(res2.status === 200, '带心情参数随机漫步成功');

  // 4.3 边界测试：缺少lat参数
  console.log('\n--- 4.3 边界测试：缺少纬度参数 ---');
  const res3 = await sendRequest('GET',
    `${BASE_URL}/api/map/random?lng=${BEIJING_LNG}`,
    null, {}, null, '边界测试：随机漫步缺少纬度参数'
  );
  assert(res3.status === 400, '缺少纬度返回400');

  // 4.4 边界测试：缺少lng参数
  console.log('\n--- 4.4 边界测试：缺少经度参数 ---');
  const res4 = await sendRequest('GET',
    `${BASE_URL}/api/map/random?lat=${BEIJING_LAT}`,
    null, {}, null, '边界测试：随机漫步缺少经度参数'
  );
  assert(res4.status === 400, '缺少经度返回400');

  // 4.5 边界测试：无效的心情参数
  console.log('\n--- 4.5 边界测试：无效的心情参数 ---');
  const res5 = await sendRequest('GET',
    `${BASE_URL}/api/map/random?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&mood=无效心情`,
    null, {}, null, '边界测试：随机漫步使用无效的心情参数'
  );
  assert(res5.status === 400, '无效心情参数返回400');
}

/**
 * 5. feed 接口测试 - 消息推荐流
 * GET /api/map/feed?lat&lng&mood&page&limit
 */
async function testRecommendationFeed() {
  console.log('\n========== 5. feed 接口测试（消息推荐流） ==========\n');

  // 5.1 正常查询
  console.log('\n--- 5.1 正常查询推荐流 ---');
  const res1 = await sendRequest('GET',
    `${BASE_URL}/api/map/feed?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&page=1&limit=10`,
    null, {}, null, '正常测试：在北京获取推荐流（page=1, limit=10）'
  );
  assert(res1.status === 200, '推荐流查询成功');
  if (res1.status === 200) {
    console.log(`[INFO] 推荐流返回故事数: ${res1.data?.data?.stories?.length || res1.data?.data?.length || 0}`);
  }

  // 5.2 带心情参数
  console.log('\n--- 5.2 带心情参数查询推荐流 ---');
  const res2 = await sendRequest('GET',
    `${BASE_URL}/api/map/feed?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&mood=打卡&page=1&limit=5`,
    null, {}, null, '正常测试：获取推荐流（心情=打卡, limit=5）'
  );
  assert(res2.status === 200, '带心情参数推荐流查询成功');

  // 5.3 边界测试：缺少lat参数
  console.log('\n--- 5.3 边界测试：缺少纬度参数 ---');
  const res3 = await sendRequest('GET',
    `${BASE_URL}/api/map/feed?lng=${BEIJING_LNG}&page=1&limit=10`,
    null, {}, null, '边界测试：推荐流缺少纬度参数'
  );
  assert(res3.status === 400, '缺少纬度返回400');

  // 5.4 边界测试：缺少lng参数
  console.log('\n--- 5.4 边界测试：缺少经度参数 ---');
  const res4 = await sendRequest('GET',
    `${BASE_URL}/api/map/feed?lat=${BEIJING_LAT}&page=1&limit=10`,
    null, {}, null, '边界测试：推荐流缺少经度参数'
  );
  assert(res4.status === 400, '缺少经度返回400');

  // 5.5 边界测试：无效分页参数
  console.log('\n--- 5.5 边界测试：无效分页参数 ---');
  const res5 = await sendRequest('GET',
    `${BASE_URL}/api/map/feed?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&page=-1&limit=10`,
    null, {}, null, '边界测试：推荐流使用无效分页参数（page=-1）'
  );
  assert(res5.status === 400 || res5.status === 200, '无效分页参数处理正确');
}

// ==================== 保存报告 ====================

async function saveRequestRecords() {
  const fs = await import('fs');
  const path = await import('path');
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'request-records');
  const reportPath = path.join(reportDir, `map.request-${now}.md`);
  
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  fs.writeFileSync(reportPath, generateReportContent());
  console.log(`[INFO] 请求记录已保存: ${reportPath}`);
}

async function saveTestReport() {
  const fs = await import('fs');
  const path = await import('path');
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'test-reports');
  const reportPath = path.join(reportDir, `map.test.report-${now}.txt`);
  
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  let content = `EchoStar Map模块测试报告\n`;
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
  let content = `# EchoStar API 测试报告 - Map模块\n\n`;
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
  console.log(`[${now}] ║          EchoStar API 测试报告 - Map模块           ║`);
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
  console.log(`[${now}] ║              Map 模块测试开始                      ║`);
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

    if (!await createTestStories()) {
      console.error('[ERROR] 无法创建测试故事，测试终止');
      return;
    }

    // 执行测试
    await testExploreStories();    // 1. explore 接口测试
    await testLocationWall();      // 2. wall 接口测试
    await testClusterData();       // 3. clusters 接口测试
    await testRandomWalk();        // 4. random 接口测试
    await testRecommendationFeed(); // 5. feed 接口测试

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
