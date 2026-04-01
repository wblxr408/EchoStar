/**
 * Recommendation 模块测试脚本
 * 
 * 测试接口（通过 Map 模块暴露）：
 *   - GET /api/map/random - 随机漫步（加权推荐）
 *   - GET /api/map/feed - 消息推荐流
 * 
 * 测试流程：
 *   1. 创建用户并发布多个故事（带不同情感标签和位置）
 *   2. 用户点赞一些故事（建立偏好）
 *   3. 测试随机漫步接口（各种边界测试）
 *   4. 测试消息推荐流接口（各种边界测试）
 *   5. 验证推荐算法是否能根据用户偏好推荐故事
 * 
 * 使用方式：
 *   node recommendation.test.js          # 正常运行（不重置环境）
 *   node recommendation.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_PREFIX = 'rec_test_';
const SHOULD_RESET = process.argv.includes('--reset');

// 测试用户
let user1Token = null;
let user1Id = null;
let user1Email = null;

let user2Token = null;
let user2Id = null;

// 测试故事ID列表
let happyStories = [];
let sadStories = [];
let healingStories = [];
let checkinStories = [];

// 请求记录
const requestRecords = [];
let requestCounter = 0;

// 测试统计
const stats = { total: 0, passed: 0, failed: 0, errors: [] };

// 北京坐标
const BEIJING_LAT = 39.90923;
const BEIJING_LNG = 116.397428;

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

async function setupTestUsers() {
  console.log('\n[账号创建] 创建测试用户...');

  // 创建用户1 - 用于点赞测试和主要测试
  const timestamp1 = Date.now();
  const username1 = `${TEST_PREFIX}user1_${timestamp1}`;
  user1Email = `${TEST_PREFIX}user1_${timestamp1}@test.com`;

  const registerRes1 = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username: username1,
    email: user1Email,
    password: 'Test123456'
  }, {}, null, '创建测试用户1（用于主要测试）');

  if (registerRes1.status === 200 || registerRes1.data?.code === 0) {
    user1Id = registerRes1.data?.data?.user?.id;
    user1Token = registerRes1.data?.data?.accessToken;
    console.log(`[INFO] 用户1创建成功: ID=${user1Id}`);
  }

  // 创建用户2 - 用于发布更多故事
  const timestamp2 = Date.now() + 1;
  const username2 = `${TEST_PREFIX}user2_${timestamp2}`;
  const email2 = `${TEST_PREFIX}user2_${timestamp2}@test.com`;

  const registerRes2 = await sendRequest('POST', `${BASE_URL}/api/auth/register_2`, {
    username: username2,
    email: email2,
    password: 'Test123456'
  }, {}, null, '创建测试用户2（用于发布更多故事）');

  if (registerRes2.status === 200 || registerRes2.data?.code === 0) {
    user2Id = registerRes2.data?.data?.user?.id;
    user2Token = registerRes2.data?.data?.accessToken;
    console.log(`[INFO] 用户2创建成功: ID=${user2Id}`);
  }

  return user1Token && user2Token;
}

async function createTestStories() {
  console.log('\n[故事创建] 创建不同情感标签的测试故事...');

  // 用户1发布故事
  const user1Stories = [
    { content: '今天天气真好，心情很开心！', emotionTag: '开心', lat: 39.9087, lng: 116.3975 },
    { content: '遇到一些不开心的事情...', emotionTag: '难过', lat: 39.9163, lng: 116.3972 },
    { content: '听着音乐，感觉很治愈', emotionTag: '治愈', lat: 39.9999, lng: 116.2755 },
  ];

  for (const story of user1Stories) {
    const res = await sendRequest('POST', `${BASE_URL}/api/stories`, {
      content: story.content,
      images: ['https://example.com/test.jpg'],
      emotionTag: story.emotionTag,
      location: { lat: story.lat, lng: story.lng }
    }, {}, user1Token, `用户1发布故事: ${story.emotionTag} - ${story.content.substring(0, 20)}`);

    if (res.status === 200 || res.status === 201) {
      const id = res.data?.data?.id;
      if (story.emotionTag === '开心') happyStories.push(id);
      else if (story.emotionTag === '难过') sadStories.push(id);
      else if (story.emotionTag === '治愈') healingStories.push(id);
    }
  }

  // 用户2发布故事
  const user2Stories = [
    { content: '打卡北京长城！', emotionTag: '打卡', lat: 40.3597, lng: 116.0199 },
    { content: '又一个开心的日子', emotionTag: '开心', lat: 39.9929, lng: 116.3966 },
    { content: '治愈的午后时光', emotionTag: '治愈', lat: 39.9405, lng: 116.3342 },
    { content: '有些难过想找人倾诉', emotionTag: '难过', lat: 39.8946, lng: 116.3222 },
    { content: '打卡网红景点', emotionTag: '打卡', lat: 39.9324, lng: 116.4536 },
  ];

  for (const story of user2Stories) {
    const res = await sendRequest('POST', `${BASE_URL}/api/stories`, {
      content: story.content,
      images: ['https://example.com/test.jpg'],
      emotionTag: story.emotionTag,
      location: { lat: story.lat, lng: story.lng }
    }, {}, user2Token, `用户2发布故事: ${story.emotionTag} - ${story.content.substring(0, 20)}`);

    if (res.status === 200 || res.status === 201) {
      const id = res.data?.data?.id;
      if (story.emotionTag === '开心') happyStories.push(id);
      else if (story.emotionTag === '难过') sadStories.push(id);
      else if (story.emotionTag === '治愈') healingStories.push(id);
      else if (story.emotionTag === '打卡') checkinStories.push(id);
    }
  }

  console.log(`[INFO] 故事创建完成: 开心=${happyStories.length}, 难过=${sadStories.length}, 治愈=${healingStories.length}, 打卡=${checkinStories.length}`);
  return true;
}

async function createTestLikes() {
  console.log('\n[点赞创建] 用户1点赞开心类故事（建立偏好）...');

  // 用户1点赞开心的故事，建立偏好
  for (const storyId of happyStories) {
    await sendRequest('POST', `${BASE_URL}/api/likes`, {
      storyId: storyId
    }, {}, user1Token, `用户1点赞开心类故事 ID=${storyId}（建立偏好）`);
    // 等待一下避免请求过快
    await new Promise(r => setTimeout(r, 100));
  }

  // 也点赞一个治愈故事
  if (healingStories.length > 0) {
    await sendRequest('POST', `${BASE_URL}/api/likes`, {
      storyId: healingStories[0]
    }, {}, user1Token, `用户1点赞治愈类故事 ID=${healingStories[0]}（建立偏好）`);
  }

  console.log(`[INFO] 点赞创建完成: 用户1点赞了 ${happyStories.length + 1} 个故事`);
}

// ==================== Recommendation 接口测试 ====================

/**
 * 1. 随机漫步接口测试 (random)
 */
