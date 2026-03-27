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
| 响应性能 | ✅ | 全局 p95=180.1ms（阈值 1000ms），仅用 18.0% |
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
| comment | 39.3ms | 97.4ms | **174.6ms** | 379.5ms | p95<500ms | ✅ 34.9% |
| like | 53.5ms | 160.0ms | **238.2ms** | 471.7ms | p95<500ms | ✅ 47.6% |
| notification | 53.3ms | 134.8ms | **178.5ms** | 304.5ms | p95<500ms | ✅ 35.7% |
| favorite | 55.5ms | 188.3ms | **268.2ms** | 472.6ms | p95<500ms | ✅ 53.6% |
| auth（login） | 76.2ms | 179.9ms | **229.0ms** | 407.3ms | p95<800ms | ✅ 28.6% |

> "达标" 列表示 p95 实际值占阈值的百分比，越低越优。

### 5.4 检查项明细

| 模块 | 检查项 | 通过数 | 失败数 | 通过率 |
|------|--------|--------|--------|--------|
| auth | login status is 200 | 3,768 | 0 | 100% |
| auth | login response time < 500ms | 3,768 | 0 | 100% |
| auth | get current user status is 200 | 3,768 | 0 | 100% |
| auth | get current user response time < 300ms | 3,768 | 0 | 100% |
| auth | get user info status is 200 | 3,768 | 0 | 100% |
| auth | get user info response time < 300ms | 3,768 | 0 | 100% |
| story | get story status is 200 | 4,563 | 0 | 100% |
| story | get story response time < 500ms | 4,563 | 0 | 100% |
| story | search story status is 200 | 4,563 | 0 | 100% |
| story | search story response time < 1000ms | 4,563 | 0 | 100% |
| story | get my stories status is 200 | 4,563 | 0 | 100% |
| story | get my stories response time < 500ms | 4,563 | 0 | 100% |
| like | toggle like status is 200 | 2,728 | 0 | 100% |
| like | toggle like response time < 500ms | 2,728 | 0 | 100% |
| like | check like status is 200 | 2,728 | 0 | 100% |
| like | check like response time < 300ms | 2,728 | 0 | 100% |
| like | get like count status is 200 | 2,728 | 0 | 100% |
| like | get like count response time < 300ms | 2,728 | 0 | 100% |
| favorite | toggle favorite status is 200 | 1,857 | 0 | 100% |
| favorite | toggle favorite response time < 500ms | 1,857 | 0 | 100% |
| favorite | get favorite count status is 200 | 1,857 | 0 | 100% |
| favorite | get favorite count response time < 300ms | 1,857 | 0 | 100% |
| comment | create comment status is 200 | 1,946 | 0 | 100% |
| comment | create comment response time < 500ms | 1,946 | 0 | 100% |
| comment | get comments status is 200 | 1,946 | 0 | 100% |
| comment | get comments response time < 500ms | 1,946 | 0 | 100% |
| comment | get comment count status is 200 | 1,946 | 0 | 100% |
| comment | get comment count response time < 300ms | 1,946 | 0 | 100% |
| map | explore stories status is 200 | 3,293 | 0 | 100% |
| map | explore stories response time < 1000ms | 3,293 | 0 | 100% |
| map | location wall status is 200 | 3,293 | 0 | 100% |
| map | location wall response time < 1000ms | 3,293 | 0 | 100% |
| notification | get notifications status is 200 | 417 | 0 | 100% |
| notification | get notifications response time < 500ms | 417 | 0 | 100% |
| notification | mark notification read status is 200 | 369 | 0 | 100% |
| notification | mark notification read response time < 500ms | 369 | 0 | 100% |
| notification | mark all notifications read status is 200 | 193 | 0 | 100% |
| notification | mark all notifications read response time < 500ms | 193 | 0 | 100% |
| recommendation | recommendation random status is 200 | 587 | 0 | 100% |
| recommendation | recommendation random response time < 1500ms | 587 | 0 | 100% |
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

> Redis 资源消耗极低（CPU 峰值 5.98%），缓存命中率在测试中段升至 93%+。通知数据存储在 Redis（200 条通知写入），验证了 Redis 作为通知存储层的并发读写性能。基础设施远未成为瓶颈。

## 六、新增模块说明

本次测试相比首次 P1 新增 2 个模块：

