/**
 * k6 测试报告解析器 v3.0
 *
 * 核心功能：
 *   1. 自动检测格式（Summary Export / JSON Lines）
 *   2. JSON Lines 模式：按 Stage 细分，计算每个 Stage 各接口 P50/P90/P95/P99
 *   3. 自动检测性能拐点（P95 突增 >30% 或错误率 >5%）
 *   4. 关联 monitor.cjs 采集的 Redis/PG 指标
 *   5. 输出完整 Markdown 报告 + 阶段性能 JSON
 *
 * 使用方法:
 *   node parse-report.js <report-file> [output-dir]
 *   node parse-report.js <summary-json> <jsonlines-file> [output-dir]  # 同时提供两种报告
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

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

function evaluateResponseTime(time) {
  for (const [grade, config] of Object.entries(GRADES.responseTime)) {
    if (time <= config.threshold) return { grade, ...config };
  }
  return { grade: 'critical', ...GRADES.responseTime.critical };
}

function evaluateErrorRate(rate) {
  for (const [grade, config] of Object.entries(GRADES.errorRate)) {
    if (rate <= config.threshold) return { grade, ...config };
  }
  return { grade: 'critical', ...GRADES.errorRate.critical };
}

function calculatePercentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

/**
 * 只读取文件的第一行（用于大文件格式检测，避免 readFileSync 爆内存）
 */
function readFirstLine(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(1024);
  const bytesRead = fs.readSync(fd, buf, 0, 1024, 0);
  fs.closeSync(fd);
  const firstLine = buf.toString('utf-8', 0, bytesRead).split('\n')[0];
  return firstLine;
}

function calcStats(durations) {
  if (durations.length === 0) return { count: 0, avg: 0, min: 0, max: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  const sorted = durations.slice().sort((a, b) => a - b);
  return {
    count: sorted.length,
    avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: calculatePercentile(sorted, 50),
    p90: calculatePercentile(sorted, 90),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
  };
}

// ===================== 格式检测 =====================

function detectFormat(content) {
  const trimmed = content.trim();
  const firstChar = trimmed[0];

  if (firstChar === '{') {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.metrics) return 'summary';
    } catch (e) {}
  }

  try {
    const firstLine = trimmed.split('\n')[0];
    const entry = JSON.parse(firstLine);
    if (entry.type || entry.metric) return 'jsonlines';
  } catch (e) {}

  const lines = trimmed.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    try {
      const first = JSON.parse(lines[0]);
      if (first.type) return 'jsonlines';
    } catch (e) {}
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && parsed.metrics) return 'summary';
  } catch (e) {}

  return 'unknown';
}

// ===================== Summary Export 解析 =====================

function parseMetricTags(metricName) {
  const match = metricName.match(/^(.+)\{(.+)\}$/);
  if (!match) return { baseName: metricName, tags: {} };

  const baseName = match[1];
  const tags = {};
  const tagPairs = match[2].split(',');
  for (const pair of tagPairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex > -1) {
      const key = pair.substring(0, colonIndex).trim();
      const value = pair.substring(colonIndex + 1).trim();
      tags[key] = value;
    }
  }
  return { baseName, tags };
}

function extractTrendValues(metricData) {
  if (!metricData) return {};
  // k6 summary-export: values are top-level or under "values" key
  const values = metricData.values || metricData;
  return {
    avg: values.avg || 0, min: values.min || 0,
    med: values.med || values['p(50)'] || 0, max: values.max || 0,
    p50: values.med || values['p(50)'] || 0,
    p90: values['p(90)'] || 0, p95: values['p(95)'] || 0,
    p99: values['p(99)'] || 0, count: values.count || 0,
  };
}

function extractRateValues(metricData) {
  if (!metricData) return { rate: 0, passes: 0, fails: 0 };
  const values = metricData.values || metricData;
  return { rate: values.rate || values.value || 0, passes: values.passes || 0, fails: values.fails || 0 };
}

function parseSummaryExport(jsonFilePath) {
  const content = fs.readFileSync(jsonFilePath, 'utf-8');
  const data = JSON.parse(content.trim());
  const metrics = data.metrics || {};

  // k6 summary-export: count 在 http_reqs 中，不在 http_req_duration 中
  const httpReqs = metrics['http_reqs']?.values || metrics['http_reqs'] || {};
  const overallDuration = extractTrendValues(metrics['http_req_duration']);
  overallDuration.count = httpReqs.count || overallDuration.count || 0;

  // k6 summary-export 可能没有 state 字段，尝试多种方式获取
  let testRunDurationMs = data.state?.testRunDurationMs || 0;
  if (!testRunDurationMs) {
    const setupTs = data.setup_data?.timestamps;
    if (setupTs?.stopped && setupTs?.started) {
      testRunDurationMs = new Date(setupTs.stopped) - new Date(setupTs.started);
    } else if (httpReqs.count && httpReqs.rate && httpReqs.rate > 0) {
      // 从请求数和速率推算: duration = count / rate * 1000
      testRunDurationMs = (httpReqs.count / httpReqs.rate) * 1000;
    }
  }

  const result = {
    format: 'summary-export',
    startTime: data.state?.testStartTimestamp || data.setup_data?.timestamps?.started || null,
    endTime: null,
    testRunDurationMs,
    options: data.options || {},
    overall: overallDuration,
    endpoints: {},
    groups: {},
    limiters: {},
    error4xx: extractRateValues(metrics['errors_4xx']),
    error5xx: extractRateValues(metrics['errors_5xx']),
    errorOther: extractRateValues(metrics['errors_other']),
    errorRate: extractRateValues(metrics['http_req_failed']),
    rate429: extractRateValues(metrics['rate_429']),
    rateSuccess: extractRateValues(metrics['rate_success']),
    checks: {},
    allMetricNames: Object.keys(metrics),
    // 提取 stages 配置（如果有）
    stages: data.options?.scenarios?.default?.executor === 'ramping-vus'
      ? data.options?.scenarios?.default?.startVUs
      : data.options?.stages || null,
  };

  for (const [metricName, metricData] of Object.entries(metrics)) {
    if (!metricName.startsWith('http_req_duration') || metricName === 'http_req_duration') continue;
    // k6 summary export format varies: some have .type field, some don't
    // Accept if it has avg/med/p95 or .type is Trend/Rate
    const hasNumericValues = metricData.avg !== undefined || metricData.med !== undefined;
    if (!hasNumericValues && metricData.type !== 'Trend' && metricData.type !== 'Rate') continue;

    const { baseName, tags } = parseMetricTags(metricName);

    if (tags.endpoint) {
      result.endpoints[tags.endpoint] = {
        ...extractTrendValues(metricData), endpoint: tags.endpoint, ...tags,
      };
      if (tags.limiter && !result.limiters[tags.limiter]) {
        result.limiters[tags.limiter] = { ...extractTrendValues(metricData), tag: tags.limiter };
      }
    }
    if (tags.group) {
      const groupName = tags.group.replace(/^:+/, '');
      result.groups[groupName] = { ...extractTrendValues(metricData), group: groupName };
    }
  }

  // 递归提取嵌套 groups 中的 checks
  function extractChecks(group, prefix = '') {
    const checks = group.checks || {};
    for (const [name, checkData] of Object.entries(checks)) {
      const fullName = prefix ? `${prefix} > ${name}` : name;
      result.checks[fullName] = {
        passes: checkData.passes || 0, fails: checkData.fails || 0,
        total: (checkData.passes || 0) + (checkData.fails || 0),
        passRate: (checkData.passes || 0) + (checkData.fails || 0) > 0
          ? ((checkData.passes || 0) / ((checkData.passes || 0) + (checkData.fails || 0)) * 100).toFixed(2)
          : '0.00',
      };
    }
    // 递归子 groups
    if (group.groups) {
      for (const [, subGroup] of Object.entries(group.groups)) {
        extractChecks(subGroup, prefix || subGroup.name);
      }
    }
  }

  if (data.root_group) {
    extractChecks(data.root_group);
  }

  return result;
}

