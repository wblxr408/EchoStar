# EchoStar 后端压力测试计划

## 测试设计原则

| 原则 | 说明 |
|------|------|
| **阶梯拐点探测** | 单次测试从低到高平滑递增 VUs，一次获得完整性能曲线，替代多个固定压力测试 |
| **基于拐点确定压力** | 耐力测试和限流测试的压力均基于拐点结果动态计算，确保测试有实际指导意义 |
| **80/20 法则** | 核心接口承载 80% 流量，低频接口（管理员）单独测试 |
| **场景化行为** | 每个 VU 模拟用户会话（登录 → 浏览 → 互动），而非纯随机请求 |
| **真实读写比** | 读操作 85%，写操作 15%（符合社交平台真实流量模式） |
| **热度分布访问** | 少数热门故事/用户承载大部分流量（帕累托/齐普夫分布），模拟生产环境热点 |
| **自然增长模式** | ramp 测试使用 95% 读 / 5% 写，持续创建新数据，模拟冷热数据混合和缓存命中率自然下降 |
| **指数分布思考时间** | 浏览 0.3-2s，互动 0.5-3s，比均匀分布更真实 |
| **分级阈值** | 按操作复杂度分级（健康检查 < 简单读 < 列表搜索 < 认证 < 写操作 < 地图聚合） |
| **错误分类** | 区分 4xx/5xx/429，辅助快速定位问题 |
| **k6 tags 驱动** | 通过 tags 自动生成按接口细分的指标，无需手动 Trend 对象 |

---

## 测试环境要求

| 项目 | 要求 |
|------|------|
| 后端服务 | Docker 容器（PostgreSQL + Redis）已启动 |
| k6 | 已安装（`k6 version` 可执行） |
| Node.js | 已安装（用于 `--reset` 自动重启服务） |
| 网络 | 本机访问 `localhost:3000` 正常 |
| 磁盘空间 | 普通模式每次 ~1-5MB；`--full` 模式阶梯测试约 200-500MB |

---

## 核心测试矩阵（3 组）

> 从原来的 7-8 组独立测试精简为 3 组核心测试，总耗时约 59 分钟，信息量不减反增。

| 编号 | 测试类型 | Profile | 峰值 VUs | 时长 | 目的 |
|:----:|----------|---------|:--------:|:----:|------|
| **T1** | 阶梯拐点测试 | `ramp` | 400 | ~23m | 找出性能拐点和容量上限 |
| **T2** | 耐力测试 | `endurance` | 拐点×0.8* | ~32m | 检测内存/连接泄漏 |
| **T3** | 限流验证测试 | rate-limit | 拐点×1.3* | ~2m | 验证限流中间件正确性 |

> \* T2 的 VUs 需在 T1 完成后根据拐点结果修改 `config.js` 中 endurance 的 `vus` 和 stages 的 `target`。T3 的 `--vus` 根据拐点在命令行指定。

---

## T1：阶梯拐点测试（一次性找出容量上限）

### 1.1 目标

使用一个脚本，VUs 从 50 逐步增加到 400（聚焦 150-350 拐点区间，每 25 VUs 一级），全程记录 RPS、p95、错误率随 VUs 的变化曲线。从结果中直接读出：

- **拐点 VUs**：p95 开始显著偏离线性增长的点
- **安全容量**：p95 < SLA 目标（如 500ms）对应的最大 VUs
- **崩溃阈值**：错误率飙升或 p95 超过 2s 的点
- **RPS 上限**：RPS 停止增长趋于平缓的点

### 1.2 Profile 配置

定义在 `config.js` 中：

