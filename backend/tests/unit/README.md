# EchoStar 单元/集成测试

本目录包含 EchoStar 后端各业务模块 API 接口的功能测试，验证正常流程与边界条件。

## 目录结构

```
unit/
├── test-scripts/                # 测试脚本
│   ├── admin.test.js            # Admin 模块测试
│   ├── auth.test.js             # Auth 模块测试
│   ├── comment.test.js          # Comment 模块测试
│   ├── favorite.test.js         # Favorite 模块测试
│   ├── like.test.js             # Like 模块测试
│   ├── map.test.js              # Map 模块测试
│   ├── notification.test.js     # Notification 模块测试
│   ├── recommendation.test.js   # Recommendation 模块测试
│   ├── report.test.js           # Report 模块测试
│   ├── story.test.js            # Story 模块测试
│   ├── update-user-info.test.js # 用户信息更新测试
│   └── reset-env.js             # 环境重置脚本
├── problems/                    # 各模块已知问题文档
│   ├── admin.problems.md
│   ├── auth.problems.md
│   ├── comment.problems.md
│   ├── favorite.problems.md
│   ├── like.problems.md
│   ├── map.problems.md
│   ├── notification.problems.md
│   ├── recommendation.problems.md
│   ├── report.problems.md
│   └── story.problems.md
└── test-results/                # 测试输出结果
    ├── request-records/         # 请求记录（xxx.request-<时间>.md）
    └── test-reports/            # 测试报告（xxx.test.report-<时间>.txt）
```

## 快速开始

### 1. 启动环境

确保 Docker 数据库和后端服务已运行（参见 [上级 README](../README.md)）。

### 2. 重置测试环境

```bash
cd backend
node tests/unit/test-scripts/reset-env.js
```

该脚本会自动：停止并重建 Docker 容器 → 等待数据库就绪 → 启动后端服务（测试模式）→ 等待服务器就绪。

### 3. 运行测试

```bash
# 普通运行
node tests/unit/test-scripts/admin.test.js

# 重置环境后运行（推荐首次运行或数据冲突时使用）
node tests/unit/test-scripts/admin.test.js --reset
```

### 4. 自定义服务器地址

```bash
# Windows
set API_BASE_URL=http://your-server:3000
# Linux/Mac
export API_BASE_URL=http://your-server:3000

node tests/unit/test-scripts/admin.test.js
```

## 测试模块说明

### Admin 模块 (`admin.test.js`)

测试管理员相关接口，包括权限控制边界：

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

测试地图相关接口，包括范围查询、故事墙和聚合数据：

| 接口 | 方法 | 路径 | 边界测试 |
|------|------|------|----------|
| 范围查询故事 | GET | /api/map/explore | 缺少经纬度、坐标超范围、半径过小/过大、无效格式、不同城市 |
| 同地点故事墙 | GET | /api/map/wall | 缺少经纬度、坐标超范围、半径过小/过大、默认半径 |
| 获取聚合数据 | GET | /api/map/clusters | 缺少参数、无效JSON、无效坐标、缺失字段、空范围内查询 |

### Notification 模块 (`notification.test.js`)

测试通知相关接口（依赖 Redis）：

| 接口 | 方法 | 路径 |
|------|------|------|
| 获取通知列表 | GET | /api/notifications/me |
| 获取未读数量 | GET | /api/notifications/me/unread-count |
| 标记单条已读 | PUT | /api/notifications/:id/mark-read |
| 标记全部已读 | PUT | /api/notifications/me/mark-read |
| 清空所有通知 | DELETE | /api/notifications/me |

### Recommendation 模块 (`recommendation.test.js`)

测试推荐/发现页接口（通过 Map 模块暴露），验证推荐算法是否能根据用户偏好推荐故事：

