# EchoStar / エコースター


<img width="1046" height="1024" alt="10" src="https://github.com/user-attachments/assets/cd77e73e-ad28-4fba-84d5-183223fecd7d" />

## 项目简介

EchoStar 是一个结合地图探索、情绪表达和地点故事发布的全栈项目。用户可以在地图上查看附近故事、发布带图片和情绪标签的内容、体验随机漫步与推荐流，也可以进行点赞、收藏、评论、举报、通知查看和公告浏览。项目同时提供游客模式、账号体系、头像与资料编辑、时光胶囊与可见时间段等前台能力，以及内容精选、用户管理、举报处理等后台能力。

仓库当前主要分为两部分：

- `frontend/`：Vue 3 + Vite + Pinia + Vue Router，负责地图交互、发布流程、用户中心和管理页面。
- `backend/`：Express + PostgreSQL + Redis，负责认证、故事、地图、评论、点赞、收藏、通知、举报和公告等 API。

## 快速上手

### 1. 启动后端

```bash
cd backend
npm install
```

复制环境变量模板并按本地环境填写：

```bash
cp .env.example .env
```

后端本地运行通常需要：

- PostgreSQL
- Redis
- 可选：RocketMQ、OSS、GitHub OAuth、邮件服务

数据库初始化可参考：

- `backend/scripts/init-db.sql`
- `backend/migrations/`

启动开发服务：

```bash
npm run dev
```

默认地址：`http://localhost:3000`

### 2. 启动前端

```bash
cd frontend
npm install
```

复制前端环境变量模板：

```bash
cp .env.example .env.development
```

至少需要配置：

- `VITE_API_BASE_URL`
- `VITE_AMAP_KEY`

启动前端开发服务：

```bash
npm run dev
```

默认地址：`http://localhost:5173`

### 3. 本地联调

1. 先启动后端，再启动前端。
2. 打开 `http://localhost:5173`。
3. 确认前端能访问 `http://localhost:3000/api`。
4. 如需图片上传、GitHub 登录、邮件验证码或消息队列能力，再补充对应环境变量。

