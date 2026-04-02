# EchoStar 回归测试

本目录用于在代码变更后快速验证所有模块功能是否正常，复用 `unit/test-scripts/` 下的测试脚本，结果独立保存。

## 目录结构

```
regression/
├── README.md                         # 本文件
├── test-scripts/
│   └── run-regression.js             # 回归测试调度器（唯一脚本）
├── problems/                         # 回归测试发现的问题记录
└── test-results/                     # 回归测试输出结果
    ├── request-records/              # 请求记录（由 unit 脚本生成）
    └── test-reports/                 # 回归测试报告（<模块>.regression-<时间>.txt）
```

## 与 unit 测试的关系

- `regression` **不包含**任何测试逻辑脚本，仅有一个调度器
- 调度器通过 `child_process` 调用 `../unit/test-scripts/` 下对应的 `.test.js` 脚本
- 测试结果保存到 `regression/test-results/`，与 unit 的结果互不干扰

## 快速开始

### 1. 启动环境

确保 Docker 数据库和后端服务已运行（参见 [上级 README](../README.md)）。

### 2. 运行回归测试

```bash
cd backend

# 运行单个模块
node tests/regression/test-scripts/run-regression.js auth

# 运行所有模块
node tests/regression/test-scripts/run-regression.js all

# 重置环境后运行（推荐首次或数据冲突时使用）
node tests/regression/test-scripts/run-regression.js all --reset
```

### 3. 自定义服务器地址

```bash
# Windows
set API_BASE_URL=http://your-server:3000

# Linux/Mac
export API_BASE_URL=http://your-server:3000

node tests/regression/test-scripts/run-regression.js all
```

## 可用模块

| 模块名 | 说明 | 测试脚本 |
|--------|------|----------|
| `admin` | 管理员接口（封禁/解封/统计） | `admin.test.js` |
| `auth` | 认证接口（注册/登录/用户信息） | `auth.test.js` |
| `comment` | 评论接口（CRUD/搜索/统计） | `comment.test.js` |
| `favorite` | 收藏接口（切换/列表/批量检查） | `favorite.test.js` |
| `like` | 点赞接口（切换/列表/批量检查） | `like.test.js` |
| `map` | 地图接口（范围查询/故事墙/聚合） | `map.test.js` |
| `notification` | 通知接口（列表/已读/清空） | `notification.test.js` |
| `recommendation` | 推荐接口（随机漫步/信息流） | `recommendation.test.js` |
| `report` | 举报接口（创建/处理/统计） | `report.test.js` |
| `story` | 故事接口（完整 CRUD + 高级功能） | `story.test.js` |

## 执行顺序

使用 `all` 参数时，按以下顺序执行：

```
admin → auth → comment → favorite → like → map → notification → recommendation → report → story
```

## 测试输出

测试完成后会在 `test-results/test-reports/` 下生成报告文件：

- **命名格式**：`<模块名>.regression-<时间>.txt`
- **内容**：执行时间、耗时、通过/失败状态、完整 stdout/stderr 输出

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 所有模块全部通过 |
| 1 | 至少一个模块失败或参数错误 |

## 注意事项

1. **不要同时运行 unit 和 regression 测试**，两者操作同一数据库，可能产生数据冲突
2. **Redis 依赖**：Notification 模块依赖 Redis，请确保 Redis 服务正常
3. **数据依赖**：某些测试依赖前置测试创建的数据，`all` 模式按固定顺序执行
4. **`--reset` 会清空所有数据**（PostgreSQL + Redis），请勿在生产环境使用