async function testRandomWalk() {
  console.log('\n========== 1. 随机漫步接口测试（random） ==========\n');

  // 1.1 正常随机漫步（无参数）
  console.log('\n--- 1.1 正常随机漫步（无参数） ---');
  const res1 = await sendRequest('GET', `${BASE_URL}/api/map/random`, null, {}, user1Token, '正常测试：无参数随机漫步');
  assert(res1.status === 200, '随机漫步成功');
  if (res1.status === 200 && res1.data?.data) {
    console.log(`[INFO] 随机漫步返回故事ID: ${res1.data?.data?.story?.id}`);
  }

  // 1.2 带位置参数的随机漫步
  console.log('\n--- 1.2 带位置参数的随机漫步 ---');
  const res2 = await sendRequest('GET', 
    `${BASE_URL}/api/map/random?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}`, 
    null, {}, user1Token, '正常测试：带北京位置的随机漫步'
  );
  assert(res2.status === 200, '带位置随机漫步成功');

  // 1.3 带情感筛选的随机漫步 - 开心
  console.log('\n--- 1.3 带情感筛选的随机漫步（开心） ---');
  const res3 = await sendRequest('GET', 
    `${BASE_URL}/api/map/random?mood=开心`, 
    null, {}, user1Token, '正常测试：筛选开心类故事的随机漫步'
  );
  assert(res3.status === 200, '筛选开心情感成功');
  if (res3.status === 200 && res3.data?.data?.story) {
    const emotionTag = res3.data.data.story.emotionTag;
    console.log(`[INFO] 返回故事情感标签: ${emotionTag}`);
    assert(emotionTag === '开心', '返回的应该是开心类故事');
  }

  // 1.4 带情感筛选的随机漫步 - 难过
  console.log('\n--- 1.4 带情感筛选的随机漫步（难过） ---');
  const res4 = await sendRequest('GET', 
    `${BASE_URL}/api/map/random?mood=难过`, 
    null, {}, user1Token, '正常测试：筛选难过类故事的随机漫步'
  );
  assert(res4.status === 200, '筛选难过情感成功');

  // 1.5 带情感筛选的随机漫步 - 治愈
  console.log('\n--- 1.5 带情感筛选的随机漫步（治愈） ---');
  const res5 = await sendRequest('GET', 
    `${BASE_URL}/api/map/random?mood=治愈`, 
    null, {}, user1Token, '正常测试：筛选治愈类故事的随机漫步'
  );
  assert(res5.status === 200, '筛选治愈情感成功');

  // 1.6 带情感筛选的随机漫步 - 打卡
  console.log('\n--- 1.6 带情感筛选的随机漫步（打卡） ---');
  const res6 = await sendRequest('GET', 
    `${BASE_URL}/api/map/random?mood=打卡`, 
    null, {}, user1Token, '正常测试：筛选打卡类故事的随机漫步'
  );
  assert(res6.status === 200, '筛选打卡情感成功');

  // 1.7 边界测试：无效的情感标签
  console.log('\n--- 1.7 边界测试：无效的情感标签 ---');
  const res7 = await sendRequest('GET', 
    `${BASE_URL}/api/map/random?mood=无效标签`, 
    null, {}, user1Token, '边界测试：无效的情感标签（应被忽略或返回错误）'
  );
  // 无效标签可能被忽略，返回200也是正常的
  console.log(`[INFO] 无效情感标签返回状态码: ${res7.status}`);

  // 1.8 边界测试：无效的经纬度
  console.log('\n--- 1.8 边界测试：无效的经纬度（非数字） ---');
  const res8 = await sendRequest('GET', 
    `${BASE_URL}/api/map/random?lat=abc&lng=def`, 
    null, {}, user1Token, '边界测试：无效的经纬度格式'
  );
  // 应该被解析为NaN，接口可能有默认值
  console.log(`[INFO] 无效经纬度返回状态码: ${res8.status}`);

  // 1.9 无Token的随机漫步（可选认证）
  console.log('\n--- 1.9 无Token的随机漫步 ---');
  const res9 = await sendRequest('GET', `${BASE_URL}/api/map/random`, null, {}, null, '正常测试：无Token随机漫步');
  assert(res9.status === 200, '无Token可随机漫步');

  // 1.10 带位置和情感的随机漫步
  console.log('\n--- 1.10 带位置和情感的随机漫步 ---');
  const res10 = await sendRequest('GET', 
    `${BASE_URL}/api/map/random?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&mood=开心`, 
    null, {}, user1Token, '正常测试：带位置和情感筛选的随机漫步'
  );
  assert(res10.status === 200, '带位置和情感筛选成功');

  // 1.11 多次调用验证随机性
  console.log('\n--- 1.11 多次调用验证随机性 ---');
  const storyIds = new Set();
  for (let i = 0; i < 5; i++) {
    const res = await sendRequest('GET', `${BASE_URL}/api/map/random`, null, {}, user1Token, `随机漫步第${i + 1}次调用`);
    if (res.status === 200 && res.data?.data?.story?.id) {
      storyIds.add(res.data.data.story.id);
    }
  }
  console.log(`[INFO] 5次调用返回了 ${storyIds.size} 个不同的故事ID`);
}

