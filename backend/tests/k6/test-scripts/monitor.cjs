#!/usr/bin/env node
/**
 * EchoStar 基础设施监控脚本 v2.0
 * 在 k6 压测期间收集 Redis、PostgreSQL、Docker 容器、Node.js 后端进程指标
 *
 * 使用方法（在 backend 目录下执行）：
 *   node tests/k6/test-scripts/monitor.cjs              # 手动 Ctrl+C 停止
 *   node tests/k6/test-scripts/monitor.cjs 300           # 自动运行 300 秒后停止
 *   node tests/k6/test-scripts/monitor.cjs 300 10        # 每 10 秒采样一次（默认 5 秒）
 *
 * 输出文件：tests/k6/test-reports/monitor-[timestamp].json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── 配置 ───────────────────────────────────────────────
const REDIS_CONTAINER = process.env.REDIS_CONTAINER || 'echostar-redis';
const PG_CONTAINER = process.env.PG_CONTAINER || 'echostar-postgres';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '123456';

const DURATION = parseInt(process.argv[2]) || 0;         // 0 = 手动停止
const INTERVAL = parseInt(process.argv[3]) || 10;         // 采样间隔（秒），默认 10s 减少对被测系统干扰
const SIGNAL_FILE = process.argv[4] || null;              // PID 文件路径（monitor 启动时写入 PID，run-test.bat 读取后 taskkill）
const REPORT_DIR = process.argv[5] || path.join(__dirname, '..', 'test-reports');  // 输出目录，默认 test-reports

// ─── 状态 ───────────────────────────────────────────────
const samples = [];
let running = true;
const startTime = new Date();
const STOP_SIGNAL_FILE = SIGNAL_FILE ? SIGNAL_FILE.replace('.pid', '.stop') : null;

// ─── 工具函数 ───────────────────────────────────────────

function timestamp() {
  return new Date().toISOString();
}

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', windowsHide: true, timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return null;
  }
}

function parseDockerStats(container) {
  const raw = safeExec(`docker stats ${container} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}|{{.PIDs}}"`);
  if (!raw) return null;
  const [cpu, mem, memPerc, netIO, blockIO, pids] = raw.split('|');
  // 解析数值：去掉 % 和单位
  const cpuVal = parseFloat(cpu);
  const memVal = parseFloat(memPerc);
  return { cpu, cpuVal, mem, memPerc: memVal, netIO, blockIO, pids };
}

function parseRedisInfo() {
  // 使用 REDISCLI_AUTH 环境变量避免 -a 的安全警告
  const raw = safeExec(
    `docker exec -e REDISCLI_AUTH=${REDIS_PASSWORD} ${REDIS_CONTAINER} redis-cli info`
  );
  if (!raw) return null;

  const get = (pattern) => {
    const m = raw.match(new RegExp(pattern + ':(.+)'));
    return m ? m[1].trim() : null;
  };

  // 解析 db0 keys 数量
  const dbKeysMatch = raw.match(/db\d+:keys=(\d+),expires=(\d+),avg_ttl=(\d+)/);
  const keys = dbKeysMatch ? parseInt(dbKeysMatch[1]) : 0;
  const expires = dbKeysMatch ? parseInt(dbKeysMatch[2]) : 0;

  return {
    usedMemory: get('used_memory_human'),
    usedMemoryBytes: parseInt(get('used_memory')) || 0,
    peakMemory: get('used_memory_peak_human'),
    rssMemory: get('used_memory_rss_human'),
    fragmentation: get('mem_fragmentation_ratio'),
    opsPerSec: parseInt(get('instantaneous_ops_per_sec')) || 0,
    keyspaceHits: parseInt(get('keyspace_hits')) || 0,
    keyspaceMisses: parseInt(get('keyspace_misses')) || 0,
    connectedClients: parseInt(get('connected_clients')) || 0,
    blockedClients: parseInt(get('blocked_clients')) || 0,
    evictedKeys: parseInt(get('evicted_keys')) || 0,
    keys,
    expires,
  };
}

function parsePGStats() {
  const sql = "SELECT count(*) as total, count(*) FILTER (WHERE state = 'active') as active, count(*) FILTER (WHERE state = 'idle') as idle FROM pg_stat_activity;";
  const raw = safeExec(
    `docker exec ${PG_CONTAINER} psql -U postgres -d echostar -t -A -F'|' -c '${sql}'`
  );
  if (!raw) return null;
  const parts = raw.trim().split('|');
  return {
    totalConnections: parseInt(parts[0]) || 0,
    activeConnections: parseInt(parts[1]) || 0,
    idleConnections: parseInt(parts[2]) || 0,
  };
}

/**
 * 监控 Node.js 后端进程（CPU、内存、事件循环延迟）
 * 通过 /health 接口的响应时间间接测量后端健康度
 */
function parseNodeBackendHealth() {
  const port = process.env.PORT || '3000';
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

  // 健康检查（同时测量响应时间）
  const start = Date.now();
  const raw = safeExec(`curl -s -o /dev/null -w "%{http_code}|%{time_total}" "${baseUrl}/health"`);
  const elapsed = Date.now() - start;

  if (!raw) return null;
  const [status, totalTime] = raw.split('|');
  return {
    healthStatus: parseInt(status) || 0,
    healthResponseMs: elapsed,
    curlTotalTime: parseFloat(totalTime) || 0,
  };
}

