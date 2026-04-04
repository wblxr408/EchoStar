# EchoStar 后端压力测试

本目录包含 EchoStar 后端 API 的压力测试脚本，使用 [k6](https://k6.io/) 进行测试。

## 设计原则

- **80/20 法则**：核心接口承载 80% 流量，管理员等低频接口单独测试
- **场景化行为**：每个 VU 模拟用户会话（浏览 → 互动 → 退出），而非纯随机请求
- **真实读写比**：读操作 85%，写操作 15%（符合社交平台真实流量模式）
- **热度分布访问**：少数热门故事/用户承载大部分流量（帕累托/齐普夫分布），模拟生产环境热点
- **指数分布思考时间**：模拟用户行为的快慢差异，比均匀分布更真实
- **错误分类监控**：区分 4xx/5xx/429，快速定位问题
- **k6 tags 驱动指标**：通过 tags 实现按接口细分，无需手动 Trend，自动出现在 summary-export 中

## 目录结构

```
tests/k6/
├── test-scripts/
│   ├── config.js              # 测试配置（Profile、权重、阈值、接口权重）
│   ├── data-generator.js      # 测试数据生成器（用户、故事、评论等）
│   ├── stress-test-simple.js  # 主性能测试脚本（ramp 自然增长 / 场景化行为）
│   ├── rate-limit-test.js     # 限流功能验证脚本（按 limiter 类型细分）
│   ├── parse-report.js        # 报告解析（summary/json → Markdown + analysis JSON）
│   ├── plot-stages.js         # 阶段图表生成（Chart.js HTML + ASCII sparkline）
│   ├── monitor.cjs            # Redis/PG/Docker 监控脚本
│   ├── run-test.bat           # Windows 运行脚本（全自动流水线）
│   ├── run-test.sh            # Linux/Mac 运行脚本
│   └── run-monitor.bat        # Windows 监控独立启动脚本
├── test-reports/
│   ├── performance-test/      # 性能测试报告（按 profile 分目录）
│   └── rate-limit-test/       # 限流测试报告
├── README.md                   # 本文档
└── TEST-PLAN.md               # 测试计划（矩阵、命令、指标记录）
```

## 安装 k6

### Windows

```powershell
choco install k6
# 或
scoop install k6
```

### macOS

```bash
brew install k6
```

### Linux

```bash
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415B36428D57F82F9B6ADEBD7F80
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## 快速开始

> `--reset` 参数会自动启动/重启后端服务（关闭限流模式），无需手动启动。

### 1. 运行测试

#### Windows

```powershell
cd backend
# 性能测试（默认 peak profile，80 VUs, 3m）
tests\k6\test-scripts\run-test.bat --mode performance --reset

# 限流测试
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset

# 自定义 profile
set PROFILE=overload
tests\k6\test-scripts\run-test.bat --mode performance

# 启用 JSON lines 详细输出（用于深度分析）
tests\k6\test-scripts\run-test.bat --mode performance --full --reset

# 自定义参数
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 100 --duration 5m --users 200 --stories 1000
```

#### Linux/Mac

```bash
cd backend
# 性能测试
tests/k6/test-scripts/run-test.sh --mode performance --reset

# 限流测试
tests/k6/test-scripts/run-test.sh --mode rate-limit --reset

# 启用 JSON lines 详细输出
tests/k6/test-scripts/run-test.sh --mode performance --reset --full
```

#### 直接使用 k6

```bash
# 使用 Profile
k6 run --env PROFILE=peak tests/k6/test-scripts/stress-test-simple.js

# 使用自定义参数
k6 run --env USER_COUNT=200 --env STORY_COUNT=1000 --env LOAD_VUS=80 tests/k6/test-scripts/stress-test-simple.js

# 限流测试
k6 run tests/k6/test-scripts/rate-limit-test.js
```

## Profile 配置

通过 `--env PROFILE=xxx` 切换测试场景：

| Profile | VUs | 时长 | 数据量(用户/故事) | 读写比 | 目的 |
|---------|-----|------|-------------------|--------|------|
| smoke | 10 | 30s | 20/50 | 85/15 | 快速验证服务可用性 |
| daily | 30 | 5m | 100/500 | 85/15 | 建立日常负载基线 |
| **peak** | 80 | 3m | 200/1000 | 85/15 | **峰值负载，核心参照组** |
| **ramp** | 400 | ~23m | 500/2000 | 95/5 | **阶梯拐点探测（150-350 VUs 聚焦）** |
| **mini_verify** | 30 | ~2m | 15/30 | 85/15 | **快速验证，覆盖全部 18 个接口** |
| endurance | 120* | 30m | 300/1500 | 85/15 | 长时间运行检测内存泄漏 |

> \* endurance 的 VUs 需根据 ramp 测试结果调整为拐点 × 0.8。

## 指标体系

### k6 tags 驱动的按接口细分指标

所有测试脚本使用 k6 tags 自动生成按接口细分的响应时间指标：

```
http_req_duration{endpoint:get_story}        — 故事详情响应时间
http_req_duration{endpoint:map_explore}      — 地图探索响应时间
http_req_duration{endpoint:search_story}     — 搜索响应时间
http_req_duration{endpoint:login}            — 登录响应时间
http_req_duration{group:::read}              — 所有读操作响应时间
http_req_duration{group:::write}             — 所有写操作响应时间
```

限流测试还使用 `limiter` tag 按 limiter 类型细分：

```
http_req_duration{limiter:strict}            — strictLimiter 响应时间
http_req_duration{limiter:general}           — generalLimiter 响应时间
http_req_duration{limiter:loose}             — looseLimiter 响应时间
http_req_duration{endpoint:auth,limiter:strict} — 同时按接口+limiter 细分
```

**优势**：这些指标自动出现在 `--summary-export` JSON 中，parse-report.js 可直接解析，无需 `--out json` 大文件。

### 错误分类

| 指标 | 说明 |
|------|------|
| errors_4xx | 4xx 错误率（客户端错误） |
| errors_5xx | 5xx 错误率（服务端错误） |
| errors_other | 网络等其它错误率 |
| rate_429 | 429 限流响应率（限流测试专用） |

### 按接口独立阈值

每个接口有独立的 p95 阈值，按操作复杂度分级（简单读 < 列表/搜索 < 认证 < 写操作 < 地图聚合），自动从 `config.js` 的 `ENDPOINT_THRESHOLDS` 生成：

| 分类 | 接口 | P95 阈值(ms) | 说明 |
|------|------|:----------:|------|
| 健康检查 | health_check | 100 | 无业务逻辑 |
| 简单读 | get_story, get_user, mark_notif_read | 500 | 单条记录查询 |
| 列表/搜索 | search_story, list_comments, list_notifications | 800 | 多记录查询+分页排序 |
| 认证 | login | 1000 | JWT 生成+密码验证 |
| 认证 | register | 1500 | 密码哈希+新用户写入 |
| 写操作 | like_toggle, favorite_toggle, create_comment, create_report, update_profile | 1000 | DB 事务+数据校验 |
| 写操作 | create_story | 1500 | 图片处理+地理位置+多字段写入 |
| 地图聚合 | map_explore, map_feed, map_clusters | 1200 | 空间计算+聚合查询 |

## 接口权重分配（85:15 读写比）

### 读操作（85%）

| 接口 | 权重 | 累计 | 说明 |
|------|------|------|------|
| GET /api/stories/:id | 30 | 30% | 获取故事详情（最高频） |
| GET /api/map/explore | 15 | 45% | 地图范围探索 |
| GET /api/map/clusters | 12 | 57% | 聚合数据（次高频） |
| GET /api/stories/search | 5 | 62% | 搜索故事 |
| GET /api/v1/map/feed | 10 | 72% | 推荐信息流 |
| GET /api/comments/story/:id | 8 | 80% | 获取评论列表 |
| GET /api/v1/notifications/me | 3 | 83% | 通知列表 |
| GET /api/auth/users/:id | 2 | 85% | 获取用户信息 |
| GET /health | 1 | 86% | 健康检查 |

### 写操作（15%）

| 接口 | 权重 | 累计 | 说明 |
|------|------|------|------|
| POST /api/auth/login | 3 | 3% | 登录 |
| POST /api/comments | 3 | 6% | 创建评论 |
| POST /api/likes | 3 | 9% | 点赞/取消点赞 |
| POST /api/favorites | 2 | 11% | 收藏/取消收藏 |
| POST /api/stories | 1.5 | 12.5% | 创建故事 |
| POST /api/auth/register_2 | 1 | 13.5% | 注册 |
| POST /api/reports | 0.5 | 14% | 举报 |
| PUT /api/v1/notifications/me/mark-read | 0.5 | 14.5% | 标记通知已读 |
| PUT /api/auth/users/me | 0.5 | 15% | 更新个人资料 |

## 报告生成

### 自动生成（`--full` 模式）

测试完成后，`run-test.bat` 会自动执行以下流水线：

1. `parse-report.js` — 生成 Markdown 报告 + 分阶段分析 JSON
2. `plot-stages.js` — 生成交互式 HTML 图表 + ASCII 图表

产出文件位于 `backend\tests\k6\test-reports\performance-test\`：

| 文件 | 说明 |
|------|------|
| `{profile}-summary-{timestamp}.json` | k6 汇总指标（P95/P99/吞吐/错误率/断言结果） |
| `{profile}-{timestamp}.json` | 逐请求 JSON Lines 原始数据 |
| `{profile}-report-{timestamp}.md` | Markdown 报告（分阶段 P95、拐点检测、接口趋势、Redis/PG 监控） |
| `{profile}-analysis-{timestamp}.json` | 结构化分阶段数据（供程序化消费） |
| `{profile}-charts-{timestamp}.html` | 交互式折线图（浏览器打开，支持缩放悬停） |
| `{profile}-charts-{timestamp}.md` | ASCII 图表（追加到 report.md） |
| `monitor-{timestamp}.json` | Redis/PG/Docker 资源监控采样 |

> **注意**：不带 `--full` 参数时，只生成 summary JSON，不生成逐请求数据和图表。`--full` 模式文件较大（200-500MB）。

### 手动生成 Markdown 报告

如需手动解析已有报告：

```bash
# 解析 summary-export JSON
node tests/k6/test-scripts/parse-report.js tests/k6/test-reports/performance-test/{profile}-summary-xxx.json

# 解析 JSON lines（--full 模式）
node tests/k6/test-scripts/parse-report.js tests/k6/test-reports/performance-test/{profile}-xxx.json

# 生成 HTML 图表（需要 analysis JSON）
node tests/k6/test-scripts/plot-stages.js tests/k6/test-reports/performance-test/{profile}-analysis-xxx.json tests/k6/test-reports/performance-test/
```

### 性能等级说明

| 等级 | 响应时间 | 吞吐量(req/s) | 错误率 |
|------|---------|---------------|--------|
| 优秀 | <=100ms | >=500 | <0.1% |
| 良好 | <=300ms | >=200 | <0.5% |
| 可接受 | <=500ms | >=100 | <1% |
| 较慢 | <=1000ms | >=50 | <5% |
| 严重 | >1000ms | <50 | >5% |

## 测试参数

| 参数 | 环境变量 | 默认值 | 说明 |
|------|---------|--------|------|
| Profile | PROFILE | peak | 测试场景配置 |
| 用户数量 | USER_COUNT | 由 Profile 决定 | 创建的测试用户数量 |
| 故事数量 | STORY_COUNT | 由 Profile 决定 | 创建的故事数量 |
| 并发用户数 | LOAD_VUS | 由 Profile 决定 | 并发虚拟用户数 |
| 测试持续时间 | LOAD_DURATION | 由 Profile 决定 | 测试主阶段时长 |
| 基础 URL | BASE_URL | http://localhost:3000 | 后端服务地址 |
| P95 阈值 | THRESHOLD_P95 | 1000 | 全局 P95 阈值(ms) |
| P99 阈值 | THRESHOLD_P99 | 2000 | 全局 P99 阈值(ms) |
| 访问分布模式 | DIST | pareto | 热度分布：`pareto`(默认)、`zipfian`、`uniform` |
| 热门集合比例 | HOT_RATIO | 0.2 | 热门内容占总数据比例（20%） |

## 热度分布（访问模式）

真实生产环境中，少数热门内容承载大部分流量。测试脚本支持三种访问分布模式：

| 模式 | 热门占比 | 热门流量 | 适用场景 | 用法 |
|------|:-------:|:-------:|---------|------|
| **pareto** (默认) | 20% | ~80% | 模拟真实热点 | `--env DIST=pareto` |
| **zipfian** | 5% | ~50% | 模拟"爆款"极端热点 | `--env DIST=zipfian` |
| **uniform** | 100% | 100% | 基准对比 | `--env DIST=uniform` |

```bash
# 默认帕累托分布
run-test.bat --mode performance --reset --env PROFILE=ramp

# 均匀分布（与 pareto 对比缓存命中率差异）
run-test.bat --mode performance --reset --env PROFILE=ramp --env DIST=uniform

# 自定义热门比例（10% 故事承载 80% 流量）
run-test.bat --mode performance --reset --env PROFILE=ramp --env HOT_RATIO=0.1
```

> **核心目的**：偏态分布不是为了提升性能数据，而是更真实地模拟生产环境，发现热点带来的真实问题（缓存效果 vs 数据库热点竞争）。

## 测试脚本说明

### stress-test-simple.js（主脚本）

根据 Profile 自动选择行为模式：

**ramp 阶梯拐点测试 — 自然增长模式：**
- 95% 读 / 5% 写，短思考时间（0.1-0.3s），最大化吞吐
- 持续创建新数据，模拟冷热数据混合
- 覆盖 4 种读 + 4 种写接口

**其他 Profile — 场景化行为模式：**
1. 获取用户身份和 token
2. **浏览阶段**（3-10 次读操作）：按权重选择读接口，指数分布思考时间
3. **互动阶段**（1-3 次写操作）：按权重选择写接口，指数分布思考时间
4. 覆盖全部 18 个接口（9 读 + 9 写）

所有请求通过 `tags: { endpoint }` 自动生成按接口细分的指标。

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

使用双重 tags（`endpoint` + `limiter`）同时按模块和 limiter 类型细分指标。

## 常见问题

### 连接被拒绝

```bash
curl http://localhost:3000/health
netstat -an | findstr 3000  # Windows
lsof -i :3000              # Linux/Mac
```

### 测试数据创建失败

检查数据库连接和 Redis 服务：

```bash
docker ps
```

### 内存不足

减少数据量：

```bash
k6 run --env PROFILE=smoke tests/k6/test-scripts/stress-test-simple.js
```

### 速率限制干扰性能测试

`--reset` 参数会自动启动无限流模式的服务，无需手动处理。

### parse-report.js 输出"没有找到测试数据"

确保传入的是 `--summary-export` 生成的 JSON 文件（文件名含 `-summary.json`），或 `--full` 模式下的 JSON lines 文件。脚本会自动检测格式。