/**
 * 2. 消息推荐流接口测试 (feed)
 */
async function testRecommendationFeed() {
  console.log('\n========== 2. 消息推荐流接口测试（feed） ==========\n');

  // 2.1 正常获取推荐流（无参数）
  console.log('\n--- 2.1 正常获取推荐流（无参数） ---');
  const res1 = await sendRequest('GET', `${BASE_URL}/api/map/feed`, null, {}, user1Token, '正常测试：获取推荐流');
  assert(res1.status === 200, '获取推荐流成功');
  if (res1.status === 200) {
    const stories = res1.data?.data?.stories || [];
    const pagination = res1.data?.data?.pagination || {};
    console.log(`[INFO] 推荐流返回 ${stories.length} 条故事，总数 ${pagination.total || 0}`);
  }

  // 2.2 带位置参数的推荐流
  console.log('\n--- 2.2 带位置参数的推荐流 ---');
  const res2 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}`, 
    null, {}, user1Token, '正常测试：带北京位置的推荐流'
  );
  assert(res2.status === 200, '带位置推荐流成功');

  // 2.3 带情感筛选的推荐流 - 开心
  console.log('\n--- 2.3 带情感筛选的推荐流（开心） ---');
  const res3 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?mood=开心`, 
    null, {}, user1Token, '正常测试：筛选开心类故事的推荐流'
  );
  assert(res3.status === 200, '筛选开心情感成功');
  if (res3.status === 200) {
    const stories = res3.data?.data?.stories || [];
    console.log(`[INFO] 开心类推荐流返回 ${stories.length} 条故事`);
    // 验证返回的故事都是开心类
    if (stories.length > 0) {
      const allHappy = stories.every(s => s.emotionTag === '开心');
      assert(allHappy, '返回的故事应该都是开心类');
    }
  }

  // 2.4 带情感筛选的推荐流 - 难过
  console.log('\n--- 2.4 带情感筛选的推荐流（难过） ---');
  const res4 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?mood=难过`, 
    null, {}, user1Token, '正常测试：筛选难过类故事的推荐流'
  );
  assert(res4.status === 200, '筛选难过情感成功');

  // 2.5 带情感筛选的推荐流 - 治愈
  console.log('\n--- 2.5 带情感筛选的推荐流（治愈） ---');
  const res5 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?mood=治愈`, 
    null, {}, user1Token, '正常测试：筛选治愈类故事的推荐流'
  );
  assert(res5.status === 200, '筛选治愈情感成功');

  // 2.6 带情感筛选的推荐流 - 打卡
  console.log('\n--- 2.6 带情感筛选的推荐流（打卡） ---');
  const res6 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?mood=打卡`, 
    null, {}, user1Token, '正常测试：筛选打卡类故事的推荐流'
  );
  assert(res6.status === 200, '筛选打卡情感成功');

  // 2.7 测试分页参数
  console.log('\n--- 2.7 测试分页参数 ---');
  const res7 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?page=1&limit=5`, 
    null, {}, user1Token, '正常测试：使用分页参数获取推荐流'
  );
  assert(res7.status === 200, '分页参数正常');
  if (res7.status === 200) {
    const stories = res7.data?.data?.stories || [];
    assert(stories.length <= 5, '返回故事数不超过limit');
  }

  // 2.8 测试第二页
  console.log('\n--- 2.8 测试第二页 ---');
  const res8 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?page=2&limit=3`, 
    null, {}, user1Token, '正常测试：获取第二页推荐流'
  );
  assert(res8.status === 200, '第二页获取成功');

  // 2.9 边界测试：无效的分页参数（负数）
  console.log('\n--- 2.9 边界测试：无效的分页参数 ---');
  const res9 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?page=-1&limit=100`, 
    null, {}, user1Token, '边界测试：负数页码'
  );
  assert(res9.status === 200, '负数页码应被处理为有效值');

  // 2.10 边界测试：limit过大
  console.log('\n--- 2.10 边界测试：limit过大 ---');
  const res10 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?limit=100`, 
    null, {}, user1Token, '边界测试：limit超过最大值（应被限制为50）'
  );
  assert(res10.status === 200, 'limit过大应被限制');
  if (res10.status === 200) {
    const stories = res10.data?.data?.stories || [];
    assert(stories.length <= 50, '返回故事数不超过50');
  }

  // 2.11 边界测试：无效的情感标签
  console.log('\n--- 2.11 边界测试：无效的情感标签 ---');
  const res11 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?mood=无效标签`, 
    null, {}, user1Token, '边界测试：无效的情感标签（应被忽略）'
  );
  assert(res11.status === 200, '无效情感标签应被忽略');

  // 2.12 无Token获取推荐流
  console.log('\n--- 2.12 无Token获取推荐流 ---');
  const res12 = await sendRequest('GET', `${BASE_URL}/api/map/feed`, null, {}, null, '正常测试：无Token获取推荐流');
  assert(res12.status === 200, '无Token可获取推荐流');

  // 2.13 带位置和情感的推荐流
  console.log('\n--- 2.13 带位置和情感的推荐流 ---');
  const res13 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?lat=${BEIJING_LAT}&lng=${BEIJING_LNG}&mood=开心&page=1&limit=10`, 
    null, {}, user1Token, '正常测试：带位置和情感筛选的推荐流'
  );
  assert(res13.status === 200, '带位置和情感筛选成功');

  // 2.14 验证用户偏好对推荐的影响
  console.log('\n--- 2.14 验证用户偏好对推荐的影响 ---');
  // 用户1之前点赞了开心类故事，推荐流应该偏好开心类
  const res14 = await sendRequest('GET', `${BASE_URL}/api/map/feed?limit=20`, null, {}, user1Token, '验证用户偏好：用户1点赞了开心类故事');
  if (res14.status === 200) {
    const stories = res14.data?.data?.stories || [];
    const happyCount = stories.filter(s => s.emotionTag === '开心').length;
    console.log(`[INFO] 推荐流中开心类故事数量: ${happyCount}/${stories.length}`);
    console.log(`[INFO] （用户1偏好开心类，可能有更多开心类故事）`);
  }

  // 2.15 边界测试：limit为0
  console.log('\n--- 2.15 边界测试：limit为0 ---');
  const res15 = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?limit=0`, 
    null, {}, user1Token, '边界测试：limit为0（应被处理为最小值1）'
  );
  assert(res15.status === 200, 'limit为0应被处理');
}