- **notification（通知）**：测试 GET /me（列表查询）、PUT /:id/mark-read（单条已读）、PUT /me/mark-read（全部已读）。通知数据通过 setup 阶段 200 次点赞操作自动产生（存入 Redis），覆盖 50 个用户。p95=178.5ms，仅占 500ms 阈值的 35.7%。
- **recommendation（推荐）**：测试 GET /map/random（随机漫步推荐）和 GET /map/feed（推荐信息流），使用随机 mood 参数和分页，仅测接口响应性能不验证推荐准确性。p95=86.5ms，仅占 2000ms 阈值的 4.3%。

## 七、未覆盖模块

| 模块 | 原因 |
|------|------|
| admin | 需要管理员权限，业务场景特殊 |
| report | 举报功能依赖复杂上下文，不适合自动化压测 |

## 八、问题发现

本次测试未发现问题。全部 37 个检查项 100% 通过，所有阈值均大幅低于设定值。

## 九、总结

P1 作为低负载性能基线，服务表现优秀：零失败、全局 p95 仅 180.1ms（距 1000ms 阈值有 5.6x 余量）、RPS 273.9。新增的 notification 和 recommendation 模块均表现优异（p95 分别为 178.5ms 和 86.5ms）。各模块中最慢的 favorite 模块 p95 也仅占阈值的 53.6%。Redis 承载通知读写后仍保持低负载（CPU 峰值 <6%）。该结果可作为后续 P2-P3 及 R1-R3 对比的基准参照。

## 附录

### 附录 A：原始 k6 报告

- `stress-test-28032026_30640-summary.json`（`performance-test/` 目录）

### 附录 B：压测命令

```bat
cd backend
tests\k6\test-scripts\run-test.bat --mode performance --reset --vus 30 --duration 2m --users 50 --stories 200 --monitor
```

### 附录 C：终端完整输出