// ===================== JSON Lines 深度解析（含 Stage 分析）=====================

/**
 * 解析 JSON Lines 报告，返回完整的按-Stage 细分数据
 */
function parseJsonLinesDeep(jsonFilePath) {
  // 使用 readline 流式读取，避免大文件爆内存
  const raw = {
    httpReqDuration: [],   // { duration, endpoint, group, timestamp, status }
    httpReqFailed: [],     // { failed, endpoint, group }
    vusSamples: [],        // { timestamp, value }
    iterations: [],
    startTime: null,
    endTime: null,
    testStartTimestamp: null,
  };

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(jsonFilePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    let lineCount = 0;
    rl.on('line', (line) => {
      lineCount++;
      if (lineCount % 500000 === 0) {
        process.stderr.write(`  已处理 ${lineCount} 行...\n`);
      }
      try {
        const entry = JSON.parse(line);
        const type = entry.type;
        const data = entry.data;

      const timestamp = data.time ? new Date(data.time) : null;

      // k6 --out json 不输出 testStartTimestamp，用第一个有效时间戳作为 startTime

        if (type === 'Point') {
          if (!raw.startTime || (timestamp && timestamp < raw.startTime)) raw.startTime = timestamp;
          if (!raw.endTime || (timestamp && timestamp > raw.endTime)) raw.endTime = timestamp;

          const metricName = entry.metric;

        if (metricName === 'http_req_duration') {
          const tags = data.tags || {};
          raw.httpReqDuration.push({
            duration: data.value,
            endpoint: tags.endpoint || tags.name || 'unknown',
            group: (tags.group || 'default').replace(/^:+/, ''),
            timestamp: data.time,
            status: tags.status || null,
            expected_response: tags.expected_response !== 'false',
          });
        }

        if (metricName === 'http_req_failed') {
          raw.httpReqFailed.push({
            failed: data.value,
            endpoint: (data.tags || {}).endpoint || 'unknown',
          });
        }

        if (metricName === 'iterations') raw.iterations.push(data.value);
        if (metricName === 'vus') {
          raw.vusSamples.push({ timestamp: data.time, value: data.value });
        }
        }
      } catch (e) {}
    });

    rl.on('close', () => {
      process.stderr.write(`  共处理 ${lineCount} 行\n`);
      resolve(raw);
    });

    rl.on('error', (err) => {
      process.stderr.write(`  读取文件出错: ${err.message}\n`);
      resolve(raw);
    });
  });
}

/**
 * 从 VU 采样数据推断 Stage 边界
 * k6 的 stages 定义了 target VUs 的阶梯，VU 数据会在阶段边界处有明显跳变
 *
 * 策略：
 *   1. 优先使用 k6 原始 stages 配置（如果 summary export 可用）
 *   2. fallback 从 VU 采样推断：取窗口内 VU 中位数作为阶段目标值
 *
 * @returns {{ stages: Array, isFlat: boolean }}
 *   - stages: 阶段定义数组
 *   - isFlat: true 表示 VU 始终平稳（无阶梯），调用方应使用时间窗口 fallback
 */
