# EchoStar 后端环境配置指南

## 📋 前置要求

### 已验证的环境
- ✅ **Node.js**: v24.11.1 (要求 >= 18.0.0)
- ✅ **npm**: 11.6.2 (要求 >= 9.0.0)
- ✅ **依赖包**: 已成功安装 590 个包

### 需要安装的服务
在启动服务前，您需要确保以下服务已安装并运行：

1. **PostgreSQL** (版本 >= 12)
   - 下载地址: https://www.postgresql.org/download/
   - Windows: 使用安装程序或通过 Chocolatey: `choco install postgresql`
   - 建议安装时设置 postgres 用户密码，记住此密码

2. **Redis** (版本 >= 6.0)
   - 下载地址: https://redis.io/download
   - Windows: 使用 Memurai 或通过 WSL 安装
   - 或使用 Docker: `docker run -d -p 6379:6379 redis`

3. **Git** (已安装 ✅)

---

## 🚀 配置步骤

### 步骤 1: 配置 PostgreSQL 数据库

#### 1.1 创建数据库
打开 PostgreSQL 命令行工具 (psql) 或使用 pgAdmin，执行：

```sql
-- 创建数据库
CREATE DATABASE echostar;

-- 创建专用用户（可选，但推荐）
CREATE USER echostar_user WITH PASSWORD 'your_secure_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE echostar TO echostar_user;
```

#### 1.2 修改 .env 文件中的数据库配置
编辑 [`.env`](.env) 文件，更新以下配置：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=echostar
DB_USERNAME=postgres          # 或 echostar_user
DB_PASSWORD=your_postgres_password  # 替换为实际密码
DB_LOGGING=true               # 开发环境建议开启，生产环境关闭
```

**思路与理由**：
- 使用专用用户可以提升安全性，避免直接使用 postgres 超级用户
- 开启日志记录有助于调试数据库查询问题
- 数据库名称应与项目名称保持一致

### 步骤 2: 配置 Redis

#### 2.1 确保 Redis 正在运行

**Windows (使用 Docker)**:
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Windows (使用 WSL)**:
```bash
sudo apt-get install redis-server
sudo service redis-server start
```

#### 2.2 修改 .env 文件中的 Redis 配置

```bash
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=               # 如果设置了密码，填写在这里
REDIS_DB=0
```

**思路与理由**：
- 项目使用 Redis 进行缓存和请求限流
- 如果 Redis 未配置，限流功能将回退到内存存储（多实例部署时会失效）
- 开发环境可以不设置密码，生产环境必须设置强密码

### 步骤 3: 配置 JWT 密钥

在 [`.env`](.env) 文件中修改 JWT 配置：

```bash
# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**生成强密钥的方法**：

**方法 1: 使用 Node.js 生成**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**方法 2: 使用在线工具**
- https://www.grc.com/passwords.htm
- 选择至少 32 位的随机字符串

**思路与理由**：
- JWT 密钥用于签名和验证 token，泄露将导致严重安全问题
- 生产环境必须使用随机生成的强密钥
- 密钥长度至少 32 位，建议使用 64 位

### 步骤 4: 配置 GitHub OAuth（可选）

如果需要使用 GitHub 登录功能，需要进行以下配置：

#### 4.1 创建 GitHub OAuth App
1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写以下信息：
   - **Application name**: EchoStar Dev
   - **Homepage URL**: http://localhost:5173
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. 创建后，获取 Client ID 和 Client Secret

#### 4.2 更新 .env 文件
```bash
# GitHub OAuth 配置
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**思路与理由**：
- OAuth 回调 URL 必须与后端服务器地址匹配
- 开发环境使用 localhost，生产环境需要配置实际域名
- Client Secret 必须保密，不要提交到代码仓库

### 步骤 5: 配置阿里云 OSS（可选）

如果需要使用图片上传功能，需要配置阿里云 OSS：

#### 5.1 创建阿里云 OSS Bucket
1. 登录阿里云控制台: https://oss.console.aliyun.com/
2. 创建 Bucket，建议设置：
   - **地域**: 选择距离用户最近的区域（如 oss-cn-hangzhou）
   - **读写权限**: 私有
   - **跨域设置**: 允许 `http://localhost:5173` 和 `http://localhost:3000`

#### 5.2 获取访问密钥
1. 访问: https://ram.console.aliyun.com/manage/ak
2. 创建 AccessKey（建议使用 RAM 用户）
3. 保存 AccessKey ID 和 AccessKey Secret

#### 5.3 更新 .env 文件
```bash
# 阿里云 OSS 配置
OSS_ACCESS_KEY_ID=your_aliyun_access_key_id
OSS_ACCESS_KEY_SECRET=your_aliyun_access_key_secret
OSS_BUCKET=echostar-bucket
OSS_REGION=oss-cn-hangzhou
OSS_HOST=https://echostar-bucket.oss-cn-hangzhou.aliyuncs.com
```