```javascript
ramp: {
  name: '阶梯拐点测试',
  vus: 400,
  duration: '25m',
  stages: [
    // ---- 预热阶段：快速爬升到 100 VUs ----
    { duration: '30s', target: 50 },
    { duration: '1m30s', target: 100 },
    // ---- 接近拐点区：100→150 ----
    { duration: '1m30s', target: 150 },
    // ---- 核心拐点区间：150-350（每 25 VUs 一级 × 1m45s = 8 级）----
    { duration: '1m45s', target: 175 },
    { duration: '1m45s', target: 200 },
    { duration: '1m45s', target: 225 },
    { duration: '1m45s', target: 250 },
    { duration: '1m45s', target: 275 },
    { duration: '1m45s', target: 300 },
    { duration: '1m45s', target: 325 },
    { duration: '1m45s', target: 350 },
    // ---- 拐点后验证：350-400 ----
    { duration: '1m45s', target: 375 },
    { duration: '1m45s', target: 400 },
    // ---- 保持阶段：400 VUs 稳定采集 ----
    { duration: '1m', target: 400 },
    // ---- 优雅停止 ----
    { duration: '30s', target: 0 },
  ],
  dataScale: { users: 500, stories: 2000 },
}
```

> 预热阶段 2 分钟快速爬升到 100 VUs，核心区间 150-350 以 25 VUs 为粒度精细测量（8 级 × 1m45s），最后 3.5 分钟验证 350-400 区间。总量约 22.5 分钟。设计基于前期测试发现的拐点在 200-300 VUs 区间，将测量密度集中于此。

### 1.3 行为模式：自然增长

ramp 测试使用独特的**自然增长模式**，与其他 Profile 的场景化行为不同：

| 特性 | ramp（自然增长模式） | 其他 Profile（场景化行为） |
|------|---------------------|--------------------------|
| 读写比 | 95% 读 / 5% 写 | 85% 读 / 15% 写 |
| 每迭代操作数 | 1 次（读或写） | 3-10 读 + 1-3 写 |
| 思考时间 | 0.1-0.3s（均值 ~0.2s） | 0.3-3s（指数分布） |
| 写操作内容 | 创建新故事/评论/点赞/收藏 | 登录/评论/点赞等全类型 |

**写操作内部分配（5% 概率命中时）：**

| 写操作 | 比例 | 说明 |
|--------|------|------|
| 创建故事 | 60% | 核心写操作，生成冷数据 |
| 创建评论 | 25% | 对已有故事的互动 |
| 点赞/取消点赞 | 8% | 高频轻量写操作 |
| 收藏/取消收藏 | 7% | 高频轻量写操作 |

> 新数据写入数据库后，`map_explore`、`search_story` 等聚合查询会自然返回新数据，使缓存命中率随时间平滑下降，更贴近真实生产环境。

### 1.4 阈值策略

阶梯测试使用**宽松阈值**（仅监控不中断），因为我们故意压过拐点：

| 指标 | 阈值 | 说明 |
|------|------|------|
| http_req_duration | p(95)<10000 | 极度宽松，仅用于记录 |
| errors_5xx | rate<0.05 | 安全网：5xx 错误率不超过 5% |
| http_req_failed | 不设限 | 允许高并发下的 4xx 失败 |
| 接口细分阈值 | 不设限 | 高并发下预期超限，不作为判断标准 |

> 脚本会自动检测 `PROFILE=ramp` 并应用宽松阈值，无需手动配置。

### 1.4b 接口阈值分级

所有 Profile（除 ramp 外）使用按操作复杂度分级的标准阈值：

| 分类 | 接口 | P95(ms) | 说明 |
|------|------|:-------:|------|
| 健康检查 | health_check | 100 | 无业务逻辑，应最快响应 |
| 简单读 | get_story, get_user, mark_notif_read | 500 | 单条记录查询 |
| 列表/搜索 | search_story, list_comments, list_notifications | 800 | 多记录查询+分页排序 |
| 认证 | login | 1000 | JWT 生成+密码验证 |
| 认证 | register | 1500 | 密码哈希+新用户写入 |
| 写操作 | like_toggle, favorite_toggle, create_comment, create_report, update_profile | 1000 | DB 事务+数据校验 |
| 写操作 | create_story | 1500 | 图片处理+地理位置+多字段写入 |
| 地图聚合 | map_explore, map_feed, map_clusters | 1200 | 空间计算+聚合查询 |

### 1.4c 热度分布