function inferStagesFromVusData(vusSamples, testStartTimestamp, startTime, k6Stages) {
  if (vusSamples.length === 0) return { stages: [], isFlat: false, avgVus: 0 };

  // 计算相对时间（秒）
  const baseTime = testStartTimestamp ? new Date(testStartTimestamp) : startTime;
  if (!baseTime) return { stages: [], isFlat: false, avgVus: 0 };

  const baseMs = baseTime.getTime();

  // 取样：每隔 10 秒取一个样本，减少噪声（原 3 秒太敏感）
  const sampled = [];
  let lastSampleTime = 0;
  for (const s of vusSamples) {
    const t = new Date(s.timestamp).getTime();
    const relSec = (t - baseMs) / 1000;
    if (relSec < 0) continue;
    if (relSec - lastSampleTime >= 10) {  // 每 10 秒取一个样本
      sampled.push({ relSec, value: s.value });
      lastSampleTime = relSec;
    }
  }

  if (sampled.length < 2) return { stages: [], isFlat: false, avgVus: sampled.length > 0 ? sampled[0].value : 0 };

  // 计算平均 VU
  const avgVus = sampled.reduce((a, b) => a + b.value, 0) / sampled.length;

  // ===== 策略 1：优先使用 k6 原始 stages 配置 =====
  if (k6Stages && Array.isArray(k6Stages) && k6Stages.length > 0) {
    const parsed = [];
    let elapsed = 0;
    for (const stage of k6Stages) {
      const durStr = stage.duration || '';
      const durMatch = durStr.match(/^(\d+)(s|m|h)$/);
      const durSec = durMatch
        ? durMatch[2] === 'h' ? parseInt(durMatch[1]) * 3600
          : durMatch[2] === 'm' ? parseInt(durMatch[1]) * 60
          : parseInt(durMatch[1])
        : 60;
      const target = stage.target || 0;

      parsed.push({
        startSec: elapsed,
        endSec: elapsed + durSec,
        targetVus: target,
        name: `${target}vus`,
      });
      elapsed += durSec;
    }

    // 去除 ramp-down（target=0）的尾部阶段（对性能分析无意义）
    const meaningful = parsed.filter(s => s.targetVus > 0);
    // 去除第一个 ramp-up 阶段中 VU 还在爬升的阶段（VU 不稳定，样本不可靠）
    // 只保留最后一个 ramp-up 阶段和之后的 hold 阶段
    if (meaningful.length >= 2) {
      // 找到第一个 target 稳定的区间：最后一个 target < 后续 target 的 stage
      const lastRampIdx = meaningful.findIndex((s, i) =>
        i > 0 && s.targetVus === meaningful[i - 1].targetVus
      );
      if (lastRampIdx > 1) {
        // 合并 ramp-up 阶段为一个大预热阶段
        const rampStages = meaningful.slice(0, lastRampIdx);
        const rampMax = rampStages[rampStages.length - 1].targetVus;
        const mergedRamp = {
          startSec: rampStages[0].startSec,
          endSec: rampStages[lastRampIdx].startSec,
          targetVus: rampMax,
          name: `${rampMax}vus_ramp`,
        };
        meaningful.splice(0, lastRampIdx, mergedRamp);
      }
    }

    // 合并相邻 targetVus 相同的阶段（如 hold + ramp-to-same）
    const consolidated = [];
    for (const stage of meaningful) {
      if (consolidated.length > 0 && consolidated[consolidated.length - 1].targetVus === stage.targetVus) {
        consolidated[consolidated.length - 1].endSec = stage.endSec;
      } else {
        consolidated.push({ ...stage });
      }
    }

    if (consolidated.length > 0) {
      console.log(`  [stages] 使用 k6 原始 stages 配置，识别到 ${consolidated.length} 个阶段`);
      return { stages: consolidated, isFlat: false, avgVus: Math.round(avgVus) };
    }
  }

  // ===== 策略 2：fallback - 从 VU 采样推断 =====
  const variance = sampled.reduce((a, b) => a + (b.value - avgVus) ** 2, 0) / sampled.length;
  const stddev = Math.sqrt(variance);
  const cv = avgVus > 0 ? stddev / avgVus : 0;  // 变异系数

  // 变异系数 < 0.05（5%）视为平坦压力测试，无阶梯
  if (cv < 0.05) {
    return {
      stages: [],
      isFlat: true,
      avgVus: Math.round(avgVus),
      durationSec: sampled[sampled.length - 1].relSec - sampled[0].relSec,
      startSec: sampled[0].relSec,
      endSec: sampled[sampled.length - 1].relSec + 5,
    };
  }

  // 检测稳定平台：VU 变化超过阈值的点作为阶段分界
  // 阈值 = max(10 VUs, 5% 平均 VU)，避免微小波动产生碎片阶段
  const vuThreshold = Math.max(10, Math.round(avgVus * 0.05));

  const stages = [];
  let currentTarget = sampled[0].value;
  let stageStart = sampled[0].relSec;
  // 收集当前阶段的所有 VU 值，用于计算中位数
  let currentStageValues = [sampled[0].value];

  for (let i = 1; i < sampled.length; i++) {
    const s = sampled[i];
    if (Math.abs(s.value - currentTarget) > vuThreshold) {
      // 使用中位数作为该阶段的目标 VU（比最后采样值更准确）
      const sorted = [...currentStageValues].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      stages.push({
        startSec: stageStart,
        endSec: s.relSec,
        targetVus: Math.round(median),
        name: `${Math.round(median)}vus`,
      });
      stageStart = s.relSec;
      currentTarget = s.value;
      currentStageValues = [s.value];
    } else {
      currentStageValues.push(s.value);
    }
  }

  // 最后一个 stage
  {
    const sorted = [...currentStageValues].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    stages.push({
      startSec: stageStart,
      endSec: sampled[sampled.length - 1].relSec + 5,
      targetVus: Math.round(median),
      name: `${Math.round(median)}vus`,
    });
  }

  // 合并过短的 stage（< 30s 可能是过渡噪声，原 10s 太短）
  const merged = [];
  for (const stage of stages) {
    if (stage.endSec - stage.startSec < 30 && merged.length > 0) {
      merged[merged.length - 1].endSec = stage.endSec;
      merged[merged.length - 1].targetVus = Math.max(merged[merged.length - 1].targetVus, stage.targetVus);
      merged[merged.length - 1].name = `${merged[merged.length - 1].targetVus}vus`;
    } else {
      merged.push({ ...stage });
    }
  }

  return { stages: merged, isFlat: false, avgVus: Math.round(avgVus) };
}

/**
 * 将原始请求分配到 Stage，并计算每个 Stage 的统计
 * @param {object} raw - 解析后的原始数据
 * @param {Array} [k6Stages] - k6 原始 stages 配置（来自 summary export）
 */
function buildStageAnalysis(raw, k6Stages) {
  const baseTime = raw.startTime;
  if (!baseTime) return { stages: [], overall: null };

  const baseMs = baseTime.getTime();

  // 推断 stages（优先使用 k6 原始 stages 配置）
  const inferred = inferStagesFromVusData(raw.vusSamples, null, raw.startTime, k6Stages);
  const stageDefs = inferred.stages;

  if (stageDefs.length === 0) {
    // 无阶梯数据：可能是固定压力测试或无 VU 采样
    // 按固定时间窗口切分（每 2 分钟一个窗口）
    const totalSec = raw.endTime && raw.startTime
      ? (new Date(raw.endTime).getTime() - baseMs) / 1000
      : (inferred.durationSec || 300);
    const windowSec = 120;  // 2 分钟窗口
    const numWindows = Math.max(1, Math.ceil(totalSec / windowSec));
    const avgVus = inferred.avgVus || 0;

    console.log(`  [info] 未检测到 VU 阶梯变化（${inferred.isFlat ? `固定 ${avgVus} VUs` : '无 VU 数据'}），按 ${windowSec}s 时间窗口划分为 ${numWindows} 个阶段`);
    for (let i = 0; i < numWindows; i++) {
      stageDefs.push({
        startSec: i * windowSec,
        endSec: (i + 1) * windowSec,
        targetVus: avgVus,
        name: inferred.isFlat ? `${avgVus}vus_t${(i + 1) * windowSec / 60}m` : `window_${i + 1}`,
      });
    }
  }

  // 初始化 stage 数据结构
  const stageData = {};
  for (const sd of stageDefs) {
    stageData[sd.name] = {
      ...sd,
      endpoints: {},
      overall: { durations: [], errors: 0, total: 0 },
      readDurations: [],
      writeDurations: [],
      rps: 0,
      durationSec: sd.endSec - sd.startSec,
    };
  }

  // 分配请求到 stage
  let unassignedCount = 0;
  for (const req of raw.httpReqDuration) {
    const t = new Date(req.timestamp).getTime();
    const relSec = (t - baseMs) / 1000;

    let assigned = false;
    for (const sd of stageDefs) {
      if (relSec >= sd.startSec && relSec < sd.endSec) {
        const stage = stageData[sd.name];
        stage.overall.durations.push(req.duration);
        stage.overall.total++;

        if (!req.expected_response || req.status >= 400) {
          stage.overall.errors++;
        }

        // 按接口统计
        if (!stage.endpoints[req.endpoint]) {
          stage.endpoints[req.endpoint] = { durations: [], errors: 0, total: 0 };
        }
        stage.endpoints[req.endpoint].durations.push(req.duration);
        stage.endpoints[req.endpoint].total++;
        if (!req.expected_response || req.status >= 400) {
          stage.endpoints[req.endpoint].errors++;
        }

        // 按读写统计
        if (req.group === 'read') {
          stage.readDurations.push(req.duration);
        } else if (req.group === 'write') {
          stage.writeDurations.push(req.duration);
        }

        assigned = true;
        break;
      }
    }
    if (!assigned) unassignedCount++;
  }

  // 计算每个 stage 的统计值
  for (const stage of Object.values(stageData)) {
    const overallStats = calcStats(stage.overall.durations);
    stage.overallStats = overallStats;
    stage.errorRate = stage.overall.total > 0 ? (stage.overall.errors / stage.overall.total * 100) : 0;
    stage.rps = stage.durationSec > 0 ? (stage.overall.total / stage.durationSec) : 0;

    // 按接口统计
    stage.endpointStats = {};
    for (const [ep, data] of Object.entries(stage.endpoints)) {
      const stats = calcStats(data.durations);
      stats.errorRate = data.total > 0 ? (data.errors / data.total * 100) : 0;
      stage.endpointStats[ep] = stats;
    }

    // 读写统计
    stage.readStats = calcStats(stage.readDurations);
    stage.writeStats = calcStats(stage.writeDurations);
  }

  return {
    stages: Object.values(stageData).sort((a, b) => a.startSec - b.startSec),
    unassignedCount,
  };
}

