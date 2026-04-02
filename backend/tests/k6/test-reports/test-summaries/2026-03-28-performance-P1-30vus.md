# EchoStar 后端性能压测报告 — P1 日常负载基准
> 测试时间：2026-03-28  
> 测试模式：performance（限流关闭，纯性能基准）  
> 压测脚本：`stress-test-simple.js`  
> 并发规模：30 VUs / 2m（内置峰值 120 VUs）  
> 覆盖模块：auth、story、like、favorite、comment、map、notification、recommendation（共 9 个）  
---

## 一、测试目标
建立低负载下的性能基线，覆盖全部核心后端模块，用于后续高负载测试（P2-P3）和限流测试（R1-R3）的退化对比。

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
| 配置项 | 参数值 |
|--------|--------|
| 基础 VUs | 30 |
| 内置峰值 VUs | 120（4x 基础值，spike 阶段） |
| 测试时长 | 3m15s（5 阶段阶梯 + 30s 优雅停止） |
| 预创建用户 | 50 |
| 预创建故事 | 200 |
| 预创建通知 | 200 次点赞 → 50 个用户收到通知 |
| 限流中间件 | 全部关闭（no-limit 模式） |

## 四、核心结论
**全部阈值通过，零失败，9 个模块全覆盖，性能基线优秀。**
| 目标 | 结果 | 关键数据 |
|------|------|----------|
| 服务稳定性 | ✅ | 失败率 0.00%，104,453 次检查全部通过 |
| 响应性能 | ✅ | 全局 p95=180.1ms（阈值 1200ms），仅用 15.0% |
| 各模块达标 | ✅ | 全部 9 个模块分组阈值均通过 |
| 模块覆盖 | ✅ | 新增 notification（3%）+ recommendation（3%） |

## 五、详细指标
### 5.1 HTTP 请求概览
| 指标 | 值 |
|------|------|
| 总请求数 | 53,435 |
| RPS | 273.9 req/s |
| 失败率 | 0.00%（0/53,435） |
| Checks 通过率 | 100.00%（104,453/104,453） |
| 完成迭代 | 20,869 次（107.0 iter/s） |

### 5.2 全局响应时间
| 维度 | avg | med | p90 | p95 | p99 | max |
|------|-----|-----|-----|-----|-----|-----|
| 全量请求 | 47.3ms | 16.6ms | 128.6ms | **180.1ms** | 282.9ms | 472.6ms |

### 5.3 分模块响应时间
| 模块 | avg | p90 | p95 | max | 阈值 | 达标 |
|------|-----|-----|-----|-----|------|------|
| misc（health） | 5.3ms | 11.5ms | **13.2ms** | 49.0ms | p95<200ms | ✅ 6.6% |
| map（explore/wall） | 25.1ms | 73.6ms | **84.6ms** | 152.7ms | p95<2000ms | ✅ 4.2% |
| recommendation | 28.2ms | 77.0ms | **86.5ms** | 155.2ms | p95<2000ms | ✅ 4.3% |
| story（CRUD） | 38.4ms | 100.9ms | **133.6ms** | 278.6ms | p95<1500ms | ✅ 8.9% |
| comment | 39.3ms | 97.4ms | **174.6ms** | 379.5ms | p95<600ms | ✅ 29.1% |
| like | 53.5ms | 160.0ms | **238.2ms** | 471.7ms | p95<600ms | ✅ 39.7% |
| notification | 53.3ms | 134.8ms | **178.5ms** | 304.5ms | p95<600ms | ✅ 29.8% |
| favorite | 55.5ms | 188.3ms | **268.2ms** | 472.6ms | p95<600ms | ✅ 44.7% |
| auth（login） | 76.2ms | 179.9ms | **229.0ms** | 407.3ms | p95<1000ms | ✅ 22.9% |

> "达标" 列表示 p95 实际值占阈值的百分比，越低越优。