真实生产环境中，少数热门内容承载大部分流量。测试框架支持三种访问分布模式，通过 `--env DIST=xxx` 切换：

| 模式 | 热门占比 | 热门流量 | 说明 |
|------|:-------:|:-------:|------|
| **pareto** (默认) | 20% | ~80% | 帕累托分布，模拟真实社交平台热点 |
| **zipfian** | 5% | ~50% | 齐普夫分布，模拟"爆款"极端热点 |
| **uniform** | 100% | 100% | 均匀分布，用于基准对比 |

热门集合在 setup 阶段自动标记：
- 故事：前 `HOT_RATIO` 比例的故事被标记为"热门"（带图片占位符、丰富情绪标签）
- 用户：按数组顺序，前 `HOT_RATIO` 比例的用户被更频繁选中

```bash
# 默认帕累托分布
run-test.bat --mode performance --reset --env PROFILE=ramp --monitor

# 均匀分布（与 pareto 对比缓存命中率差异）
run-test.bat --mode performance --reset --env PROFILE=ramp --monitor --env DIST=uniform

# 自定义热门比例
run-test.bat --mode performance --reset --env PROFILE=ramp --monitor --env HOT_RATIO=0.1
```

> **分析要点**：对比 pareto vs uniform 报告，关注：
> - 热门故事的缓存命中率是否大幅提升？
> - 读接口延迟是否因缓存命中而下降？
> - 写操作（like/favorite）是否因热点竞争成为新瓶颈？

### 1.5 执行命令

```bat
:: ========== T1: 阶梯拐点测试（~25min，含逐请求数据 + 可视化图表）==========
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=ramp --monitor --full
```

> `--full` 模式会自动生成 JSON Lines 文件（200-500MB）、Markdown 报告、HTML 图表和监控报告。`run-test.bat` 会自动调用 `parse-report.js` 和 `plot-stages.js`。

### 1.6 结果解读

从终端输出、Markdown 报告或 HTML 图表中提取每个阶段的指标。

> `--full` 模式会自动生成可视化图表，可直接在浏览器打开 `*-charts.html` 查看交互式图表。

**判断标准：**

| 判断项 | 定义 | 识别方法 |
|--------|------|----------|
| **拐点 VUs** | p95 开始显著偏离线性增长 | p95 斜率突然变陡（如从 +50ms/阶 变为 +300ms/阶） |
| **安全容量** | p95 仍在可接受范围的最大 VUs | p95 < SLA（如 500ms）对应的最大 VUs 阶梯 |
| **RPS 上限** | 吞吐量停止增长的点 | RPS 增幅 < 5% 的阶梯 |
| **崩溃阈值** | 服务质量严重劣化的点 | 错误率飙升或 p95 > 2s 的阶梯 |

> **参考**（基于阶梯拐点测试实际数据）：
> - 拐点区间约 200-300 VUs（p95 显著跳升）
> - RPS 上限约 375 req/s

### 1.7 可视化图表（`--full` 模式，自动生成）

`--full` 模式下，`run-test.bat` 测试完成后会自动调用 `plot-stages.js` 生成可视化：

| 输出 | 说明 |
|------|------|
| `{profile}-analysis-{timestamp}.json` | 各阶梯详细指标（由 `parse-report.js` 生成） |
| `{profile}-charts-{timestamp}.html` | 交互式 HTML 图表（Chart.js，含响应时间叠加图、RPS 柱状图、接口 P95 对比） |
| `{profile}-charts-{timestamp}.md` | ASCII 图表（追加到 Markdown 报告） |
| `{profile}-report-{timestamp}.md` | 完整 Markdown 报告（分阶段 P95、拐点检测、Redis/PG 监控） |

### 1.8 Redis Key 分布采样

测试结束后（非阻塞），monitor 会自动采样 Redis 中 12 种 key 前缀的数量分布：