/**
 * 检测性能拐点
 * 拐点定义：相比上一个 stage，P95 响应时间增长 >30% 且 P95 > 500ms
 */
function detectInflectionPoints(stageAnalysis) {
  const points = [];
  const stages = stageAnalysis.stages;

  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1].overallStats;
    const curr = stages[i].overallStats;
    const prevVus = stages[i - 1].targetVus;
    const currVus = stages[i].targetVus;

    // P95 增长 > 30% 且当前 P95 > 500ms
    if (prev.p95 > 0 && curr.p95 > 500) {
      const p95Increase = ((curr.p95 - prev.p95) / prev.p95) * 100;
      if (p95Increase > 30) {
        points.push({
          stageIndex: i,
          stageName: stages[i].name,
          vus: currVus,
          prevP95: prev.p95,
          currP95: curr.p95,
          p95Increase: p95Increase.toFixed(1),
          prevRps: stages[i - 1].rps.toFixed(1),
          currRps: stages[i].rps.toFixed(1),
          type: 'p95_spike',
        });
      }
    }

    // 错误率 > 5%
    if (stages[i].errorRate > 5 && stages[i - 1].errorRate <= 5) {
      points.push({
        stageIndex: i,
        stageName: stages[i].name,
        vus: currVus,
        errorRate: stages[i].errorRate.toFixed(2),
        type: 'error_spike',
      });
    }

    // 吞吐量下降 > 20%（说明系统开始饱和）
    if (stages[i - 1].rps > 0 && stages[i].rps > 0) {
      const rpsDrop = ((stages[i - 1].rps - stages[i].rps) / stages[i - 1].rps) * 100;
      if (rpsDrop > 20) {
        points.push({
          stageIndex: i,
          stageName: stages[i].name,
          vus: currVus,
          prevRps: stages[i - 1].rps.toFixed(1),
          currRps: stages[i].rps.toFixed(1),
          rpsDrop: rpsDrop.toFixed(1),
          type: 'throughput_drop',
        });
      }
    }
  }

  return points;
}

/**
 * 检测各接口的性能退化趋势
 * 对比前半段和后半段的 P95，找出演化趋势
 */
function detectEndpointTrends(stageAnalysis) {
  const stages = stageAnalysis.stages;
  if (stages.length < 4) return {};

  const mid = Math.floor(stages.length / 2);
  const firstHalf = stages.slice(0, mid);
  const secondHalf = stages.slice(mid);

  const trends = {};

  // 收集所有出现过的接口
  const allEndpoints = new Set();
  for (const stage of stages) {
    for (const ep of Object.keys(stage.endpointStats)) {
      allEndpoints.add(ep);
    }
  }

  for (const ep of allEndpoints) {
    const firstDurations = [];
    const secondDurations = [];

    for (const stage of firstHalf) {
      if (stage.endpointStats[ep]) {
        firstDurations.push(...stage.endpointStats[ep].p95 > 0 ? [stage.endpointStats[ep].p95] : []);
      }
    }
    for (const stage of secondHalf) {
      if (stage.endpointStats[ep]) {
        secondDurations.push(...stage.endpointStats[ep].p95 > 0 ? [stage.endpointStats[ep].p95] : []);
      }
    }

    if (firstDurations.length === 0 || secondDurations.length === 0) continue;

    const firstAvg = firstDurations.reduce((a, b) => a + b, 0) / firstDurations.length;
    const secondAvg = secondDurations.reduce((a, b) => a + b, 0) / secondDurations.length;

    if (firstAvg > 0) {
      const change = ((secondAvg - firstAvg) / firstAvg) * 100;
      trends[ep] = {
        firstHalfP95: firstAvg.toFixed(1),
        secondHalfP95: secondAvg.toFixed(1),
        change: change.toFixed(1),
        trend: change > 20 ? 'degrading' : change < -20 ? 'improving' : 'stable',
        statusCounts: stages.map(s => s.endpointStats[ep]?.count || 0),
        p95Series: stages.map(s => parseFloat((s.endpointStats[ep]?.p95 || 0).toFixed(1))),
      };
    }
  }

  return trends;
}

/**
 * 尝试加载同目录的 monitor 报告
 */
function loadMonitorReport(outputDir, testStartTime) {
  if (!fs.existsSync(outputDir)) return null;

  const files = fs.readdirSync(outputDir).filter(f => f.startsWith('monitor-') && f.endsWith('.json'));
  if (files.length === 0) return null;

  // 找到时间最接近的 monitor 报告
  let bestFile = null;
  let bestDiff = Infinity;

  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(outputDir, f), 'utf-8');
      const data = JSON.parse(content);
      const monitorStart = new Date(data.startTime).getTime();
      const testStart = testStartTime ? new Date(testStartTime).getTime() : Date.now();
      const diff = Math.abs(monitorStart - testStart);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestFile = data;
      }
    } catch (e) {}
  }

  // 只匹配时间差在 10 分钟内的
  if (bestDiff > 10 * 60 * 1000) return null;

  return bestFile;
}

/**
 * 从 monitor 报告中提取阶段对应的 Redis/PG 指标
 */
function extractMonitorStageMetrics(monitorData, stageAnalysis) {
  if (!monitorData || !monitorData.samples || stageAnalysis.stages.length === 0) return [];

  const monitorStart = new Date(monitorData.startTime).getTime();
  const results = [];

  for (const stage of stageAnalysis.stages) {
    const stageStartMs = monitorStart + stage.startSec * 1000;
    const stageEndMs = monitorStart + stage.endSec * 1000;

    // 收集该 stage 时间范围内的 monitor 采样点
    const stageSamples = monitorData.samples.filter(s => {
      const t = new Date(s.timestamp).getTime();
      return t >= stageStartMs && t <= stageEndMs;
    });

    if (stageSamples.length === 0) continue;

    // 取该 stage 的中位数或最后一个采样点
    const lastSample = stageSamples[stageSamples.length - 1];
    const firstSample = stageSamples[0];
    const redis = lastSample.redis || {};

    // 计算 Redis 命中率
    const totalHits = (redis.keyspaceHits || 0) - (firstSample.redis?.keyspaceHits || 0);
    const totalMisses = (redis.keyspaceMisses || 0) - (firstSample.redis?.keyspaceMisses || 0);
    const hitRate = (totalHits + totalMisses) > 0
      ? (totalHits / (totalHits + totalMisses) * 100).toFixed(1) : 'N/A';

    results.push({
      stageName: stage.name,
      vus: stage.targetVus,
      redis: {
        usedMemory: redis.usedMemory || 'N/A',
        opsPerSec: redis.opsPerSec || 0,
        keys: redis.keys || 0,
        hitRate,
        samplesCount: stageSamples.length,
      },
      pg: lastSample.pg || null,
      pgDocker: lastSample.pgDocker || null,
      redisDocker: lastSample.redisDocker || null,
    });
  }

  return results;
}

