import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// EchoStar 回归测试调度器
// 复用 unit/test-scripts/ 下的测试脚本，结果输出到 regression/test-results/
// ============================================================

const MODULES = [
  'admin', 'auth', 'comment', 'favorite', 'like',
  'map', 'notification', 'recommendation', 'report', 'story'
];

const UNIT_SCRIPTS_DIR = path.resolve(__dirname, '..', '..', 'unit', 'test-scripts');
const RESULTS_DIR = path.resolve(__dirname, '..', 'test-results');
const REPORTS_DIR = path.join(RESULTS_DIR, 'test-reports');
const REQUEST_RECORDS_DIR = path.join(RESULTS_DIR, 'request-records');
const BACKEND_ROOT = path.resolve(__dirname, '..', '..', '..');

// -------------------- 参数解析 --------------------
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node run-regression.js <module|all> [--reset]');
  console.log('');
  console.log('Available modules:');
  MODULES.forEach(m => console.log(`  - ${m}`));
  process.exit(1);
}

const moduleArg = args[0];
const hasReset = args.includes('--reset');
const targets = moduleArg === 'all' ? [...MODULES] : [moduleArg];

// 校验模块名
for (const mod of targets) {
  if (!MODULES.includes(mod)) {
    console.error(`Unknown module: "${mod}"`);
    console.error(`Available modules: ${MODULES.join(', ')}`);
    process.exit(1);
  }
}

// -------------------- 环境准备 --------------------
if (!fs.existsSync(REQUEST_RECORDS_DIR)) {
  fs.mkdirSync(REQUEST_RECORDS_DIR, { recursive: true });
}
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// --reset：先重置环境
if (hasReset) {
  console.log('='.repeat(60));
  console.log('  Resetting test environment...');
  console.log('='.repeat(60));
  const resetScript = path.join(UNIT_SCRIPTS_DIR, 'reset-env.js');
  const resetResult = spawnSync('node', [resetScript], {
    stdio: 'inherit',
    cwd: BACKEND_ROOT
  });
  if (resetResult.status !== 0) {
    console.error('\nEnvironment reset failed! Aborting.');
    process.exit(1);
  }
  console.log('  Environment reset complete.\n');
}

// -------------------- 执行测试 --------------------
const results = [];

for (const mod of targets) {
  const scriptPath = path.join(UNIT_SCRIPTS_DIR, `${mod}.test.js`);

  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`);
    results.push({ module: mod, passed: false, duration: '0.0', reason: 'script not found' });
    continue;
  }

  console.log('='.repeat(60));
  console.log(`  [Running] ${mod}`);
  console.log(`  Script:   ${path.relative(BACKEND_ROOT, scriptPath)}`);
  console.log(`  Time:     ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const startTime = Date.now();
  const result = spawnSync('node', [scriptPath], {
    encoding: 'utf-8',
    cwd: BACKEND_ROOT,
    env: { ...process.env, TEST_RESULTS_DIR: RESULTS_DIR }
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // 打印测试输出
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const passed = result.status === 0;
  results.push({ module: mod, passed, duration });

  // 保存报告到 regression/test-results/test-reports/
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(REPORTS_DIR, `${mod}.regression-${ts}.txt`);
  const reportContent = [
    `Regression Test Report: ${mod}`,
    `Time:     ${new Date().toISOString()}`,
    `Duration: ${duration}s`,
    `Status:   ${passed ? 'PASSED' : 'FAILED'}`,
    '='.repeat(60),
    '',
    '--- stdout ---',
    result.stdout || '(empty)',
    '',
    '--- stderr ---',
    result.stderr || '(empty)'
  ].join('\n');

  fs.writeFileSync(reportFile, reportContent, 'utf-8');

  console.log(`\n  [${passed ? 'PASS' : 'FAIL'}] ${mod} (${duration}s)`);
  console.log(`  Report:  ${path.relative(BACKEND_ROOT, reportFile)}\n`);
}

// -------------------- 汇总 --------------------
const passCount = results.filter(r => r.passed).length;
const failCount = results.length - passCount;

console.log('='.repeat(60));
console.log('  Regression Test Summary');
console.log('='.repeat(60));
for (const r of results) {
  const tag = r.passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${r.module.padEnd(18)} ${r.duration}s`);
}
console.log('-'.repeat(60));
console.log(`  Total: ${passCount}/${results.length} passed, ${failCount} failed`);
console.log('='.repeat(60));

process.exit(failCount > 0 ? 1 : 0);
