/**
 * k6 测试报告解析器
 * 将 k6 输出的 JSON 报告转换为可读的 Markdown 报告
 * 
 * 使用方法: node parse-report.js <json-report-file> [output-dir]
 */

import fs from 'fs';
import path from 'path';

// 性能等级定义
const GRADES = {
  responseTime: {
    excellent: { threshold: 100, label: '优秀', color: '🟢' },
    good: { threshold: 300, label: '良好', color: '🟡' },
    acceptable: { threshold: 500, label: '可接受', color: '🟠' },
    slow: { threshold: 1000, label: '较慢', color: '🔴' },
    critical: { threshold: Infinity, label: '严重慢', color: '⛔' },
  },
  errorRate: {
    excellent: { threshold: 0.1, label: '优秀', color: '🟢' },
    good: { threshold: 0.5, label: '良好', color: '🟡' },
    acceptable: { threshold: 1, label: '可接受', color: '🟠' },
    poor: { threshold: 5, label: '较差', color: '🔴' },
    critical: { threshold: Infinity, label: '严重差', color: '⛔' },
  },
};

/**
 * 评估响应时间等级
 */
function evaluateResponseTime(time) {
  for (const [grade, config] of Object.entries(GRADES.responseTime)) {
    if (time <= config.threshold) {
      return { grade, ...config };
    }
  }
  return { grade: 'critical', ...GRADES.responseTime.critical };
}

/**
 * 评估错误率等级
 */
