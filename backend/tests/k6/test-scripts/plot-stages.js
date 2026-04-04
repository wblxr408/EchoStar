#!/usr/bin/env node
/**
 * EchoStar 性能图表生成器 v1.0
 * 从 parse-report.js 生成的 stages.json 生成可视化图表
 *
 * 输出:
 *   1. ASCII 柱状图（嵌入 Markdown 报告）
 *   2. HTML 交互式图表（独立文件，浏览器打开）
 *
 * 使用方法:
 *   node plot-stages.js <stages.json> [output-dir]
 */

import fs from 'fs';
import path from 'path';

// ===================== 配置 =====================

const CHART_HEIGHT = 12;      // ASCII 图表高度（行数）
const BAR_CHARS = '▁▂▃▄▅▆▇█'; // 火花线字符

// ===================== ASCII 图表 =====================

/**
 * 生成 P95 vs VUs 的 ASCII 折线图（Unicode 火花线）
 */
function generateSparkline(dataPoints, labels, title, maxValue) {
  if (dataPoints.length === 0) return `* ${title}: 无数据 *\n`;

  const maxVal = maxValue || Math.max(...dataPoints, 1);
  const numLevels = BAR_CHARS.length;

  const bars = dataPoints.map(v => {
    const level = Math.min(Math.floor((v / maxVal) * numLevels), numLevels - 1);
    return BAR_CHARS[Math.max(0, level)];
  });

  let chart = `**${title}**\n`;
  chart += '```\n';
  chart += `max: ${maxVal.toFixed(0)}ms\n`;
  chart += bars.join('') + '\n';
  chart += labels.map((l, i) => i % 2 === 0 ? l.padStart(4) : '    ').join('') + '\n';
  chart += '```\n';
  return chart;
}

/**
 * 生成 ASCII 柱状图（纵向柱子）
 */
function generateBarChart(dataPoints, labels, title, _yAxisLabel, maxValue) {
  if (dataPoints.length === 0) return `* ${title}: 无数据 *\n`;

  const maxVal = maxValue || Math.max(...dataPoints, 1);
  const height = CHART_HEIGHT;
  const width = dataPoints.length;

  // 生成柱子高度
  const barHeights = dataPoints.map(v => Math.max(1, Math.round((v / maxVal) * height)));

  let chart = `**${title}**\n`;
  chart += '```\n';

  // Y 轴标签和柱子
  for (let row = height; row >= 0; row--) {
    let line = '';
    // Y 轴刻度
    const val = Math.round((row / height) * maxVal);
    line += val.toString().padStart(7) + ' │';

    for (let col = 0; col < width; col++) {
      if (barHeights[col] >= row) {
        line += ' █';
      } else {
        line += '  ';
      }
    }
    chart += line + '\n';
  }

  // X 轴
  chart += '        └' + '──'.repeat(width) + '\n';

  // X 轴标签（每两个标签取一个避免溢出）
  let labelLine = '         ';
  for (let i = 0; i < labels.length; i++) {
    if (i % Math.ceil(labels.length / 15) === 0) {
      const lbl = String(labels[i]).substring(0, 2);
      labelLine += lbl.padEnd(2);
    } else {
      labelLine += '  ';
    }
  }
  chart += labelLine + '\n';
  chart += '```\n';

  return chart;
}

/**
 * 生成 RPS (吞吐量) 变化图
 */
function generateRpsChart(stages) {
  const dataPoints = stages.map(s => s.rps || 0);
  const labels = stages.map(s => String(s.targetVus || 0));
  return generateBarChart(dataPoints, labels, '吞吐量 (RPS) 随 VUs 变化', 'RPS');
}

/**
 * 生成错误率变化图
 */
function generateErrorRateChart(stages) {
  const dataPoints = stages.map(s => s.errorRate || 0);
  const labels = stages.map(s => String(s.targetVus || 0));
  const maxVal = Math.max(...dataPoints, 1);
  return generateBarChart(dataPoints, labels, '错误率 (%) 随 VUs 变化', 'Error%', maxVal);
}

// ===================== HTML 图表 =====================

/**
 * 生成完整的 HTML 可交互图表页面
 */
