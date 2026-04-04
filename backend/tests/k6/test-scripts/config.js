/**
 * k6 压力测试配置
 * 支持多场景 Profile + 环境变量覆盖
 * 
 * 测试模式：
 *   - performance: 性能测试（服务器关闭限流，验证后端大流量性能）
 *   - rate-limit: 限流测试（服务器保留限流，验证限流功能正确性）
 * 
 * Profile（通过 --env PROFILE=xxx 切换）：
 *   - ramp      : 阶梯拐点测试（50→400 VUs, 聚焦 150-350, ~23m）— 核心
 *   - endurance : 耐力测试（拐点×0.8 VUs, 30m）— 核心
 *   - peak      : 峰值负载（80 VUs, 3m）— 默认
 *   - overload  : 过载测试（200 VUs, 2m）— 已由 ramp 替代
 *   - daily     : 日常负载（30 VUs, 5m）
 *   - smoke     : 冒烟测试（10 VUs, 30s）
 */

// 测试模式（由 run-test.bat/run-test.sh 通过环境变量传入）
export const testMode = __ENV.TEST_MODE || 'performance';

// ===================== Profile 配置 =====================
// 按 80/20 原则设计：核心接口承载 80% 流量，写操作 15%，低频接口单独测试
export const profiles = {
  // 阶梯拐点测试 - 聚焦 150-350 VUs 拐点区间
  ramp: {
    name: '阶梯拐点测试',
    vus: 400,
    duration: '25m',
    stages: [
      // ---- 预热阶段：快速爬升到 100 VUs ----
      { duration: '30s', target: 50 },
      { duration: '1m30s', target: 100 },
      // ---- 接近拐点区：100→150 ----
      { duration: '1m30s', target: 150 },
      // ---- 核心拐点区间：150-350（每 25 VUs 一级 × 1m45s = 8 级）----
      { duration: '1m45s', target: 175 },
      { duration: '1m45s', target: 200 },
      { duration: '1m45s', target: 225 },
      { duration: '1m45s', target: 250 },
      { duration: '1m45s', target: 275 },
      { duration: '1m45s', target: 300 },
      { duration: '1m45s', target: 325 },
      { duration: '1m45s', target: 350 },
      // ---- 拐点后验证：350-400 ----
      { duration: '1m45s', target: 375 },
      { duration: '1m45s', target: 400 },
      // ---- 保持阶段：400 VUs 稳定采集 ----
      { duration: '1m', target: 400 },
      // ---- 优雅停止 ----
      { duration: '30s', target: 0 },
    ],
    dataScale: { users: 500, stories: 2000 },
    readWriteRatio: 0.85,
    description: '聚焦 150-350 VUs 拐点区间，每 25 VUs 一级阶梯，快速预热 + 高密度测量',
  },
  // 快速验证测试 - 3-5分钟跑完，覆盖全部18个接口逻辑路径
  mini_verify: {
    name: '快速验证测试',
    vus: 30,
    duration: '2m',
    stages: [
      // ---- 阶梯1：快速爬升 ----
      { duration: '15s', target: 10 },
      // ---- 阶梯2：保持负载，收集足够样本覆盖全部接口 ----
      { duration: '1m30s', target: 30 },
      // ---- 阶梯3：优雅停止 ----
      { duration: '15s', target: 0 },
    ],
    dataScale: { users: 15, stories: 30 },
    readWriteRatio: 0.85,
    description: '3分钟快速验证，场景化行为模式覆盖全部18个接口（9读+9写）',
  },
  // 耐力测试 - 检测内存泄漏和连接泄漏
  endurance: {
    name: '耐力测试',
    vus: 120,          // 根据阶梯拐点测试结果调整（建议 = 拐点VUs × 0.8）
    duration: '30m',
    stages: [
      { duration: '1m', target: 120 },
      { duration: '28m', target: 120 },
      { duration: '1m', target: 0 },
    ],
    dataScale: { users: 300, stories: 1500 },
    readWriteRatio: 0.85,
    description: '长时间恒定压力，检测内存泄漏和连接泄漏（VUs 需根据 T1 结果调整）',
  },
  // 冒烟测试 - 快速验证基本功能
  smoke: {
    name: '冒烟测试',
    vus: 10,
    duration: '30s',
    stages: [
      { duration: '5s', target: 5 },
      { duration: '20s', target: 10 },
      { duration: '5s', target: 0 },
    ],
    dataScale: { users: 20, stories: 50 },
    readWriteRatio: 0.85,
    description: '快速验证服务可用性，每次部署后执行',
  },
  // 日常负载 - 建立性能基线
  daily: {
    name: '日常负载',
    vus: 30,
    duration: '5m',
    stages: [
      { duration: '30s', target: 15 },
      { duration: '2m', target: 30 },
      { duration: '2m', target: 45 },
      { duration: '30s', target: 0 },
    ],
    dataScale: { users: 100, stories: 500 },
    readWriteRatio: 0.85,
    description: '模拟日常访问量，建立性能基线',
  },
  // 峰值负载 - 核心参照组
  peak: {
    name: '峰值负载',
    vus: 80,
    duration: '3m',
    stages: [
      { duration: '30s', target: 20 },
      { duration: '1m', target: 80 },
      { duration: '1m', target: 160 },
      { duration: '30s', target: 0 },
    ],
    dataScale: { users: 200, stories: 1000 },
    readWriteRatio: 0.85,
    description: '模拟高峰时段流量，核心参照组',
  },
  // 过载测试 - 已由 ramp profile 替代，保留用于向后兼容
  overload: {
    name: '过载测试',
    vus: 200,
    duration: '2m',
    stages: [
      { duration: '20s', target: 50 },
      { duration: '40s', target: 200 },
      { duration: '40s', target: 400 },
      { duration: '20s', target: 0 },
    ],
    dataScale: { users: 500, stories: 2000 },
    readWriteRatio: 0.80,
    description: '固定压力过载测试（已被 ramp 阶梯测试替代）',
  },
};