/**
 * 3. 推荐算法综合测试
 */
async function testRecommendationAlgorithm() {
  console.log('\n========== 3. 推荐算法综合测试 ==========\n');

  // 3.1 测试无偏好的用户推荐
  console.log('\n--- 3.1 测试无偏好用户（user2）的推荐 ---');
  const res1 = await sendRequest('GET', `${BASE_URL}/api/map/feed?limit=10`, null, {}, user2Token, '验证无偏好用户：user2没有点赞记录');
  assert(res1.status === 200, '无偏好用户推荐成功');
  if (res1.status === 200) {
    console.log(`[INFO] user2（无点赞）的推荐流获取成功`);
  }

  // 3.2 对比两个用户的推荐结果
  console.log('\n--- 3.2 对比不同用户的推荐结果 ---');
  const user1Res = await sendRequest('GET', `${BASE_URL}/api/map/feed?limit=5`, null, {}, user1Token, '用户1的推荐流');
  const user2Res = await sendRequest('GET', `${BASE_URL}/api/map/feed?limit=5`, null, {}, user2Token, '用户2的推荐流');
  
  if (user1Res.status === 200 && user2Res.status === 200) {
    console.log(`[INFO] 两个用户的推荐流都获取成功`);
    // 注意：由于排序可能有随机性，不一定完全不同
  }

  // 3.3 测试位置对推荐的影响
  console.log('\n--- 3.3 测试位置对推荐的影响 ---');
  const nearRes = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?lat=39.9092&lng=116.3974&limit=5`, 
    null, {}, user1Token, '北京附近位置的推荐流'
  );
  const farRes = await sendRequest('GET', 
    `${BASE_URL}/api/map/feed?lat=40.3597&lng=116.0199&limit=5`, 
    null, {}, user1Token, '长城附近位置的推荐流'
  );
  
  if (nearRes.status === 200 && farRes.status === 200) {
    console.log(`[INFO] 不同位置的推荐流获取成功`);
  }

  // 3.4 测试情感筛选精确度
  console.log('\n--- 3.4 测试情感筛选精确度 ---');
  const moods = ['开心', '难过', '治愈', '打卡'];
  for (const mood of moods) {
    const res = await sendRequest('GET', 
      `${BASE_URL}/api/map/feed?mood=${mood}&limit=10`, 
      null, {}, user1Token, `验证情感筛选：${mood}`
    );
    if (res.status === 200) {
      const stories = res.data?.data?.stories || [];
      const allMatch = stories.every(s => s.emotionTag === mood);
      console.log(`[INFO] ${mood} 筛选返回 ${stories.length} 条，全部匹配: ${allMatch}`);
    }
  }
}

// ==================== 保存报告 ====================

async function saveRequestRecords() {
  const fs = await import('fs');
  const path = await import('path');
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'request-records');
  const reportPath = path.join(reportDir, `recommendation_request_${now}.md`);
  
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  fs.writeFileSync(reportPath, generateReportContent());
  console.log(`[INFO] 请求记录已保存: ${reportPath}`);
}

async function saveTestReport() {
  const fs = await import('fs');
  const path = await import('path');
  
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'test-results', 'test-reports');
  const reportPath = path.join(reportDir, `recommendation_test_report_${now}.txt`);
  
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  let content = `EchoStar Recommendation模块测试报告\n`;
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
  let content = `# EchoStar API 测试报告 - Recommendation模块\n\n`;
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
  console.log(`[${now}] ║       EchoStar API 测试报告 - Recommendation模块    ║`);
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
  console.log(`[${now}] ║           Recommendation 模块测试开始               ║`);
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
    
    if (!await setupTestUsers()) {
      console.error('[ERROR] 无法创建测试用户，测试终止');
      return;
    }

    if (!await createTestStories()) {
      console.error('[ERROR] 无法创建测试故事，测试终止');
      return;
    }

    await createTestLikes();

    // 执行测试
    await testRandomWalk();            // 1. 随机漫步接口测试
    await testRecommendationFeed();    // 2. 消息推荐流接口测试
    await testRecommendationAlgorithm(); // 3. 推荐算法综合测试

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
