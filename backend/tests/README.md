# EchoStar 后端测试总览

本目录包含 EchoStar 后端 API 的所有测试，分为单元/集成测试（`unit/`）和 K6 压力测试（`k6/`）两大类。

## 目录结构

```
backend/tests/
├── unit/                        # 单元/集成测试（详见 unit/README.md）
├── k6/                          # K6 压力测试（详见 k6/README.md）
└── README.md                    # 本文件
```

## unit/ — 单元/集成测试

针对各业务模块 API 接口的功能正确性测试，包含正常流程和边界条件验证。

```
unit/
├── test-scripts/                # 测试脚本（11 个模块 + 环境重置）
├── problems/                    # 各模块已知问题文档（10 个）
└── test-results/                # 测试输出结果
    ├── request-records/         # 请求记录
    └── test-reports/            # 测试报告
```

覆盖模块：Admin、Auth、Comment、Favorite、Like、Map、Notification、Recommendation、Report、Story、Update User Info

> 详细使用说明请参阅 [unit/README.md](unit/README.md)

## k6/ — 压力/性能测试

使用 [k6](https://k6.io/) 进行 API 性能测试，模拟高并发场景。

```
k6/
├── test-scripts/                # 测试脚本（简化版 + 完整版）
├── test-reports/                # 测试报告（JSON + 摘要）
└── README.md                    # 详细文档
```

包含简化测试（100 用户 / 500 故事）和完整测试（5000 用户 / 25000 故事），覆盖认证、故事、评论、点赞、收藏、地图、管理员等模块。

> 详细使用说明请参阅 [k6/README.md](k6/README.md)

## 通用环境准备

所有测试都需要先启动数据库和后端服务：

### 1. 启动 Docker 数据库

```bash
cd backend
docker-compose up -d
docker ps  # 验证服务运行
```

### 2. 确保环境变量配置正确

`.env` 中需包含数据库和 Redis 连接信息。

### 3. 安装依赖并启动服务

```bash
cd backend
npm install
npm run dev
```

## 注意事项

1. **单元测试**：建议按顺序运行，部分测试依赖前置数据；不建议并发运行多个测试脚本
2. **压力测试**：测试环境需放宽速率限制（设置 `K6_TEST=true`），否则会被限流中间件拦截
3. **Redis 依赖**：Notification 模块测试依赖 Redis 服务正常运行
4. **测试数据**：可通过 `reset-env.js` 脚本一键重置测试环境（重建数据库 + 重启服务）