| 前缀 | 用途 |
|------|------|
| `story:raw:*` | 原始故事数据 |
| `story:cache:*` | 故事缓存 |
| `story:list:*` | 故事列表缓存 |
| `user:info:*` | 用户信息缓存 |
| `user:session:*` | 用户会话 |
| `comment:*` | 评论缓存 |
| `like:*` | 点赞缓存 |
| `favorite:*` | 收藏缓存 |
| `notification:*` | 通知缓存 |
| `map:*` | 地图数据缓存 |
| `rate_limit:*` | 限流计数器 |
| `token:*` | Token 存储 |

> 结果展示在 Markdown 报告中，可辅助分析缓存命中率低的原因。采样在测试完全结束后执行，不影响测试结果。

### 1.9 固定压力测试的 Fallback 分析

对于无阶梯递增的 Profile（如 endurance），`parse-report.js` 会自动检测平坦 VU 曲线（CV < 0.05），改用时间窗口分析（2 分钟一个窗口），命名为 `120vus_t2m`、`120vus_t4m` 等格式，确保报告仍然可读。

---

## T2：耐力测试（验证长期稳定性）

### 2.1 目标

在安全容量的 80% 处恒定运行 30 分钟，检测内存泄漏、连接泄漏和性能劣化。

### 2.2 Profile 配置

```javascript
endurance: {
  name: '耐力测试',
  vus: 120,          // = 拐点VUs × 0.8，根据 T1 结果调整
  duration: '30m',
  stages: [
    { duration: '1m', target: 120 },
    { duration: '28m', target: 120 },
    { duration: '1m', target: 0 },
  ],
  dataScale: { users: 300, stories: 1500 },
}
```

> **重要**：执行 T2 前必须根据 T1 结果修改 `config.js` 中 endurance 的 `vus` 值和 stages 中的 `target` 值。默认 120 VUs（假设拐点为 150）。

### 2.3 阈值策略

使用标准性能阈值（因为压力控制在安全容量以内）：

| 指标 | 阈值 | 说明 |
|------|------|------|
| http_req_duration | p(95)<1000, p(99)<2000 | 标准性能阈值 |
| http_req_failed | rate<0.05 | 失败率不超过 5% |
| errors_5xx | rate<0.01 | 5xx 错误率不超过 1% |

### 2.4 执行命令

```bat
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=endurance --monitor
```

### 2.5 结果解读

重点观察以下指标是否随时间劣化：

| 观察项 | 正常 | 异常信号 |
|--------|------|----------|
| p95 趋势 | 随时间稳定（波动 < 20%） | 30 分钟内持续上升超过 50% |
| RPS 趋势 | 随时间稳定 | 持续下降 |
| Redis 内存 | 稳定（峰值后回落） | 持续增长不释放 |
| PG 连接数 | 稳定 | 持续增长 |
| Node.js 进程内存 | 稳定 | 持续增长（内存泄漏信号） |

---

## T3：限流验证测试（可选）

### 3.1 目标

在超过拐点 30% 的压力下运行 2 分钟，验证限流中间件的正确性和服务稳定性。

### 3.2 执行命令

```bat
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 300 --duration 2m --users 100 --stories 500 --monitor
```

> `--vus` 建议设为拐点 × 1.3。示例中使用 300 VUs（假设拐点约 250），请根据 T1 结果调整。

### 3.3 验证要点

| 检查项 | 预期结果 |
|--------|----------|
| rate_429 指标 | > 0（确认限流被触发） |
| 429 响应格式 | `{ code: 429, message: "..." }` |
| 服务稳定性 | 无 5xx 错误，服务不崩溃 |
| 非限流接口正常 | health check 等仍返回 200 |

### 3.4 限流窗口重置测试（扩展）

如需验证 15 分钟限流窗口重置后服务恢复正常吞吐：

```bat
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 30 --duration 16m --users 50 --stories 200 --monitor
```

---

## 执行顺序与流程

