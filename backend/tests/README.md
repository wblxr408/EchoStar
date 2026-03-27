# EchoStar API 自动化测试

本目录包含 EchoStar 后端 API 的自动化测试脚本，分为单元/集成测试（`unit/`）和 K6 压力测试（`k6/`）两大类。

## 目录结构

```
backend/tests/
├── unit/                        # 单元/集成测试
│   ├── problems/                # 后端问题文档
│   │   ├── admin.problems.md
│   │   ├── auth.problems.md
│   │   ├── comment.problems.md
│   │   ├── favorite.problems.md
│   │   ├── like.problems.md
│   │   ├── map.problems.md
│   │   ├── notification.problems.md
│   │   ├── recommendation.problems.md
│   │   ├── report.problems.md
│   │   └── story.problems.md
│   ├── test-methods/            # 测试脚本
│   │   ├── admin.test.js        # Admin 模块测试
│   │   ├── auth.test.js         # Auth 模块测试
│   │   ├── comment.test.js      # Comment 模块测试
│   │   ├── favorite.test.js     # Favorite 模块测试
│   │   ├── like.test.js         # Like 模块测试
│   │   ├── map.test.js          # Map 模块测试
│   │   ├── notification.test.js # Notification 模块测试
│   │   ├── recommendation.test.js # Recommendation 模块测试
│   │   ├── report.test.js       # Report 模块测试
│   │   ├── reset-env.js         # 环境重置脚本
│   │   ├── story.test.js        # Story 模块测试
│   │   └── update-user-info.test.js # 用户信息更新测试
│   └── test-results/            # 测试结果
│       ├── request-records/     # 请求记录（xxx.request-<时间>.md）
│       └── test-reports/        # 测试报告（xxx.test.report-<时间>.txt）
├── k6/                          # K6 压力测试
│   ├── test-reports/            # 测试报告
│   └── test-scripts/            # 测试脚本
│       ├── api-client.js
│       ├── config.js
│       ├── data-generator.js
│       ├── parse-report.js
│       ├── README.md
│       ├── report-generator.js
│       ├── run-test.bat             # Windows 运行脚本
│       ├── run-test.sh              # Linux/Mac 运行脚本
│       ├── stress-test-simple.js    # 简单压力测试
│       └── stress-test.js           # 完整压力测试
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

### 重置测试环境

```bash
cd backend
node tests/unit/test-methods/reset-env.js
```

### 运行单个模块测试

每个测试脚本支持 `--reset` 参数，会在测试前自动重置环境：

```bash
# 普通运行
node tests/unit/test-methods/admin.test.js

# 重置环境后运行
node tests/unit/test-methods/admin.test.js --reset
```

可用的测试模块：

| 模块 | 脚本 | 说明 |
|------|------|------|
| Admin | `admin.test.js` | 管理员封禁/解封用户、shadowban 故事、统计 |
| Auth | `auth.test.js` | 注册、登录、Token 刷新、用户信息 |
| Comment | `comment.test.js` | 评论 CRUD、搜索 |
| Favorite | `favorite.test.js` | 收藏/取消收藏、批量检查 |
| Like | `like.test.js` | 点赞/取消点赞、批量检查 |
| Map | `map.test.js` | 地图相关接口 |
| Notification | `notification.test.js` | 通知列表、已读标记、清空 |
| Recommendation | `recommendation.test.js` | 推荐、发现页 |
| Report | `report.test.js` | 举报创建、处理、统计 |
| Story | `story.test.js` | 故事 CRUD、搜索、Feed 流 |
| Update User Info | `update-user-info.test.js` | 用户资料更新 |

### 自定义服务器地址

```bash
# 使用环境变量指定服务器地址
set API_BASE_URL=http://your-server:3000
node tests/unit/test-methods/admin.test.js
```

### 运行 K6 压力测试

```bash
# Windows
cd tests\k6
run-test.bat

# Linux/Mac
cd tests/k6
bash run-test.sh
```

## 测试模块说明

### Admin 模块 (`admin.test.js`)

测试管理员相关接口：

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 封禁用户 | POST | /api/admin/users/:userId/ban | 边界：无Token、自封、重复封禁 |
| 解封用户 | POST | /api/admin/users/:userId/unban | 边界：重复解封 |
| 封禁故事 | POST | /api/admin/stories/:storyId/shadowban | 边界：无Token、普通用户、重复 |
| 恢复故事 | POST | /api/admin/stories/:storyId/restore | 边界：重复恢复 |
| 获取统计 | GET | /api/admin/statistics | 边界：无Token、普通用户 |

### Auth 模块 (`auth.test.js`)

测试认证相关接口：

| 接口 | 方法 | 路径 |
|------|------|------|
| 注册 | POST | /api/auth/register_2 |
| 登录 | POST | /api/auth/login |
| 管理员登录 | POST | /api/auth/admin/login |
| 获取当前用户 | GET | /api/auth/me |

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

### Map 模块 (`map.test.js`)

测试地图相关接口。

### Notification 模块 (`notification.test.js`)

测试通知相关接口：

| 接口 | 方法 | 路径 |
|------|------|------|
| 获取通知列表 | GET | /api/notifications/me |
| 获取未读数量 | GET | /api/notifications/me/unread-count |
| 标记单条已读 | PUT | /api/notifications/:id/mark-read |
| 标记全部已读 | PUT | /api/notifications/me/mark-read |
| 清空所有通知 | DELETE | /api/notifications/me |

### Recommendation 模块 (`recommendation.test.js`)

测试推荐/发现页相关接口。

### Report 模块 (`report.test.js`)

测试举报相关接口：

| 接口 | 方法 | 权限 | 功能 |
|------|------|------|------|
| /api/reports | POST | 用户 | 创建举报 |
| /api/reports/me | GET | 用户 | 获取自己的举报列表 |
| /api/reports | GET | 管理员 | 获取所有举报列表 |
| /api/reports/:reportId/handle | POST | 管理员 | 处理举报（批准/拒绝） |
| /api/reports/statistics | GET | 管理员 | 获取举报统计 |

### Story 模块 (`story.test.js`)

测试故事相关接口，包括 CRUD、搜索、Feed 流等。

### Update User Info 模块 (`update-user-info.test.js`)

测试用户资料更新相关接口。

## 测试报告

测试完成后会在 `unit/test-results/` 下生成两类文件：

1. **请求记录** (`unit/test-results/request-records/`)
   - 命名格式：`<模块名>.request-<时间戳>.md`（如：`admin.request-2026-03-24T16-29-30-689Z.md`）
   - 内容：每次请求的详细信息（请求头、请求体、响应内容等）

2. **测试报告** (`unit/test-results/test-reports/`)
   - 命名格式：`<模块名>.test.report-<时间戳>.txt`（如：`admin.test.report-2026-03-24T16-29-30-690Z.txt`）
   - 内容：测试执行日志和结果统计

## 问题文档

各模块的已知问题记录在 `unit/problems/` 目录下，文件命名格式为 `<模块名>.problems.md`。

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

2. **数据清理**：测试会创建临时用户和故事，可通过 `reset-env.js` 重置环境

3. **并发测试**：不建议同时运行多个测试脚本，可能产生数据冲突

4. **Redis 依赖**：Notification 模块测试依赖 Redis，请确保 Redis 服务正常

**文档版本**: v2.0
**最后更新**: 2026-03-27