// ===================== Markdown 报告生成 =====================

/**
 * 从 Summary Export 数据生成 Markdown 报告
 */
function generateSummaryMarkdown(data) {
  const overall = data.overall;
  if (!overall || !overall.avg) return '# 测试报告\n\n没有找到测试数据。\n';

  const duration = data.testRunDurationMs / 1000;
  const rps = duration > 0 ? (overall.count / duration).toFixed(2) : 'N/A';
  const errorRate = (data.errorRate.rate * 100).toFixed(2);
  const successRate = (100 - parseFloat(errorRate)).toFixed(2);
  const avgGrade = evaluateResponseTime(overall.avg);
  const p95Grade = evaluateResponseTime(overall.p95);
  const errorGrade = evaluateErrorRate(parseFloat(errorRate));

  let md = `# EchoStar 后端压力测试报告

## 测试概览

| 指标 | 值 |
|------|-----|
| 测试持续时间 | ${duration.toFixed(2)} 秒 |
| 总请求数 | ${overall.count} |
| 吞吐量 | ${rps} req/s |
| 成功率 | ${successRate}% |
| 错误率 | ${errorRate}% |

## 性能指标总览

### 响应时间

| 指标 | 值 (ms) | 评级 |
|------|---------|------|
| 平均响应时间 | ${overall.avg.toFixed(2)} | ${avgGrade.color} ${avgGrade.label} |
| P50 响应时间 | ${overall.p50.toFixed(2)} | ${evaluateResponseTime(overall.p50).color} ${evaluateResponseTime(overall.p50).label} |
| P90 响应时间 | ${overall.p90.toFixed(2)} | ${evaluateResponseTime(overall.p90).color} ${evaluateResponseTime(overall.p90).label} |
| P95 响应时间 | ${overall.p95.toFixed(2)} | ${p95Grade.color} ${p95Grade.label} |
| P99 响应时间 | ${overall.p99.toFixed(2)} | ${evaluateResponseTime(overall.p99).color} ${evaluateResponseTime(overall.p99).label} |
| 最小响应时间 | ${overall.min.toFixed(2)} | - |
| 最大响应时间 | ${overall.max.toFixed(2)} | ${evaluateResponseTime(overall.max).color} ${evaluateResponseTime(overall.max).label} |

### 错误分类

| 类型 | 错误率 | 说明 |
|------|--------|------|
| 4xx (客户端错误) | ${(data.error4xx.rate * 100).toFixed(2)}% | 客户端请求错误 |
| 5xx (服务端错误) | ${(data.error5xx.rate * 100).toFixed(2)}% | 服务端内部错误 |
`;

  if (data.rate429.rate > 0) {
    md += `| 429 (限流) | ${(data.rate429.rate * 100).toFixed(2)}% | 限流触发（预期行为） |\n`;
  }
  md += `\n`;

  // 接口性能详情
  if (Object.keys(data.endpoints).length > 0) {
    md += `## 接口性能详情\n\n`;
    md += `| 接口 | P95(ms) | P99(ms) | 平均(ms) | 最大(ms) | 评级 |
|------|---------|---------|----------|----------|------|\n`;
    const sorted = Object.entries(data.endpoints).sort((a, b) => (b[1].count || 0) - (a[1].count || 0));
    for (const [, ep] of sorted) {
      const grade = evaluateResponseTime(ep.avg || ep.p95 || 0);
      md += `| ${ep.endpoint} | ${ep.p95?.toFixed(2) || '-'} | ${ep.p99?.toFixed(2) || '-'} | ${ep.avg?.toFixed(2) || '-'} | ${ep.max?.toFixed(2) || '-'} | ${grade.color} ${grade.label} |\n`;
    }
    md += `\n`;
  }

  // Checks
  if (Object.keys(data.checks).length > 0) {
    md += `## 检查断言结果\n\n`;
    md += `| 检查项 | 通过 | 失败 | 通过率 |\n|--------|------|------|--------|\n`;
    const sortedChecks = Object.entries(data.checks).sort((a, b) => parseFloat(a[1].passRate) - parseFloat(b[1].passRate));
    for (const [name, c] of sortedChecks) {
      const icon = parseFloat(c.passRate) >= 100 ? '✅' : parseFloat(c.passRate) >= 95 ? '⚠️' : '❌';
      md += `| ${icon} ${name} | ${c.passes} | ${c.fails} | ${c.passRate}% |\n`;
    }
    md += `\n`;
  }

  md += `---\n*报告生成时间: ${new Date().toISOString()}*\n`;
  return md;
}

/**
 * 从 JSON Lines + Stage 分析生成完整 Markdown 报告
 */
