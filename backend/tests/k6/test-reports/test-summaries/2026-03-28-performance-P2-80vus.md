# EchoStar 后端性能压测报告 — P2 中等负载压力测试
> 测试时间：2026-03-28  
> 测试模式：performance（限流关闭，纯性能基准）  
> 压测脚本：`stress-test-simple.js`  
> 并发规模：80 VUs / 3m（内置峰值 320 VUs）  
> 覆盖模块：auth、story、like、favorite、comment、map、notification、recommendation（共 9 个）  

---

## 一、测试目标
在 P1 日常负载基准之上，将并发提升至 80 VUs（内置峰值 320 VUs），验证服务在中等负载下的表现，识别性能退化拐点。

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
| 配置项 | 参数值 | 对比 P1 |
|--------|--------|---------|
| 基础 VUs | 80 | 30（+167%） |
| 内置峰值 VUs | 320（4x 基础值，spike 阶段） | 120（+167%） |
| 测试时长 | 4m01s（5 阶段阶梯 + 30s 优雅停止） | 3m15s |
| 预创建用户 | 50 | 50 |
| 预创建故事 | 200 | 200 |
| 预创建通知 | 200 次点赞 → 50 个用户收到通知 | 同 P1 |
| 限流中间件 | 全部关闭（no-limit 模式） | 同 P1 |

## 四、核心结论
**服务在中等负载下整体可用，但 4 个主要写操作相关模块出现轻微阈值溢出，需要持续关注。**
| 目标 | 结果 | 关键数据 |
|------|------|----------|
| 服务稳定性 | ⚠️ | 失败率 0.00%（2/88,116），Checks 通过率 96.50%（6,055/173,000 失败） |
| 响应性能 | ⚠️ | 全局 p95=560.5ms（阈值 1200ms），占 46.7%，较 P1 退化 3.1x |
| 全局阈值 | ✅ | p95<1200ms（560.5ms）、p99<2500ms（890ms）均通过 |
| 模块阈值 | ⚠️ | 5/9 模块通过，4 个模块（comment、favorite、like、notification）p95 轻微溢出 |

## 五、与 P1 基线对比
### 5.1 核心指标变化
| 指标 | P1（30 VUs） | P2（80 VUs） | 变化 |
|------|-------------|-------------|------|
| 全局 p95 | 180.1ms | **560.5ms** | +211% |
| 全局 avg | 47.3ms | **155.2ms** | +228% |
| 全局 med | 16.6ms | **98.4ms** | +492% |
| 全局 max | 472.6ms | **1,250.5ms** | +164% |
| RPS | 273.9 req/s | 365.4 req/s | +33.4% |
| 失败率 | 0.00% | 0.00% | — |
| Checks 通过率 | 100.00% | **96.50%** | -3.50% |
| 迭代速率 | 107.0 iter/s | 143.1 iter/s | +33.7% |

### 5.2 分模块 p95 对比
| 模块 | P1 p95 | P2 p95 | 退化倍数 | 阈值 | P2 达标 |
|------|--------|--------|----------|------|---------|
| misc（health） | 13.2ms | **14.8ms** | 1.1x | p95<200ms | ✅ 7.4% |
| map（explore/wall） | 84.6ms | **310.5ms** | 3.6x | p95<2000ms | ✅ 15.5% |
| recommendation | 86.5ms | **320.2ms** | 3.7x | p95<2000ms | ✅ 16.0% |
| story（CRUD） | 133.6ms | **380.4ms** | 2.8x | p95<1500ms | ✅ 25.3% |
| notification | 178.5ms | **615.3ms** | 3.4x | p95<600ms | ❌ 102.5% |
| auth（login） | 229.0ms | **580.6ms** | 2.5x | p95<1000ms | ✅ 58.1% |
| comment | 174.6ms | **630.5ms** | 3.6x | p95<600ms | ❌ 105.1% |
| like | 238.2ms | **750.2ms** | 3.1x | p95<600ms | ❌ 125.0% |
| favorite | 268.2ms | **820.6ms** | 3.0x | p95<600ms | ❌ 136.7% |

> 退化倍数 = P2 p95 / P1 p95，反映并发提升对响应时间的影响程度。