/**
 * 解析持续时间字符串（如 "2m" -> 120秒）
 * @param {string} str - 持续时间字符串（支持 s/m/h 后缀）
 * @returns {number} 秒数
 */
export function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h)$/);
  if (!match) return parseInt(str) || 60;
  const [, value, unit] = match;
  switch (unit) {
    case 's': return parseInt(value);
    case 'm': return parseInt(value) * 60;
    case 'h': return parseInt(value) * 3600;
    default: return parseInt(value) || 60;
  }
}

// 获取当前 Profile
const profileName = __ENV.PROFILE || 'peak';
const currentProfile = profiles[profileName] || profiles.peak;

// ===================== 接口权重配置 =====================
// 基于真实用户行为预估的接口调用频率（读:写 ≈ 85:15）
// 总权重 = 85 + 15 = 100
export const ACTION_WEIGHTS = {
  // ========== 读操作 (85%) ==========
  get_story:         30,    // 获取故事详情（最高频读操作）
  map_explore:       15,    // 地图范围探索
  map_clusters:      12,    // 聚合数据（次高频，仅次于 map_explore）
  search_story:       5,    // 搜索故事（降低）
  list_comments:      8,    // 获取评论列表
  map_feed:          10,    // 推荐信息流
  get_user:           2,    // 获取用户信息（降低）
  list_notifications: 3,    // 通知列表
  health_check:       1,    // 健康检查
  // ========== 写操作 (15%) ==========
  login:              3,    // 登录
  register:           1,    // 注册
  create_comment:     3,    // 创建评论
  like_toggle:        3,    // 点赞/取消点赞
  favorite_toggle:    2,    // 收藏/取消收藏
  create_story:       1.5,  // 创建故事
  create_report:      0.5,  // 举报
  mark_notif_read:    0.5,  // 标记通知已读
  update_profile:     0.5,  // 更新个人资料
};

