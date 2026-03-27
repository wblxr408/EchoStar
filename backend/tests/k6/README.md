# EchoStar 后端压力测试

本目录包含 EchoStar 后端 API 的压力测试脚本，使用 [k6](https://k6.io/) 进行测试。

## 目录结构

```
tests/k6/
├── config.js              # 测试配置文件
├── data-generator.js      # 测试数据生成器
├── api-client.js          # API 客户端封装
├── report-generator.js    # 报告生成器
├── stress-test.js         # 完整压力测试脚本
├── stress-test-simple.js  # 简化压力测试脚本
├── parse-report.js        # 报告解析脚本
├── run-test.sh            # Linux/Mac 运行脚本
├── run-test.bat           # Windows 运行脚本
└── README.md              # 本文档
```

## 安装 k6

### Windows

```powershell
# 使用 Chocolatey
choco install k6

# 或使用 Scoop
scoop install k6
```

### macOS

```bash
# 使用 Homebrew
brew install k6
```

### Linux

```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415B36428D57F82F9B6ADEBD7F80
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 快速开始

### 1. 启动后端服务

确保后端服务正在运行：

```bash
cd backend
npm run dev
```

### 2. 运行测试

#### Windows

```powershell
cd backend/tests/k6
# 运行简化测试（推荐首次运行）
run-test.bat

# 运行完整测试（包含大量数据创建）
run-test.bat --full

# 自定义参数
run-test.bat --users 500 --stories 2000 --vus 100
```

#### Linux/Mac

```bash
cd backend/tests/k6
chmod +x run-test.sh

# 运行简化测试
./run-test.sh

# 运行完整测试
./run-test.sh --full

# 自定义参数
./run-test.sh --users 500 --stories 2000 --vus 100 --duration 3m
```

#### 直接使用 k6

```bash
# 简化测试
k6 run --out json=tests/test-results/test-reports/result.json tests/k6/stress-test-simple.js

# 完整测试
k6 run --out json=tests/test-results/test-reports/result.json tests/k6/stress-test.js

# 使用环境变量自定义参数
k6 run --env USER_COUNT=1000 --env STORY_COUNT=5000 tests/k6/stress-test.js
```

## 测试参数

| 参数 | 环境变量 | 默认值 | 说明 |
|------|---------|--------|------|
| 用户数量 | USER_COUNT | 5000 | 创建的测试用户数量 |
| 管理员数量 | ADMIN_COUNT | 500 | 创建的管理员数量 |
| 故事数量 | STORY_COUNT | 25000 | 创建的故事数量 |
| 并发用户数 | LOAD_VUS | 50 | 负载测试阶段的并发用户数 |
| 测试持续时间 | LOAD_DURATION | 2m | 负载测试持续时间 |

### 性能阈值

| 指标 | 默认阈值 | 说明 |
|------|---------|------|
| P95 响应时间 | < 500ms | 95% 的请求响应时间应低于此值 |
| P99 响应时间 | < 1000ms | 99% 的请求响应时间应低于此值 |
| 错误率 | < 1% | 请求失败率应低于此值 |

## 测试流程

### 简化测试 (stress-test-simple.js)

1. **数据准备阶段**：创建少量测试数据（约 100 用户，500 故事）
2. **预热阶段**：逐渐增加到 10 VU
3. **负载测试**：增加到 50 VU，持续 2 分钟
4. **压力测试**：增加到 100 VU，持续 2 分钟
5. **峰值测试**：激增到 200 VU，持续 30 秒
6. **冷却阶段**：逐渐减少到 0 VU

### 完整测试 (stress-test.js)

1. **Setup 阶段**：创建大量测试数据（5000+ 用户，25000+ 故事）
2. **负载测试**：模拟正常用户行为
3. **压力测试**：测试系统在高负载下的表现
4. **峰值测试**：测试系统处理突发流量的能力
5. **Teardown 阶段**：生成测试报告

## 测试覆盖的接口

### 认证模块 (Auth)
- POST /api/auth/register_2 - 用户注册
- POST /api/auth/login - 用户登录
- POST /api/auth/admin/login - 管理员登录
- GET /api/auth/me - 获取当前用户信息
- GET /api/auth/users/:userId - 获取用户信息

### 故事模块 (Story)
- POST /api/stories - 发布故事
- GET /api/stories/:id - 获取故事详情
- GET /api/stories/me/list - 我的故事列表
- GET /api/stories/search - 搜索故事

### 评论模块 (Comment)
- POST /api/comments - 创建评论
- GET /api/comments/story/:storyId - 获取故事评论列表
- GET /api/comments/:storyId/count - 获取评论数量

### 点赞模块 (Like)
- POST /api/likes - 点赞/取消点赞
- GET /api/likes/:storyId/check - 检查是否已点赞
- GET /api/likes/:storyId/count - 获取点赞数量

### 收藏模块 (Favorite)
- POST /api/favorites - 收藏/取消收藏
- GET /api/favorites/:storyId/check - 检查是否已收藏
- GET /api/favorites/:storyId/count - 获取收藏数量

### 地图模块 (Map)
- GET /api/map/explore - 范围查询故事
- GET /api/map/random - 随机漫步
- GET /api/map/feed - 推荐流
- GET /api/map/wall - 故事墙

### 管理员模块 (Admin)
- POST /api/admin/stories/:storyId/recommend - 设为推荐
- GET /api/admin/statistics - 获取统计数据

## 报告生成

### 自动生成

测试完成后，报告会自动保存到 `tests/test-results/test-reports/` 目录：

- `stress-test-YYYYMMDD_HHMMSS.json` - k6 原始 JSON 报告
- `stress-test-YYYYMMDD_HHMMSS-summary.txt` - 控制台输出摘要

### 手动生成 Markdown 报告

```bash
node tests/k6/parse-report.js tests/test-results/test-reports/stress-test-xxx.json
```

生成的 Markdown 报告包含：

- 测试概览（时间、请求数、成功率等）
- 性能指标（响应时间百分位、错误率）
- 响应时间分布
- 各接口性能详情（按模块分组）
- 测试结果分析与建议

### 性能等级说明

| 等级 | 响应时间 | 错误率 |
|------|---------|--------|
| 🟢 优秀 | < 100ms | < 0.1% |
| 🟡 良好 | < 300ms | < 0.5% |
| 🟠 可接受 | < 500ms | < 1% |
| 🔴 较慢 | < 1000ms | < 5% |
| ⛔ 严重 | > 1000ms | > 5% |

## 常见问题

### 1. 连接被拒绝

确保后端服务正在运行，且端口正确（默认 3000）：

```bash
# 检查服务状态
curl http://localhost:3000/health

# 或检查端口
netstat -an | findstr 3000  # Windows
lsof -i :3000                # Linux/Mac
```

### 2. 测试数据创建失败

检查数据库连接和 Redis 服务：

```bash
# 确保 Docker 容器运行
docker ps

# 检查数据库连接
npm run db:test
```

### 3. 内存不足

如果测试过程中内存不足，可以减少数据量：

```bash
k6 run --env USER_COUNT=100 --env STORY_COUNT=500 tests/k6/stress-test-simple.js
```

### 4. 速率限制

测试可能触发 API 速率限制。可以在测试环境暂时调整限流配置，或降低并发数。

## 最佳实践

1. **首次运行**：使用简化测试脚本，确保环境正常
2. **逐步增加**：从小数据量开始，逐步增加
3. **监控资源**：测试时监控 CPU、内存、数据库连接
4. **分析报告**：关注 P95/P99 响应时间和错误率
5. **优化迭代**：根据报告结果优化系统，再次测试验证

## 扩展测试

### 添加新接口测试

在 `api-client.js` 中添加新的 API 调用函数：

```javascript
export function newApiCall(token, data) {
  return sendRequest('POST', '/api/new-endpoint', data, {
    'Authorization': `Bearer ${token}`,
  });
}
```

在 `stress-test-simple.js` 中添加测试逻辑：

```javascript
function testNewFeature(data) {
  // 测试新功能
  api.newApiCall(token, testData);
}
```

### 自定义测试场景

修改 `config.js` 中的阈值和参数：

```javascript
thresholds: {
  p95: parseInt(__ENV.THRESHOLD_P95) || 500,
  p99: parseInt(__ENV.THRESHOLD_P99) || 1000,
  errorRate: parseFloat(__ENV.THRESHOLD_ERROR_RATE) || 0.01,
},
```