function generateStageMarkdown(raw, stageAnalysis, inflectionPoints, endpointTrends, monitorStageMetrics, keyDistribution) {
  const stages = stageAnalysis.stages;
  if (stages.length === 0) return '# 测试报告\n\n没有找到阶段数据。\n';

  // 全局统计
  const allDurations = raw.httpReqDuration.map(r => r.duration);
  const overall = calcStats(allDurations);
  const totalErrors = raw.httpReqDuration.filter(r => !r.expected_response || r.status >= 400).length;
  const totalRequests = allDurations.length;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests * 100) : 0;
  const testDuration = raw.startTime && raw.endTime ? ((raw.endTime - raw.startTime) / 1000) : 0;
  const maxRps = stages.length > 0 ? Math.max(...stages.map(s => s.rps)) : 0;
  const maxVus = stages.length > 0 ? Math.max(...stages.map(s => s.targetVus)) : 0;

  const avgGrade = evaluateResponseTime(overall.avg);
  const p95Grade = evaluateResponseTime(overall.p95);
  const errorGrade = evaluateErrorRate(errorRate);

  let md = `# EchoStar 性能测试完整报告

## 1. 测试概览

| 指标 | 值 |
|------|-----|
| 测试持续时间 | ${testDuration.toFixed(0)} 秒 (${(testDuration / 60).toFixed(1)} 分钟) |
| 阶段数量 | ${stages.length} |
| 最大 VUs | ${maxVus} |
| 总请求数 | ${totalRequests.toLocaleString()} |
| 最大吞吐量 | ${maxRps.toFixed(1)} req/s |
| 平均响应时间 | ${overall.avg.toFixed(1)} ms | ${avgGrade.color} ${avgGrade.label} |
| P95 响应时间 | ${overall.p95.toFixed(1)} ms | ${p95Grade.color} ${p95Grade.label} |
| P99 响应时间 | ${overall.p99.toFixed(1)} ms |
| 错误率 | ${errorRate.toFixed(2)}% | ${errorGrade.color} ${errorGrade.label} |
| 测试开始时间 | ${raw.startTime?.toISOString() || 'N/A'} |
| 测试结束时间 | ${raw.endTime?.toISOString() || 'N/A'} |

---

## 2. 阶段性能总览（P95 随 VUs 变化）

| 阶段 | 目标VUs | 请求数 | RPS | P95(ms) | P99(ms) | 平均(ms) | 错误率 | 评级 |
|------|---------|--------|-----|---------|---------|----------|--------|------|
`;

  for (const stage of stages) {
    const s = stage.overallStats;
    const grade = evaluateResponseTime(s.p95);
    const errGrade = evaluateErrorRate(stage.errorRate);
    md += `| ${stage.name} | ${stage.targetVus} | ${s.count.toLocaleString()} | ${stage.rps.toFixed(1)} | ${s.p95.toFixed(1)} | ${s.p99.toFixed(1)} | ${s.avg.toFixed(1)} | ${stage.errorRate.toFixed(2)}% | ${grade.color} ${grade.label} |\n`;
  }

  md += `\n`;

  // 拐点分析
  if (inflectionPoints.length > 0) {
    md += `## 3. 性能拐点分析\n\n`;
    md += `### 检测到的拐点\n\n`;

    for (const point of inflectionPoints) {
      if (point.type === 'p95_spike') {
        md += `#### P95 突增 @ ${point.vus} VUs (${point.stageName})\n\n`;
        md += `- P95 从 ${point.prevP95.toFixed(0)}ms 飙升至 ${point.currP95.toFixed(0)}ms (+${point.p95Increase}%)\n`;
        md += `- 吞吐量从 ${point.prevRps} → ${point.currRps} req/s\n`;
        md += `- **结论**: ${point.vus} VUs 附近存在性能拐点，响应时间开始急剧恶化\n\n`;
      } else if (point.type === 'error_spike') {
        md += `#### 错误率突增 @ ${point.vus} VUs (${point.stageName})\n\n`;
        md += `- 错误率飙升至 ${point.errorRate}%\n`;
        md += `- **结论**: ${point.vus} VUs 已超出系统承载能力\n\n`;
      } else if (point.type === 'throughput_drop') {
        md += `#### 吞吐量下降 @ ${point.vus} VUs (${point.stageName})\n\n`;
        md += `- 吞吐量从 ${point.prevRps} → ${point.currRps} req/s (下降 ${point.rpsDrop}%)\n`;
        md += `- **结论**: 系统开始饱和，增加并发量反而降低了整体吞吐\n\n`;
      }
    }

    // 综合结论
    md += `### 综合容量评估\n\n`;
    const p95Points = inflectionPoints.filter(p => p.type === 'p95_spike');
    const errorPoints = inflectionPoints.filter(p => p.type === 'error_spike');
    const throughputPoints = inflectionPoints.filter(p => p.type === 'throughput_drop');

    if (p95Points.length > 0) {
      const firstP95 = p95Points[0];
      md += `- **性能拐点 VUs**: ~${firstP95.vus} VUs（P95 开始急剧增长）\n`;
    }
    if (errorPoints.length > 0) {
      const firstError = errorPoints[0];
      md += `- **错误容忍上限**: ~${firstError.vus} VUs（错误率突破 5%）\n`;
    }
    if (throughputPoints.length > 0) {
      const firstDrop = throughputPoints[0];
      md += `- **吞吐量峰值**: ~${stages[firstDrop.stageIndex - 1]?.targetVus || '?'} VUs（之后吞吐量开始下降）\n`;
    }
    if (p95Points.length === 0 && errorPoints.length === 0 && throughputPoints.length === 0) {
      md += `- **未检测到明显拐点**: 在整个测试范围内，系统表现稳定\n`;
    }
    md += `\n`;
  } else {
    md += `## 3. 性能拐点分析\n\n`;
    md += `在整个 VUs 范围内未检测到明显性能拐点，系统表现稳定。\n\n`;
  }

  // 接口趋势分析
  if (Object.keys(endpointTrends).length > 0) {
    md += `## 4. 各接口性能趋势\n\n`;
    md += `对比前半段和后半段测试，各接口 P95 变化趋势：\n\n`;
    md += `| 接口 | 前半段P95(ms) | 后半段P95(ms) | 变化 | 趋势 |\n`;
    md += `|------|-------------|-------------|------|------|\n`;

    const sortedTrends = Object.entries(endpointTrends).sort((a, b) => parseFloat(b[1].change) - parseFloat(a[1].change));
    for (const [ep, trend] of sortedTrends) {
      const trendIcon = trend.trend === 'degrading' ? '📉' : trend.trend === 'improving' ? '📈' : '➡️';
      const trendLabel = trend.trend === 'degrading' ? '退化' : trend.trend === 'improving' ? '改善' : '稳定';
      md += `| ${ep} | ${trend.firstHalfP95} | ${trend.secondHalfP95} | ${trend.change > 0 ? '+' : ''}${trend.change}% | ${trendIcon} ${trendLabel} |\n`;
    }
    md += `\n`;

    // 各接口 P95 随阶段变化详细表
    md += `### 各接口 P95 随 VUs 阶段变化\n\n`;
    // 获取所有接口列表
    const allEndpoints = Object.keys(endpointTrends);
    // 表头
    md += `| 阶段(VUs) | ${allEndpoints.join(' | ')} |\n`;
    md += `|${'--------|'.repeat(allEndpoints.length + 1)}\n`;
    for (let i = 0; i < stages.length; i++) {
      const row = [stages[i].name];
      for (const ep of allEndpoints) {
        const p95 = stages[i].endpointStats[ep]?.p95 || 0;
        row.push(p95 > 0 ? p95.toFixed(0) : '-');
      }
      md += `| ${row.join(' | ')} |\n`;
    }
    md += `\n`;
  }

  // Monitor 关联数据
  if (monitorStageMetrics.length > 0) {
    md += `## 5. 基础设施监控（Redis / PostgreSQL）\n\n`;
    md += `> 以下数据来自 monitor.cjs 采样，与各阶段时间对齐\n\n`;
    md += `| 阶段 | VUs | Redis内存 | Redis ops/s | Redis keys | Redis命中 | PG活跃连接 | PG CPU |\n`;
    md += `|------|-----|-----------|-------------|------------|----------|-----------|-------|\n`;

    for (const m of monitorStageMetrics) {
      const pgCpu = m.pgDocker?.cpu || '-';
      const pgActive = m.pg?.activeConnections || '-';
      md += `| ${m.stageName} | ${m.vus} | ${m.redis.usedMemory} | ${m.redis.opsPerSec} | ${m.redis.keys} | ${m.redis.hitRate} | ${pgActive} | ${pgCpu} |\n`;
    }
    md += `\n`;
  }

  // Redis Key 分布（测试结束时采样，分析缓存覆盖情况）
  if (keyDistribution) {
    const total = keyDistribution['_total']?.count || 0;
    const entries = Object.entries(keyDistribution)
      .filter(([k]) => !k.startsWith('_'))
      .sort((a, b) => (b[1].count || 0) - (a[1].count || 0));

    if (entries.length > 0) {
      md += `### Redis Key 分布（测试结束时采样）\n\n`;
      md += `> 共 ${total} keys，以下为各前缀分布，用于分析缓存命中率和数据覆盖情况\n\n`;
      md += `| 前缀 | Key 数量 | 占比 |\n`;
      md += `|------|---------|------|\n`;

      for (const [prefix, info] of entries) {
        const count = info.count || 0;
        const pct = total > 0 ? (count / total * 100).toFixed(1) : '0.0';
        md += `| \`${prefix}:*\` | ${count.toLocaleString()} | ${pct}% |\n`;
      }

      const unmatched = keyDistribution['_unmatched']?.count || 0;
      if (unmatched > 0) {
        const pct = total > 0 ? (unmatched / total * 100).toFixed(1) : '0.0';
        md += `| (未匹配) | ${unmatched.toLocaleString()} | ${pct}% |\n`;
      }
      md += `\n`;
    }
  }

  // 接口详细性能
  md += `## 6. 接口性能详情\n\n`;

  // 收集全局接口统计
  const endpointGlobal = {};
  for (const req of raw.httpReqDuration) {
    if (!endpointGlobal[req.endpoint]) {
      endpointGlobal[req.endpoint] = { durations: [], errors: 0, total: 0 };
    }
    endpointGlobal[req.endpoint].durations.push(req.duration);
    endpointGlobal[req.endpoint].total++;
    if (!req.expected_response || req.status >= 400) endpointGlobal[req.endpoint].errors++;
  }

  md += `| 接口 | 请求数 | 占比 | 平均(ms) | P50(ms) | P95(ms) | P99(ms) | 最大(ms) | 错误率 | 评级 |\n`;
  md += `|------|--------|------|----------|---------|---------|---------|----------|--------|------|\n`;

  const sortedEp = Object.entries(endpointGlobal).sort((a, b) => b[1].total - a[1].total);
  for (const [ep, data] of sortedEp) {
    const stats = calcStats(data.durations);
    const grade = evaluateResponseTime(stats.p95);
    const errRate = data.total > 0 ? (data.errors / data.total * 100).toFixed(2) : '0.00';
    const pct = totalRequests > 0 ? ((data.total / totalRequests) * 100).toFixed(1) : '0.0';
    md += `| ${ep} | ${data.total.toLocaleString()} | ${pct}% | ${stats.avg.toFixed(1)} | ${stats.p50.toFixed(1)} | ${stats.p95.toFixed(1)} | ${stats.p99.toFixed(1)} | ${stats.max.toFixed(1)} | ${errRate}% | ${grade.color} ${grade.label} |\n`;
  }
  md += `\n`;

  // 响应时间分布
  const distribution = { excellent: 0, good: 0, acceptable: 0, slow: 0, critical: 0 };
  for (const d of allDurations) {
    if (d < 100) distribution.excellent++;
    else if (d < 300) distribution.good++;
    else if (d < 500) distribution.acceptable++;
    else if (d < 1000) distribution.slow++;
    else distribution.critical++;
  }

  md += `## 7. 响应时间分布\n\n`;
  md += `| 等级 | 范围 | 请求数 | 占比 |\n`;
  md += `|------|------|--------|------|\n`;
  md += `| ${GRADES.responseTime.excellent.color} 优秀 | < 100ms | ${distribution.excellent.toLocaleString()} | ${(distribution.excellent / totalRequests * 100).toFixed(2)}% |\n`;
  md += `| ${GRADES.responseTime.good.color} 良好 | 100-300ms | ${distribution.good.toLocaleString()} | ${(distribution.good / totalRequests * 100).toFixed(2)}% |\n`;
  md += `| ${GRADES.responseTime.acceptable.color} 可接受 | 300-500ms | ${distribution.acceptable.toLocaleString()} | ${(distribution.acceptable / totalRequests * 100).toFixed(2)}% |\n`;
  md += `| ${GRADES.responseTime.slow.color} 较慢 | 500-1000ms | ${distribution.slow.toLocaleString()} | ${(distribution.slow / totalRequests * 100).toFixed(2)}% |\n`;
  md += `| ${GRADES.responseTime.critical.color} 严重慢 | > 1000ms | ${distribution.critical.toLocaleString()} | ${(distribution.critical / totalRequests * 100).toFixed(2)}% |\n`;
  md += `\n`;

  md += `---\n*报告生成时间: ${new Date().toISOString()}*\n`;
  return md;
}