/**
 * 获取系统级 CPU 和内存（Windows: WMIC, Linux: /proc/meminfo）
 */
function parseSystemStats() {
  const isWin = process.platform === 'win32';
  if (isWin) {
    const cpu = safeExec('wmic cpu get loadpercentage /value');
    const mem = safeExec('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /value');
    let cpuVal = 0, memFree = 0, memTotal = 0;
    if (cpu) {
      const m = cpu.match(/LoadPercentage=(\d+)/);
      if (m) cpuVal = parseInt(m[1]);
    }
    if (mem) {
      const fm = mem.match(/FreePhysicalMemory=(\d+)/);
      const tm = mem.match(/TotalVisibleMemorySize=(\d+)/);
      if (fm) memFree = parseInt(fm[1]);
      if (tm) memTotal = parseInt(tm[1]);
    }
    return { cpuPerc: cpuVal, memFreeMB: Math.round(memFree / 1024), memTotalMB: Math.round(memTotal / 1024) };
  } else {
    const meminfo = safeExec("free -b | grep Mem");
    if (!meminfo) return null;
    const parts = meminfo.trim().split(/\s+/);
    const total = parseInt(parts[1]) || 0;
    const free = parseInt(parts[3]) || 0;
    return { cpuPerc: 0, memFreeMB: Math.round(free / 1048576), memTotalMB: Math.round(total / 1048576) };
  }
}

// ─── 采样 ───────────────────────────────────────────────

function collect() {
  const sample = { timestamp: timestamp() };

  sample.redis = parseRedisInfo();
  sample.redisDocker = parseDockerStats(REDIS_CONTAINER);
  sample.pg = parsePGStats();
  sample.pgDocker = parseDockerStats(PG_CONTAINER);
  sample.nodeHealth = parseNodeBackendHealth();
  sample.system = parseSystemStats();

  samples.push(sample);

  // 实时输出一行摘要
  const r = sample.redis;
  const rd = sample.redisDocker;
  const pd = sample.pgDocker;
  const nh = sample.nodeHealth;
  const ts = new Date().toLocaleTimeString();
  if (r && rd && pd) {
    const hitRate = (r.keyspaceHits + r.keyspaceMisses) > 0
      ? ((r.keyspaceHits / (r.keyspaceHits + r.keyspaceMisses)) * 100).toFixed(1) + '%'
      : 'N/A';
    console.log(
      `[${ts}] Redis: ${r.usedMemory} | ops/s: ${r.opsPerSec} | keys: ${r.keys} | ` +
      `hit: ${hitRate} | CPU: ${rd.cpu} | Mem: ${rd.mem}`
    );
    if (sample.pg) {
      console.log(
      `         PG:    conn: ${sample.pg.totalConnections}(active:${sample.pg.activeConnections}) | CPU: ${pd.cpu} | Mem: ${pd.mem}`
      );
    }
    if (nh) {
      console.log(
      `         Node:  health: ${nh.healthStatus} | ${nh.healthResponseMs}ms`
      );
    }
    if (sample.system) {
      console.log(
      `         Sys:   CPU: ${sample.system.cpuPerc}% | Mem: ${sample.system.memFreeMB}/${sample.system.memTotalMB}MB free`
      );
    }
  } else {
    console.log(`[${ts}] 部分指标采集失败（容器未运行？）`);
  }
}

// ─── 报告生成 ───────────────────────────────────────────

function computeSummary() {
  if (samples.length === 0) return {};

  const numeric = (key, objPath) => {
    const vals = samples
      .map(s => {
        let o = s;
        for (const p of objPath) o = o?.[p];
        return typeof o === 'number' ? o : null;
      })
      .filter(v => v !== null);
    if (vals.length === 0) return null;
    return {
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      samples: vals.length,
    };
  };

  return {
    redis: {
      memory: numeric('usedMemoryBytes', ['redis']),
      opsPerSec: numeric('opsPerSec', ['redis']),
      keys: numeric('keys', ['redis']),
      keyspaceHits: numeric('keyspaceHits', ['redis']),
      keyspaceMisses: numeric('keyspaceMisses', ['redis']),
      cpu: numeric('cpuVal', ['redisDocker']),
      memPerc: numeric('memPerc', ['redisDocker']),
    },
    postgres: {
      cpu: numeric('cpuVal', ['pgDocker']),
      memPerc: numeric('memPerc', ['pgDocker']),
      activeConnections: numeric('activeConnections', ['pg']),
      totalConnections: numeric('totalConnections', ['pg']),
    },
    nodeBackend: {
      healthResponseMs: numeric('healthResponseMs', ['nodeHealth']),
    },
    system: {
      cpuPerc: numeric('cpuPerc', ['system']),
      memFreeMB: numeric('memFreeMB', ['system']),
    },
    duration: {
      totalSeconds: ((new Date() - startTime) / 1000).toFixed(1),
      sampleCount: samples.length,
      intervalSeconds: INTERVAL,
    },
  };
}

