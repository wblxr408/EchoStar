# EchoStar API 自动化测试

本目录包含 EchoStar 后端 API 的自动化测试脚本。

## 目录结构

```
backend/tests/
├── README/
|   ├── backend_xxx_problems.md  # 后端问题文档
|   └── ...
├── test-method/                 # 测试脚本目录
│   ├── comment.test.js          # Comment 模块测试
│   ├── favorite.test.js         # Favorite 模块测试
│   ├── like.test.js             # Like 模块测试
│   ├── notification.test.js     # Notification 模块测试
│   └── report.test.js.js        # report 模块测试
├── test-results/                # 测试结果目录
│   ├── request-records/         # 请求记录（.md 文件）
│   └── test-reports/            # 测试报告（.txt 文件）
└── README.md                    # 本文件
```

## 环境准备

### 1. 启动 Docker 数据库

确保已安装 Docker Desktop 并启动。然后运行：

```bash
cd c:\Users\20979\RP_Projects\ECHOSTAR\EchoStar\backend

# 启动 PostgreSQL 和 Redis
docker-compose up -d

# 验证服务运行
docker ps
```

### 2. 配置环境变量

确保 `.env` 文件配置正确：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=echostar
DB_USERNAME=postgres
DB_PASSWORD=123456

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=123456
```

### 3. 安装依赖

```bash
cd backend
npm install
```

### 4. 启动后端服务

```bash
npm run dev
```

## 运行测试

### 运行所有测试

```bash
cd backend
node tests/test-method/run-all-tests.js
```

### 运行单个模块测试

```bash
# Comment 模块
node tests/test-method/comment.test.js

# Favorite 模块
node tests/test-method/favorite.test.js

# Like 模块
node tests/test-method/like.test.js

# Notification 模块
node tests/test-method/notification.test.js
```

### 自定义服务器地址

```bash
# 使用环境变量指定服务器地址
set API_BASE_URL=http://your-server:3000
node tests/test-method/run-all-tests.js
```

## 测试模块说明

### Comment 模块 (`comment.test.js`)

测试评论相关接口：

| 接口 | 方法 | 路径 |
|------|------|------|
| 创建评论 | POST | /api/comments |
| 获取故事评论列表 | GET | /api/comments/story/:storyId |
| 获取用户评论列表 | GET | /api/comments/me |
| 统计评论数量 | GET | /api/comments/:storyId/count |
| 搜索评论 | GET | /api/comments/search |
| 删除评论 | DELETE | /api/comments/:id |

### Favorite 模块 (`favorite.test.js`)

测试收藏相关接口：

| 接口 | 方法 | 路径 |
|------|------|------|
| 收藏/取消收藏切换 | POST | /api/favorites |
| 创建收藏 | POST | /api/favorites/create |
| 取消收藏 | DELETE | /api/favorites/:storyId |
| 获取用户收藏列表 | GET | /api/favorites/me |
| 获取故事收藏列表 | GET | /api/favorites/story/:storyId |
| 检查是否已收藏 | GET | /api/favorites/:storyId/check |
| 统计收藏数量 | GET | /api/favorites/:storyId/count |
| 批量检查收藏状态 | POST | /api/favorites/check-multiple |

### Like 模块 (`like.test.js`)

测试点赞相关接口：

| 接口 | 方法 | 路径 |
|------|------|------|
| 点赞/取消点赞切换 | POST | /api/likes |
| 创建点赞 | POST | /api/likes/create |
| 取消点赞 | DELETE | /api/likes/:storyId |
| 获取用户点赞列表 | GET | /api/likes/me |
| 获取故事点赞列表 | GET | /api/likes/story/:storyId |
| 检查是否已点赞 | GET | /api/likes/:storyId/check |
| 统计点赞数量 | GET | /api/likes/:storyId/count |
| 批量检查点赞状态 | POST | /api/likes/check-multiple |

### Notification 模块 (`notification.test.js`)

测试通知相关接口：

| 接口 | 方法 | 路径 |
|------|------|------|
| 获取通知列表 | GET | /api/notifications/me |
| 获取未读数量 | GET | /api/notifications/me/unread-count |
| 标记单条已读 | PUT | /api/notifications/:id/mark-read |
| 标记全部已读 | PUT | /api/notifications/me/mark-read |
| 清空所有通知 | DELETE | /api/notifications/me |

### report 模块 (`report.test.js`)

|接口 | 方法 | 权限 | 功能 |
|------|------|------|------|
|/api/reports | POST | 用户 | 创建举报 |
|/api/reports/me | GET | 用户 | 获取自己的举报列表 |
|/api/reports | GET | 管理员 | 获取所有举报列表 |
|/api/reports/:reportId/handle | POST | 管理员 | 处理举报（批准/拒绝） |
|/api/reports/statistics | GET | 管理员 | 获取举报统计 |

## 测试报告

测试完成后会生成两类文件：

1. **请求记录** (`test-results/request-records/`)
   - 格式：Markdown (.md)
   - 内容：每次请求的详细信息（请求头、请求体、响应内容等）

2. **测试报告** (`test-results/test-reports/`)
   - 格式：文本文件 (.txt)
   - 内容：测试执行日志和结果统计

## 边界测试覆盖

每个模块的测试都包含以下边界测试：

- 缺少必需参数
- 无效参数格式
- 不存在的资源ID
- 无 Token 访问需认证接口
- 重复操作（如重复点赞、重复收藏）
- 分页参数边界

## 注意事项

1. **测试顺序**：建议按顺序运行测试，因为某些测试依赖前面测试创建的数据

2. **数据清理**：测试会创建临时用户和故事，但不会自动清理

3. **并发测试**：不建议同时运行多个测试脚本，可能产生数据冲突

4. **Redis 依赖**：Notification 模块测试依赖 Redis，请确保 Redis 服务正常


**文档版本**: v1.0  
**最后更新**: 2026-03-19