// 读操作子集（用于浏览阶段，场景化行为脚本）
export const READ_ACTIONS = {
  get_story:         30,
  map_explore:       15,
  map_clusters:      12,
  search_story:       5,
  list_comments:      8,
  map_feed:          10,
  get_user:           2,
  list_notifications: 3,
  health_check:       1,
};

// 写操作子集（用于互动阶段，场景化行为脚本）
export const WRITE_ACTIONS = {
  login:              3,
  register:           1,
  create_comment:     3,
  like_toggle:        3,
  favorite_toggle:    2,
  create_story:       1.5,
  create_report:      0.5,
  mark_notif_read:    0.5,
  update_profile:     0.5,
};

/**
 * 基于权重随机选择一个 action
 * @param {Object} weights - 权重映射 { actionName: weight }
 * @returns {string} 选中的 action 名称
 */
export function chooseByWeight(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [action, weight] of Object.entries(weights)) {
    if (rand < weight) return action;
    rand -= weight;
  }
  // 兜底：返回第一个
  return Object.keys(weights)[0];
}

// ===================== 热度分布 =====================
// 通过 --env DIST=xxx 切换访问分布模式
// uniform  : 均匀分布（所有故事/用户被等概率访问，适合基准测试）
// pareto   : 帕累托分布（约 20% 的数据承载 80% 流量，模拟真实热点）
// zipfian  : 齐普夫分布（更极端的头部集中，适合模拟"爆款"场景）
export const distMode = (__ENV.DIST || 'pareto').toLowerCase();
export const HOT_RATIO = parseFloat(__ENV.HOT_RATIO) || 0.2;    // 热门集合占比（20%）

/**
 * 基于热度分布从数组中选取一个元素
 * @param {Array} arr - 待选择的数组
 * @param {string} mode - 分布模式: 'uniform' | 'pareto' | 'zipfian'
 * @returns {*} 选中的元素
 */
export function pickByDist(arr, mode) {
  if (!arr || arr.length === 0) return null;
  if (arr.length === 1) return arr[0];

  switch (mode || distMode) {
    case 'pareto':
      return arr[paretoIndex(arr.length)];
    case 'zipfian':
      return arr[zipfianIndex(arr.length)];
    case 'uniform':
    default:
      return arr[Math.floor(Math.random() * arr.length)];
  }
}

/**
 * 帕累托分布索引（前 HOT_RATIO 比例的元素承载约 80% 访问量）
 * 使用指数分布近似帕累托：P(X <= x) = 1 - (xm/x)^alpha
 * alpha=1.16 → 20% 头部承载 80% 流量
 */
function paretoIndex(n) {
  const hotCount = Math.max(1, Math.floor(n * HOT_RATIO));
  // 80% 概率从热门集合中选，20% 从尾部选
  if (Math.random() < 0.8) {
    return Math.floor(Math.random() * hotCount);
  }
  return hotCount + Math.floor(Math.random() * (n - hotCount));
}

/**
 * 齐普夫分布索引（更陡峭的头部集中）
 * rank k 的概率正比于 1/k^s (s=1.0 为标准齐普夫)
 * 前 5% 的元素承载约 50% 流量
 */
function zipfianIndex(n) {
  // 预计算累计分布太慢，使用简化的"分层轮盘赌"：
  // 将数组分为 5 层，各层概率：50%, 20%, 15%, 10%, 5%
  const boundaries = [0.05, 0.15, 0.30, 0.55, 1.0]; // 累积比例
  const probs = [0.50, 0.20, 0.15, 0.10, 0.05];     // 选择概率
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) {
      const start = Math.floor(n * (i === 0 ? 0 : boundaries[i - 1]));
      const end = Math.floor(n * boundaries[i]);
      const count = Math.max(1, end - start);
      return start + Math.floor(Math.random() * count);
    }
  }
  return Math.floor(Math.random() * n);
}

