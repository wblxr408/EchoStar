# EchoStar 前端项目

> 情绪地图社交应用 - 匿名分享你的故事

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`

---

## 📦 核心依赖

| 依赖           | 版本    | 用途                   |
| -------------- | ------- | ---------------------- |
| Vue 3          | ^3.4.0  | 渐进式 JavaScript 框架 |
| Vue Router     | ^4.2.5  | 路由管理               |
| Pinia          | ^2.1.7  | 状态管理               |
| Axios          | ^1.6.2  | HTTP 请求              |
| ali-oss        | ^6.18.1 | 阿里云 OSS 图片上传    |
| Vite           | ^5.0.0  | 构建工具               |
| Sass           | ^1.69.5 | CSS 预处理器           |

---

## 📖 API 集成

### 生成 TypeScript 类型定义

```bash
npm run generate:types
```

这会从 `../docs/openapi.yaml` 生成 `src/types/api.d.ts`

### 启动 Mock API Server

```bash
npm run mock:api
```

访问 `http://localhost:4010` 可以调试所有接口(无需后端)

---

## 🛠️ 使用 API 客户端

我们基于 OpenAPI 规范封装了类型安全的 API 客户端:

```javascript
import { authApi, storyApi, mapApi } from '@/api/client';

// 登录
const { accessToken, user } = await authApi.login('user@example.com', '123456');

// 发布故事
const story = await storyApi.create({
  content: '今天心情很好',
  images: ['https://oss.../1.jpg'],
  location: { lng: 116.4074, lat: 39.9042 },
  emotionTag: '开心'
});

// 地图探索
const { stories } = await mapApi.explore(39.9042, 116.4074, 1000);
```

完整文档: [API 集成指南](../docs/API-集成指南.md)

## 📁 项目结构

```
frontend/
├── src/
│   ├── api/                  # API 客户端
│   │   ├── index.js         # Axios 实例配置
│   │   ├── client.js        # API 方法封装 ✨ 新增
│   │   ├── auth.js          # 认证接口
│   │   ├── story.js         # 故事接口
│   │   └── map.js           # 地图接口
│   ├── components/          # 通用组件
│   ├── views/               # 页面组件
│   ├── stores/              # Pinia 状态管理
│   ├── router/              # 路由配置
│   ├── utils/               # 工具函数
│   │   ├── upload.js        # 图片上传工具 ✨ 新增
│   │   ├── geo.js           # 地理位置工具
│   │   ├── time.js          # 时间处理工具
│   │   └── image.js         # 图片处理工具
│   ├── types/               # TypeScript 类型定义 ✨ 新增
│   │   └── api.d.ts         # API 类型(自动生成)
│   ├── styles/              # 全局样式
│   ├── App.vue
│   └── main.js
├── public/
├── .env.development         # 开发环境变量
├── .env.production          # 生产环境变量
├── .env.example             # 环境变量示例 ✨ 新增
├── vite.config.js
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.development` 并填写必要的配置:

```bash
# 已包含默认配置，可直接使用
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动，并自动打开浏览器

## 主要功能

### 已实现

- ✅ 用户认证（登录/注册）
- ✅ 路由导航
- ✅ 状态管理
- ✅ API 封装
- ✅ 公共组件（时光胶囊、情绪选择器、图片上传）
- ✅ 响应式布局

### 待实现

- ⏳ 高德地图集成
- ⏳ 地图标点与聚合
- ⏳ 故事发布与查看
- ⏳ 随机漫步功能
- ⏳ 管理后台功能
- ⏳ OSS 图片上传

## 开发指南

### 目录说明

#### `views/` - 页面组件

- `Home/` - 首页，包含登录/注册
- `Map/` - 地图主页，展示所有故事
- `Publish/` - 发布故事页面
- `Admin/` - 管理后台

#### `components/` - 公共组件

- `TimeCapsule.vue` - 时光胶囊组件
- `EmotionSelector.vue` - 情绪选择器
- `ImageUploader.vue` - 图片上传组件

#### `stores/` - 状态管理

- `user.js` - 用户状态（登录、用户信息）
- `map.js` - 地图状态（中心点、缩放、故事列表）
- `story.js` - 故事状态（我的故事列表）

#### `api/` - API 封装

- `index.js` - Axios 实例配置
- `auth.js` - 认证相关 API
- `story.js` - 故事相关 API
- `map.js` - 地图相关 API

#### `utils/` - 工具函数

- `geo.js` - 地理位置工具
- `time.js` - 时间格式化工具
- `image.js` - 图片处理工具

### 样式规范

项目使用 Sass 作为 CSS 预处理器，采用治愈系配色方案:

- 主色调: 紫蓝渐变 `#667eea` → `#764ba2`
- 辅助色: 粉橙 `#f093fb`
- 情绪色: 5 种情绪对应的颜色

全局样式变量定义在 `src/styles/variables.scss`

### 组件开发

使用 Vue 3 Composition API:

```vue
<template>
  <div class="my-component">
    <!-- 模板内容 -->
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 组件逻辑
const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>

<style scoped>
/* 组件样式 */
</style>
```

## 构建部署

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录

### 预览生产版本

```bash
npm run preview
```

### 部署

将 `dist/` 目录部署到静态服务器（如 Nginx、Vercel、Netlify）

#### Nginx 配置示例

```nginx
server {
  listen 80;
  server_name echostar.com;
  root /var/www/echostar/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://localhost:3000;
  }
}
```

## 常见问题

### 1. 地图不显示

需要先申请高德地图 API Key，并在 `.env` 文件中配置 `VITE_AMAP_KEY`

### 2. API 请求失败

检查后端服务是否启动，确认 `VITE_API_BASE_URL` 配置正确

### 3. 图片上传失败

需要配置 OSS 服务，并在后端实现上传凭证生成接口

## License

MIT
