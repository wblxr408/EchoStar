# EchoStar Backend

EchoStar 后端服务 - 基于位置的情绪地图社交应用

## 技术栈

- **Node.js** 18+ / Express.js
- **PostgreSQL** 14+ (PostGIS 扩展)
- **Redis** 7+
- **Sequelize ORM**
- **JWT 认证**
- **阿里云 OSS** (图片存储)

## 项目结构

```
backend/
├── src/
│   ├── modules/          # 业务模块
│   │   ├── auth/         # 认证模块
│   │   ├── story/        # 故事模块
│   │   ├── map/          # 地图模块
│   │   └── admin/        # 管理员模块
│   ├── common/           # 公共层
│   ├── config/           # 配置
│   ├── routes/           # 路由
│   ├── app.js            # Express 应用
│   └── server.js         # 启动入口
├── tests/                # 测试
├── .env.example          # 环境变量示例
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置:

```bash
cp .env.example .env
```

### 3. 安装 PostgreSQL 和 PostGIS

```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgis

# macOS
brew install postgresql postgis

# 启动 PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql # macOS
```

### 4. 创建数据库

```bash
psql -U postgres

CREATE DATABASE echostar;
\c echostar
CREATE EXTENSION postgis;
\q
```

### 5. 启动 Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo service redis-server start

# macOS
brew install redis
brew services start redis
```

### 6. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动

## API 文档

### 认证 API

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/github` - GitHub OAuth 登录
- `GET /api/auth/me` - 获取当前用户信息

### 故事 API

- `POST /api/stories` - 发布故事
- `GET /api/stories/:id` - 查看故事详情
- `DELETE /api/stories/:id` - 删除故事
- `GET /api/stories/me/list` - 我的故事列表
- `GET /api/stories/upload/token` - 获取上传凭证

### 地图 API

- `GET /api/map/explore` - 范围查询故事
- `GET /api/map/random` - 随机漫步
- `GET /api/map/wall` - 同地点故事墙
- `GET /api/map/clusters` - 获取聚合数据

### 管理员 API

- `POST /api/admin/stories/:id/recommend` - 设为推荐
- `POST /api/admin/stories/:id/shadowban` - Shadowban
- `POST /api/admin/stories/:id/restore` - 恢复故事
- `GET /api/admin/reports` - 举报列表
- `POST /api/admin/reports/:id/handle` - 处理举报
- `GET /api/admin/statistics` - 数据统计

## 数据库迁移

如需手动创建 PostGIS 空间索引:

```sql
-- 创建空间索引
CREATE INDEX stories_location_gist_idx
ON stories
USING GIST (ST_MakePoint(longitude, latitude));
```

## 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

## 部署

### 1. 构建生产环境

```bash
NODE_ENV=production npm start
```

### 2. 使用 PM2 (推荐)

```bash
npm install -g pm2
pm2 start src/server.js --name echostar-backend
pm2 save
pm2 startup
```

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | development |
| `PORT` | 服务端口 | 3000 |
| `DB_HOST` | 数据库主机 | localhost |
| `DB_PORT` | 数据库端口 | 5432 |
| `DB_NAME` | 数据库名称 | echostar |
| `JWT_SECRET` | JWT 密钥 | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth ID | - |
| `REDIS_HOST` | Redis 主机 | localhost |
| `OSS_BUCKET` | OSS 存储桶 | - |

## 模块依赖关系

```
Auth (基础模块)
  ↓
Story (核心模块)
  ↓
Map (查询模块, 只读)
  ↓
Admin (管理模块)
```

## 代码规范

- Controller 层: 处理 HTTP 请求
- Service 层: 业务逻辑
- Model 层: 数据库操作

## License

MIT
