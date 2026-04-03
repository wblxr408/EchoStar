/**
 * 测试报告生成器
 * 
 * 增强功能：
 *   - 按接口细分 p95/p99 响应时间
 *   - 错误分类统计（4xx / 5xx / 429）
 *   - 性能等级评定
 *   - 支持 JSON 和 Markdown 报告输出
 */

import { evaluateResponseTime, evaluateThroughput, evaluateErrorRate } from './config.js';

// 存储测试结果
let testResults = {
  metadata: {
    startTime: null,
    endTime: null,
    duration: 0,
    version: '2.0.0',
    profile: null,
  },
  summary: {
    totalRequests: 0,
    successRequests: 0,
    failedRequests: 0,
    errorRate: 0,
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    minResponseTime: 0,
    maxResponseTime: 0,
    requestsPerSecond: 0,
  },
  phases: {},
  endpoints: {},
  metrics: {
    responseTimeGrades: {
      excellent: 0,
      good: 0,
      acceptable: 0,
      slow: 0,
      critical: 0,
    },
    throughputGrade: 'unknown',
    errorRateGrade: 'unknown',
  },
  errorBreakdown: {
    '4xx': 0,
    '5xx': 0,
    '429': 0,
    'other': 0,
  },
  dataCreated: {
    users: 0,
    admins: 0,
    stories: 0,
    comments: 0,
    likes: 0,
    favorites: 0,
    reports: 0,
  },
  errors: [],
};

// 存储每个接口的详细指标
let endpointMetrics = {};

// 存储响应时间历史
let responseTimes = [];

/**
 * 初始化测试
 */
export function initTest(profileName) {
  testResults.metadata.startTime = new Date().toISOString();
  testResults.metadata.profile = profileName || null;
  testResults.summary.totalRequests = 0;
  testResults.summary.successRequests = 0;
  testResults.summary.failedRequests = 0;
  testResults.errorBreakdown = { '4xx': 0, '5xx': 0, '429': 0, 'other': 0 };
  responseTimes = [];
  endpointMetrics = {};
}

/**
 * 记录请求结果（增强版：支持错误分类）
 */
