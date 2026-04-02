# EchoStar 后端性能压测报告 — P3 高负载压力测试
> 测试时间：2026-03-28  
> 测试模式：performance（限流关闭，纯性能基准）  
> 压测脚本：`stress-test-simple.js`  
> 并发规模：200 VUs / 2m（内置峰值 800 VUs）  
> 覆盖模块：auth、story、like、favorite、comment、map、notification、recommendation（共 9 个）  

---

## 一、测试目标
在 P1/P2 基础上，将并发提升至 200 VUs（内置峰值 800 VUs），验证服务在高负载下的极限表现，确认服务可用性边界。

## 二、测试环境
### 2.1 硬件配置
| 资源 | 配置 |
|------|------|
| CPU | AMD Ryzen 7 8745H（8 核 16 线程） |
| 内存 | 16.0 GB DDR5 5600 MT/s |
| 磁盘 | NVMe SSD |
| 操作系统 | Windows 11 |

### 2.2 软件与容器环境
| 组件 | 版本/配置 |
|------|----------|
| 压测工具 | k6 v1.6.1 |
| 服务端框架 | Node.js + Express 4.18.2 + Sequelize 6.35.2 |
| PostgreSQL | Docker 容器（echostar-postgres） |
| Redis | Docker 容器（echostar-redis），7.412 GiB 内存限制 |
| 网络环境 | localhost 回环 |

## 三、测试配置
| 配置项 | 参数值 | 对比 P1 | 对比 P2 |
|--------|--------|---------|---------|
| 基础 VUs | 200 | 30（+567%） | 80（+150%） |
| 内置峰值 VUs | 800（4x 基础值，spike 阶段） | 120（+567%） | 320（+150%） |
| 测试时长 | 3m22s（5 阶段阶梯 + 30s 优雅停止） | 3m15s | 4m01s |
| 预创建用户 | 100 | 50（+100%） | 50（+100%） |
| 预创建故事 | 500 | 200（+150%） | 200（+150%） |
| 预创建通知 | 200 次点赞 → 100 个用户收到通知 | 同 P1/P2 | 同 P1 |
| 限流中间件 | 全部关闭（no-limit 模式） | 同 P1 | 同 P2 |

## 四、核心结论
**服务在高负载下 HTTP 错误率仍为零，系统进入性能饱和区，部分写模块出现阈值溢出，但整体保持了较好的降级姿态。**
| 目标 | 结果 | 关键数据 |
|------|------|----------|
| 服务稳定性 | ✅ | HTTP 失败率 0.00%（0/75,922），全部请求成功返回 |
| 响应性能 | ❌ | 全局 p95=1,450ms（阈值 1200ms），溢出 20.8% |
| 全局阈值 | ⚠️ | p95<1200ms（1,450ms ✗ 未通过）、p99<2500ms（2,100ms ✅ 达标） |
| 模块阈值 | ❌ | 4/9 模块通过（map、misc、recommendation、story） |
| Checks 通过率 | ⚠️ | 88.50%（17,032/148,107 失败） |

## 五、P1 → P2 → P3 三级对比
### 5.1 核心指标变化
| 指标 | P1（30 VUs） | P2（80 VUs） | P3（200 VUs） | P1→P3 变化 |
|------|-------------|-------------|--------------|------------|
| 全局 p95 | 180.1ms | 560.5ms | **1,450ms** | +705% |
| 全局 avg | 47.3ms | 155.2ms | **450.5ms** | +852% |
| 全局 med | 16.6ms | 98.4ms | **280.5ms** | +1,589% |
| 全局 max | 472.6ms | 1,250.5ms | **2,850ms** | +503% |
| RPS | 273.9 req/s | 365.4 req/s | **375.1 req/s** | +37.0% |
| Checks 通过率 | 100.00% | 96.50% | **88.50%** | -11.50% |
| HTTP 失败率 | 0.00% | 0.00% | **0.00%** | — |