```
mini_verify（快速验证，~3min，覆盖全部 18 接口，验证脚本正确性）
        │
        ▼
T1（阶梯拐点测试，~25min 含 reset，pareto 分布）
        │
        ▼
  分析结果，确定：
  - 拐点 VUs（如 250）
  - 安全容量（如 200 VUs）
  - RPS 上限（如 375 req/s）
        │
        ▼
  修改 config.js：
  - endurance.vus = 拐点 × 0.8
  - endurance.stages 中的 target 同步修改
        │
        ▼
T2（耐力测试，~32min 含 reset）
        │
        ▼
  分析结果，确认：
  - 无内存泄漏
  - p95 随时间稳定
        │
        ▼
T3（限流验证，~2min）
        │
        ▼
  [可选] T1 uniform 对比
  重新执行 T1 使用 --env DIST=uniform
  对比 pareto vs uniform 报告：
  - 缓存命中率差异
  - 热点读写瓶颈
```

### 注意事项

1. **不要并行执行** — 每次测试需要独占服务器，同时运行会导致结果失真
2. **测试间隔建议 30s** — 等待 Docker 资源释放
3. **T1 耗时最长** — 约 25 分钟（含 reset + setup），建议先单独执行
4. **T2 需修改配置** — 执行前必须根据 T1 结果更新 `config.js` 中 endurance 的 VUs
5. **T3 VUs 需调整** — `--vus` 参数建议为拐点 × 1.3
6. **默认使用帕累托分布** — `DIST=pareto` 模拟真实热点，可通过 `--env DIST=uniform` 切换均匀分布对比
7. **报告文件位置**：
   - 性能测试：`backend/tests/k6/test-reports/performance-test/`
   - 限流测试：`backend/tests/k6/test-reports/rate-limit-test/`
   - 监控报告：`backend/tests/k6/test-reports/monitor-[时间戳].json`
8. **可视化图表** — `--full` 模式会自动生成 `*-charts.html` 和追加 ASCII 图表到 Markdown
9. **Redis Key 分布** — 测试结束自动采样，无需额外操作，结果在 Markdown 报告中查看

---

## 快速执行命令汇总

docker start rmqnamesrv rmqbroker rmqproxy

```bat
:: ========== 快速验证（~3min，覆盖全部 18 接口）==========
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=mini_verify --monitor --full

:: ========== T1: 阶梯拐点测试（~25min）==========
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=ramp --monitor --full

:: ========== T1: 阶梯拐点测试（均匀分布，用于对比缓存效果）==========
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=ramp --monitor --full --env DIST=uniform

:: ========== T2: 耐力测试（~32min，执行前先修改 config.js 中 endurance 的 vus）==========
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=endurance --monitor

:: ========== T3: 限流验证测试（~2min，可选，根据 T1 结果调整 --vus）==========
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 300 --duration 2m --users 100 --stories 500 --monitor
```

---

## Profile 配置一览

所有 Profile 定义在 `config.js` 中，通过 `--env PROFILE=xxx` 切换：

| Profile | 峰值 VUs | 时长 | 数据量(用户/故事) | 阶梯设计 | 用途 |
|---------|:--------:|:----:|:-----------------:|----------|------|
| **ramp** | 400 | ~23m | 500/2000 | 预热→150→350(25VUs/步)→400+保持+冷却 | **核心：阶梯拐点探测** |
| **endurance** | 120* | ~32m | 300/1500 | 1m 升 + 28m 恒 + 1m 降 | **核心：耐力验证** |
| **mini_verify** | 30 | ~2m | 15/30 | 15s 升 + 1m30s 恒 + 15s 降 | **快速验证：覆盖全部 18 接口** |
| smoke | 10 | ~30s | 20/50 | 5→10→0 | 快速冒烟 |
| daily | 30 | ~5m | 100/500 | 15→30→45→0 | 日常基线 |
| peak | 80 | ~3m | 200/1000 | 20→80→160→0 | 峰值参照 |

> \* endurance 的 VUs 需根据 T1 结果手动调整为拐点 × 0.8。

---

## 指标体系说明

### k6 tags 自动生成的指标

测试脚本通过 `tags: { endpoint }` 自动生成以下指标（出现在 summary-export JSON 中）：