/**
 * 统计 Redis 各前缀 key 的数量和内存占用
 * 使用 SCAN 避免阻塞（相比 KEYS * 更安全）
 * 仅在测试结束时调用一次
 */
function sampleRedisKeyDistribution() {
  // EchoStar 项目已知的 Redis key 前缀
  const PREFIXES = [
    'story:raw:*', 'story:cache:*', 'story:list:*',
    'user:info:*', 'user:session:*',
    'comment:*', 'like:*', 'favorite:*',
    'notification:*', 'map:*',
    'rate_limit:*', 'token:*',
  ];

  const result = {};

  console.log('  [Redis] 采样 key 分布（测试已结束，KEYS 短暂阻塞可接受）...');

  for (const pattern of PREFIXES) {
    const raw = safeExec(
      `docker exec -e REDISCLI_AUTH=${REDIS_PASSWORD} ${REDIS_CONTAINER} redis-cli --no-auth-warning keys "${pattern}"`
    );

    let count = 0;
    if (raw) {
      count = raw.split('\n').filter(l => l.trim()).length;
    }

    const prefixName = pattern.replace(':*', '');
    result[prefixName] = { pattern, count };

    if (count > 0) {
      console.log(`    ${prefixName}: ${count} keys`);
    }
  }

  // 统计未匹配的 key（DBSIZE 差异）
  const info = parseRedisInfo();
  const dbTotal = info?.keys || 0;
  const matched = Object.values(result).reduce((a, b) => a + b.count, 0);
  result['_unmatched'] = { pattern: '(未匹配前缀)', count: Math.max(0, dbTotal - matched) };
  result['_total'] = { pattern: 'DBSIZE', count: dbTotal };

  console.log(`  [Redis] key 采样完成: 匹配 ${matched}/${dbTotal} keys`);
  return result;
}

function saveReport() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  // 命名格式: monitor-{timestamp}.json
  const ts = startTime.toISOString().replace(/[-:.T]/g, '').slice(0, 15);
  const outputFile = path.join(REPORT_DIR, `monitor-${ts}.json`);

  // 测试结束后采样一次 Redis key 分布（TTL 未过期）
  const keyDistribution = sampleRedisKeyDistribution();

  const report = {
    startTime: startTime.toISOString(),
    endTime: new Date().toISOString(),
    config: {
      redisContainer: REDIS_CONTAINER,
      pgContainer: PG_CONTAINER,
      intervalSeconds: INTERVAL,
      durationSeconds: DURATION || 'manual',
    },
    samples,
    keyDistribution,
    summary: computeSummary(),
  };

  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`\n报告已保存: ${outputFile}`);
  return outputFile;
}

// ─── 主流程 ─────────────────────────────────────────────

function main() {
  console.log('========================================');
  console.log('  EchoStar 压测监控 v2.0');
  console.log('========================================');
  console.log(`  Redis 容器:    ${REDIS_CONTAINER}`);
  console.log(`  PG 容器:       ${PG_CONTAINER}`);
  console.log(`  采样间隔:      ${INTERVAL}s`);
  console.log(`  运行时长:      ${DURATION > 0 ? DURATION + 's' : '手动停止 (Ctrl+C)'}`);
  console.log(`  开始时间:      ${startTime.toLocaleString()}`);
  console.log('========================================\n');

  // 立即采集一次
  collect();

  // 写入 PID 文件供 run-test.bat 使用 taskkill 停止
  if (SIGNAL_FILE) {
    try {
      fs.writeFileSync(SIGNAL_FILE, String(process.pid));
    } catch (_) {}
  }

  // 定时采集
  const timer = setInterval(() => {
    if (!running) return;
    collect();
  }, INTERVAL * 1000);

  // 轮询检查停止信号文件（Windows taskkill /f 不发信号，用文件触发退出）
  const stopCheckTimer = STOP_SIGNAL_FILE ? setInterval(() => {
    if (fs.existsSync(STOP_SIGNAL_FILE)) {
      console.log('\n\n检测到停止信号文件，正在保存报告...');
      running = false;
      clearInterval(timer);
      clearInterval(stopCheckTimer);
      try { fs.unlinkSync(STOP_SIGNAL_FILE); } catch (_) {}
      saveReport();
      process.exit(0);
    }
  }, 500) : null;

  // 自动停止
  if (DURATION > 0) {
    setTimeout(() => {
      console.log(`\n已达到 ${DURATION}s 时长，自动停止...`);
      running = false;
      clearInterval(timer);
      saveReport();
      process.exit(0);
    }, DURATION * 1000);
  }

  // Ctrl+C 优雅退出
  process.on('SIGINT', () => {
    console.log('\n\n收到停止信号，正在保存报告...');
    running = false;
    clearInterval(timer);
    saveReport();
    process.exit(0);
  });

  // SIGTERM（Windows taskkill 发送）
  process.on('SIGTERM', () => {
    running = false;
    clearInterval(timer);
    saveReport();
    process.exit(0);
  });
}

main();