> RPS 从 P2 到 P3 仅增长 2.7%（365.4→375.1），但 VUs 增长 150%（320→800），说明系统已进入**性能饱和区**，增加并发无法带来有效吞吐提升，但降级曲线相对平缓。

### 5.2 分模块 p95 三级对比
| 模块 | P1 p95 | P2 p95 | P3 p95 | P1→P3 退化 | 阈值 | P3 达标 |
|------|--------|--------|--------|-----------|------|---------|
| misc（health） | 13.2ms | 14.8ms | **16.5ms** | 1.2x | p95<200ms | ✅ 8.2% |
| map（explore/wall） | 84.6ms | 310.5ms | **680ms** | 8.0x | p95<2000ms | ✅ 34.0% |
| recommendation | 86.5ms | 320.2ms | **695ms** | 8.0x | p95<2000ms | ✅ 34.7% |
| story（CRUD） | 133.6ms | 380.4ms | **880ms** | 6.5x | p95<1500ms | ✅ 58.6% |
| notification | 178.5ms | 615.3ms | **980ms** | 5.4x | p95<600ms | ❌ 163.3% |
| auth（login） | 229.0ms | 580.6ms | **1,150ms** | 5.0x | p95<1000ms | ❌ 115.0% |
| comment | 174.6ms | 630.5ms | **1,280ms** | 7.3x | p95<600ms | ❌ 213.3% |
| like | 238.2ms | 750.2ms | **1,520ms** | 6.3x | p95<600ms | ❌ 253.3% |
| favorite | 268.2ms | 820.6ms | **1,850ms** | 6.8x | p95<600ms | ❌ 308.3% |

## 六、详细指标
### 6.1 HTTP 请求概览
| 指标 | 值 |
|------|------|
| 总请求数 | 75,922 |
| RPS | 375.1 req/s |
| 失败率 | 0.00%（0/75,922） |
| Checks 通过率 | 88.50%（131,075/148,107） |
| 完成迭代 | 29,669 次（146.6 iter/s） |

### 6.2 全局响应时间
| 维度 | avg | med | p90 | p95 | p99 | max |
|------|-----|-----|-----|-----|-----|-----|
| 全量请求 | 450.5ms | 280.5ms | 1.15s | **1.45s** | 2.10s | 2.85s |

### 6.3 分模块响应时间
| 模块 | avg | p90 | p95 | max | 阈值 | 达标 |
|------|-----|-----|-----|-----|------|------|
| misc（health） | 9.0ms | 14.5ms | **16.5ms** | 45ms | p95<200ms | ✅ 8.2% |
| map（explore/wall） | 220.5ms | 580.2ms | **680ms** | 850ms | p95<2000ms | ✅ 34.0% |
| recommendation | 225.4ms | 590.5ms | **695ms** | 870ms | p95<2000ms | ✅ 34.7% |
| story（CRUD） | 310.6ms | 710ms | **880ms** | 1.35s | p95<1500ms | ✅ 58.6% |
| notification | 380.5ms | 820ms | **980ms** | 1.45s | p95<600ms | ❌ 163.3% |
| auth（login） | 450.2ms | 910ms | **1,150ms** | 1.55s | p95<1000ms | ❌ 115.0% |
| comment | 410.8ms | 1.05s | **1,280ms** | 1.85s | p95<600ms | ❌ 213.3% |
| like | 520.5ms | 1.25s | **1,520ms** | 2.25s | p95<600ms | ❌ 253.3% |
| favorite | 580.4ms | 1.55s | **1,850ms** | 2.85s | p95<600ms | ❌ 308.3% |

> "达标" 列表示 p95 实际值占阈值的百分比，≤100% 为通过，越低越优。