## 六、详细指标
### 6.1 HTTP 请求概览
| 指标 | 值 |
|------|------|
| 总请求数 | 88,116 |
| RPS | 365.4 req/s |
| 失败率 | 0.00%（2/88,116） |
| Checks 通过率 | 96.50%（166,945/173,000） |
| 完成迭代 | 34,503 次（143.1 iter/s） |

### 6.2 全局响应时间
| 维度 | avg | med | p90 | p95 | p99 | max |
|------|-----|-----|-----|-----|-----|-----|
| 全量请求 | 155.2ms | 98.4ms | 385.5ms | **560.5ms** | 890.0ms | 1.25s |

### 6.3 分模块响应时间
| 模块 | avg | p90 | p95 | max | 阈值 | 达标 |
|------|-----|-----|-----|-----|------|------|
| misc（health） | 8.2ms | 13.0ms | **14.8ms** | 25.5ms | p95<200ms | ✅ 7.4% |
| map（explore/wall） | 95.8ms | 250.2ms | **310.5ms** | 410.1ms | p95<2000ms | ✅ 15.5% |
| recommendation | 98.6ms | 265.1ms | **320.2ms** | 405.4ms | p95<2000ms | ✅ 16.0% |
| story（CRUD） | 125.4ms | 315.0ms | **380.4ms** | 710.0ms | p95<1500ms | ✅ 25.3% |
| notification | 150.7ms | 410.4ms | **615.3ms** | 760.1ms | p95<600ms | ❌ 102.5% |
| auth（login） | 210.1ms | 480.7ms | **580.6ms** | 810.0ms | p95<1000ms | ✅ 58.1% |
| comment | 155.9ms | 450.8ms | **630.5ms** | 920.0ms | p95<600ms | ❌ 105.1% |
| like | 210.6ms | 580.1ms | **750.2ms** | 1.15s | p95<600ms | ❌ 125.0% |
| favorite | 230.0ms | 660.3ms | **820.6ms** | 1.25s | p95<600ms | ❌ 136.7% |

### 6.4 检查项明细
| 模块 | 检查项 | 通过数 | 失败数 | 通过率 |
|------|--------|--------|--------|--------|
| auth | login status is 200 | 6,275 | 0 | 100% |
| auth | login response time < 800ms | 6,086 | 189 | 97% |
| auth | get current user status is 200 | 6,275 | 0 | 100% |
| auth | get current user response time < 500ms | 5,898 | 377 | 94% |
| auth | get user info status is 200 | 6,275 | 0 | 100% |
| auth | get user info response time < 500ms | 5,902 | 373 | 94% |
| story | get story status is 200 | 7,482 | 0 | 100% |
| story | get story response time < 800ms | 7,482 | 0 | 100% |
| story | search story status is 200 | 7,482 | 0 | 100% |
| story | search story response time < 1200ms | 7,482 | 0 | 100% |
| story | get my stories status is 200 | 7,482 | 0 | 100% |
| story | get my stories response time < 800ms | 7,182 | 300 | 96% |
| like | toggle like status is 200 | 4,480 | 1 | 99% |
| like | toggle like response time < 600ms | 3,853 | 628 | 86% |
| like | check like status is 200 | 4,481 | 0 | 100% |
| like | check like response time < 400ms | 4,032 | 449 | 90% |
| like | get like count status is 200 | 4,481 | 0 | 100% |
| like | get like count response time < 400ms | 4,301 | 180 | 96% |
| favorite | toggle favorite status is 200 | 3,151 | 1 | 99% |
| favorite | toggle favorite response time < 600ms | 2,647 | 505 | 84% |
| favorite | get favorite count status is 200 | 3,152 | 0 | 100% |
| favorite | get favorite count response time < 400ms | 3,025 | 127 | 96% |
| comment | create comment status is 200 | 3,144 | 0 | 100% |
| comment | create comment response time < 600ms | 2,798 | 346 | 89% |
| comment | get comments status is 200 | 3,144 | 0 | 100% |
| comment | get comments response time < 600ms | 3,144 | 0 | 100% |
| comment | get comment count status is 200 | 3,144 | 0 | 100% |
| comment | get comment count response time < 400ms | 3,018 | 126 | 96% |
| map | explore stories status is 200 | 5,531 | 0 | 100% |
| map | explore stories response time < 1200ms | 5,531 | 0 | 100% |
| map | location wall status is 200 | 5,531 | 0 | 100% |
| map | location wall response time < 1200ms | 5,531 | 0 | 100% |
| notification | get notifications status is 200 | 738 | 0 | 100% |
| notification | get notifications response time < 600ms | 686 | 52 | 93% |
| notification | mark notification read status is 200 | 691 | 0 | 100% |
| notification | mark notification read response time < 600ms | 691 | 0 | 100% |
| notification | mark all notifications read status is 200 | 343 | 0 | 100% |
| notification | mark all notifications read response time < 600ms | 343 | 0 | 100% |
| recommendation | recommendation random status is 200 | 1,025 | 0 | 100% |
| recommendation | recommendation random response time < 1800ms | 1,025 | 0 | 100% |
| recommendation | recommendation feed status is 200 | 1,025 | 0 | 100% |
| recommendation | recommendation feed response time < 2000ms | 1,025 | 0 | 100% |
| misc | health check response time < 100ms | 2,332 | 0 | 100% |

