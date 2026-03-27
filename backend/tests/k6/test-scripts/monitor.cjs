#!/usr/bin/env node
/**
 * EchoStar Redis & Docker 容器监控脚本
 * 在 k6 压测期间收集 Redis 指标和 Docker 容器资源占用
 *
 * 使用方法（在 backend 目录下执行）：
 *   node tests/k6/test-scripts/monitor.js              # 手动 Ctrl+C 停止
 *   node tests/k6/test-scripts/monitor.js 300           # 自动运行 300 秒后停止
 *   node tests/k6/test-scripts/monitor.js 300 10        # 每 10 秒采样一次（默认 5 秒）
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
const INTERVAL = parseInt(process.argv[3]) || 5;          // 采样间隔（秒）
const SIGNAL_FILE = process.argv[4] || null;              // PID 文件路径（monitor 启动时写入 PID，run-test.bat 读取后 taskkill）
const REPORT_DIR = path.join(__dirname, '..', 'test-reports');

// ─── 状态 ───────────────────────────────────────────────
const samples = [];
let running = true;
const startTime = new Date();

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
  const sql = "SELECT count(*) as total, count(*) FILTER (WHERE state = 'active') as active FROM pg_stat_activity;";
  const raw = safeExec(
    `docker exec ${PG_CONTAINER} psql -U postgres -d echostar -t -A -F'|' -c '${sql}'`
  );
  if (!raw) return null;
  const parts = raw.trim().split('|');
  return {
    totalConnections: parseInt(parts[0]) || 0,
    activeConnections: parseInt(parts[1]) || 0,
  };
}

// ─── 采样 ───────────────────────────────────────────────

function collect() {
  const sample = { timestamp: timestamp() };

  sample.redis = parseRedisInfo();
  sample.redisDocker = parseDockerStats(REDIS_CONTAINER);
  sample.pg = parsePGStats();
  sample.pgDocker = parseDockerStats(PG_CONTAINER);

  samples.push(sample);

  // 实时输出一行摘要
  const r = sample.redis;
  const rd = sample.redisDocker;
  const pd = sample.pgDocker;
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
      `         PG:    active: ${sample.pg.activeConnections} | CPU: ${pd.cpu} | Mem: ${pd.mem}`
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
    },
    duration: {
      totalSeconds: ((new Date() - startTime) / 1000).toFixed(1),
      sampleCount: samples.length,
      intervalSeconds: INTERVAL,
    },
  };
}

function saveReport() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const ts = startTime.toISOString().replace(/[:.]/g, '').slice(0, 15);
  const outputFile = path.join(REPORT_DIR, `monitor-${ts}.json`);

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
    summary: computeSummary(),
  };

  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
  console.log(`\n报告已保存: ${outputFile}`);
  return outputFile;
}

// ─── 主流程 ─────────────────────────────────────────────

function main() {
  console.log('========================================');
  console.log('  EchoStar 压测监控');
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