| 接口 | 方法 | 路径 | 边界测试 |
|------|------|------|----------|
| 随机漫步（加权推荐） | GET | /api/map/random | 无参数、带位置、情感筛选（开心/难过/治愈/打卡）、无效标签、无效经纬度、无Token、重复调用稳定性 |
| 消息推荐流 | GET | /api/map/feed | 无参数、带位置、情感筛选、分页参数、无效分页、limit 过大、无效标签、无Token |

### Report 模块 (`report.test.js`)

测试举报相关接口，包含用户和管理员两个权限维度：

| 接口 | 方法 | 权限 | 功能 |
|------|------|------|------|
| /api/reports | POST | 用户 | 创建举报 |
| /api/reports/me | GET | 用户 | 获取自己的举报列表 |
| /api/reports | GET | 管理员 | 获取所有举报列表 |
| /api/reports/:reportId/handle | POST | 管理员 | 处理举报（批准/拒绝） |
| /api/reports/statistics | GET | 管理员 | 获取举报统计 |

### Story 模块 (`story.test.js`)

测试故事相关接口，覆盖完整 CRUD 生命周期和高级功能：

| 接口 | 方法 | 路径 | 边界测试 |
|------|------|------|----------|
| 发布故事 | POST | /api/stories | 无Token、内容为空、内容过长、缺少位置/情感标签、无效标签、坐标超范围、图片过多/格式无效、时光胶囊时间设置 |
| 查看故事详情 | GET | /api/stories/:id | 不存在的ID、无效ID格式、无Token查看公开故事 |
| 我的故事列表 | GET | /api/stories/me/list | 无Token、分页参数、无效分页 |
| 搜索故事 | GET | /api/stories/search | 缺少关键词、空关键词、无Token搜索 |
| 修改故事内容 | POST | /api/stories/:id | 无Token、修改他人故事、内容边界 |
| 修改故事可见性 | PUT | /api/stories/:id/visibility | 无效可见性值、权限控制 |
| 删除故事 | DELETE | /api/stories/:id | 无Token、删除他人故事、删除不存在的故事 |
| 获取 OSS 上传凭证 | GET | /api/stories/upload-token | 无Token |
| 解锁时光胶囊 | POST | /api/stories/:id/unlock | 未到解锁时间、已解锁、重复解锁 |
| 管理员获取所有帖子 | GET | /api/stories/admin/all | 无Token、普通用户访问、分页参数 |

### Update User Info 模块 (`update-user-info.test.js`)

测试用户资料更新接口：

| 接口 | 方法 | 路径 |
|------|------|------|
| 修改用户信息 | PUT | /api/auth/users/me |

测试流程：注册用户 → 获取当前信息 → 修改用户名 → 验证修改结果 → 注销账号。

## 边界测试覆盖

每个模块的测试都包含以下通用边界测试：

- 缺少必需参数
- 无效参数格式
- 不存在的资源 ID
- 无 Token 访问需认证接口
- 重复操作（如重复点赞、重复收藏）
- 分页参数边界（负数、过大、缺页码）

## 测试输出

测试完成后会在 `test-results/` 下生成两类文件：

1. **请求记录** (`test-results/request-records/`)
   - 命名格式：`<模块名>.request-<时间戳>.md`
   - 内容：每次请求的详细信息（请求头、请求体、响应内容等）

2. **测试报告** (`test-results/test-reports/`)
   - 命名格式：`<模块名>.test.report-<时间戳>.txt`
   - 内容：测试执行日志和结果统计

## 问题文档

各模块的已知问题记录在 `problems/` 目录下，文件命名格式为 `<模块名>.problems.md`。

## 注意事项

1. **测试顺序**：建议按顺序运行测试，因为某些测试依赖前面测试创建的数据
2. **数据清理**：测试会创建临时用户和故事，可通过 `reset-env.js` 重置环境
3. **并发测试**：不建议同时运行多个测试脚本，可能产生数据冲突
4. **Redis 依赖**：Notification 模块测试依赖 Redis，请确保 Redis 服务正常