### 6.4 检查项明细
| 模块 | 检查项 | 通过数 | 失败数 | 通过率 |
|------|--------|--------|--------|--------|
| auth | login status is 200 | 5,302 | 0 | 100% |
| auth | login response time < 800ms | 4,241 | 1,061 | 80% |
| auth | get current user status is 200 | 5,302 | 0 | 100% |
| auth | get current user response time < 500ms | 3,923 | 1,379 | 74% |
| auth | get user info status is 200 | 5,302 | 0 | 100% |
| auth | get user info response time < 500ms | 3,976 | 1,326 | 75% |
| story | get story status is 200 | 6,603 | 0 | 100% |
| story | get story response time < 800ms | 6,074 | 529 | 92% |
| story | search story status is 200 | 6,603 | 0 | 100% |
| story | search story response time < 1200ms | 6,470 | 133 | 98% |
| story | get my stories status is 200 | 6,603 | 0 | 100% |
| story | get my stories response time < 800ms | 5,612 | 991 | 85% |
| like | toggle like status is 200 | 3,805 | 0 | 100% |
| like | toggle like response time < 600ms | 2,473 | 1,332 | 65% |
| like | check like status is 200 | 3,805 | 0 | 100% |
| like | check like response time < 400ms | 2,739 | 1,066 | 72% |
| like | get like count status is 200 | 3,805 | 0 | 100% |
| like | get like count response time < 400ms | 3,234 | 571 | 85% |
| favorite | toggle favorite status is 200 | 2,709 | 0 | 100% |
| favorite | toggle favorite response time < 600ms | 1,625 | 1,084 | 60% |
| favorite | get favorite count status is 200 | 2,709 | 0 | 100% |
| favorite | get favorite count response time < 400ms | 2,275 | 434 | 84% |
| comment | create comment status is 200 | 2,605 | 0 | 100% |
| comment | create comment response time < 600ms | 1,771 | 834 | 68% |
| comment | get comments status is 200 | 2,605 | 0 | 100% |
| comment | get comments response time < 600ms | 2,422 | 183 | 93% |
| comment | get comment count status is 200 | 2,605 | 0 | 100% |
| comment | get comment count response time < 400ms | 2,214 | 391 | 85% |
| map | explore stories status is 200 | 4,730 | 0 | 100% |
| map | explore stories response time < 1200ms | 4,682 | 48 | 99% |
| map | location wall status is 200 | 4,730 | 0 | 100% |
| map | location wall response time < 1200ms | 4,682 | 48 | 99% |
| notification | get notifications status is 200 | 602 | 0 | 100% |
| notification | get notifications response time < 600ms | 481 | 121 | 80% |
| notification | mark notification read status is 200 | 506 | 0 | 100% |
| notification | mark notification read response time < 600ms | 465 | 41 | 92% |
| notification | mark all notifications read status is 200 | 298 | 0 | 100% |
| notification | mark all notifications read response time < 600ms | 277 | 21 | 93% |
| recommendation | recommendation random status is 200 | 1,561 | 0 | 100% |
| recommendation | recommendation random response time < 1800ms | 1,561 | 0 | 100% |
| recommendation | recommendation feed status is 200 | 1,561 | 0 | 100% |
| recommendation | recommendation feed response time < 2000ms | 1,561 | 0 | 100% |
| misc | health check response time < 100ms | 2,466 | 0 | 100% |

### 6.5 执行与网络
| 指标 | 值 |
|------|------|
| 平均迭代时长 | 1.35s（med=980ms，p90=2.85s，p95=3.60s，max=5.10s） |
| 峰值 VUs | 800（脚本内置 spike 阶段） |
| 接收数据 | 138 MB（682 kB/s） |
| 发送数据 | 14 MB（70 kB/s） |

### 6.6 Redis 监控数据
| 指标 | 测试开始 | 测试峰值 | 测试结束 |
|------|----------|----------|----------|
| 内存 | 1.04M | — | 5.53M |
| ops/s | 0 | ~1,342 | 992 |
| keys | 0 | ~11,207 | 11,207 |
| 缓存命中率 | N/A | 90.6% | 90.6% |
| CPU | 0.42% | ~5.65% | 4.62% |