```
========================================
   EchoStar Backend Stress Test
========================================

Working directory: C:\Users\20979\RP_Projects\ECHOSTAR\EchoStar\backend

k6 version: k6.exe v1.6.1 (commit/2ac2bb560e, go1.25.7, windows/amd64)


========================================
   Resetting test environment...
========================================

[INFO] Starting server WITHOUT rate limiting...
========================================
     清除数据并重启测试环境
========================================

[STEP 1] 停止并删除容器...
[INFO] 容器和卷已删除

[STEP 2] 启动容器...
[INFO] 容器已启动

[STEP 3] 等待数据库...
[INFO] 等待数据库就绪...
[INFO] 数据库已就绪

[STEP 4] 启动开发服务器...
[INFO] 已启用关限流测试模式（所有速率限制已禁用）
[INFO] 服务器已在后台启动

[STEP 5] 等待服务器就绪...
[INFO] 等待服务器就绪: http://localhost:3000
..[DEBUG] 健康检查响应: 200
[INFO] 服务器已就绪

[STEP 6] 等待数据库表同步...
[INFO] 数据库表同步等待完成

[STEP 7] 验证服务器健康状态...
[DEBUG] 健康检查响应: 200
[INFO] 服务器健康检查通过

========================================
     环境重启完成！
========================================


Environment reset completed.

========================================
  Test Configuration
========================================
  Mode:            performance
  Reset database:  1
  User count:      50
  Story count:     200
  Concurrent VUs:  30
  Duration:        2m
  Report dir:      tests\k6\test-reports\performance-test
  Test script:     stress-test-simple.js
========================================

Starting performance test...
Report will be saved to: tests\k6\test-reports\performance-test\stress-test-28032026_30640-summary.json

[MONITOR] Starting Redis/PG monitoring (5s interval)...
========================================
  EchoStar 压测监控
========================================
  Redis 容器:    echostar-redis
  PG 容器:       echostar-postgres
  采样间隔:      5s
  运行时长:      手动停止 (Ctrl+C)
  开始时间:      2026/3/28 03:06:54
========================================

[MONITOR] Running. Will auto-stop after k6 test completes.


IMPORTANT: Make sure backend server is running WITH rate limiting
  (Use: npm run dev

Running stress-test-simple.js...

         /\      Grafana   /‾‾/
    /\  /  \     |\  __   /  /
   /  \/    \    | |/ /  /   ‾‾\
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/


     execution: local
        script: C:\Users\20979\RP_Projects\ECHOSTAR\EchoStar\backend\tests\k6\test-scripts\stress-test-simple.js
        output: -

     scenarios: (100.00%) 1 scenario, 120 max VUs, 3m36s max duration (incl. graceful stop):
              * default: Up to 120 looping VUs for 3m6s over 5 stages (gracefulRampDown: 30s, gracefulStop: 30s)

INFO[0000] === Starting Data Preparation ===             source=console
INFO[0000] Creating 50 test users...                     source=console
INFO[0000] [Setup] Creating users: 0/50                  source=console
INFO[0001] [Setup] Creating users: 10/50                 source=console
INFO[0002] [Setup] Creating users: 20/50                 source=console
INFO[0002] [Setup] Creating users: 30/50                 source=console
[03:06:58] Redis: 1.04M | ops/s: 0 | keys: 0 | hit: N/A | CPU: 0.42% | Mem: 4.512MiB / 7.412GiB
INFO[0003] [Setup] Creating users: 40/50                 source=console
INFO[0004] [Setup] Created 50 users                      source=console
INFO[0004] Creating 200 test stories...                  source=console
INFO[0006] [Setup] Created 200 stories                   source=console
INFO[0006] [Setup] Creating likes to generate notification data (max 200)...  source=console
INFO[0008] [Setup] Created 200 likes, 50 users have notifications  source=console
[03:07:07] Redis: 1.30M | ops/s: 474 | keys: 367 | hit: 49.8% | CPU: 0.43% | Mem: 5.395MiB / 7.412GiB
[03:07:11] Redis: 1.36M | ops/s: 46 | keys: 512 | hit: 44.8% | CPU: 0.80% | Mem: 5.949MiB / 7.412GiB
[03:07:17] Redis: 1.42M | ops/s: 50 | keys: 556 | hit: 32.1% | CPU: 0.88% | Mem: 5.305MiB / 7.412GiB
[03:07:21] Redis: 1.52M | ops/s: 67 | keys: 608 | hit: 25.2% | CPU: 0.79% | Mem: 5.848MiB / 7.412GiB
[03:07:27] Redis: 1.57M | ops/s: 136 | keys: 664 | hit: 21.8% | CPU: 1.04% | Mem: 5.633MiB / 7.412GiB
[03:07:31] Redis: 1.62M | ops/s: 169 | keys: 732 | hit: 22.4% | CPU: 1.19% | Mem: 6.406MiB / 7.412GiB
[03:07:37] Redis: 1.65M | ops/s: 130 | keys: 817 | hit: 24.9% | CPU: 1.35% | Mem: 3.922MiB / 7.412GiB
[03:07:41] Redis: 1.69M | ops/s: 110 | keys: 907 | hit: 27.8% | CPU: 1.49% | Mem: 5.242MiB / 7.412GiB
[03:07:47] Redis: 1.75M | ops/s: 200 | keys: 1037 | hit: 33.1% | CPU: 1.94% | Mem: 5.359MiB / 7.412GiB
[03:07:51] Redis: 1.80M | ops/s: 206 | keys: 1171 | hit: 39.2% | CPU: 1.84% | Mem: 5.348MiB / 7.412GiB
[03:07:57] Redis: 1.86M | ops/s: 346 | keys: 1293 | hit: 47.4% | CPU: 2.05% | Mem: 5.18MiB / 7.412GiB
[03:08:01] Redis: 1.90M | ops/s: 301 | keys: 1418 | hit: 53.1% | CPU: 1.98% | Mem: 5.684MiB / 7.412GiB
[03:08:07] Redis: 1.96M | ops/s: 305 | keys: 1579 | hit: 57.3% | CPU: 2.29% | Mem: 5.359MiB / 7.412GiB
[03:08:11] Redis: 2.01M | ops/s: 373 | keys: 1727 | hit: 63.8% | CPU: 2.58% | Mem: 5.371MiB / 7.412GiB
[03:08:17] Redis: 2.07M | ops/s: 484 | keys: 1889 | hit: 69.2% | CPU: 3.65% | Mem: 5.715MiB / 7.412GiB
[03:08:21] Redis: 2.16M | ops/s: 530 | keys: 2074 | hit: 72.8% | CPU: 2.52% | Mem: 5.824MiB / 7.412GiB
[03:08:27] Redis: 2.21M | ops/s: 486 | keys: 2212 | hit: 75.5% | CPU: 2.68% | Mem: 5.879MiB / 7.412GiB
[03:08:31] Redis: 2.28M | ops/s: 545 | keys: 2402 | hit: 78.0% | CPU: 3.65% | Mem: 5.949MiB / 7.412GiB
[03:08:37] Redis: 2.36M | ops/s: 658 | keys: 2619 | hit: 80.4% | CPU: 3.92% | Mem: 5.82MiB / 7.412GiB
[03:08:41] Redis: 2.45M | ops/s: 873 | keys: 2868 | hit: 82.3% | CPU: 3.57% | Mem: 6.172MiB / 7.412GiB
[03:08:47] Redis: 2.54M | ops/s: 709 | keys: 3097 | hit: 83.8% | CPU: 4.14% | Mem: 6.57MiB / 7.412GiB
[03:08:51] Redis: 2.65M | ops/s: 718 | keys: 3344 | hit: 85.0% | CPU: 3.69% | Mem: 6.184MiB / 7.412GiB
[03:08:57] Redis: 2.74M | ops/s: 864 | keys: 3604 | hit: 86.2% | CPU: 4.11% | Mem: 6.559MiB / 7.412GiB
[03:09:01] Redis: 2.84M | ops/s: 992 | keys: 3892 | hit: 87.2% | CPU: 4.16% | Mem: 6.648MiB / 7.412GiB
[03:09:07] Redis: 2.96M | ops/s: 903 | keys: 4161 | hit: 88.1% | CPU: 4.08% | Mem: 7.352MiB / 7.412GiB
[03:09:11] Redis: 3.06M | ops/s: 1144 | keys: 4404 | hit: 89.0% | CPU: 3.60% | Mem: 6.688MiB / 7.412GiB
[03:09:17] Redis: 3.15M | ops/s: 1056 | keys: 4669 | hit: 89.7% | CPU: 5.98% | Mem: 6.793MiB / 7.412GiB
[03:09:21] Redis: 3.25M | ops/s: 1076 | keys: 4920 | hit: 90.2% | CPU: 4.78% | Mem: 7.383MiB / 7.412GiB
[03:09:27] Redis: 3.36M | ops/s: 1151 | keys: 5155 | hit: 90.9% | CPU: 4.57% | Mem: 7.543MiB / 7.412GiB
[03:09:31] Redis: 3.46M | ops/s: 1133 | keys: 5432 | hit: 91.4% | CPU: 4.87% | Mem: 7.113MiB / 7.412GiB
[03:09:37] Redis: 3.55M | ops/s: 1043 | keys: 5699 | hit: 91.8% | CPU: 4.56% | Mem: 7.246MiB / 7.412GiB
[03:09:41] Redis: 3.66M | ops/s: 1043 | keys: 5970 | hit: 92.2% | CPU: 4.74% | Mem: 7.348MiB / 7.412GiB
[03:09:47] Redis: 3.77M | ops/s: 865 | keys: 6299 | hit: 92.5% | CPU: 4.70% | Mem: 7.684MiB / 7.412GiB
[03:09:51] Redis: 3.87M | ops/s: 1065 | keys: 6606 | hit: 92.7% | CPU: 4.40% | Mem: 7.789MiB / 7.412GiB
[03:09:57] Redis: 3.98M | ops/s: 1304 | keys: 6901 | hit: 93.0% | CPU: 4.41% | Mem: 7.934MiB / 7.412GiB
[03:10:01] Redis: 4.12M | ops/s: 1068 | keys: 7154 | hit: 93.3% | CPU: 4.37% | Mem: 8.184MiB / 7.412GiB
[03:10:07] Redis: 4.19M | ops/s: 534 | keys: 7337 | hit: 93.4% | CPU: 2.49% | Mem: 8.125MiB / 7.412GiB
INFO[0195]
=== Test Completed ===                       source=console
INFO[0195] Created users: 50                             source=console
INFO[0195] Created stories: 200                          source=console
INFO[0195] Users with notifications: 50                  source=console


  █ THRESHOLDS

    http_req_duration
    ✓ 'p(95)<1000' p(95)=180.09ms
    ✓ 'p(99)<2000' p(99)=282.85ms

      {group:::auth}
      ✓ 'p(95)<800' p(95)=228.95ms

      {group:::comment}
      ✓ 'p(95)<500' p(95)=174.63ms

      {group:::favorite}
      ✓ 'p(95)<500' p(95)=268.23ms

      {group:::like}
      ✓ 'p(95)<500' p(95)=238.23ms

      {group:::map}
      ✓ 'p(95)<2000' p(95)=84.63ms

      {group:::misc}
      ✓ 'p(95)<200' p(95)=13.19ms

      {group:::notification}
      ✓ 'p(95)<500' p(95)=178.5ms

      {group:::recommendation}
      ✓ 'p(95)<2000' p(95)=86.54ms

      {group:::story}
      ✓ 'p(95)<1500' p(95)=133.64ms

    http_req_failed
    ✓ 'rate<0.05' rate=0.00%


  █ TOTAL RESULTS

    checks_total.......: 104453  535.432981/s
    checks_succeeded...: 100.00% 104453 out of 104453
    checks_failed......: 0.00%   0 out of 104453

    ✓ create comment status is 200
    ✓ create comment response time < 500ms
    ✓ get comments status is 200
    ✓ get comments response time < 500ms
    ✓ get comment count status is 200
    ✓ get comment count response time < 300ms
    ✓ explore stories status is 200
    ✓ explore stories response time < 1000ms
    ✓ location wall status is 200
    ✓ location wall response time < 1000ms
    ✓ login status is 200
    ✓ login response time < 500ms
    ✓ get current user status is 200
    ✓ get current user response time < 300ms
    ✓ get user info status is 200
    ✓ get user info response time < 300ms
    ✓ toggle favorite status is 200
    ✓ toggle favorite response time < 500ms
    ✓ get favorite count status is 200
    ✓ get favorite count response time < 300ms
    ✓ toggle like status is 200
    ✓ toggle like response time < 500ms
    ✓ check like status is 200
    ✓ check like response time < 300ms
    ✓ get like count status is 200
    ✓ get like count response time < 300ms
    ✓ get story status is 200
    ✓ get story response time < 500ms
    ✓ search story status is 200
    ✓ search story response time < 1000ms
    ✓ get my stories status is 200
    ✓ get my stories response time < 500ms
    ✓ health check response time < 100ms
    ✓ get notifications status is 200
    ✓ get notifications response time < 500ms
    ✓ recommendation random status is 200
    ✓ recommendation random response time < 1500ms
    ✓ recommendation feed status is 200
    ✓ recommendation feed response time < 2000ms
    ✓ mark all notifications read status is 200
    ✓ mark all notifications read response time < 500ms
    ✓ mark notification read status is 200
    ✓ mark notification read response time < 500ms

    HTTP
    http_req_duration..............: avg=47.3ms   min=335.3µs  med=16.6ms   max=472.6ms  p(90)=128.57ms p(95)=180.09ms
      { expected_response:true }...: avg=47.3ms   min=335.3µs  med=16.6ms   max=472.6ms  p(90)=128.57ms p(95)=180.09ms
      { group:::auth }.............: avg=76.19ms  min=335.3µs  med=66.23ms  max=407.3ms  p(90)=179.87ms p(95)=228.95ms
      { group:::comment }..........: avg=39.28ms  min=504.2µs  med=13.57ms  max=379.54ms p(90)=97.4ms   p(95)=174.63ms
      { group:::favorite }.........: avg=55.49ms  min=504.9µs  med=17.29ms  max=472.6ms  p(90)=188.28ms p(95)=268.23ms
      { group:::like }.............: avg=53.52ms  min=503.4µs  med=16.41ms  max=471.7ms  p(90)=160ms    p(95)=238.23ms
      { group:::map }..............: avg=25.12ms  min=418.9µs  med=10.03ms  max=152.65ms p(90)=73.58ms  p(95)=84.63ms
      { group:::misc }.............: avg=5.34ms   min=397.6µs  med=3.69ms   max=48.98ms  p(90)=11.49ms  p(95)=13.19ms
      { group:::notification }.....: avg=53.29ms  min=504.29µs med=31.07ms  max=304.52ms p(90)=134.81ms p(95)=178.5ms
      { group:::recommendation }...: avg=28.15ms  min=3.61ms   med=13.35ms  max=155.22ms p(90)=76.99ms  p(95)=86.54ms
      { group:::story }............: avg=38.41ms  min=511.2µs  med=17.11ms  max=278.63ms p(90)=100.92ms p(95)=133.64ms
    http_req_failed................: 0.00%  0 out of 53435
    http_reqs......................: 53435  273.911341/s

    EXECUTION
    iteration_duration.............: avg=371.27ms min=102.53ms med=343.95ms max=1.16s    p(90)=615.91ms p(95)=719.9ms
    iterations.....................: 20869  106.975873/s
    vus............................: 1      min=0          max=120
    vus_max........................: 120    min=120        max=120

    NETWORK
    data_received..................: 97 MB  495 kB/s
    data_sent......................: 9.9 MB 51 kB/s



running (3m15.1s), 000/120 VUs, 20869 complete and 0 interrupted iterations
default ✓ [======================================] 000/120 VUs  3m6s
[03:10:11] Redis: 4.21M | ops/s: 135 | keys: 7408 | hit: 93.5% | CPU: 0.74% | Mem: 8.828MiB / 7.412GiB

[MONITOR] Stopping monitor...
[MONITOR] Stopped.

========================================
   Test completed
========================================
  Mode:   performance
  Report: tests\k6\test-reports\performance-test\stress-test-28032026_30640-summary.json
========================================
```
