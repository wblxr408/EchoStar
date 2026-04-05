# EchoStar 后端性能测试计划

## 测试设计原则

| 原则 | 说明 |
|------|------|
| 阶梯拐点探测 | 单次测试 VUs 递增，获得完整性能曲线 |
| 基于拐点定压力 | 耐力和限流测试的压力基于拐点结果动态计算 |
| 80/20 法则 | 核心接口承载 80% 流量，低频接口单独测试 |
| 场景化行为 | VU 模拟用户会话（登录 → 浏览 → 互动） |
| 真实读写比 | 读 85%，写 15% |
| 热度分布 | 帕累托/齐普夫分布模拟生产热点 |
| 自然增长模式 | ramp 测试 95% 读/5% 写，持续创建新数据 |
| 分级阈值 | 按操作复杂度分级（健康检查 < 简单读 < 列表 < 认证 < 写 < 地图） |
| 错误分类 | 区分 4xx/5xx/429 |
| k6 tags 驱动 | 通过 tags 自动生成按接口细分指标 |

---

## 测试环境要求

| 项目 | 要求 |
|------|------|
| Docker | PostgreSQL + Redis 容器已启动 |
| k6 | 已安装（`k6 version` 可执行） |
| Node.js | 已安装（`--reset` 自动重启服务需要） |
| 网络 | 本机访问 `localhost:3000` 正常 |
| 磁盘 | 普通模式 ~1-5MB；`--full` 模式 ~200-500MB |

### 启动模式

| 模式 | 参数 | 说明 |
|------|------|------|
| 单进程（默认） | `--reset` | 1 个 Node.js 进程 |
| 多进程集群 | `--reset --cluster` | N 个 worker（N = CPU 核数） |

---

## 核心测试矩阵（3 组）

| 编号 | 测试类型 | Profile | 峰值 VUs | 时长 | 目的 |
|:----:|----------|---------|:--------:|:----:|------|
| T1 | 阶梯拐点 | `ramp` | 400 | ~23m | 找出性能拐点和容量上限 |
| T2 | 耐力测试 | `endurance` | 拐点×0.8* | ~32m | 检测内存/连接泄漏 |
| T3 | 限流验证 | rate-limit | 拐点×1.3* | ~2m | 验证限流中间件正确性 |

> \* T2 的 VUs 需在 T1 完成后根据拐点修改 `config.js` 中 endurance 的 `vus` 和 `stages.target`。T3 的 `--vus` 在命令行指定。

---

## T1：阶梯拐点测试

### 目标

VUs 从 50 递增至 400（聚焦 150-350 区间，每 25 VUs 一级），全程记录 RPS、p95、错误率。确定：

- **拐点 VUs**：p95 开始显著偏离线性增长的点
- **安全容量**：p95 < SLA（如 500ms）对应的最大 VUs
- **崩溃阈值**：错误率飙升或 p95 > 2s 的点
- **RPS 上限**：RPS 停止增长的点

### Profile 配置

```javascript
ramp: {
  name: '阶梯拐点测试',
  vus: 400,
  duration: '25m',
  stages: [
    { duration: '30s', target: 50 },      // 预热
    { duration: '1m30s', target: 100 },
    { duration: '1m30s', target: 150 },    // 接近拐点区
    { duration: '1m45s', target: 175 },    // 核心拐点区间（25VUs/步）
    { duration: '1m45s', target: 200 },
    { duration: '1m45s', target: 225 },
    { duration: '1m45s', target: 250 },
    { duration: '1m45s', target: 275 },
    { duration: '1m45s', target: 300 },
    { duration: '1m45s', target: 325 },
    { duration: '1m45s', target: 350 },
    { duration: '1m45s', target: 375 },    // 拐点后验证
    { duration: '1m45s', target: 400 },
    { duration: '1m', target: 400 },       // 保持
    { duration: '30s', target: 0 },        // 优雅停止
  ],
  dataScale: { users: 500, stories: 2000 },
}
```