// ===================== 阶段性能 JSON 输出 =====================

function generateStageJson(raw, stageAnalysis, inflectionPoints, endpointTrends) {
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      startTime: raw.startTime?.toISOString(),
      endTime: raw.endTime?.toISOString(),
      totalRequests: raw.httpReqDuration.length,
      testDurationSec: raw.startTime && raw.endTime ? ((raw.endTime - raw.startTime) / 1000) : 0,
    },
    stages: stageAnalysis.stages.map(s => ({
      name: s.name,
      targetVus: s.targetVus,
      startSec: s.startSec,
      endSec: s.endSec,
      durationSec: s.durationSec,
      requestCount: s.overallStats.count,
      rps: parseFloat(s.rps.toFixed(2)),
      errorRate: parseFloat(s.errorRate.toFixed(4)),
      p50: parseFloat(s.overallStats.p50.toFixed(2)),
      p90: parseFloat(s.overallStats.p90.toFixed(2)),
      p95: parseFloat(s.overallStats.p95.toFixed(2)),
      p99: parseFloat(s.overallStats.p99.toFixed(2)),
      avg: parseFloat(s.overallStats.avg.toFixed(2)),
      endpoints: Object.fromEntries(
        Object.entries(s.endpointStats).map(([ep, stats]) => [ep, {
          count: stats.count,
          p95: parseFloat(stats.p95.toFixed(2)),
          p99: parseFloat(stats.p99.toFixed(2)),
          avg: parseFloat(stats.avg.toFixed(2)),
          errorRate: parseFloat(stats.errorRate.toFixed(4)),
        }])
      ),
    })),
    inflectionPoints,
    endpointTrends,
  };
}

