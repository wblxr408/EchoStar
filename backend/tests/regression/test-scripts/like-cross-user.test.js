/**
 * Like 模块跨用户回归测试
 * 
 * 测试流程：
 *   1. 创建用户1，发布故事1
 *   2. 创建用户2
 *   3. 用户2 点赞 用户1的故事1 → 检查用户1的点赞状态（应为未点赞）
 *   4. 用户2 取消点赞 → 检查用户1的点赞状态（应为未点赞）
 *   5. 重复步骤 3-4 一次
 * 
 * 使用方式：
 *   node like-cross-user.test.js          # 正常运行
 *   node like-cross-user.test.js --reset  # 先重置环境再测试
 */

import axios from 'axios';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_RESULTS_DIR = process.env.TEST_RESULTS_DIR || join(__dirname, '..', 'test-results');
const BACKEND_ROOT = join(__dirname, '..', '..', '..');
const SHOULD_RESET = process.argv.includes('--reset');
const TS = Date.now();

let user1Token = null;
let user1Id = null;
let user2Token = null;
let user2Id = null;
let storyId = null;

const stats = { total: 0, passed: 0, failed: 0, errors: [] };
const requestRecords = [];
let requestCounter = 0;

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

function generateReportContent() {
  const now = new Date().toISOString();
  let content = `# EchoStar API 测试报告 - Like跨用户回归测试\n\n`;
  content += `**测试时间**: ${now}\n\n`;
  content += `**服务器地址**: ${BASE_URL}\n\n`;
  content += `---\n\n`;

  requestRecords.forEach((record, idx) => {
    content += `### ${idx + 1}. ${record.测试说明 || '接口测试'}\n\n`;
    content += `**测试说明**: ${record.测试说明 || '无'}\n\n`;
    content += `**序号**: ${record.序号}\n\n`;
    content += `**请求类型**: ${record.请求类型}\n\n`;
    content += `**接口地址**: ${record.接口地址}\n\n`;
    content += `**返回状态**: ${record.返回状态}\n\n`;

    const displayHeaders = { ...record.请求头 };
    if (displayHeaders['Authorization']) {
      displayHeaders['Authorization'] = displayHeaders['Authorization'].substring(0, 30) + '...';
    }
    content += `**请求头**:\n\`\`\`json\n${JSON.stringify(displayHeaders, null, 2)}\n\`\`\`\n\n`;
    content += `**请求体**:\n\`\`\`json\n${record.请求体 ? JSON.stringify(record.请求体, null, 2) : '{}'}\n\`\`\`\n\n`;
    content += `**返回内容**:\n\`\`\`json\n${JSON.stringify(record.返回内容, null, 2)}\n\`\`\`\n\n`;
    content += `---\n\n`;
  });

  content += `## 测试统计\n\n`;
  content += `- **总计**: ${stats.total}\n`;
  content += `- **通过**: ${stats.passed}\n`;
  content += `- **失败**: ${stats.failed}\n`;
  if (stats.errors.length > 0) {
    content += `\n### 失败详情\n\n`;
    stats.errors.forEach((err, idx) => {
      content += `${idx + 1}. ${err}\n`;
    });
  }

  return content;
}

async function request(method, url, data = null, token = null, desc = '') {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const config = { method, url, headers, validateStatus: () => true };
    if (data !== null && data !== undefined) config.data = data;
    const res = await axios(config);
    console.log(`  [${res.status}] ${desc || url}`);
    recordRequest(method.toUpperCase(), url, { ...headers }, data, res.status, res.data, desc);
    return res;
  } catch (err) {
    const res = err.response || { status: 500, data: { error: err.message } };
    console.log(`  [${res.status}] ${desc || url} — ERROR`);
    recordRequest(method.toUpperCase(), url, { ...headers }, data, res.status, res.data, desc);
    return res;
  }
}

function assert(condition, message) {
  stats.total++;
  if (condition) {
    stats.passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    stats.failed++;
    stats.errors.push(message);
    console.log(`  [FAIL] ${message}`);
  }
}

// ==================== 测试步骤 ====================

async function step1_createUser1AndStory() {
  console.log('\n--- 步骤1: 创建用户1并发布故事1 ---');

  // 注册用户1
  const reg1 = await request('POST', `${BASE_URL}/api/auth/register_2`, {
    username: `cross_like_u1_${TS}`,
    email: `cross_like_u1_${TS}@test.com`,
    password: 'Test123456'
  }, null, '注册用户1');
  assert(reg1.status === 200, '用户1注册成功');
  user1Token = reg1.data?.data?.accessToken;
  user1Id = reg1.data?.data?.user?.id;
  assert(user1Token, '用户1获取到 accessToken');

  // 用户1发布故事1
  const story = await request('POST', `${BASE_URL}/api/stories`, {
    content: `跨用户点赞测试故事 ${TS}`,
    images: ['https://example.com/cross-like-test.jpg'],
    emotionTag: '开心',
    location: { lat: 39.90923, lng: 116.397428 }
  }, user1Token, '用户1发布故事1');
  assert(story.status === 200 || story.status === 201, '故事1发布成功');
  storyId = story.data?.data?.id;
  assert(storyId, '获取到故事1 ID');
}