export function recordRequest(endpoint, success, responseTime, statusCode = null) {
  testResults.summary.totalRequests += 1;

  if (success) {
    testResults.summary.successRequests += 1;
  } else {
    testResults.summary.failedRequests += 1;

    // 错误分类
    if (statusCode === 429) {
      testResults.errorBreakdown['429'] += 1;
    } else if (statusCode >= 400 && statusCode < 500) {
      testResults.errorBreakdown['4xx'] += 1;
    } else if (statusCode >= 500) {
      testResults.errorBreakdown['5xx'] += 1;
    } else {
      testResults.errorBreakdown['other'] += 1;
    }

    if (statusCode) {
      testResults.errors.push({
        endpoint: endpoint,
        statusCode: statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  }

  responseTimes.push(responseTime);

  // 记录接口级别指标
  if (!endpointMetrics[endpoint]) {
    endpointMetrics[endpoint] = {
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      statusCodes: {},
    };
  }

  endpointMetrics[endpoint].totalRequests += 1;
  if (success) {
    endpointMetrics[endpoint].successRequests += 1;
  } else {
    endpointMetrics[endpoint].failedRequests += 1;
  }
  endpointMetrics[endpoint].responseTimes.push(responseTime);

  // 按状态码统计
  if (statusCode) {
    const code = String(statusCode);
    endpointMetrics[endpoint].statusCodes[code] = (endpointMetrics[endpoint].statusCodes[code] || 0) + 1;
  }

  // 更新响应时间等级统计
  const grade = evaluateResponseTime(responseTime);
  testResults.metrics.responseTimeGrades[grade] += 1;
}

/**
 * 开始一个测试阶段
 */
export function startPhase(phaseName) {
  testResults.phases[phaseName] = {
    startTime: new Date().toISOString(),
    endTime: null,
    requests: 0,
    errors: 0,
  };
}

/**
 * 结束一个测试阶段
 */
export function endPhase(phaseName) {
  if (testResults.phases[phaseName]) {
    testResults.phases[phaseName].endTime = new Date().toISOString();
  }
}

/**
 * 更新创建的数据量
 */
export function updateDataCreated(dataType, count) {
  if (testResults.dataCreated[dataType] !== undefined) {
    testResults.dataCreated[dataType] += count;
  }
}

/**
 * 计算百分位数
 */
function calculatePercentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

/**
 * 计算接口级别统计
 */
function calculateEndpointStats(endpoint, metrics) {
  const sortedTimes = metrics.responseTimes.slice().sort((a, b) => a - b);
  const avg = sortedTimes.length > 0
    ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length
    : 0;

  return {
    totalRequests: metrics.totalRequests,
    successRequests: metrics.successRequests,
    failedRequests: metrics.failedRequests,
    errorRate: metrics.totalRequests > 0
      ? (metrics.failedRequests / metrics.totalRequests * 100).toFixed(2)
      : 0,
    avgResponseTime: avg.toFixed(2),
    minResponseTime: sortedTimes.length > 0 ? sortedTimes[0] : 0,
    maxResponseTime: sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0,
    p50ResponseTime: calculatePercentile(sortedTimes, 50).toFixed(2),
    p90ResponseTime: calculatePercentile(sortedTimes, 90).toFixed(2),
    p95ResponseTime: calculatePercentile(sortedTimes, 95).toFixed(2),
    p99ResponseTime: calculatePercentile(sortedTimes, 99).toFixed(2),
    grade: evaluateResponseTime(avg),
    statusCodes: metrics.statusCodes,
  };
}

/**
 * 结束测试并生成报告
 */
export function finalizeTest() {
  testResults.metadata.endTime = new Date().toISOString();

  const startTime = new Date(testResults.metadata.startTime);
  const endTime = new Date(testResults.metadata.endTime);
  testResults.metadata.duration = (endTime - startTime) / 1000;

  // 计算汇总统计
  const sortedTimes = responseTimes.sort((a, b) => a - b);

  testResults.summary.errorRate = testResults.summary.totalRequests > 0
    ? (testResults.summary.failedRequests / testResults.summary.totalRequests * 100).toFixed(2)
    : 0;

  testResults.summary.avgResponseTime = sortedTimes.length > 0
    ? (sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length).toFixed(2)
    : 0;

  testResults.summary.p95ResponseTime = calculatePercentile(sortedTimes, 95);
  testResults.summary.p99ResponseTime = calculatePercentile(sortedTimes, 99);
  testResults.summary.minResponseTime = sortedTimes.length > 0 ? sortedTimes[0] : 0;
  testResults.summary.maxResponseTime = sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0;

  testResults.summary.requestsPerSecond = testResults.metadata.duration > 0
    ? (testResults.summary.totalRequests / testResults.metadata.duration).toFixed(2)
    : 0;

  // 计算吞吐量和错误率等级
  testResults.metrics.throughputGrade = evaluateThroughput(parseFloat(testResults.summary.requestsPerSecond));
  testResults.metrics.errorRateGrade = evaluateErrorRate(parseFloat(testResults.summary.errorRate));

  // 计算每个接口的统计
  for (const [endpoint, metrics] of Object.entries(endpointMetrics)) {
    testResults.endpoints[endpoint] = calculateEndpointStats(endpoint, metrics);
  }

  return testResults;
}

/**
 * 生成 JSON 报告
 */
export function generateJsonReport() {
  return JSON.stringify(testResults, null, 2);
}

/**
 * 生成 Markdown 报告
 */
export function generateMarkdownReport() {
  const report = testResults;

  let md = `# EchoStar 后端压力测试报告

## 测试概览

| 指标 | 值 |
|------|-----|
| Profile | ${report.metadata.profile || 'N/A'} |
| 开始时间 | ${report.metadata.startTime} |
| 结束时间 | ${report.metadata.endTime} |
| 持续时间 | ${report.metadata.duration.toFixed(2)} 秒 |
| 总请求数 | ${report.summary.totalRequests} |
| 成功请求 | ${report.summary.successRequests} |
| 失败请求 | ${report.summary.failedRequests} |
| 错误率 | ${report.summary.errorRate}% |
| 吞吐量 | ${report.summary.requestsPerSecond} req/s |

## 错误分类

| 类型 | 数量 | 占失败请求比例 |
|------|------|----------------|
| 4xx (客户端错误) | ${report.errorBreakdown['4xx']} | ${report.summary.failedRequests > 0 ? ((report.errorBreakdown['4xx'] / report.summary.failedRequests) * 100).toFixed(1) : 0}% |
| 429 (限流) | ${report.errorBreakdown['429']} | ${report.summary.failedRequests > 0 ? ((report.errorBreakdown['429'] / report.summary.failedRequests) * 100).toFixed(1) : 0}% |
| 5xx (服务端错误) | ${report.errorBreakdown['5xx']} | ${report.summary.failedRequests > 0 ? ((report.errorBreakdown['5xx'] / report.summary.failedRequests) * 100).toFixed(1) : 0}% |
| 其他 | ${report.errorBreakdown['other']} | ${report.summary.failedRequests > 0 ? ((report.errorBreakdown['other'] / report.summary.failedRequests) * 100).toFixed(1) : 0}% |

## 性能指标

### 响应时间

| 指标 | 值 (ms) | 评级 |
|------|---------|------|
| 平均响应时间 | ${report.summary.avgResponseTime} | ${evaluateResponseTime(parseFloat(report.summary.avgResponseTime))} |
| P95 响应时间 | ${report.summary.p95ResponseTime} | ${evaluateResponseTime(report.summary.p95ResponseTime)} |
| P99 响应时间 | ${report.summary.p99ResponseTime} | ${evaluateResponseTime(report.summary.p99ResponseTime)} |
| 最小响应时间 | ${report.summary.minResponseTime} | - |
| 最大响应时间 | ${report.summary.maxResponseTime} | ${evaluateResponseTime(report.summary.maxResponseTime)} |

### 响应时间分布

| 等级 | 请求数 | 占比 |
|------|--------|------|
| 优秀 (<=100ms) | ${report.metrics.responseTimeGrades.excellent} | ${(report.summary.totalRequests > 0 ? report.metrics.responseTimeGrades.excellent / report.summary.totalRequests * 100 : 0).toFixed(2)}% |
| 良好 (<=300ms) | ${report.metrics.responseTimeGrades.good} | ${(report.summary.totalRequests > 0 ? report.metrics.responseTimeGrades.good / report.summary.totalRequests * 100 : 0).toFixed(2)}% |
| 可接受 (<=500ms) | ${report.metrics.responseTimeGrades.acceptable} | ${(report.summary.totalRequests > 0 ? report.metrics.responseTimeGrades.acceptable / report.summary.totalRequests * 100 : 0).toFixed(2)}% |
| 较慢 (<=1000ms) | ${report.metrics.responseTimeGrades.slow} | ${(report.summary.totalRequests > 0 ? report.metrics.responseTimeGrades.slow / report.summary.totalRequests * 100 : 0).toFixed(2)}% |
| 严重慢 (>1000ms) | ${report.metrics.responseTimeGrades.critical} | ${(report.summary.totalRequests > 0 ? report.metrics.responseTimeGrades.critical / report.summary.totalRequests * 100 : 0).toFixed(2)}% |

## 测试数据创建

| 数据类型 | 数量 |
|----------|------|
| 普通用户 | ${report.dataCreated.users} |
| 管理员 | ${report.dataCreated.admins} |
| 故事 | ${report.dataCreated.stories} |
| 评论 | ${report.dataCreated.comments} |
| 点赞 | ${report.dataCreated.likes} |
| 收藏 | ${report.dataCreated.favorites} |
| 举报 | ${report.dataCreated.reports} |

## 接口性能详情

`;

  // 按模块分组接口
  const modules = {};
  for (const [endpoint, stats] of Object.entries(report.endpoints)) {
    const module = endpoint.split('/')[2] || 'other';
    if (!modules[module]) modules[module] = [];
    modules[module].push({ endpoint, ...stats });
  }

  for (const [module, endpoints] of Object.entries(modules)) {
    md += `### ${module.toUpperCase()} 模块\n\n`;
    md += `| 接口 | 请求数 | 成功率 | 平均响应(ms) | P95响应(ms) | P99响应(ms) | 评级 |\n`;
    md += `|------|--------|--------|--------------|-------------|-------------|------|\n`;

    for (const ep of endpoints) {
      const successRate = ep.totalRequests > 0
        ? ((ep.successRequests / ep.totalRequests) * 100).toFixed(2)
        : 0;
      md += `| ${ep.endpoint} | ${ep.totalRequests} | ${successRate}% | ${ep.avgResponseTime} | ${ep.p95ResponseTime} | ${ep.p99ResponseTime} | ${ep.grade} |\n`;
    }
    md += `\n`;
  }

  // 错误详情
  if (report.errors.length > 0) {
    md += `## 错误详情\n\n`;
    md += `| 接口 | 状态码 | 次数 |\n`;
    md += `|------|--------|------|\n`;

    const errorSummary = {};
    for (const error of report.errors.slice(0, 100)) {
      const key = `${error.endpoint}:${error.statusCode}`;
      if (!errorSummary[key]) {
        errorSummary[key] = { ...error, count: 0 };
      }
      errorSummary[key].count += 1;
    }

    for (const [, err] of Object.entries(errorSummary)) {
      md += `| ${err.endpoint} | ${err.statusCode} | ${err.count} |\n`;
    }
  }

  md += `\n---\n`;
  md += `\n*报告生成时间: ${new Date().toISOString()}*\n`;

  return md;
}

/**
 * 获取当前测试结果
 */
export function getTestResults() {
  return testResults;
}

/**
 * 重置测试结果
 */
export function resetTestResults() {
  testResults = {
    metadata: {
      startTime: null,
      endTime: null,
      duration: 0,
      version: '2.0.0',
      profile: null,
    },
    summary: {
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      requestsPerSecond: 0,
    },
    phases: {},
    endpoints: {},
    metrics: {
      responseTimeGrades: {
        excellent: 0,
        good: 0,
        acceptable: 0,
        slow: 0,
        critical: 0,
      },
      throughputGrade: 'unknown',
      errorRateGrade: 'unknown',
    },
    errorBreakdown: {
      '4xx': 0,
      '5xx': 0,
      '429': 0,
      'other': 0,
    },
    dataCreated: {
      users: 0,
      admins: 0,
      stories: 0,
      comments: 0,
      likes: 0,
      favorites: 0,
      reports: 0,
    },
    errors: [],
  };
  responseTimes = [];
  endpointMetrics = {};
}
