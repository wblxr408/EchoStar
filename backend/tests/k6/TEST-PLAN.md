# EchoStar 后端压力测试计划

## 测试环境要求

| 项目 | 要求 |
|------|------|
| 后端服务 | Docker 容器（PostgreSQL + Redis）已启动 |
| k6 | 已安装（`k6 version` 可执行） |
| Node.js | 已安装（用于 `--reset` 自动重启服务） |
| 网络 | 本机访问 `localhost:3000` 正常 |
| 磁盘空间 | 每次测试生成 ~1-5MB JSON 报告 |

---

## 测试矩阵（共 8 组）

### 维度说明

| 维度 | 解释 |
|------|------|
| **模式** | `performance` = 关闭限流测纯性能；`rate-limit` = 开启限流验证功能 |
| **VUs** | 虚拟用户数，模拟同时发起请求的用户数量 |
| **持续时间** | 测试主阶段时长（脚本会自动在前后加预热/冷却） |
| **对比** | 标注与哪组测试做对比，用于计算限流带来的性能损耗 |

### 第一优先级：必做（7 组）

#### 性能测试（限流关闭）

| 编号 | 场景 | VUs | 时长 | 用户 | 故事 | 内置峰值 | 目的 |
|:----:|------|:---:|:----:|:----:|:----:|:--------:|------|
| P1 | 日常负载 | 30 | 2m | 50 | 200 | 120 VUs | 建立低负载性能基线 |
| P2 | 峰值负载 | 80 | 3m | 50 | 200 | 320 VUs | 模拟高峰时段，**核心参照组** |
| P3 | 过载压力 | 200 | 2m | 100 | 500 | 800 VUs | 找到服务性能拐点/崩溃阈值 |
| P4 | 持久运行 | 50 | 15m | 50 | 200 | 200 VUs | 检测内存泄漏与长时间稳定性 |

#### 限流测试（限流开启）

| 编号 | 场景 | VUs | 时长 | 用户 | 故事 | 内置峰值 | 对比 | 目的 |
|:----:|------|:---:|:----:|:----:|:----:|:--------:|:----:|------|
| R1 | 峰值限流 | 80 | 2m | 50 | 200 | 160 VUs | P2 | 验证限流在峰值下的表现 & 计算性能损耗 |
| R2 | 高压限流 | 120 | 2m | 50 | 200 | 240 VUs | R1 | 验证更高并发下的限流稳定性 |
| R3 | 窗口重置 | 30 | 16m | 50 | 200 | 60 VUs | - | 覆盖完整 15min 限流窗口，验证窗口重置后服务恢复 |

### 第二优先级：选做（1 组）

#### 大数据量测试（限流关闭）

| 编号 | 场景 | VUs | 时长 | 用户 | 故事 | 内置峰值 | 目的 |
|:----:|------|:---:|:----:|:----:|:----:|:--------:|------|
| P5 | 大数据量 | 80 | 3m | 200 | 1000 | 320 VUs | 模拟生产级数据量，对比 P2 验证数据量增长对性能的影响 |

### 覆盖维度总结

```
负载级别:   低(30VUs) ─── 中(50-80VUs) ──── 高(120-200VUs)
            P1, R3        P2, P4, R1, P5    P3, R2

测试模式:   无限流 ───────────────────── 限流开启
            P1-P5                         R1-R3

持续时间:   短(2m) ──── 中(3m) ──── 长(15-16m)
            P1,P3,R1,R2  P2,P5        P4,R3

数据规模:   小(50/200) ────────────── 大(200/1000)
            P1-P4, R1-R3               P5
```

---

## 快速执行命令

> 以下命令在 `backend` 目录下执行，可直接复制粘贴到终端。
> 每条命令含 `--reset` 和 `--monitor`，会自动重启服务并启用 Redis/PG 监控。

### 性能测试（需按顺序执行）

```bat
:: P1 - 日常负载基准
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 30 --duration 2m --users 50 --stories 200 --monitor
```

```bat
:: P2 - 峰值负载（核心参照）
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 80 --duration 3m --users 50 --stories 200 --monitor
```

```bat
:: P3 - 过载压力
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 200 --duration 2m --users 100 --stories 500 --monitor
```

```bat
:: P4 - 持久运行（耗时最长）
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 50 --duration 15m --users 50 --stories 200 --monitor
```

### 限流测试

```bat
:: R1 - 峰值限流验证（对比 P2）
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 80 --duration 2m --users 50 --stories 200 --monitor
```

```bat
:: R2 - 高压限流验证
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 120 --duration 2m --users 50 --stories 200 --monitor
```

```bat
:: R3 - 限流窗口重置验证（覆盖完整 15min 窗口）
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 30 --duration 16m --users 50 --stories 200 --monitor
```

### 大数据量测试（选做）