function evaluateErrorRate(rate) {
  for (const [grade, config] of Object.entries(GRADES.errorRate)) {
    if (rate <= config.threshold) {
      return { grade, ...config };
    }
  }
  return { grade: 'critical', ...GRADES.errorRate.critical };
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
 * 解析 k6 JSON 报告
 */
function parseK6Report(jsonFilePath) {
  const content = fs.readFileSync(jsonFilePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  const metrics = {
    requests: [],
    httpReqDuration: [],
    httpReqFailed: [],
    iterations: [],
    vus: [],
    endpoints: {},
    groups: {},
    startTime: null,
    endTime: null,
  };
  
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const type = entry.type;
      const data = entry.data;
      
      // 记录时间范围
      const timestamp = new Date(entry.timestamp);
      if (!metrics.startTime || timestamp < metrics.startTime) {
        metrics.startTime = timestamp;
      }
      if (!metrics.endTime || timestamp > metrics.endTime) {
        metrics.endTime = timestamp;
      }
      
      if (type === 'Point') {
        const metricName = entry.metric;
        
        // 处理 HTTP 请求持续时间
        if (metricName === 'http_req_duration') {
          const duration = data.value;
          const tags = data.tags || {};
          const endpoint = tags.endpoint || tags.name || 'unknown';
          const group = tags.group || 'default';
          
          metrics.httpReqDuration.push({
            duration,
            endpoint,
            group,
            timestamp: entry.timestamp,
          });
          
          // 按接口统计
          if (!metrics.endpoints[endpoint]) {
            metrics.endpoints[endpoint] = {
              durations: [],
              failures: 0,
              successes: 0,
            };
          }
          metrics.endpoints[endpoint].durations.push(duration);
          
          // 按分组统计
          if (!metrics.groups[group]) {
            metrics.groups[group] = {
              durations: [],
              failures: 0,
              successes: 0,
            };
          }
          metrics.groups[group].durations.push(duration);
        }
        
        // 处理 HTTP 请求失败
        if (metricName === 'http_req_failed') {
          const failed = data.value;
          const tags = data.tags || {};
          const endpoint = tags.endpoint || tags.name || 'unknown';
          const group = tags.group || 'default';
          
          metrics.httpReqFailed.push({ failed, endpoint, group });
          
          if (metrics.endpoints[endpoint]) {
            if (failed === 1) {
              metrics.endpoints[endpoint].failures++;
            } else {
              metrics.endpoints[endpoint].successes++;
            }
          }
          
          if (metrics.groups[group]) {
            if (failed === 1) {
              metrics.groups[group].failures++;
            } else {
              metrics.groups[group].successes++;
            }
          }
        }
        
        // 处理迭代次数
        if (metricName === 'iterations') {
          metrics.iterations.push(data.value);
        }
        
        // 处理 VU 数量
        if (metricName === 'vus' || metricName === 'vus_max') {
          metrics.vus.push(data.value);
        }
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  
  return metrics;
}

/**
 * 生成 Markdown 报告
 */
function generateMarkdownReport(metrics) {
  const totalRequests = metrics.httpReqDuration.length;
  if (totalRequests === 0) {
    return '# 测试报告\n\n没有找到测试数据。\n';
  }
  
  // 计算总体统计
  const allDurations = metrics.httpReqDuration.map(d => d.duration).sort((a, b) => a - b);
  const avgDuration = allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
  const p50 = calculatePercentile(allDurations, 50);
  const p90 = calculatePercentile(allDurations, 90);
  const p95 = calculatePercentile(allDurations, 95);
  const p99 = calculatePercentile(allDurations, 99);
  const minDuration = allDurations[0];
  const maxDuration = allDurations[allDurations.length - 1];
  
  const totalFailures = metrics.httpReqFailed.filter(f => f.failed === 1).length;
  const errorRate = (totalFailures / totalRequests * 100);
  const successRate = (100 - errorRate).toFixed(2);
  
  // 计算吞吐量
  const duration = metrics.endTime && metrics.startTime 
    ? (metrics.endTime - metrics.startTime) / 1000 
    : 0;
  const rps = duration > 0 ? (totalRequests / duration).toFixed(2) : 0;
  
  // 评估等级
  const avgGrade = evaluateResponseTime(avgDuration);
  const p95Grade = evaluateResponseTime(p95);
  const errorGrade = evaluateErrorRate(errorRate);
  
  let md = `# EchoStar 后端压力测试报告

## 测试概览

| 指标 | 值 |
|------|-----|
| 测试开始时间 | ${metrics.startTime?.toISOString() || 'N/A'} |
| 测试结束时间 | ${metrics.endTime?.toISOString() || 'N/A'} |
| 测试持续时间 | ${duration.toFixed(2)} 秒 |
| 总请求数 | ${totalRequests} |
| 成功请求数 | ${totalRequests - totalFailures} |
| 失败请求数 | ${totalFailures} |
| 成功率 | ${successRate}% |
| 吞吐量 | ${rps} req/s |

## 性能指标总览

### 响应时间

| 指标 | 值 (ms) | 评级 |
|------|---------|------|
| 平均响应时间 | ${avgDuration.toFixed(2)} | ${avgGrade.color} ${avgGrade.label} |
| P50 响应时间 | ${p50.toFixed(2)} | ${evaluateResponseTime(p50).color} ${evaluateResponseTime(p50).label} |
| P90 响应时间 | ${p90.toFixed(2)} | ${evaluateResponseTime(p90).color} ${evaluateResponseTime(p90).label} |
| P95 响应时间 | ${p95.toFixed(2)} | ${p95Grade.color} ${p95Grade.label} |
| P99 响应时间 | ${p99.toFixed(2)} | ${evaluateResponseTime(p99).color} ${evaluateResponseTime(p99).label} |
| 最小响应时间 | ${minDuration.toFixed(2)} | - |
| 最大响应时间 | ${maxDuration.toFixed(2)} | ${evaluateResponseTime(maxDuration).color} ${evaluateResponseTime(maxDuration).label} |

### 错误率

| 指标 | 值 | 评级 |
|------|-----|------|
| 错误率 | ${errorRate.toFixed(2)}% | ${errorGrade.color} ${errorGrade.label} |
| 成功率 | ${successRate}% | - |

## 响应时间分布

`;

  // 计算响应时间分布
  const distribution = {
    excellent: 0, // < 100ms
    good: 0,      // 100-300ms
    acceptable: 0, // 300-500ms
    slow: 0,      // 500-1000ms
    critical: 0,  // > 1000ms
  };
  
  for (const duration of allDurations) {
    if (duration < 100) distribution.excellent++;
    else if (duration < 300) distribution.good++;
    else if (duration < 500) distribution.acceptable++;
    else if (duration < 1000) distribution.slow++;
    else distribution.critical++;
  }
  
  md += `| 等级 | 响应时间范围 | 请求数 | 占比 |
|------|-------------|--------|------|
| 🟢 优秀 | < 100ms | ${distribution.excellent} | ${(distribution.excellent / totalRequests * 100).toFixed(2)}% |
| 🟡 良好 | 100-300ms | ${distribution.good} | ${(distribution.good / totalRequests * 100).toFixed(2)}% |
| 🟠 可接受 | 300-500ms | ${distribution.acceptable} | ${(distribution.acceptable / totalRequests * 100).toFixed(2)}% |
| 🔴 较慢 | 500-1000ms | ${distribution.slow} | ${(distribution.slow / totalRequests * 100).toFixed(2)}% |
| ⛔ 严重慢 | > 1000ms | ${distribution.critical} | ${(distribution.critical / totalRequests * 100).toFixed(2)}% |

`;

  // 按接口分组统计
  md += `## 接口性能详情

`;

  // 按模块分组接口
  const moduleEndpoints = {};
  for (const [endpoint, stats] of Object.entries(metrics.endpoints)) {
    if (stats.durations.length === 0) continue;
    
    // 从 endpoint 提取模块名
    const parts = endpoint.split('/');
    const moduleName = parts[2] || 'other';
    
    if (!moduleEndpoints[moduleName]) {
      moduleEndpoints[moduleName] = [];
    }
    
    const sortedDurations = stats.durations.sort((a, b) => a - b);
    const avg = sortedDurations.reduce((a, b) => a + b, 0) / sortedDurations.length;
    const ep = {
      endpoint,
      count: sortedDurations.length,
      avg: avg,
      p95: calculatePercentile(sortedDurations, 95),
      min: sortedDurations[0],
      max: sortedDurations[sortedDurations.length - 1],
      failures: stats.failures,
      successes: stats.successes,
    };
    
    moduleEndpoints[moduleName].push(ep);
  }

  for (const [module, endpoints] of Object.entries(moduleEndpoints)) {
    md += `### ${module.toUpperCase()} 模块\n\n`;
    md += `| 接口 | 请求数 | 成功率 | 平均响应(ms) | P95响应(ms) | 评级 |\n`;
    md += `|------|--------|--------|--------------|-------------|------|\n`;
    
    for (const ep of endpoints.sort((a, b) => b.count - a.count)) {
      const successRate = ep.count > 0 
        ? ((ep.successes / ep.count) * 100).toFixed(2) 
        : '0.00';
      const grade = evaluateResponseTime(ep.avg);
      md += `| ${ep.endpoint.substring(0, 50)} | ${ep.count} | ${successRate}% | ${ep.avg.toFixed(2)} | ${ep.p95.toFixed(2)} | ${grade.color} ${grade.label} |\n`;
    }
    md += `\n`;
  }

  // 添加测试建议
  md += `## 测试结果分析

`;

  if (errorRate > 5) {
    md += `### ⚠️ 警告：错误率过高

当前错误率为 ${errorRate.toFixed(2)}%，超过了 5% 的阈值。建议检查：
- 服务器是否正常运行
- 数据库连接是否稳定
- API 限流配置是否合理

`;
  }

  if (p95 > 1000) {
    md += `### ⚠️ 警告：响应时间过长

P95 响应时间为 ${p95.toFixed(2)}ms，超过了 1000ms 的阈值。建议检查：
- 数据库查询是否有慢查询
- 是否需要添加索引
- 服务器资源是否充足

`;
  }

  if (avgDuration < 300 && errorRate < 1) {
    md += `### ✅ 测试通过

系统在当前负载下表现良好：
- 平均响应时间 ${avgDuration.toFixed(2)}ms，处于良好水平
- 错误率 ${errorRate.toFixed(2)}%，处于可接受范围

`;
  }

  md += `---
*报告生成时间: ${new Date().toISOString()}*
`;

  return md;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('使用方法: node parse-report.js <json-report-file> [output-dir]');
    console.log('');
    console.log('参数:');
    console.log('  json-report-file  k6 输出的 JSON 报告文件路径');
    console.log('  output-dir        报告输出目录（可选，默认为报告文件所在目录）');
    process.exit(1);
  }
  
  const jsonFilePath = args[0];
  const outputDir = args[1] || path.dirname(jsonFilePath);
  
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`错误: 文件不存在: ${jsonFilePath}`);
    process.exit(1);
  }
  
  console.log(`解析报告: ${jsonFilePath}`);
  
  const metrics = parseK6Report(jsonFilePath);
  const markdown = generateMarkdownReport(metrics);
  
  // 生成输出文件名
  const baseName = path.basename(jsonFilePath, '.json');
  const mdFilePath = path.join(outputDir, `${baseName}-report.md`);
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 写入 Markdown 报告
  fs.writeFileSync(mdFilePath, markdown, 'utf-8');
  
  console.log(`报告已生成: ${mdFilePath}`);
  console.log('');
  console.log('=== 测试摘要 ===');
  console.log(`总请求数: ${metrics.httpReqDuration.length}`);
  console.log(`测试持续时间: ${metrics.endTime && metrics.startTime ? ((metrics.endTime - metrics.startTime) / 1000).toFixed(2) : 'N/A'} 秒`);
}

main();