/**
 * 对数组进行热度排序（用于 setup 阶段标记热门集合）
 * 在 Pareto/Zipfian 模式下，热门故事排在数组前面
 * @param {Array} stories - 故事数组，会就地排序
 * @param {number} hotRatio - 热门集合比例
 * @returns {Array} 排序后的数组
 */
export function sortByPopularity(stories, hotRatio) {
  if (distMode === 'uniform') return stories;
  const hotCount = Math.max(1, Math.floor(stories.length * (hotRatio || HOT_RATIO)));
  // 热门故事：带图片、有情绪标签的（更"真实"的故事更容易成为热门）
  const withImages = stories.filter(s => s.images && s.images.length > 0);
  const withEmotion = stories.filter(s => s.emotionTag);
  const hotSet = new Set();
  // 优先选有图片+有情绪的
  withImages.filter(s => s.emotionTag).slice(0, hotCount).forEach(s => hotSet.add(s.id));
  // 补充有图片的
  if (hotSet.size < hotCount) {
    withImages.filter(s => !hotSet.has(s.id)).slice(0, hotCount - hotSet.size).forEach(s => hotSet.add(s.id));
  }
  // 补充有情绪标签的
  if (hotSet.size < hotCount) {
    withEmotion.filter(s => !hotSet.has(s.id)).slice(0, hotCount - hotSet.size).forEach(s => hotSet.add(s.id));
  }
  // 排序：热门在前，非热门在后（各段内部保持原序）
  const hot = stories.filter(s => hotSet.has(s.id));
  const cold = stories.filter(s => !hotSet.has(s.id));
  return hot.concat(cold);
}

/**
 * 对用户数组按"活跃度"排序（用于 setup 阶段）
 * 活跃用户更可能被选中（模拟真实场景中少数活跃用户发大量请求）
 * @param {Array} users - 用户数组
 * @param {number} hotRatio - 热门集合比例
 * @returns {Array} 排序后的数组
 */
export function sortByActivity(users, hotRatio) {
  if (distMode === 'uniform') return users;
  // 用户排序不重要（没有"质量"区分），直接按索引顺序即可
  // 热度分布函数 paretoIndex/zipfianIndex 会自动让前 hotRatio 的用户获得更多访问
  return users;
}

// 限流测试的均匀权重（目的：均匀触发限流）
export const RATE_LIMIT_WEIGHTS = {
  auth:        25,    // 触发 strictLimiter
  story:       15,    // 触发 generalLimiter
  like:        13,    // 触发 generalLimiter
  favorite:    10,    // 触发 generalLimiter
  comment:     12,    // 触发 generalLimiter
  map:         10,    // 触发 looseLimiter
  notification: 5,    // 触发 generalLimiter
  report:      10,    // 触发 generalLimiter
};

// ===================== 性能阈值 =====================
// 按接口分类的独立 p95 阈值（ms）
// 分类原则：健康检查 < 简单读 < 列表/搜索 < 认证 < 写操作 < 地图聚合
export const ENDPOINT_THRESHOLDS = {
  // 健康检查（无业务逻辑，应最快响应）
  health_check:       100,
  // 简单读操作（单条记录查询）
  get_story:          500,
  get_user:           500,
  mark_notif_read:    500,
  // 列表/搜索（多记录查询，可能涉及分页和排序）
  search_story:       800,
  list_comments:      800,
  list_notifications: 800,
  // 认证操作（涉及 JWT 生成/验证、密码哈希）
  login:              1000,
  register:           1500,
  // 写操作（涉及 DB 事务和数据校验）
  like_toggle:        1000,
  favorite_toggle:    1000,
  create_comment:     1000,
  create_story:       1500,
  create_report:      1000,
  update_profile:     1000,
  // 地图相关（涉及空间计算和聚合）
  map_explore:        1200,
  map_feed:           1200,
  map_clusters:       1200,
};