async function step2_createUser2() {
  console.log('\n--- 步骤2: 创建用户2 ---');

  const reg2 = await request('POST', `${BASE_URL}/api/auth/register_2`, {
    username: `cross_like_u2_${TS}`,
    email: `cross_like_u2_${TS}@test.com`,
    password: 'Test123456'
  }, null, '注册用户2');
  assert(reg2.status === 200, '用户2注册成功');
  user2Token = reg2.data?.data?.accessToken;
  user2Id = reg2.data?.data?.user?.id;
  assert(user2Token, '用户2获取到 accessToken');
}

async function step3_likeAndCheck(round) {
  console.log(`\n--- 步骤3.${round}: 用户2点赞故事1 → 用户1检查点赞状态 ---`);

  // 用户2点赞故事1
  const likeRes = await request('POST', `${BASE_URL}/api/likes`, {
    storyId
  }, user2Token, `用户2点赞故事1 (第${round}轮)`);
  assert(likeRes.status === 200 || likeRes.status === 201, `用户2点赞成功 (第${round}轮)`);
  assert(likeRes.data?.data?.isLiked === true, `返回 isLiked=true (第${round}轮)`);

  // 用户1检查自己对故事1的点赞状态（应该是 false，因为点赞的是用户2）
  const checkRes = await request('GET', `${BASE_URL}/api/likes/${storyId}/check`, null, user1Token, `用户1检查对故事1的点赞状态 (第${round}轮)`);
  assert(checkRes.status === 200, `check 请求成功 (第${round}轮)`);
  assert(checkRes.data?.data?.isLiked === false, `用户1对故事1 isLiked=false (第${round}轮)`);
}

async function step4_unlikeAndCheck(round) {
  console.log(`\n--- 步骤4.${round}: 用户2取消点赞 → 用户1检查点赞状态 ---`);

  // 用户2取消点赞
  const unlikeRes = await request('DELETE', `${BASE_URL}/api/likes/${storyId}`, null, user2Token, `用户2取消点赞 (第${round}轮)`);
  assert(unlikeRes.status === 200, `用户2取消点赞成功 (第${round}轮)`);

  // 用户1检查自己对故事1的点赞状态（应该仍然是 false）
  const checkRes = await request('GET', `${BASE_URL}/api/likes/${storyId}/check`, null, user1Token, `用户1检查对故事1的点赞状态 (第${round}轮)`);
  assert(checkRes.status === 200, `check 请求成功 (第${round}轮)`);
  assert(checkRes.data?.data?.isLiked === false, `用户1对故事1 isLiked=false (第${round}轮)`);
}

// ==================== 主流程 ====================

async function main() {
  console.log('='.repeat(60));
  console.log('  Like 模块跨用户回归测试');
  console.log(`  服务器: ${BASE_URL}`);
  console.log(`  时间:   ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  if (SHOULD_RESET) {
    console.log('\n  --reset: 重置测试环境...');
    const resetScript = join(BACKEND_ROOT, 'tests', 'unit', 'test-scripts', 'reset-env.js');
    const resetResult = spawnSync('node', [resetScript], {
      stdio: 'inherit',
      cwd: BACKEND_ROOT
    });
    if (resetResult.status !== 0) {
      console.error('\n  环境重置失败，终止测试');
      process.exit(1);
    }
    console.log('  环境重置完成\n');
  }

  await step1_createUser1AndStory();
  if (!user1Token || !storyId) {
    console.error('\n[ABORT] 环境准备失败，终止测试');
    process.exit(1);
  }

  await step2_createUser2();
  if (!user2Token) {
    console.error('\n[ABORT] 用户2创建失败，终止测试');
    process.exit(1);
  }

  // 第1轮
  await step3_likeAndCheck(1);
  await step4_unlikeAndCheck(1);

  // 第2轮
  await step3_likeAndCheck(2);
  await step4_unlikeAndCheck(2);

  // 汇总
  console.log('\n' + '='.repeat(60));
  console.log(`  结果: ${stats.passed}/${stats.total} 通过, ${stats.failed} 失败`);
  if (stats.errors.length > 0) {
    console.log('  失败项:');
    stats.errors.forEach((e, i) => console.log(`    ${i + 1}. ${e}`));
  }
  console.log('='.repeat(60));

  // 保存报告
  const reportsDir = join(TEST_RESULTS_DIR, 'test-reports');
  const recordsDir = join(TEST_RESULTS_DIR, 'request-records');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(recordsDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  // 保存请求记录
  const recordPath = join(recordsDir, `like-cross-user.request-${ts}.md`);
  fs.writeFileSync(recordPath, generateReportContent());
  console.log(`  请求记录: ${recordPath}`);

  // 保存测试报告
  const reportPath = join(reportsDir, `like-cross-user.regression-${ts}.txt`);
  const reportContent = [
    `Like Cross-User Regression Test`,
    `Time:     ${new Date().toISOString()}`,
    `Duration: (see console)`,
    `Status:   ${stats.failed === 0 ? 'PASSED' : 'FAILED'}`,
    `Results:  ${stats.passed}/${stats.total} passed, ${stats.failed} failed`,
    stats.errors.length > 0 ? `Errors:\n${stats.errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}` : '',
    '='.repeat(60)
  ].join('\n');
  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n  报告: ${reportPath}`);

  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('测试异常:', err);
  process.exit(1);
});
