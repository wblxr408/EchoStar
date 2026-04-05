# EchoStar 单元/集成测试

各业务模块 API 接口的功能测试，验证正常流程与边界条件。

## 目录结构

```
unit/
├── test-scripts/                # 测试脚本
│   ├── admin.test.js            # Admin 模块
│   ├── auth.test.js             # Auth 模块
│   ├── comment.test.js          # Comment 模块
│   ├── favorite.test.js         # Favorite 模块
│   ├── like.test.js             # Like 模块
│   ├── map.test.js              # Map 模块
│   ├── notification.test.js     # Notification 模块
│   ├── recommendation.test.js   # Recommendation 模块
│   ├── report.test.js           # Report 模块
│   ├── story.test.js            # Story 模块
│   ├── update-user-info.test.js # 用户信息更新
│   └── reset-env.js             # 环境重置脚本
├── problems/                    # 各模块已知问题文档
└── test-results/                # 测试输出
    ├── request-records/         # 请求记录
    └── test-reports/            # 测试报告
```

## 快速开始

### 1. 启动环境

确保 Docker 数据库和后端服务已运行（参见 [上级 README](../README.md)）。

### 2. 重置测试环境（可选）

```bash
cd backend
node tests/unit/test-scripts/reset-env.js
```

该脚本执行：停止并重建 Docker 容器 → 等待数据库就绪 → 启动后端服务（设置 `K6_TEST=true` 环境变量）→ 等待服务就绪。

### 3. 运行测试

```bash
node tests/unit/test-scripts/<模块名>.test.js

# 重置环境后运行
node tests/unit/test-scripts/<模块名>.test.js --reset
```

### 4. 自定义服务器地址

```bash
# Windows
set API_BASE_URL=http://your-server:3000
# Linux/Mac
export API_BASE_URL=http://your-server:3000
```

## 测试模块说明

### Admin (`admin.test.js`)

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 封禁用户 | POST | /api/admin/users/:userId/ban | 边界：无Token、自封、重复封禁 |
| 解封用户 | POST | /api/admin/users/:userId/unban | 边界：重复解封 |
| 封禁故事 | POST | /api/admin/stories/:storyId/shadowban | 边界：无Token、普通用户、重复 |
| 恢复故事 | POST | /api/admin/stories/:storyId/restore | 边界：重复恢复 |
| 获取统计 | GET | /api/admin/statistics | 边界：无Token、普通用户 |

### Auth (`auth.test.js`)

| 接口 | 方法 | 路径 |
|------|------|------|
| 注册 | POST | /api/auth/register_2 |
| 登录 | POST | /api/auth/login |
| 管理员登录 | POST | /api/auth/admin/login |
| 获取当前用户 | GET | /api/auth/me |

### Comment (`comment.test.js`)

| 接口 | 方法 | 路径 |
|------|------|------|
| 创建评论 | POST | /api/comments |
| 获取故事评论列表 | GET | /api/comments/story/:storyId |
| 获取用户评论列表 | GET | /api/comments/me |
| 统计评论数量 | GET | /api/comments/:storyId/count |
| 搜索评论 | GET | /api/comments/search |
| 删除评论 | DELETE | /api/comments/:id |

### Favorite (`favorite.test.js`)

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

### Like (`like.test.js`)

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

### Map (`map.test.js`)

| 接口 | 方法 | 路径 | 边界测试 |
|------|------|------|----------|
| 范围查询 | GET | /api/map/explore | 缺少经纬度、坐标超范围、半径边界、无效格式 |
| 故事墙 | GET | /api/map/wall | 缺少经纬度、坐标超范围、半径边界、默认半径 |
| 聚合数据 | GET | /api/map/clusters | 缺少参数、无效JSON、无效坐标、空范围 |

### Notification (`notification.test.js`)

依赖 Redis 服务。

| 接口 | 方法 | 路径 |
|------|------|------|
| 获取通知列表 | GET | /api/notifications/me |
| 获取未读数量 | GET | /api/notifications/me/unread-count |
| 标记单条已读 | PUT | /api/notifications/:id/mark-read |
| 标记全部已读 | PUT | /api/notifications/me/mark-read |
| 清空所有通知 | DELETE | /api/notifications/me |

### Recommendation (`recommendation.test.js`)

| 接口 | 方法 | 路径 | 边界测试 |
|------|------|------|----------|
| 随机漫步 | GET | /api/map/random | 无参数、带位置、情感筛选、无效标签、重复调用稳定性 |
| 推荐信息流 | GET | /api/map/feed | 无参数、带位置、情感筛选、分页参数、limit 过大 |

### Report (`report.test.js`)

| 接口 | 方法 | 权限 | 功能 |
|------|------|------|------|
| 创建举报 | POST | 用户 | 提交举报 |
| 我的举报列表 | GET | 用户 | 查看自己的举报 |
| 全部举报列表 | GET | 管理员 | 查看所有举报 |
| 处理举报 | POST | 管理员 | 批准/拒绝 |
| 举报统计 | GET | 管理员 | 汇总数据 |

### Story (`story.test.js`)

| 接口 | 方法 | 路径 | 边界测试 |
|------|------|------|----------|
| 发布故事 | POST | /api/stories | 无Token、内容为空/过长、缺少字段、无效标签、图片数量/格式、时光胶囊 |
| 查看详情 | GET | /api/stories/:id | 不存在ID、无效格式 |
| 我的列表 | GET | /api/stories/me/list | 无Token、分页参数 |
| 搜索 | GET | /api/stories/search | 缺少/空关键词 |
| 修改内容 | POST | /api/stories/:id | 无Token、修改他人故事 |
| 修改可见性 | PUT | /api/stories/:id/visibility | 无效值、权限控制 |
| 删除 | DELETE | /api/stories/:id | 无Token、删除他人/不存在的故事 |
| OSS 上传凭证 | GET | /api/stories/upload-token | 无Token |
| 解锁时光胶囊 | POST | /api/stories/:id/unlock | 未到时间、已解锁、重复解锁 |
| 管理员全部帖子 | GET | /api/stories/admin/all | 无Token、普通用户、分页 |

### Update User Info (`update-user-info.test.js`)

测试用户资料更新接口（`PUT /api/auth/users/me`）。

流程：注册 → 获取当前信息 → 修改用户名 → 验证结果 → 注销账号。

## 测试输出

| 目录 | 命名格式 | 内容 |
|------|----------|------|
| `test-results/request-records/` | `<模块>.request-<时间>.md` | 请求/响应详细信息 |
| `test-results/test-reports/` | `<模块>.test.report-<时间>.txt` | 执行日志和结果统计 |

## 问题文档

各模块的已知问题记录在 `problems/<模块>.problems.md` 中。

## 注意事项

1. 建议按顺序运行，某些测试依赖前置数据
2. 可通过 `reset-env.js` 重置环境，清除临时数据
3. 不建议同时运行多个测试脚本，会产生数据冲突
4. Notification 模块依赖 Redis 服务
