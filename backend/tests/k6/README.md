# EchoStar 后端性能测试

使用 [k6](https://k6.io/) 进行 API 性能与压力测试。

## 设计原则

- **阶梯拐点探测**：单次测试从低到高递增 VUs，获取完整性能曲线
- **场景化行为**：每个 VU 模拟用户会话（浏览 → 互动），非纯随机请求
- **真实读写比**：读 85%，写 15%（社交平台典型比例）
- **热度分布**：帕累托/齐普夫分布模拟生产环境热点
- **指数分布思考时间**：模拟用户行为快慢差异
- **k6 tags 驱动**：通过 tags 实现按接口细分指标

## 目录结构

```
tests/k6/
├── test-scripts/
│   ├── config.js              # 测试配置（Profile、权重、阈值）
│   ├── data-generator.js      # 测试数据生成（用户、故事、评论等）
│   ├── stress-test-simple.js  # 主测试脚本（ramp 阶梯 / 场景化行为）
│   ├── rate-limit-test.js     # 限流验证脚本
│   ├── parse-report.js        # 报告解析（JSON → Markdown + 分析数据）
│   ├── plot-stages.js         # 阶段图表生成（HTML + ASCII）
│   ├── monitor.cjs            # Redis/PG/Docker 资源监控
│   ├── report-generator.js    # 报告生成器（stress-test.js 使用）
│   ├── api-client.js          # API 客户端封装（stress-test.js 使用）
│   ├── stress-test.js         # [已废弃] 旧版完整测试脚本
│   ├── run-test.bat           # Windows 运行脚本（全自动流水线）
│   ├── run-test.sh            # Linux/Mac 运行脚本
│   └── run-monitor.bat        # Windows 监控独立启动
├── test-reports/
│   ├── performance-test/      # 性能测试报告
│   └── rate-limit-test/       # 限流测试报告
├── README.md
└── TEST-PLAN.md
```

## 安装 k6

### Windows

```powershell
choco install k6
# 或 scoop install k6
```

### macOS

```bash
brew install k6
```

### Linux

```bash
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415B36428D57F82F9B6ADEBD7F80
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## 快速开始

`--reset` 自动启动/重启后端服务，无需手动操作。

### Windows

```powershell
cd backend

# 性能测试（默认 peak profile）
tests\k6\test-scripts\run-test.bat --mode performance --reset

# 限流测试
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset

# 指定 Profile
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=endurance --monitor

# JSON lines 详细输出（用于深度分析，文件较大）
tests\k6\test-scripts\run-test.bat --mode performance --reset --full

# 自定义参数
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 100 --duration 5m
```

### Linux/Mac

```bash
cd backend

# 性能测试
tests/k6/test-scripts/run-test.sh --mode performance --reset

# 限流测试
tests/k6/test-scripts/run-test.sh --mode rate-limit --reset
```

### 直接使用 k6

```bash
# 使用 Profile
k6 run --env PROFILE=peak tests/k6/test-scripts/stress-test-simple.js

# 限流测试
k6 run tests/k6/test-scripts/rate-limit-test.js
```

## Profile 配置

通过 `--env PROFILE=xxx` 切换测试场景：

| Profile | VUs | 时长 | 数据量(用户/故事) | 读写比 | 用途 |
|---------|-----|------|-------------------|--------|------|
| smoke | 10 | 30s | 20/50 | 85/15 | 快速验证服务可用性 |
| daily | 30 | 5m | 100/500 | 85/15 | 日常负载基线 |
| **peak** | 80 | 3m | 200/1000 | 85/15 | 峰值负载参照 |
| **ramp** | 400 | ~23m | 500/2000 | 95/5 | 阶梯拐点探测（核心） |
| **mini_verify** | 30 | ~2m | 15/30 | 85/15 | 快速验证，覆盖全部 18 接口 |
| endurance | 130* | 30m | 300/1500 | 85/15 | 耐力测试（基于 T1 拐点） |

> \* endurance VUs = T1 拐点 159 × 0.8 ≈ 130，根据实际拐点结果调整 `config.js`。

## 测试脚本说明

### stress-test-simple.js（主脚本）

根据 Profile 自动选择行为模式：

**ramp 阶梯拐点测试：**
- 95% 读 / 5% 写，短思考时间（0.1-0.3s），最大化吞吐
- 持续创建新数据，模拟冷热数据混合
- 覆盖 4 种读 + 4 种写接口

**其他 Profile（场景化行为）：**
1. 获取用户身份和 token
2. 浏览阶段（3-10 次读操作）：按权重选择，指数分布思考时间
3. 互动阶段（1-3 次写操作）：按权重选择，指数分布思考时间
4. 覆盖全部 18 个接口（9 读 + 9 写）

### rate-limit-test.js（限流验证）

均匀压力分布，覆盖所有 limiter 类型：

| 模块 | 权重 | Limiter 类型 |
|------|------|-------------|
| auth | 25% | strictLimiter |
| story | 15% | generalLimiter |
| like | 13% | generalLimiter |
| comment | 12% | generalLimiter |
| favorite | 10% | generalLimiter |
| map | 10% | looseLimiter |
| report | 10% | generalLimiter |
| notification | 5% | generalLimiter |

## 指标体系

### 按接口细分指标（k6 tags 驱动）

```
http_req_duration{endpoint:get_story}        — 故事详情
http_req_duration{endpoint:map_explore}      — 地图探索
http_req_duration{endpoint:search_story}     — 搜索
http_req_duration{group:::read}              — 所有读操作
http_req_duration{group:::write}             — 所有写操作
```

限流测试额外按 limiter 类型细分：

```
http_req_duration{limiter:strict}
http_req_duration{limiter:general}
http_req_duration{limiter:loose}
```

### 错误分类

| 指标 | 说明 |
|------|------|
| errors_4xx | 客户端错误率 |
| errors_5xx | 服务端错误率 |
| errors_other | 网络等其它错误率 |
| rate_429 | 429 限流响应率 |

### 按接口独立阈值

| 分类 | 接口 | P95(ms) |
|------|------|:-------:|
| 健康检查 | health_check | 100 |
| 简单读 | get_story, get_user, mark_notif_read | 500 |
| 列表/搜索 | search_story, list_comments, list_notifications | 800 |
| 认证 | login | 1000 |
| 认证 | register | 1500 |
| 写操作 | like_toggle, favorite_toggle, create_comment, create_report, update_profile | 1000 |
| 写操作 | create_story | 1500 |
| 地图聚合 | map_explore, map_feed, map_clusters | 1200 |

## 接口权重（85:15 读写比）

### 读操作（85%）

| 接口 | 权重 | 累计 |
|------|------|------|
| GET /api/stories/:id | 30 | 30% |
| GET /api/map/explore | 15 | 45% |
| GET /api/map/clusters | 12 | 57% |
| GET /api/v1/map/feed | 10 | 67% |
| GET /api/stories/search | 5 | 72% |
| GET /api/comments/story/:id | 8 | 80% |
| GET /api/v1/notifications/me | 3 | 83% |
| GET /api/auth/users/:id | 2 | 85% |
| GET /health | 1 | 86% |

### 写操作（15%）

| 接口 | 权重 | 累计 |
|------|------|------|
| POST /api/auth/login | 3 | 3% |
| POST /api/comments | 3 | 6% |
| POST /api/likes | 3 | 9% |
| POST /api/favorites | 2 | 11% |
| POST /api/stories | 1.5 | 12.5% |
| POST /api/auth/register_2 | 1 | 13.5% |
| POST /api/reports | 0.5 | 14% |
| PUT /api/v1/notifications/me/mark-read | 0.5 | 14.5% |
| PUT /api/auth/users/me | 0.5 | 15% |

## 报告生成

### 自动生成（`--full` 模式）

`run-test.bat` 测试完成后自动执行：`parse-report.js` → `plot-stages.js`

输出到 `tests/k6/test-reports/performance-test/`：

| 文件 | 说明 |
|------|------|
| `{profile}-summary-{timestamp}.json` | k6 汇总指标 |
| `{profile}-{timestamp}.json` | 逐请求 JSON Lines（`--full` 模式，200-500MB） |
| `{profile}-report-{timestamp}.md` | Markdown 报告（分阶段 P95、拐点检测、监控） |
| `{profile}-analysis-{timestamp}.json` | 分阶段结构化数据 |
| `{profile}-charts-{timestamp}.html` | Chart.js 交互式折线图 |
| `monitor-{timestamp}.json` | Redis/PG/Docker 资源监控 |

> 不带 `--full` 时只生成 summary JSON，不生成逐请求数据和图表。

### 手动生成

```bash
node tests/k6/test-scripts/parse-report.js tests/k6/test-reports/performance-test/{profile}-summary-xxx.json
node tests/k6/test-scripts/plot-stages.js tests/k6/test-reports/performance-test/{profile}-analysis-xxx.json tests/k6/test-reports/performance-test/
```

## 热度分布

| 模式 | 热门占比 | 热门流量 | 用法 |
|------|:-------:|:-------:|------|
| **pareto**（默认） | 20% | ~80% | `--env DIST=pareto` |
| **zipfian** | 5% | ~50% | `--env DIST=zipfian` |
| **uniform** | 100% | 100% | `--env DIST=uniform`（基准对比） |

## 测试参数

| 参数 | 环境变量 | 默认值 | 说明 |
|------|---------|--------|------|
| Profile | PROFILE | peak | 测试场景 |
| 用户数量 | USER_COUNT | 由 Profile | 测试用户数 |
| 故事数量 | STORY_COUNT | 由 Profile | 故事数 |
| 并发用户 | LOAD_VUS | 由 Profile | 并发 VUs |
| 持续时间 | LOAD_DURATION | 由 Profile | 主阶段时长 |
| 基础 URL | BASE_URL | http://localhost:3000 | 后端地址 |
| P95 阈值 | THRESHOLD_P95 | 1000 | 全局 P95(ms) |
| P99 阈值 | THRESHOLD_P99 | 2000 | 全局 P99(ms) |
| 访问分布 | DIST | pareto | 分布模式 |
| 热门比例 | HOT_RATIO | 0.2 | 热门内容占比 |

## 常见问题

**连接被拒绝**：检查后端服务是否运行 `curl http://localhost:3000/health`

**数据创建失败**：检查 Docker 容器状态 `docker ps`

**内存不足**：使用 smoke 或 mini_verify profile 减少数据量

**速率限制干扰**：`--reset` 自动启动服务并设置 `K6_TEST=true`