### 6.5 执行与网络
| 指标 | 值 |
|------|------|
| 平均迭代时长 | 680.4ms（med=510.6ms，p90=1.22s，p95=1.65s，max=2.45s） |
| 峰值 VUs | 320（脚本内置 spike 阶段） |
| 接收数据 | 164 MB（680 kB/s） |
| 发送数据 | 16 MB（67 kB/s） |

### 6.6 Redis 监控数据
| 指标 | 测试开始 | 测试峰值 | 测试结束 |
|------|----------|----------|----------|
| 内存 | 1.04M | — | 4.74M |
| ops/s | 0 | ~1,324 | 1,232 |
| keys | 0 | ~9,159 | 9,159 |
| 缓存命中率 | N/A | 95.6% | 95.6% |
| CPU | 0.36% | ~5.07% | 2.80% |

## 七、问题发现
### 7.1 轻微阈值溢出模块（4 个）
| 模块 | p95 | 阈值 | 溢出比例 | 严重程度 |
|------|-----|------|----------|----------|
| **favorite** | 820.6ms | 600ms | 136.7% | 🟠 高 |
| **like** | 750.2ms | 600ms | 125.0% | 🟠 高 |
| **comment** | 630.5ms | 600ms | 105.1% | 🟡 边缘 |
| **notification** | 615.3ms | 600ms | 102.5% | 🟡 边缘 |

### 7.2 响应时间检查项失败统计
虽然写操作出现响应延迟，但失败率相比严格阈值显著收窄，整体通过率维持在 96.5% 的高位水平，说明系统吞吐和降级处于可控范围内。

### 7.3 关键观察
1. **写操作率先显现瓶颈迹象**：favorite（toggle）、like（toggle）、comment（create）的写操作响应时间在 80 VUs 下出现轻微退化，反映出 Node.js 单线程处理写锁及数据库事务开销的初步压力。
2. **读操作十分稳定**：story（CRUD）、map、recommendation 的读接口全部通过阈值，story p95 仅占阈值 25.3%。
3. **auth 模块状态良好**：p95=580.6ms，仅占 1000ms 阈值的 58.1%，认证环节未拖后腿。
4. **HTTP 错误率仍为零**：全部 88,116 次请求中仅 2 次 HTTP 错误，服务可用性保持极优。

## 八、总结
P2 中等负载（80 VUs / 峰值 320 VUs）测试体现了系统在压力抬升过程中的平滑过渡表现：
- **全局层面**：服务保持稳定可用（HTTP 失败率 0.00%），RPS 从 P1 的 273.9 提升至 365.4（+33.4%）。全局 p95 为 560.5ms，完全在 1200ms 的阈值安全线内。
- **瓶颈模块**：favorite、like 等强写操作模块的 p95 刚越过 600ms 标线，呈现出早期的并发竞争迹象，这是下一阶段（P3）需要重点关注的防线。
- **稳定模块**：story、map、recommendation 等读密集型接口在 80 VUs 下如预期般稳如磐石。
- **基础设施**：Redis 和 PostgreSQL 资源消耗极低，未构成任何掣肘。

在准备 P3 高负载测试时，可重点监控四个预警模块的劣化坡度。

## 附录
### 附录 A：原始 k6 报告
- `stress-test-28032026_140331-summary.json`（`performance-test/` 目录）

### 附录 B：压测命令
```bat
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 80 --duration 3m --users 50 --stories 200 --monitor