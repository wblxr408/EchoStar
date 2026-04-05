# EchoStar 后端测试

## 目录结构

```
backend/tests/
├── unit/                        # 单元/集成测试
├── k6/                          # 性能/压力测试（k6）
├── regression/                  # 回归测试
└── README.md
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

> 详细说明参阅 [unit/README.md](unit/README.md)

## k6/ — 性能/压力测试

使用 [k6](https://k6.io/) 进行 API 性能测试，支持阶梯拐点探测、耐力验证、限流验证。

```
k6/
├── test-scripts/                # 测试脚本、配置、报告工具
├── test-reports/                # 测试报告（JSON + Markdown + HTML）
├── README.md                    # 使用说明
└── TEST-PLAN.md                 # 测试计划与执行矩阵
```

> 详细说明参阅 [k6/README.md](k6/README.md)

## regression/ — 回归测试

代码变更后快速验证所有模块功能，复用 unit 测试脚本，结果独立保存。

```
regression/
├── test-scripts/                # 回归调度器 + 专项测试
├── problems/                    # 回归发现的问题记录
└── test-results/                # 回归测试报告
```

> 详细说明参阅 [regression/README.md](regression/README.md)

## 环境准备

所有测试需要 Docker（PostgreSQL + Redis）和后端服务运行：

```bash
cd backend
docker compose up -d            # 启动数据库
npm install                     # 安装依赖
npm run dev                     # 启动后端服务
```

## 注意事项

1. 测试脚本按顺序运行，部分测试依赖前置数据，不建议并发执行
2. k6 性能测试使用 `--reset` 参数时，会自动重启后端服务并设置 `K6_TEST=true`
3. Notification 模块测试依赖 Redis 服务
4. 可通过 `reset-env.js` 一键重置测试环境（重建数据库 + 重启服务）