// ===================== 主函数 =====================

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('使用方法: node parse-report.js <report-file> [output-dir]');
    console.log('         node parse-report.js <summary-json> <jsonlines-file> [output-dir]');
    console.log('');
    console.log('支持的报告格式:');
    console.log('  1. Summary Export (--summary-export): 聚合指标 JSON');
    console.log('  2. JSON Lines (--out json): 逐请求 JSON 流（推荐，支持阶段分析）');
    console.log('');
    process.exit(1);
  }

  const outputDir = args.length >= 3 ? args[2] : path.dirname(args[0]);

  if (!fs.existsSync(args[0])) {
    console.error(`错误: 文件不存在: ${args[0]}`);
    process.exit(1);
  }

  console.log(`解析报告: ${args[0]}`);

  // 检测第一个文件格式
  const content = fs.readFileSync(args[0], 'utf-8');
  const format = detectFormat(content);
  console.log(`检测到格式: ${format}`);

  let markdown;
  let baseName;
  let summaryData = null;  // 用于获取 testStartTimestamp

  if (format === 'summary') {
    // 只有 summary export
    const data = parseSummaryExport(args[0]);
    markdown = generateSummaryMarkdown(data);
    baseName = path.basename(args[0], '.json');

    console.log('\n=== 测试摘要 ===');
    console.log(`格式: Summary Export`);
    console.log(`总请求数: ${data.overall?.count || 'N/A'}`);
    console.log(`测试持续时间: ${(data.testRunDurationMs / 1000).toFixed(2)} 秒`);
    console.log(`错误率: ${(data.errorRate.rate * 100).toFixed(2)}%`);
    console.log(`接口数量: ${Object.keys(data.endpoints).length}`);
    summaryData = data;

    // 检查是否也有 JSON Lines 文件（第2个参数且不是目录）
    if (args.length >= 2 && fs.statSync(args[1]).isFile()) {
      // 只读第一行来检测格式，避免大文件爆内存
      const firstLine = readFirstLine(args[1]);
      const format2 = detectFormat(firstLine);
      if (format2 === 'jsonlines') {
        console.log(`\n同时检测到 JSON Lines 文件: ${args[1]}`);
        console.log('正在执行深度阶段分析...');
        // outputDir is the 3rd arg, or derive from the jsonlines file
        const deepOutputDir = args.length >= 3 ? args[2] : path.dirname(args[1]);
        markdown += await generateDeepAnalysis(args[1], deepOutputDir, data);
      }
    }
  } else if (format === 'jsonlines') {
    // JSON Lines 深度分析
    console.log('正在执行深度阶段分析...');
    markdown = await generateDeepAnalysis(args[0], outputDir, null);
    baseName = path.basename(args[0], '.json');
  } else {
    console.error(`错误: 无法识别的报告格式`);
    process.exit(1);
  }

  // 写入 Markdown 报告
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  // 命名格式: {profile}-report-{timestamp}.md (内容在前，时间戳在后)
  // baseName 可能是 {profile}-summary-{timestamp} 或 {profile}-{timestamp}
  const mdNameMatch = baseName.match(/^(.+?)(?:-summary)?-(\d{8}_\d{6})$/);
  const mdFileName = mdNameMatch ? `${mdNameMatch[1]}-report-${mdNameMatch[2]}.md` : `${baseName}-report.md`;
  const mdFilePath = path.join(outputDir, mdFileName);
  fs.writeFileSync(mdFilePath, markdown, 'utf-8');
  console.log(`\nMarkdown 报告: ${mdFilePath}`);
}

/**
 * 执行深度阶段分析（从 JSON Lines 文件）
 */
async function generateDeepAnalysis(jsonLinesPath, outputDir, summaryData) {
  console.log('  [1/5] 解析 JSON Lines (流式读取)...');
  const raw = await parseJsonLinesDeep(jsonLinesPath);
  console.log(`  总请求数: ${raw.httpReqDuration.length}`);
  console.log(`  VU 采样点: ${raw.vusSamples.length}`);

  console.log('  [2/5] 推断阶段边界...');
  // 优先使用 k6 原始 stages 配置（从 summary export 获取）
  const k6Stages = summaryData?.stages || summaryData?.options?.stages || null;
  const stageAnalysis = buildStageAnalysis(raw, k6Stages);
  console.log(`  识别到 ${stageAnalysis.stages.length} 个阶段`);
  if (stageAnalysis.stages.length > 0) {
    console.log(`  阶段范围: ${stageAnalysis.stages[0].name} → ${stageAnalysis.stages[stageAnalysis.stages.length - 1].name}`);
    if (stageAnalysis.unassignedCount > 0) {
      console.log(`  警告: ${stageAnalysis.unassignedCount} 个请求未分配到任何阶段`);
    }
  }

  console.log('  [3/5] 检测性能拐点...');
  const inflectionPoints = detectInflectionPoints(stageAnalysis);
  if (inflectionPoints.length > 0) {
    for (const p of inflectionPoints) {
      const desc = p.type === 'p95_spike' ? `P95 +${p.p95Increase}%`
        : p.type === 'error_spike' ? `错误率 ${p.errorRate}%`
        : `吞吐量 -${p.rpsDrop}%`;
      console.log(`  拐点 @ ${p.vus} VUs (${p.stageName}): ${desc}`);
    }
  } else {
    console.log('  未检测到明显拐点');
  }

  console.log('  [4/5] 分析接口趋势...');
  const endpointTrends = detectEndpointTrends(stageAnalysis);
  const degrading = Object.entries(endpointTrends).filter(([, t]) => t.trend === 'degrading');
  if (degrading.length > 0) {
    console.log(`  ${degrading.length} 个接口存在退化趋势: ${degrading.map(([ep]) => ep).join(', ')}`);
  }

  console.log('  [5/5] 加载监控数据...');
  const monitorData = loadMonitorReport(outputDir, raw.startTime?.toISOString());
  const monitorStageMetrics = extractMonitorStageMetrics(monitorData, stageAnalysis);
  const keyDistribution = monitorData?.keyDistribution || null;
  if (monitorStageMetrics.length > 0) {
    console.log(`  已关联 ${monitorStageMetrics.length} 个阶段的监控数据`);
  } else {
    console.log('  未找到匹配的监控报告');
  }
  if (keyDistribution) {
    const total = keyDistribution['_total']?.count || 0;
    console.log(`  Redis key 分布: ${total} keys (测试结束时采样)`);
  }

  // 生成 Markdown
  const markdown = generateStageMarkdown(raw, stageAnalysis, inflectionPoints, endpointTrends, monitorStageMetrics, keyDistribution);

  // 生成阶段性能 JSON（供程序化分析使用）
  const stageJson = generateStageJson(raw, stageAnalysis, inflectionPoints, endpointTrends);
  // 命名格式: {profile}-analysis-{timestamp}.json (内容在前，时间戳在后)
  const baseName = path.basename(jsonLinesPath, '.json');
  const nameMatch = baseName.match(/^(.+)-(\d{8}_\d{6})$/);
  const analysisJsonName = nameMatch ? `${nameMatch[1]}-analysis-${nameMatch[2]}.json` : `${baseName}-analysis.json`;
  const jsonPath = path.join(outputDir, analysisJsonName);
  fs.writeFileSync(jsonPath, JSON.stringify(stageJson, null, 2), 'utf-8');
  console.log(`\n  阶段数据 JSON: ${jsonPath}`);

  return '\n---\n\n' + markdown;
}

main();