### 行为模式：自然增长

ramp 使用 95:5 读写比，每迭代 1 次操作（高吞吐），与其他 Profile 不同：

| 特性 | ramp（自然增长） | 其他 Profile（场景化） |
|------|-----------------|----------------------|
| 读写比 | 95% / 5% | 85% / 15% |
| 每迭代操作数 | 1 次 | 3-10 读 + 1-3 写 |
| 思考时间 | 0.1-0.3s | 0.3-3s（指数分布） |

写操作内部分配（5% 命中时）：创建故事 60%、创建评论 25%、点赞 8%、收藏 7%。

### 阈值策略

ramp 使用宽松阈值（故意压过拐点）：

| 指标 | 阈值 | 说明 |
|------|------|------|
| http_req_duration | p(95)<10000 | 仅记录 |
| errors_5xx | rate<0.05 | 安全网 |
| http_req_failed | 不设限 | 允许高并发下 4xx |
| 接口细分阈值 | 不设限 | 不作为判断标准 |

其他 Profile 使用分级标准阈值（见 README.md 按接口独立阈值表）。

### 热度分布

| 模式 | 热门占比 | 热门流量 | 用法 |
|------|:-------:|:-------:|------|
| **pareto**（默认） | 20% | ~80% | 模拟真实热点 |
| **zipfian** | 5% | ~50% | 极端热点 |
| **uniform** | 100% | 100% | 基准对比 |

### 执行命令

```bat
:: T1 单进程（~25min）
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=ramp --monitor --full

:: T1 多进程集群
tests\k6\test-scripts\run-test.bat --mode performance --reset --cluster --env PROFILE=ramp --monitor --full

:: T1 均匀分布对比
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=ramp --monitor --full --env DIST=uniform
```

### 结果解读

| 判断项 | 定义 | 识别方法 |
|--------|------|----------|
| 拐点 VUs | p95 偏离线性增长 | p95 斜率突然变陡 |
| 安全容量 | p95 < SLA 的最大 VUs | p95 < 500ms 对应的最大阶梯 |
| RPS 上限 | 吞吐停止增长 | RPS 增幅 < 5% |
| 崩溃阈值 | 服务质量严重劣化 | 错误率飙升或 p95 > 2s |

### Redis Key 分布采样

测试结束后 monitor 自动采样 12 种 key 前缀数量（`story:raw:*`、`story:cache:*`、`user:info:*`、`like:*` 等），结果在 Markdown 报告中查看。

### 固定压力测试的 Fallback 分析

对无阶梯递增的 Profile（如 endurance），`parse-report.js` 自动检测平坦 VU 曲线（CV < 0.05），改用 2 分钟时间窗口分析。

---

## T2：耐力测试

### 目标

在安全容量 80% 处恒定运行 30 分钟，检测内存泄漏、连接泄漏和性能劣化。

### Profile 配置

```javascript
endurance: {
  name: '耐力测试',
  vus: 130,          // 拐点 159 × 0.8 ≈ 130
  duration: '30m',
  stages: [
    { duration: '1m', target: 130 },
    { duration: '28m', target: 130 },
    { duration: '1m', target: 0 },
  ],
  dataScale: { users: 300, stories: 1500 },
}
```

> 执行前须根据 T1 结果修改 `config.js` 中 endurance 的 `vus` 和 `stages.target`。

### 阈值策略

| 指标 | 阈值 |
|------|------|
| http_req_duration | p(95)<1000, p(99)<2000 |
| http_req_failed | rate<0.05 |
| errors_5xx | rate<0.01 |

### 执行命令

```bat
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=endurance --monitor
```

### 结果解读

| 观察项 | 正常 | 异常信号 |
|--------|------|----------|
| p95 趋势 | 波动 < 20% | 30 分钟内上升超过 50% |
| RPS 趋势 | 稳定 | 持续下降 |
| Redis 内存 | 峰值后回落 | 持续增长不释放 |
| PG 连接数 | 稳定 | 持续增长 |
| 进程内存 | 稳定 | 持续增长（泄漏信号） |