```bat
:: P5 - 大数据量性能对比
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 80 --duration 3m --users 200 --stories 1000 --monitor
```

---

## Redis/PostgreSQL 监控

所有测试命令已默认附带 `--monitor`，k6 测试前后会自动启停 Redis/PG 监控，无需手动操作。

如需**手动运行**监控（例如独立调试），可使用以下方式：

**终端 1** — 启动监控：
```bat
cd backend
node tests\k6\test-scripts\monitor.cjs 300
```
（300 = 自动运行 300 秒后停止，省略则需 Ctrl+C 手动停止）

**终端 2** — 运行 k6 测试（正常执行即可）

### 采集的指标

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

### 监控报告输出

报告自动保存为 `test-reports/monitor-[时间戳].json`，包含：
- 每次采样的原始数据（时间序列）
- 汇总统计（min / max / avg）

> 建议在 **P2**、**P3**、**R2** 三组测试上启用监控，数据最有代表性。

---

## 执行建议

### 完整执行（必做 7 组）

按 `P1 → P2 → P3 → R1 → R2 → P4 → R3` 顺序执行。每次测试结束后记录关键指标到下方的记录表。

```bat
:: P1
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 30 --duration 2m --users 50 --stories 200 --monitor
:: P2
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 80 --duration 3m --users 50 --stories 200 --monitor
:: P3
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 200 --duration 2m --users 100 --stories 500 --monitor
:: R1
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 80 --duration 2m --users 50 --stories 200 --monitor
:: R2
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 120 --duration 2m --users 50 --stories 200 --monitor
:: P4（耗时最长 ~18min，可单独执行）
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 50 --duration 15m --users 50 --stories 200 --monitor
:: R3（耗时最长 ~18min，可单独执行）
cd backend
tests\k6\test-scripts\run-test.bat --mode rate-limit --reset --vus 30 --duration 16m --users 50 --stories 200 --monitor
```

### 快速执行（4 组核心）

如果时间紧张，优先做 `P2 → P3 → R1 → R2`，约 15-18 分钟。

### 注意事项

1. **不要并行执行** — 每次测试需要独占服务器，同时运行会导致结果失真
2. **测试间隔建议 30s** — 等待 Docker 资源释放
3. **P4 和 R3 耗时最长** — 各约 18 分钟（含 reset），建议单独执行或最后执行
4. **报告文件位置**：
   - 性能测试：`backend/tests/k6/test-reports/performance-test/`
   - 限流测试：`backend/tests/k6/test-reports/rate-limit-test/`
   - 监控报告：`backend/tests/k6/test-reports/monitor-[时间戳].json`

---

## 关键指标记录表

> 每次测试完成后，从终端输出或 JSON 报告中提取以下字段填入。

| 编号 | RPS | p95(ms) | p99(ms) | 失败率 | Checks 通过率 | 核心结论 |
|:----:|:---:|:-------:|:-------:|:------:|:------------:|----------|
| P1 | | | | | | |
| P2 | | | | | | |
| P3 | | | | | | |
| P4 | | | | | | |
| R1 | | | | | | |
| R2 | | | | | | |
| R3 | | | | | | |
| P5 | | | | | | |

**指标说明：**

| 指标 | 含义 | 获取方式 |
|------|------|----------|
| RPS | 每秒处理请求数，越高越好 | 终端输出的 `http_reqs` / 总秒数 |
| p95 | 95% 请求在此时长内完成 | 终端输出或 JSON 中 `http_req_duration` |
| p99 | 99% 请求在此时长内完成 | 同上 |
| 失败率 | 非 2xx 响应占比 | 终端输出的 `http_req_failed` |
| Checks 通过率 | 断言检查通过比例 | 终端输出的 `checks` |

---

## 对比分析要点

完成全部测试后，重点关注以下对比：

| 对比项 | 对比组 | 关注点 |
|--------|--------|--------|
| 限流性能损耗 | P2 vs R1 | 相同 VUs 下，开启限流后 p95 上升了多少 |
| 负载-性能曲线 | P1 → P2 → P3 | 随 VUs 增加，p95 和失败率的增长趋势 |
| 限流有效性 | R1, R2 | 429 响应占比是否随 VUs 增加而上升 |
| 长期稳定性 | P1 vs P4 | 长时间运行后 p95 是否明显劣化（内存泄漏信号） |
| 限流窗口重置 | R3 | 15min 窗口结束后，服务是否自动恢复正常吞吐 |
| 数据量影响 | P2 vs P5 | 数据量增大 5x/10x 后，p95 上升幅度 |

---

## 预计总耗时

| 方案 | 测试组数 | 预计耗时（含 reset） |
|------|:--------:|:-------------------:|
| 完整执行 | 8 组 | ~55-70 分钟 |
| 必做 7 组 | 7 组 | ~45-60 分钟 |
| 快速执行 | 4 组 | ~15-18 分钟 |