function generateHtmlReport(stageData) {
  const stages = stageData.stages || [];
  const endpoints = stages.length > 0
    ? [...new Set(stages.flatMap(s => Object.keys(s.endpoints || {})))]
    : [];

  const stageLabels = stages.map(s => {
    const vus = s.targetVus || 0;
    const dur = s.durationSec ? `${(s.durationSec / 60).toFixed(0)}m` : '';
    return `${vus}vus${dur ? ' (' + dur + ')' : ''}`;
  });

  // 准备图表数据
  const overallP95 = stages.map(s => s.p95 || 0);
  const overallP99 = stages.map(s => s.p99 || 0);
  const overallAvg = stages.map(s => s.avg || 0);
  const rpsData = stages.map(s => s.rps || 0);

  // 各接口 P95 数据
  const endpointP95Series = endpoints.map(ep => ({
    name: ep,
    data: stages.map(s => s.endpoints?.[ep]?.p95 || 0),
  }));

  const CHART_COLORS = ['#38bdf8','#4ade80','#fbbf24','#f87171','#c084fc','#fb923c','#2dd4bf','#e879f9','#facc15','#f472b6'];

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EchoStar 性能测试图表</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
  .header { text-align: center; margin-bottom: 30px; }
  .header h1 { font-size: 1.8em; color: #38bdf8; margin-bottom: 8px; }
  .header .meta { color: #94a3b8; font-size: 0.9em; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(600px, 1fr)); gap: 20px; }
  .card { background: #1e293b; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
  .card h2 { font-size: 1.1em; color: #38bdf8; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 8px; }
  .chart-container { position: relative; height: 300px; }
  .inflection-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .inflection-table th, .inflection-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #334155; }
  .inflection-table th { color: #94a3b8; font-size: 0.85em; text-transform: uppercase; }
  .inflection-table .warning { color: #fbbf24; }
  .inflection-table .danger { color: #f87171; }
  .summary-cards { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; }
  .summary-card { background: #1e293b; border-radius: 8px; padding: 15px 20px; flex: 1; min-width: 150px; }
  .summary-card .value { font-size: 1.5em; font-weight: bold; }
  .summary-card .label { color: #94a3b8; font-size: 0.85em; margin-top: 4px; }
  .grade-excellent { color: #4ade80; }
  .grade-good { color: #a3e635; }
  .grade-acceptable { color: #fbbf24; }
  .grade-slow { color: #f97316; }
  .grade-critical { color: #ef4444; }
  .card-full { grid-column: 1 / -1; }
  .chart-container-tall { height: 550px; }
</style>
</head>
<body>

<div class="header">
  <h1>EchoStar 性能测试图表</h1>
  <div class="meta">
    ${stageData.metadata?.startTime ? `测试时间: ${new Date(stageData.metadata.startTime).toLocaleString('zh-CN')}` : ''}
    &nbsp;|&nbsp; 总请求: ${(stageData.metadata?.totalRequests || 0).toLocaleString()}
    &nbsp;|&nbsp; 持续: ${((stageData.metadata?.testDurationSec || 0) / 60).toFixed(1)} 分钟
  </div>
</div>

<div class="summary-cards">
  ${generateSummaryCards(stages)}
</div>

<div class="grid">
  <div class="card">
    <h2>响应时间 P50 / P95 / P99 随 VUs 变化</h2>
    <div class="chart-container"><canvas id="responseTimeChart"></canvas></div>
  </div>

  <div class="card">
    <h2>吞吐量 (RPS) 随 VUs 变化</h2>
    <div class="chart-container"><canvas id="rpsChart"></canvas></div>
  </div>

  ${endpoints.length > 0 ? `
  <div class="card card-full">
    <h2>各接口 P95 响应时间对比</h2>
    <div class="chart-container chart-container-tall"><canvas id="endpointChart"></canvas></div>
  </div>` : ''}

  ${(stageData.inflectionPoints || []).length > 0 ? `
  <div class="card card-full">
    <h2>检测到的性能拐点</h2>
    <table class="inflection-table">
      <thead><tr><th>类型</th><th>阶段</th><th>VUs</th><th>详情</th></tr></thead>
      <tbody>
        ${stageData.inflectionPoints.map(p => {
          const typeLabel = p.type === 'p95_spike' ? 'P95 突增' : p.type === 'error_spike' ? '错误率突增' : '吞吐量下降';
          const cls = p.type === 'error_spike' ? 'danger' : 'warning';
          const detail = p.type === 'p95_spike' ? `P95: ${p.prevP95?.toFixed(0)} → ${p.currP95?.toFixed(0)}ms (+${p.p95Increase}%)`
            : p.type === 'error_spike' ? `错误率: ${p.errorRate}%`
            : `RPS: ${p.prevRps} → ${p.currRps} (-${p.rpsDrop}%)`;
          return `<tr class="${cls}"><td>${typeLabel}</td><td>${p.stageName}</td><td>${p.vus}</td><td>${detail}</td></tr>`;
        }).join('\n')}
      </tbody>
    </table>
  </div>` : ''}
</div>

<script>
// 响应时间图表
const ctx1 = document.getElementById('responseTimeChart');
if (ctx1) new Chart(ctx1, {
  type: 'line',
  data: {
    labels: ${JSON.stringify(stageLabels)},
    datasets: [
      { label: 'P50', data: ${JSON.stringify(stages.map(s => s.p50 || 0))}, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', fill: true, tension: 0.3 },
      { label: 'P95', data: ${JSON.stringify(overallP95)}, borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)', fill: true, tension: 0.3 },
      { label: 'P99', data: ${JSON.stringify(overallP99)}, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)', fill: true, tension: 0.3 },
      { label: 'Avg', data: ${JSON.stringify(overallAvg)}, borderColor: '#38bdf8', borderDash: [5,5], tension: 0.3 },
    ]
  },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { title: { display: true, text: 'ms', color: '#94a3b8' }, ticks: { color: '#94a3b8' } } } }
});

// 吞吐量图表
const ctx2 = document.getElementById('rpsChart');
if (ctx2) new Chart(ctx2, {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(stageLabels)},
    datasets: [
      { label: 'RPS', data: ${JSON.stringify(rpsData)}, backgroundColor: 'rgba(56,189,248,0.6)', borderColor: '#38bdf8', borderWidth: 1 },
    ]
  },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { title: { display: true, text: 'req/s', color: '#94a3b8' }, ticks: { color: '#94a3b8' } } } }
});

${endpoints.length > 0 ? `
// 各接口 P95 对比
const ctx3 = document.getElementById('endpointChart');
if (ctx3) new Chart(ctx3, {
  type: 'line',
  data: {
    labels: ${JSON.stringify(stageLabels)},
    datasets: ${JSON.stringify(endpointP95Series.map((s, i) => ({
      label: s.name,
      data: s.data,
      borderColor: CHART_COLORS[i % CHART_COLORS.length],
      tension: 0.3,
    })))}
  },
  options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { title: { display: true, text: 'P95 (ms)', color: '#94a3b8' }, ticks: { color: '#94a3b8', maxTicksLimit: 15 } } } }
});` : ''}
</script>
</body>
</html>`;

  return html;
}

function generateSummaryCards(stages) {
  if (stages.length === 0) return '';
  const lastStage = stages[stages.length - 1];
  const maxRps = Math.max(...stages.map(s => s.rps || 0));
  const maxVus = Math.max(...stages.map(s => s.targetVus || 0));
  const totalReqs = stages.reduce((a, s) => a + (s.requestCount || 0), 0);
  const overallP95 = lastStage.p95 || 0;
  const overallErrorRate = lastStage.errorRate || 0;

  const gradeClass = overallP95 < 100 ? 'grade-excellent' : overallP95 < 300 ? 'grade-good' : overallP95 < 500 ? 'grade-acceptable' : overallP95 < 1000 ? 'grade-slow' : 'grade-critical';

  return `
    <div class="summary-card">
      <div class="value">${maxRps.toFixed(0)}</div>
      <div class="label">峰值吞吐量 (req/s)</div>
    </div>
    <div class="summary-card">
      <div class="value ${gradeClass}">${overallP95.toFixed(0)}ms</div>
      <div class="label">最终阶段 P95</div>
    </div>
    <div class="summary-card">
      <div class="value">${maxVus}</div>
      <div class="label">最大并发 VUs</div>
    </div>
    <div class="summary-card">
      <div class="value">${totalReqs.toLocaleString()}</div>
      <div class="label">总请求数</div>
    </div>
    <div class="summary-card">
      <div class="value">${(overallErrorRate * 100).toFixed(2)}%</div>
      <div class="label">最终阶段错误率</div>
    </div>
  `;
}

// ===================== Markdown 图表 =====================

function generateMarkdownCharts(stageData) {
  const stages = stageData.stages || [];
  if (stages.length === 0) return '## 图表\n\n无阶段数据可绘图。\n';

  let md = '## 可视化图表\n\n';

  // P95 sparkline
  const p95Data = stages.map(s => s.p95 || 0);
  const p95Labels = stages.map(s => String(s.targetVus || 0));
  const maxP95 = Math.max(...p95Data, 1);
  md += generateSparkline(p95Data, p95Labels, 'P95 响应时间 (ms) 随 VUs 变化', maxP95);

  // P50 sparkline
  const p50Data = stages.map(s => s.p50 || 0);
  md += generateSparkline(p50Data, p95Labels, 'P50 响应时间 (ms) 随 VUs 变化', Math.max(...p50Data, 1));

  // RPS bar chart
  md += generateRpsChart(stages);

  // Error rate bar chart
  md += generateErrorRateChart(stages);

  // 各接口 P95 sparklines
  const endpoints = [...new Set(stages.flatMap(s => Object.keys(s.endpoints || {})))];
  if (endpoints.length > 0 && endpoints.length <= 10) {
    md += '### 各接口 P95 随阶段变化\n\n';
    for (const ep of endpoints) {
      const epP95 = stages.map(s => s.endpoints?.[ep]?.p95 || 0);
      const epMax = Math.max(...epP95, 1);
      md += generateSparkline(epP95, p95Labels, `${ep} P95`, epMax);
    }
  }

  md += `> 提示: 运行 \`node plot-stages.js <stages.json>\` 生成 HTML 交互式图表，支持缩放和悬停查看详情。\n\n`;

  return md;
}

// ===================== 主函数 =====================

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('使用方法: node plot-stages.js <stages.json> [output-dir]');
    console.log('');
    console.log('  stages.json 由 parse-report.js 自动生成');
    console.log('  输出:');
    console.log('    <name>-charts.md    - Markdown ASCII 图表（追加到现有报告）');
    console.log('    <name>-charts.html  - HTML 交互式图表（浏览器打开）');
    console.log('');
    console.log('输入文件命名约定:');
    console.log('  <profile>-<timestamp>-analysis.json  (如 ramp-20260403_182056-analysis.json)');
    console.log('');
    process.exit(1);
  }

  const inputFile = args[0];
  if (!fs.existsSync(inputFile)) {
    console.error(`错误: 文件不存在: ${inputFile}`);
    process.exit(1);
  }

  const outputDir = args.length >= 2 ? args[1] : path.dirname(inputFile);
  const baseName = path.basename(inputFile, '.json');
  // 命名格式: {profile}-analysis-{timestamp}.json → {profile}-charts-{timestamp}.{md,html}
  const nameMatch = baseName.match(/^(.+)-analysis-(\d{8}_\d{6})$/);
  const filePrefix = nameMatch ? `${nameMatch[1]}-charts-${nameMatch[2]}` : baseName;

  console.log(`加载阶段数据: ${inputFile}`);
  const stageData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const stages = stageData.stages || [];
  console.log(`阶段数: ${stages.length}`);

  if (stages.length === 0) {
    console.error('错误: 无阶段数据');
    process.exit(1);
  }

  // 生成 Markdown ASCII 图表
  console.log('生成 Markdown ASCII 图表...');
  const mdCharts = generateMarkdownCharts(stageData);
  const mdPath = path.join(outputDir, `${filePrefix}.md`);
  fs.writeFileSync(mdPath, mdCharts, 'utf-8');
  console.log(`  Markdown 图表: ${mdPath}`);

  // 生成 HTML 交互式图表
  console.log('生成 HTML 交互式图表...');
  const html = generateHtmlReport(stageData);
  const htmlPath = path.join(outputDir, `${filePrefix}.html`);
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`  HTML 图表: ${htmlPath}`);

  // 尝试追加到已有的 report.md
  const reportName = nameMatch ? `${nameMatch[1]}-report-${nameMatch[2]}.md` : `${baseName.replace('-analysis', '')}-report.md`;
  const reportPath = path.join(outputDir, reportName);
  if (fs.existsSync(reportPath)) {
    let existing = fs.readFileSync(reportPath, 'utf-8');
    // 检查是否已包含图表
    if (!existing.includes('## 可视化图表')) {
      existing += '\n---\n\n' + mdCharts;
      fs.writeFileSync(reportPath, existing, 'utf-8');
      console.log(`  已追加图表到: ${reportPath}`);
    } else {
      console.log(`  报告已包含图表，跳过追加`);
    }
  }

  console.log('\n完成! 用浏览器打开 HTML 文件查看交互式图表。');
}

main();