---

## T3：限流验证测试

### 目标

在超过拐点 30% 的压力下验证限流中间件正确性和服务稳定性。

### 执行命令

```bat
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 300 --duration 2m --users 100 --stories 500 --monitor
```

> `--vus` 建议为拐点 × 1.3，示例使用 300（假设拐点约 250），根据 T1 调整。

### 验证要点

| 检查项 | 预期 |
|--------|------|
| rate_429 | > 0（限流触发） |
| 429 响应格式 | `{ code: 429, message: "..." }` |
| 服务稳定性 | 无 5xx，不崩溃 |
| 非限流接口 | health check 仍返回 200 |

---

## 执行顺序

```
mini_verify（~3min，覆盖全部 18 接口）
        │
        ▼
T1 单进程（~25min）
        │
        ▼
T1 集群模式（~25min，对比 P95 改善和拐点右移）
        │
        ▼
修改 config.js：endurance.vus = 集群拐点 × 0.8
        │
        ▼
T2 耐力测试（~32min）
        │
        ▼
T3 限流验证（~2min）
        │
        ▼
[可选] T1 uniform 对比
```

### 注意事项

1. 每次测试独占服务器，不要并行执行
2. 测试间隔建议 30s 等待资源释放
3. T2 执行前必须根据 T1 结果更新 `config.js`
4. T3 `--vus` 建议为拐点 × 1.3
5. `--full` 模式自动生成 JSON Lines + Markdown 报告 + HTML 图表

---

## 快速执行命令汇总

```bat
:: 快速验证（~3min）
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=mini_verify --monitor --full

:: T1 单进程（~25min）
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=ramp --monitor --full

:: T1 集群（~25min）
tests\k6\test-scripts\run-test.bat --mode performance --reset --cluster --env PROFILE=ramp --monitor --full

:: T1 均匀分布对比
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=ramp --monitor --full --env DIST=uniform

:: T2 耐力测试（~32min，先修改 config.js）
tests\k6\test-scripts\run-test.bat --mode performance --reset --env PROFILE=endurance --monitor

:: T3 限流验证（~2min）
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 300 --duration 2m --users 100 --stories 500 --monitor
```

---

## Profile 配置一览

| Profile | 峰值 VUs | 时长 | 数据量(用户/故事) | 用途 |
|---------|:--------:|:----:|:-----------------:|------|
| **ramp** | 400 | ~23m | 500/2000 | 阶梯拐点探测（核心） |
| **endurance** | 130* | ~32m | 300/1500 | 耐力验证（核心） |
| **mini_verify** | 30 | ~2m | 15/30 | 快速验证，18 接口全覆盖 |
| smoke | 10 | ~30s | 20/50 | 冒烟测试 |
| daily | 30 | ~5m | 100/500 | 日常基线 |
| peak | 80 | ~3m | 200/1000 | 峰值参照 |

> \* endurance VUs 基于 T1 拐点 159 × 0.8 = 130。

---

## Redis/PostgreSQL 监控

`--monitor` 参数自动启停监控（每 10 秒采样），测试结束后额外采集 Redis Key 分布。

### 采集指标

| 来源 | 指标 |
|------|------|
| Redis | used_memory, ops/sec, keys, hit/miss, connected_clients |
| Docker | CPU%, Mem |
| PG | active connections |

监控报告保存为 `test-reports/monitor-{timestamp}.json`。

---

## 预计耗时

| 方案 | 测试组 | 耗时（含 reset） |
|------|:------:|:----------------:|
| 完整（mini_verify + T1×2 + T2 + T3） | 5 | ~87 min |
| 核心（T1 单 + T1 集群 + T2） | 3 | ~82 min |
| 最小（T1 + T2） | 2 | ~57 min |
| 快速验证（仅 mini_verify） | 1 | ~3 min |