```
# 按接口细分
http_req_duration{endpoint:get_story}       — 故事详情
http_req_duration{endpoint:map_explore}     — 地图探索
http_req_duration{endpoint:search_story}    — 搜索
http_req_duration{endpoint:login}           — 登录
...

# 按阶段细分（read/write group）
http_req_duration{group:::read}             — 所有读操作
http_req_duration{group:::write}            — 所有写操作

# 限流测试：按 limiter 类型细分
http_req_duration{limiter:strict}           — strictLimiter
http_req_duration{limiter:general}          — generalLimiter
http_req_duration{limiter:loose}            — looseLimiter
```

### 错误分类指标

| 指标 | 类型 | 说明 |
|------|------|------|
| errors_4xx | Rate | 客户端错误率 |
| errors_5xx | Rate | 服务端错误率 |
| errors_other | Rate | 网络等其它错误率 |
| rate_429 | Rate | 429 限流响应率（限流测试） |
| http_req_failed | Rate | 总请求失败率 |

### 报告格式

| 格式 | 生成方式 | 大小 | 内容 |
|------|---------|------|------|
| Summary Export | `--summary-export`（默认） | ~10KB | 聚合指标 + 按 tag 细分 |
| JSON Lines | `--full` 模式 | 200-500MB | 逐请求详细数据（含时间戳） |
| Analysis JSON | `parse-report.js`（`--full` 模式） | ~50KB | 各阶梯分段指标 |
| Markdown 报告 | `parse-report.js`（自动） | ~15KB | 可读的测试报告（含 ASCII 图表 + Redis/PG 监控） |
| HTML 图表 | `plot-stages.js`（`--full` 模式，自动） | ~200KB | Chart.js 交互式图表 |
| Monitor JSON | `monitor.cjs`（`--monitor`） | ~100KB | Redis/PG/Docker 资源监控采样 |

> `--full` + `--monitor` 模式下，`parse-report.js` 和 `plot-stages.js` 会被 `run-test.bat` 自动调用，无需手动执行。

---

## 接口权重分配

### 性能测试权重

#### 场景化行为模式（endurance / peak / daily / smoke）

使用 85:15 读写比，每个 VU 模拟完整用户会话：

| 接口 | 权重 | 类别 | 说明 |
|------|------|------|------|
| GET /api/stories/:id | 30% | 读 | 获取故事详情（最高频） |
| GET /api/map/explore | 15% | 读 | 地图范围探索 |
| GET /api/map/clusters | 12% | 读 | 聚合数据（次高频，仅次于 map_explore） |
| GET /api/stories/search | 5% | 读 | 搜索故事 |
| GET /api/v1/map/feed | 10% | 读 | 推荐信息流 |
| GET /api/comments/story/:id | 8% | 读 | 获取评论列表 |
| GET /api/v1/notifications/me | 3% | 读 | 通知列表 |
| GET /api/auth/users/:id | 2% | 读 | 获取用户信息 |
| GET /health | 1% | 读 | 健康检查 |
| POST /api/auth/login | 3% | 写 | 登录 |
| POST /api/comments | 3% | 写 | 创建评论 |
| POST /api/likes | 3% | 写 | 点赞/取消点赞 |
| POST /api/favorites | 2% | 写 | 收藏/取消收藏 |
| POST /api/stories | 1.5% | 写 | 创建故事 |
| POST /api/auth/register_2 | 1% | 写 | 注册 |
| POST /api/reports | 0.5% | 写 | 举报 |
| PUT /api/v1/notifications/me/mark-read | 0.5% | 写 | 标记通知已读 |
| PUT /api/auth/users/me | 0.5% | 写 | 更新个人资料 |

#### 自然增长模式（ramp）

使用 95:5 读写比，每迭代只执行 1 次操作（高吞吐模式）：

| 操作 | 概率 | 说明 |
|------|------|------|
| 读操作（同上权重） | 95% | 从 READ_ACTIONS 中按权重选择 |
| 写操作 - 创建故事 | 3.0% | 5% × 60%，生成冷数据 |
| 写操作 - 创建评论 | 1.25% | 5% × 25% |
| 写操作 - 点赞 | 0.4% | 5% × 8% |
| 写操作 - 收藏 | 0.35% | 5% × 7% |