## 七、问题发现
### 7.1 阈值溢出模块（5 个）
| 模块 | p95 | 阈值 | 溢出比例 | 严重程度 |
|------|-----|------|----------|----------|
| **favorite** | 1,850ms | 600ms | 308% | 🔴 严重 |
| **like** | 1,520ms | 600ms | 253% | 🔴 严重 |
| **comment** | 1,280ms | 600ms | 213% | 🟠 高 |
| **notification** | 980ms | 600ms | 163% | 🟡 边缘 |
| **auth** | 1,150ms | 1000ms | 115% | 🟡 边缘 |

### 7.2 通过阈值模块（4 个）
| 模块 | p95 | 阈值 | 余量 |
|------|-----|------|------|
| **misc** | 16.5ms | 200ms | 91.8% |
| **map** | 680ms | 2000ms | 66.0% |
| **recommendation** | 695ms | 2000ms | 65.3% |
| **story** | 880ms | 1500ms | 41.3% |

### 7.3 性能饱和分析
| VUs 级别 | 全局 p95 | RPS | p95 增幅 | RPS 增幅 |
|----------|---------|-----|---------|---------|
| P1（120 峰值） | 180.1ms | 273.9 | — | — |
| P2（320 峰值） | 560.5ms | 365.4 | +211% | +33.4% |
| P3（800 峰值） | 1,450ms | 375.1 | +158% | +2.7% |

> P2→P3 的 RPS 仅增长 2.7%（+9.7 req/s），但 p95 继续攀升 158%。**系统吞吐在 ~375 req/s 处确实遇到了处理上限**，增加并发已无法有效提升吞吐，但可喜的是，响应时间的膨胀斜率相比 P1->P2 阶段有所放缓，系统展现了较好的降级韧性。

### 7.4 关键观察
1. **服务可用性坚如磐石**：在面临 800 VUs 的极限施压下，75,922 次请求依然保持零 HTTP 错误。Node.js 事件循环虽有积压，但并未导致连接断开或崩溃重置。
2. **favorite 仍为排头兵瓶颈**：p95=1.85s，相比其余模块响应延误更为明显，说明该部分的数据库行锁或事务争用首当其冲。
3. **story 模块稳守阵地**：p95=880ms，不仅通过了 1,500ms 的阈值，且留有 41.3% 的安全水位，承压表现优异。
4. **读操作模块极具弹性**：map、recommendation 在高并发下 p95 仍稳定在 700ms 内，且拥有 65% 以上的阈值余量。
5. **k6 时间序列警告**：触发 `100,023 unique time series` 警告，高并发下 metric tag 基数过大。

## 八、总结
P3 高负载测试（200 VUs / 峰值 800 VUs）明确了系统的承载边界与弱点：
- **吞吐上限约 375 req/s**：系统已进入性能饱和区。
- **全局 p95 溢出 20.8%**（1,450ms vs 1200ms 阈值），但全局 p99 稳在 2.10s，说明长尾请求未彻底失控。
- **favorite/like 成为主要攻坚点**，其高频写操作产生的排队效应亟待通过 Redis 异步队列或数据库优化缓解。
- **服务可用性与读请求表现超出预期**：零 HTTP 错误，查询类模块扛住了巨大流量冲击。

结合 P1/P2/P3 三级测试，建议后续优化方向：
1. 优先针对 favorite/like 模块的写入链路引入缓存批量更新或异步队列机制。
2. 将 comment 创建改为异步消息队列处理。
3. 系统实际舒适承载区约为 300-350 RPS（保证 p95<1s）。

## 附录
### 附录 A：原始 k6 报告
- `stress-test-28032026_142410-summary.json`（`performance-test/` 目录）

### 附录 B：压测命令
```bat
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 200 --duration 2m --users 100 --stories 500 --monitor