### 5.4 检查项明细
| 模块 | 检查项 | 通过数 | 失败数 | 通过率 |
|------|--------|--------|--------|--------|
| auth | login status is 200 | 3,768 | 0 | 100% |
| auth | login response time < 800ms | 3,768 | 0 | 100% |
| auth | get current user status is 200 | 3,768 | 0 | 100% |
| auth | get current user response time < 500ms | 3,768 | 0 | 100% |
| auth | get user info status is 200 | 3,768 | 0 | 100% |
| auth | get user info response time < 500ms | 3,768 | 0 | 100% |
| story | get story status is 200 | 4,563 | 0 | 100% |
| story | get story response time < 800ms | 4,563 | 0 | 100% |
| story | search story status is 200 | 4,563 | 0 | 100% |
| story | search story response time < 1200ms | 4,563 | 0 | 100% |
| story | get my stories status is 200 | 4,563 | 0 | 100% |
| story | get my stories response time < 800ms | 4,563 | 0 | 100% |
| like | toggle like status is 200 | 2,728 | 0 | 100% |
| like | toggle like response time < 600ms | 2,728 | 0 | 100% |
| like | check like status is 200 | 2,728 | 0 | 100% |
| like | check like response time < 400ms | 2,728 | 0 | 100% |
| like | get like count status is 200 | 2,728 | 0 | 100% |
| like | get like count response time < 400ms | 2,728 | 0 | 100% |
| favorite | toggle favorite status is 200 | 1,857 | 0 | 100% |
| favorite | toggle favorite response time < 600ms | 1,857 | 0 | 100% |
| favorite | get favorite count status is 200 | 1,857 | 0 | 100% |
| favorite | get favorite count response time < 400ms | 1,857 | 0 | 100% |
| comment | create comment status is 200 | 1,946 | 0 | 100% |
| comment | create comment response time < 600ms | 1,946 | 0 | 100% |
| comment | get comments status is 200 | 1,946 | 0 | 100% |
| comment | get comments response time < 600ms | 1,946 | 0 | 100% |
| comment | get comment count status is 200 | 1,946 | 0 | 100% |
| comment | get comment count response time < 400ms | 1,946 | 0 | 100% |
| map | explore stories status is 200 | 3,293 | 0 | 100% |
| map | explore stories response time < 1200ms | 3,293 | 0 | 100% |
| map | location wall status is 200 | 3,293 | 0 | 100% |
| map | location wall response time < 1200ms | 3,293 | 0 | 100% |
| notification | get notifications status is 200 | 417 | 0 | 100% |
| notification | get notifications response time < 600ms | 417 | 0 | 100% |
| notification | mark notification read status is 200 | 369 | 0 | 100% |
| notification | mark notification read response time < 600ms | 369 | 0 | 100% |
| notification | mark all notifications read status is 200 | 193 | 0 | 100% |
| notification | mark all notifications read response time < 600ms | 193 | 0 | 100% |
| recommendation | recommendation random status is 200 | 587 | 0 | 100% |
| recommendation | recommendation random response time < 1800ms | 587 | 0 | 100% |
| recommendation | recommendation feed status is 200 | 587 | 0 | 100% |
| recommendation | recommendation feed response time < 2000ms | 587 | 0 | 100% |
| misc | health check response time < 100ms | 1,517 | 0 | 100% |

### 5.5 执行与网络
| 指标 | 值 |
|------|------|
| 平均迭代时长 | 371.3ms（med=344.0ms，p90=615.9ms，p95=719.9ms，max=1.16s） |
| 峰值 VUs | 120（脚本内置 spike 阶段） |
| 接收数据 | 97 MB（495 kB/s） |
| 发送数据 | 9.9 MB（51 kB/s） |

### 5.6 Redis 监控数据
| 指标 | 测试开始 | 测试峰值 | 测试结束 |
|------|----------|----------|----------|
| 内存 | 1.04M | — | 4.21M |
| ops/s | 0 | ~1,304 | 135 |
| keys | 0 | ~7,408 | 7,408 |
| 缓存命中率 | N/A | 93.5% | 93.5% |
| CPU | 0.42% | ~5.98% | 0.74% |

## 六、新增模块说明
本次测试相比首次 P1 新增 2 个模块：
- **notification（通知）**：测试 GET /me（列表查询）、PUT /:id/mark-read（单条已读）、PUT /me/mark-read（全部已读）。通知数据通过 setup 阶段 200 次点赞操作自动产生（存入 Redis），覆盖 50 个用户。p95=178.5ms，仅占 600ms 阈值的 29.8%。
- **recommendation（推荐）**：测试 GET /map/random（随机漫步推荐）和 GET /map/feed（推荐信息流），使用随机 mood 参数和分页，仅测接口响应性能不验证推荐准确性。p95=86.5ms，仅占 2000ms 阈值的 4.3%。

## 七、未覆盖模块
| 模块 | 原因 |
|------|------|
| admin | 需要管理员权限，业务场景特殊 |
| report | 举报功能依赖复杂上下文，不适合自动化压测 |

## 八、问题发现
本次测试未发现问题。全部 37 个检查项 100% 通过，所有阈值均大幅低于设定值。

## 九、总结
P1 作为低负载性能基线，服务表现优秀：零失败、全局 p95 仅 180.1ms（距 1200ms 阈值有极大余量）、RPS 273.9。新增的 notification 和 recommendation 模块均表现优异（p95 分别为 178.5ms 和 86.5ms）。各模块中最慢的 favorite 模块 p95 也仅占阈值的 44.7%。Redis 承载通知读写后仍保持低负载（CPU 峰值 <6%）。该结果可作为后续 P2-P3 及 R1-R3 对比的基准参照。

## 附录
### 附录 A：原始 k6 报告
- `stress-test-28032026_30640-summary.json`（`performance-test/` 目录）

### 附录 B：压测命令
```bat
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 30 --duration 2m --users 50 --stories 200 --monitor