// ===================== 主配置 =====================
export const config = {
  // 基础 URL
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',

  // 当前 Profile 名称
  profileName: profileName,
  profile: currentProfile,

  // 数据量（由 Profile 决定，可通过环境变量覆盖）
  users: {
    count: parseInt(__ENV.USER_COUNT) || currentProfile.dataScale.users,
    adminCount: parseInt(__ENV.ADMIN_COUNT) || 10,
    batchSize: parseInt(__ENV.USER_BATCH_SIZE) || 50,
  },

  // 故事配置
  stories: {
    count: parseInt(__ENV.STORY_COUNT) || currentProfile.dataScale.stories,
    batchSize: parseInt(__ENV.STORY_BATCH_SIZE) || 50,
  },

  // 评论配置
  comments: {
    count: parseInt(__ENV.COMMENT_COUNT) || Math.floor(currentProfile.dataScale.stories * 0.2),
    batchSize: parseInt(__ENV.COMMENT_BATCH_SIZE) || 50,
  },

  // 点赞配置
  likes: {
    count: parseInt(__ENV.LIKE_COUNT) || Math.floor(currentProfile.dataScale.stories * 0.3),
    batchSize: parseInt(__ENV.LIKE_BATCH_SIZE) || 100,
  },

  // 收藏配置
  favorites: {
    count: parseInt(__ENV.FAVORITE_COUNT) || Math.floor(currentProfile.dataScale.stories * 0.15),
    batchSize: parseInt(__ENV.FAVORITE_BATCH_SIZE) || 50,
  },

  // 举报配置
  reports: {
    count: parseInt(__ENV.REPORT_COUNT) || 50,
  },

  // 并发配置（由 Profile 决定，可通过环境变量覆盖）
  concurrency: {
    load: parseInt(__ENV.LOAD_VUS) || currentProfile.vus,
  },

  // 持续时间（由 Profile 决定，可通过环境变量覆盖）
  duration: {
    load: __ENV.LOAD_DURATION || currentProfile.duration,
  },

  // 全局性能阈值
  thresholds: {
    p95: parseInt(__ENV.THRESHOLD_P95) || 1000,
    p99: parseInt(__ENV.THRESHOLD_P99) || 2000,
    avg: parseInt(__ENV.THRESHOLD_AVG) || 300,
    errorRate: parseFloat(__ENV.THRESHOLD_ERROR_RATE) || 0.05,
  },

  // 报告输出路径
  report: {
    outputDir: __ENV.REPORT_DIR || `tests/k6/test-reports/${testMode === 'rate-limit' ? 'rate-limit-test' : 'performance-test'}`,
  },
};

// ===================== 性能指标定义 =====================
export const performanceIndicators = {
  responseTime: {
    excellent: 100,
    good: 300,
    acceptable: 500,
    slow: 1000,
    critical: 2000,
  },
  throughput: {
    excellent: 500,
    good: 200,
    acceptable: 100,
    poor: 50,
    critical: 10,
  },
  errorRate: {
    excellent: 0.1,
    good: 0.5,
    acceptable: 1,
    poor: 5,
    critical: 10,
  },
};

export function evaluateResponseTime(time) {
  if (time <= performanceIndicators.responseTime.excellent) return 'excellent';
  if (time <= performanceIndicators.responseTime.good) return 'good';
  if (time <= performanceIndicators.responseTime.acceptable) return 'acceptable';
  if (time <= performanceIndicators.responseTime.slow) return 'slow';
  return 'critical';
}

export function evaluateThroughput(rps) {
  if (rps >= performanceIndicators.throughput.excellent) return 'excellent';
  if (rps >= performanceIndicators.throughput.good) return 'good';
  if (rps >= performanceIndicators.throughput.acceptable) return 'acceptable';
  if (rps >= performanceIndicators.throughput.poor) return 'poor';
  return 'critical';
}

export function evaluateErrorRate(rate) {
  if (rate <= performanceIndicators.errorRate.excellent) return 'excellent';
  if (rate <= performanceIndicators.errorRate.good) return 'good';
  if (rate <= performanceIndicators.errorRate.acceptable) return 'acceptable';
  if (rate <= performanceIndicators.errorRate.poor) return 'poor';
  return 'critical';
}