**思路与理由**：
- OSS 用于存储用户上传的图片，避免服务器存储压力
- 私有权限确保资源安全，通过签名 URL 访问
- 开发环境可以暂不配置，图片上传功能将不可用

### 步骤 6: 其他配置

更新前端 URL（用于 CORS 配置）：

```bash
# 前端 URL
FRONTEND_URL=http://localhost:5173
```

**思路与理由**：
- CORS 配置允许前端域名访问后端 API
- 开发环境通常是 localhost:5173（Vite 默认端口）
- 生产环境需要配置实际的前端域名

---

## 🏃 启动服务

### 开发模式
```bash
cd f:\Repo\EchoStar\backend
npm run dev
```

### 生产模式
```bash
npm start
```

### 预期输出
```
✅ Database connection established successfully
🚀 Server running on port 3000
📍 Environment: development

✅ Server is ready at http://localhost:3000
```

---

## 🔍 验证配置

### 1. 测试健康检查端点
```bash
curl http://localhost:3000/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-03-14T12:00:00.000Z"
}
```

### 2. 测试数据库连接
检查控制台输出，应该看到：
```
✅ Database connection established successfully
✅ Database synchronized
```

### 3. 测试 Redis 连接
如果 Redis 连接成功，限流中间件将正常工作。

### 4. 查看日志
日志文件位于 `logs/` 目录（如果配置了文件日志）。

---

## ❌ 常见问题排查

### 问题 1: 数据库连接失败
**错误信息**: `❌ Unable to connect to database: connection refused`

**解决方案**:
1. 确认 PostgreSQL 服务是否运行
2. 检查 [`.env`](.env) 中的数据库配置是否正确
3. 检查防火墙是否阻止了连接

### 问题 2: Redis 连接失败
**错误信息**: `Redis connection failed` 或限流失效

**解决方案**:
1. 确认 Redis 服务是否运行: `redis-cli ping` (应返回 PONG)
2. 检查 Redis 端口是否正确 (默认 6379)
3. 如果使用 Docker，确认容器正在运行: `docker ps`

### 问题 3: JWT 验证失败
**错误信息**: `JsonWebTokenError: invalid signature`

**解决方案**:
1. 检查 [`.env`](.env) 中的 JWT_SECRET 是否正确
2. 如果使用了之前的 token，需要重新登录获取新 token
3. 确保前后端使用相同的 JWT_SECRET

### 问题 4: GitHub OAuth 失败
**错误信息**: GitHub 回调失败

**解决方案**:
1. 确认 GitHub OAuth App 的回调 URL 配置正确
2. 检查 Client ID 和 Client Secret 是否正确
3. 确认后端服务是否在运行

### 问题 5: OSS 上传失败
**错误信息**: `Access denied` 或 `SignatureDoesNotMatch`

**解决方案**:
1. 确认 AccessKey ID 和 Secret 是否正确
2. 检查 Bucket 名称和区域是否匹配
3. 确认 Bucket 的跨域配置是否正确
4. 检查 RAM 用户的权限配置

---

## 📝 配置检查清单

启动服务前，请确认以下配置已完成：

- [ ] PostgreSQL 已安装并运行
- [ ] 数据库 `echostar` 已创建
- [ ] `.env` 文件中的数据库配置已更新
- [ ] Redis 已安装并运行
- [ ] `.env` 文件中的 Redis 配置已更新
- [ ] JWT_SECRET 已设置为强密钥
- [ ] GitHub OAuth 已配置（如需要）
- [ ] 阿里云 OSS 已配置（如需要）
- [ ] FRONTEND_URL 已正确配置
- [ ] 所有依赖包已安装

---

## 🛡️ 安全建议

1. **永远不要提交 `.env` 文件到代码仓库**
   - `.env` 文件已添加到 `.gitignore` ✅

2. **使用强密码**
   - 数据库密码至少 16 位
   - JWT 密钥至少 32 位
   - Redis 密码至少 16 位

3. **生产环境配置**
   - 关闭数据库日志: `DB_LOGGING=false`
   - 使用强加密的 JWT 密钥
   - 启用 Redis 密码认证
   - 配置 CORS 白名单
   - 启用 HTTPS

4. **定期更新依赖**
   ```bash
   npm audit
   npm audit fix
   ```

---

## 📚 相关文档

- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Redis 文档](https://redis.io/documentation)
- [Sequelize 文档](https://sequelize.org/docs/v6/)
- [Express 文档](https://expressjs.com/)

---

## 🎯 下一步

配置完成后，您可以：

1. 启动后端服务
2. 启动前端服务（配置见前端文档）
3. 使用 Postman 测试 API 端点
4. 开始开发新功能

**祝你开发愉快！🚀**
