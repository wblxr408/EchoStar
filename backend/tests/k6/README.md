# EchoStar 后端压力测试

本目录包含 EchoStar 后端 API 的压力测试脚本，使用 [k6](https://k6.io/) 进行测试。

## 设计原则

- **80/20 法则**：核心接口承载 80% 流量，管理员等低频接口单独测试
- **场景化行为**：每个 VU 模拟用户会话（浏览 → 互动 → 退出），而非纯随机请求
- **真实读写比**：读操作 85%，写操作 15%（符合社交平台真实流量模式）
- **指数分布思考时间**：模拟用户行为的快慢差异，比均匀分布更真实
- **错误分类监控**：区分 4xx/5xx/429，快速定位问题
- **k6 tags 驱动指标**：通过 tags 实现按接口细分，无需手动 Trend，自动出现在 summary-export 中

## 目录结构

```
tests/k6/
├── test-scripts/
│   ├── config.js              # 测试配置（Profile、权重、阈值）
│   ├── data-generator.js      # 测试数据生成器（用户、故事、评论等）
│   ├── api-client.js          # API 客户端封装（stress-test.js 使用）
│   ├── report-generator.js    # 报告生成器（按接口细分 p95/p99、错误分类）
│   ├── stress-test-simple.js  # 主性能测试脚本（场景化行为 + k6 tags）
│   ├── stress-test.js         # [已废弃] 完整压力测试脚本（大数据量）
│   ├── rate-limit-test.js     # 限流功能验证脚本（按 limiter 类型细分）
│   ├── parse-report.js        # 报告解析脚本（支持 summary-export 和 JSON lines）
│   ├── monitor.cjs            # Redis/PG 监控脚本
│   ├── run-test.bat           # Windows 运行脚本
│   ├── run-test.sh            # Linux/Mac 运行脚本
│   └── run-monitor.bat        # Windows 监控启动脚本
├── test-reports/
│   ├── performance-test/      # 性能测试报告
│   ├── rate-limit-test/       # 限流测试报告
│   └── test-summaries/        # 测试摘要
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

### 1. 启动后端服务

```bash
cd backend
npm run dev                    # 启动（开启限流）
node src/server.no-limit.js    # 启动（关闭限流，用于性能测试）
```

### 2. 运行测试

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
| overload | 200 | 2m | 500/2000 | 80/20 | 找性能拐点和崩溃阈值 |
| endurance | 50 | 30m | 200/1000 | 85/15 | 长时间运行检测内存泄漏 |

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

每个接口有独立的 p95 阈值，自动从 `config.js` 的 `ENDPOINT_THRESHOLDS` 生成：

| 接口 | P95 阈值(ms) | 说明 |
|------|-------------|------|
| get_story | 300 | 故事详情 |
| map_explore | 800 | 地图探索 |
| map_feed | 800 | 推荐流 |
| search_story | 500 | 搜索 |
| login | 800 | 登录 |
| like_toggle | 300 | 点赞 |
| favorite_toggle | 300 | 收藏 |
| health_check | 100 | 健康检查 |

## 接口权重分配（85:15 读写比）

### 读操作（85%）

| 接口 | 权重 | 累计 | 说明 |
|------|------|------|------|
| GET /api/stories/:id | 30 | 30% | 获取故事详情（最高频） |
| GET /api/map/explore | 15 | 45% | 地图范围探索 |
| GET /api/stories/search | 12 | 57% | 搜索故事 |
| GET /api/v1/map/feed | 10 | 67% | 推荐信息流 |
| GET /api/comments/story/:id | 8 | 75% | 获取评论列表 |
| GET /api/auth/users/:id | 5 | 80% | 获取用户信息 |
| GET /api/v1/notifications/me | 3 | 83% | 通知列表 |
| GET /health | 1 | 84% | 健康检查 |
| GET /api/map/clusters | 1 | 85% | 聚合数据 |

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

### 自动生成

测试完成后，报告自动保存到 `tests/k6/test-reports/` 目录：

- `performance-test/stress-test-YYYYMMDD_HHMMSS-summary.json` — k6 summary export（推荐）
- `rate-limit-test/stress-test-YYYYMMDD_HHMMSS-summary.json` — 限流测试报告

### 生成 Markdown 报告

`parse-report.js` 自动检测格式并生成 Markdown 报告：

```bash
# 解析 summary-export JSON（推荐，文件小，信息完整）
node tests/k6/test-scripts/parse-report.js tests/k6/test-reports/performance-test/stress-test-xxx-summary.json

# 解析 JSON lines（需要 --full 模式，文件较大但包含逐请求数据）
node tests/k6/test-scripts/parse-report.js tests/k6/test-reports/performance-test/full_xxx.json
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

## 测试脚本说明

### stress-test-simple.js（主脚本）

场景化行为测试，每个 VU 模拟一次用户会话：

1. 获取用户身份和 token
2. **浏览阶段**（3-10 次读操作）：按权重选择读接口，指数分布思考时间
3. **互动阶段**（1-3 次写操作）：按权重选择写接口，指数分布思考时间
4. 所有请求通过 `tags: { endpoint }` 自动生成按接口细分的指标

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

### stress-test.js（已废弃）

使用 api-client.js 和 report-generator.js 的完整测试脚本。已被 stress-test-simple.js 替代。

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

确保使用 `node src/server.no-limit.js` 启动服务（关闭限流），或通过 `--reset` 参数自动重启。

### parse-report.js 输出"没有找到测试数据"

确保传入的是 `--summary-export` 生成的 JSON 文件（文件名含 `-summary.json`），或 `--full` 模式下的 JSON lines 文件。脚本会自动检测格式。
