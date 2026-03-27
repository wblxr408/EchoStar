/**
 * k6 压力测试配置
 * 可通过环境变量覆盖默认值
 * 支持两种测试模式：
 *   - rate-limit: 限流测试（服务器保留限流，验证限流功能正确性）
 *   - performance: 性能测试（服务器关闭限流，验证后端大流量性能）
 */

// 测试模式（由 run-test.bat/run-test.sh 通过环境变量传入）
export const testMode = __ENV.TEST_MODE || 'performance';

// 测试数据量配置（可通过命令行参数覆盖）
export const config = {
  // 基础 URL
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',

  // 用户配置
  users: {
    count: parseInt(__ENV.USER_COUNT) || 5000,           // 普通用户数量
    adminCount: parseInt(__ENV.ADMIN_COUNT) || 500,     // 管理员数量
    batchSize: parseInt(__ENV.USER_BATCH_SIZE) || 50,   // 每批次创建数量
  },

  // 故事配置
  stories: {
    count: parseInt(__ENV.STORY_COUNT) || 25000,         // 故事数量
    batchSize: parseInt(__ENV.STORY_BATCH_SIZE) || 50,  // 每批次创建数量
  },

  // 评论配置
  comments: {
    count: parseInt(__ENV.COMMENT_COUNT) || 10000,       // 评论数量
    batchSize: parseInt(__ENV.COMMENT_BATCH_SIZE) || 50, // 每批次创建数量
  },

  // 点赞配置
  likes: {
    count: parseInt(__ENV.LIKE_COUNT) || 20000,          // 点赞数量
    batchSize: parseInt(__ENV.LIKE_BATCH_SIZE) || 100,  // 每批次创建数量
  },

  // 收藏配置
  favorites: {
    count: parseInt(__ENV.FAVORITE_COUNT) || 10000,       // 收藏数量
    batchSize: parseInt(__ENV.FAVORITE_BATCH_SIZE) || 50, // 每批次创建数量
  },

  // 举报配置
  reports: {
    count: parseInt(__ENV.REPORT_COUNT) || 1000,          // 举报数量
  },

  // 并发配置
  concurrency: {
    setup: parseInt(__ENV.SETUP_VUS) || 10,              // 数据准备阶段并发数
    load: parseInt(__ENV.LOAD_VUS) || 50,                // 负载测试阶段并发数
    stress: parseInt(__ENV.STRESS_VUS) || 100,           // 压力测试阶段并发数
    spike: parseInt(__ENV.SPIKE_VUS) || 200,              // 峰值测试阶段并发数
  },

  // 持续时间配置（秒）
  duration: {
    setup: __ENV.SETUP_DURATION || '5m',                  // 数据准备阶段
    load: __ENV.LOAD_DURATION || '3m',                    // 负载测试阶段
    stress: __ENV.STRESS_DURATION || '2m',                // 压力测试阶段
    spike: __ENV.SPIKE_DURATION || '1m',                  // 峰值测试阶段
    cooldown: __ENV.COOLDOWN_DURATION || '30s',           // 冷却阶段
  },

  // 性能阈值（毫秒）
  thresholds: {
    p95: parseInt(__ENV.THRESHOLD_P95) || 500,            // 95% 请求响应时间
    p99: parseInt(__ENV.THRESHOLD_P99) || 1000,           // 99% 请求响应时间
    avg: parseInt(__ENV.THRESHOLD_AVG) || 200,            // 平均响应时间
    errorRate: parseFloat(__ENV.THRESHOLD_ERROR_RATE) || 0.01, // 错误率阈值
  },

  // 报告输出路径（根据测试模式自动选择子目录）
  report: {
    outputDir: __ENV.REPORT_DIR || `tests/k6/test-reports/${testMode === 'rate-limit' ? 'rate-limit-test' : 'performance-test'}`,
  },
};

// 性能指标定义
export const performanceIndicators = {
  // 响应时间等级（毫秒）
  responseTime: {
    excellent: 100,    // 优秀
    good: 300,         // 良好
    acceptable: 500,   // 可接受
    slow: 1000,        // 较慢
    critical: 2000,    // 严重慢
  },

  // 吞吐量等级（请求/秒）
  throughput: {
    excellent: 500,    // 优秀
    good: 200,         // 良好
    acceptable: 100,   // 可接受
    poor: 50,          // 较差
    critical: 10,      // 严重差
  },

  // 错误率等级（百分比）
  errorRate: {
    excellent: 0.1,    // 优秀
    good: 0.5,          // 良好
    acceptable: 1,      // 可接受
    poor: 5,            // 较差
    critical: 10,       // 严重差
  },
};

/**
 * 评估响应时间等级
 */
export function evaluateResponseTime(time) {
  if (time <= performanceIndicators.responseTime.excellent) return 'excellent';
  if (time <= performanceIndicators.responseTime.good) return 'good';
  if (time <= performanceIndicators.responseTime.acceptable) return 'acceptable';
  if (time <= performanceIndicators.responseTime.slow) return 'slow';
  return 'critical';
}

/**
 * 评估吞吐量等级
 */
export function evaluateThroughput(rps) {
  if (rps >= performanceIndicators.throughput.excellent) return 'excellent';
  if (rps >= performanceIndicators.throughput.good) return 'good';
  if (rps >= performanceIndicators.throughput.acceptable) return 'acceptable';
  if (rps >= performanceIndicators.throughput.poor) return 'poor';
  return 'critical';
}

/**
 * 评估错误率等级
 */
export function evaluateErrorRate(rate) {
  if (rate <= performanceIndicators.errorRate.excellent) return 'excellent';
  if (rate <= performanceIndicators.errorRate.good) return 'good';
  if (rate <= performanceIndicators.errorRate.acceptable) return 'acceptable';
  if (rate <= performanceIndicators.errorRate.poor) return 'poor';
  return 'critical';
}