### 限流测试权重（按 limiter 类型均匀分布）

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

---

## Redis/PostgreSQL 监控

所有测试命令已默认附带 `--monitor`，k6 测试前后会自动启停 Redis/PG 监控，无需手动操作。

如需**手动运行**监控（例如独立调试），可使用以下方式：

```bat
cd backend
node tests\k6\test-scripts\monitor.cjs 300
```

（300 = 自动运行 300 秒后停止，省略则需 Ctrl+C 手动停止）

### 采集的指标

**基础监控**（每 10 秒采样一次，测试期间持续采集）：

| 来源 | 指标 | 说明 |
|------|------|------|
| Redis | used_memory | 当前内存占用 |
| Redis | ops/sec | 每秒操作数（反映限流检查频率） |
| Redis | keys | 键数量（反映限流计数器数量） |
| Redis | hit/miss | 缓存命中率 |
| Redis | connected_clients | 连接数 |
| Docker | CPU% | 容器 CPU 占用 |
| Docker | Mem | 容器内存占用 |
| PG | active connections | 活跃数据库连接数 |

**Redis Key 分布采样**（测试结束后一次性采集，非阻塞）：

| 采集方式 | 说明 |
|---------|------|
| `KEYS prefix:*` | 12 种前缀各一次，获取各类型 key 数量 |
| 结果位置 | Markdown 报告中的「Redis Key 分布」表格 |

### 监控报告输出

报告自动保存为 `test-reports/monitor-[时间戳].json`，包含每次采样的原始数据和汇总统计。

---

## 关键指标记录表

> 每次测试完成后，查看自动生成的 Markdown 报告和 HTML 图表（`--full` 模式），或手动填入下方表格。

### T1：阶梯拐点测试

| VUs | RPS | p95(ms) | p99(ms) | avg(ms) | 失败率 | Checks 通过率 |
|:---:|:---:|:-------:|:-------:|:-------:|:------:|:------------:|
| 50 | | | | | | |
| 100 | | | | | | |
| 150 | | | | | | |
| 175 | | | | | | |
| 200 | | | | | | |
| 225 | | | | | | |
| 250 | | | | | | |
| 275 | | | | | | |
| 300 | | | | | | |
| 325 | | | | | | |
| 350 | | | | | | |
| 375 | | | | | | |
| 400 | | | | | | |

**分析结论：**

| 指标 | 值 | 说明 |
|------|-----|------|
| 拐点 VUs | | p95 斜率突增的阶梯 |
| 安全容量 | VUs | p95 < SLA 的最大 VUs |
| RPS 上限 | req/s | RPS 停止增长的点 |
| 崩溃阈值 | VUs | 错误率飙升或 p95 > 2s |

### T2：耐力测试

| 时间区间 | RPS | p95(ms) | p99(ms) | Redis 内存 | PG 连接数 |
|----------|:---:|:-------:|:-------:|:----------:|:---------:|
| 0-5 min | | | | | |
| 5-10 min | | | | | |
| 10-15 min | | | | | |
| 15-20 min | | | | | |
| 20-25 min | | | | | |
| 25-30 min | | | | | |

**稳定性结论：**

| 观察项 | 结论 |
|--------|------|
| p95 劣化幅度 | _____%（超过 50% 视为异常） |
| 内存泄漏 | 有 / 无 |
| 连接泄漏 | 有 / 无 |

### T3：限流验证测试

| 指标 | 值 |
|------|-----|
| 429 响应率 | |
| 5xx 错误率 | |
| 服务稳定性 | 正常 / 异常 |

---

## 预计总耗时

| 方案 | 测试组数 | 预计耗时（含 reset 和间隔） |
|------|:--------:|:--------------------------:|
| 完整执行（mini_verify+T1+T2+T3） | 4 组 | ~62 分钟 |
| 核心测试（T1+T2） | 2 组 | ~57 分钟 |
| 快速验证（仅 mini_verify） | 1 组 | ~3 分钟 |
| 快速验证（仅 T1） | 1 组 | ~25 分钟 |