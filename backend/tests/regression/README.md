# EchoStar 回归测试

在代码变更后验证所有模块功能是否正常。复用 `unit/test-scripts/` 下的测试脚本，结果独立保存。

## 目录结构

```
regression/
├── README.md                         # 本文件
├── test-scripts/
│   ├── run-regression.js             # 回归调度器（调用 unit 脚本）
│   └── like-cross-user.test.js       # 点赞跨用户专项测试
├── problems/                         # 回归发现的问题记录
└── test-results/                     # 输出结果
    ├── request-records/              # 请求记录
    └── test-reports/                 # 回归报告（<模块>.regression-<时间>.txt）
```

## 回归调度器

`run-regression.js` 通过 `child_process` 调用 `../unit/test-scripts/` 下的测试脚本，结果保存到 `regression/test-results/`，与 unit 结果隔离。

### 运行方式

```bash
cd backend

# 运行单个模块
node tests/regression/test-scripts/run-regression.js auth

# 运行所有模块
node tests/regression/test-scripts/run-regression.js all

# 重置环境后运行
node tests/regression/test-scripts/run-regression.js all --reset
```

### 自定义服务器地址

```bash
# Windows
set API_BASE_URL=http://your-server:3000
# Linux/Mac
export API_BASE_URL=http://your-server:3000
```

### 可用模块

| 模块名 | 说明 |
|--------|------|
| admin | 管理员接口（封禁/解封/统计） |
| auth | 认证接口（注册/登录/用户信息） |
| comment | 评论接口（CRUD/搜索/统计） |
| favorite | 收藏接口（切换/列表/批量检查） |
| like | 点赞接口（切换/列表/批量检查） |
| map | 地图接口（范围查询/故事墙/聚合） |
| notification | 通知接口（列表/已读/清空） |
| recommendation | 推荐接口（随机漫步/信息流） |
| report | 举报接口（创建/处理/统计） |
| story | 故事接口（完整 CRUD + 高级功能） |

### 执行顺序

`all` 模式按固定顺序执行：

```
admin → auth → comment → favorite → like → map → notification → recommendation → report → story
```

### 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 全部通过 |
| 1 | 至少一个模块失败或参数错误 |

## 专项测试

### like-cross-user.test.js

独立的跨用户点赞隔离性测试，不被调度器调用，需手动执行。

测试流程：创建用户1发布故事 → 用户2点赞/取消点赞 → 验证用户1的点赞状态不受影响。

```bash
node tests/regression/test-scripts/like-cross-user.test.js
node tests/regression/test-scripts/like-cross-user.test.js --reset
```

## 注意事项

1. 不要同时运行 unit 和 regression 测试，两者操作同一数据库
2. Notification 模块依赖 Redis
3. `--reset` 会清空所有数据（PostgreSQL + Redis），禁止在生产环境使用
