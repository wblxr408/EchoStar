# API 集成指南

> **版本**: V1.0
> **更新日期**: 2026-03-12

---

## 📋 概述

本指南帮助前后端团队快速集成 EchoStar API。

---

## 🚀 快速开始

### 1. 查看 API 文档

我们提供了两种格式的 API 文档:

#### 📖 Markdown 格式
适合快速查阅: [04-API设计.md](./04-API设计.md)

#### 🔧 OpenAPI 规范
适合工具集成: [openapi.yaml](./openapi.yaml)

---

## 🛠️ 前端集成步骤

### Step 1: 安装 Swagger UI (可选)

在项目根目录运行:

```bash
npm install -g @stoplight/prism-cli

# 启动 Mock Server
prism mock docs/openapi.yaml --port 4010
```

访问 `http://localhost:4010` 即可在线调试 API

---

### Step 2: 生成 TypeScript 类型定义

使用 `openapi-typescript` 自动生成类型:

```bash
# 安装工具
npm install -D openapi-typescript

# 生成类型文件
npx openapi-typescript docs/openapi.yaml --output src/types/api.d.ts
```

**生成的类型示例**:

```typescript
// src/types/api.d.ts
export interface components {
  schemas: {
    User: {
      id: number;
      username: string;
      email: string;
      avatar?: string;
      role: 'user' | 'admin';
      createdAt: string;
    };
    Story: {
      id: number;
      content?: string;
      images: string[];
      location: {
        lng: number;
        lat: number;
      };
      emotionTag: '治愈' | '难过' | '开心' | '打卡';
      // ...
    };
  };
}
```

---

### Step 3: 创建 API 客户端

#### 方式 A: 手动封装 (推荐)

```typescript
// src/api/client.ts
import axios from 'axios';
import type { components } from '@/types/api';

type User = components['schemas']['User'];
type Story = components['schemas']['Story'];

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
});

// 请求拦截器:自动添加 Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器:统一错误处理
apiClient.interceptors.response.use(
  (response) => response.data.data, // 直接返回 data 字段
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期,跳转登录
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<any, { accessToken: string; user: User }>('/auth/login', {
      email,
      password,
    }),

  register: (data: { email: string; password: string; username: string }) =>
    apiClient.post<any, { accessToken: string; user: User }>('/auth/register', data),

  me: () => apiClient.get<any, User>('/auth/me'),
};

export const storyApi = {
  create: (data: components['schemas']['CreateStoryRequest']) =>
    apiClient.post<any, Story>('/stories', data),

  getById: (id: number) => apiClient.get<any, Story>(`/stories/${id}`),

  getMy: (page = 1, limit = 20) =>
    apiClient.get<any, { total: number; list: Story[] }>('/stories/my', {
      params: { page, limit },
    }),

  delete: (id: number) => apiClient.delete(`/stories/${id}`),

  getUploadToken: () =>
    apiClient.get<any, {
      accessKeyId: string;
      accessKeySecret: string;
      stsToken: string;
      bucket: string;
      region: string;
    }>('/stories/upload-token'),
};

export const mapApi = {
  explore: (params: { lat: number; lng: number; radius?: number }) =>
    apiClient.get('/map/explore', { params }),

  random: () => apiClient.get('/map/random'),

  locationWall: (params: { lat: number; lng: number; radius?: number }) =>
    apiClient.get('/map/location-wall', { params }),
};
```

#### 方式 B: 使用代码生成器 (自动化)

```bash
# 安装 openapi-generator-cli
npm install @openapitools/openapi-generator-cli -g

# 生成 TypeScript Axios 客户端
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g typescript-axios \
  -o src/api/generated
```

---

### Step 4: 在组件中使用

```typescript
// src/pages/Login.tsx
import { authApi } from '@/api/client';

export default function Login() {
  const handleLogin = async (email: string, password: string) => {
    try {
      const { accessToken, user } = await authApi.login(email, password);

      // 保存 Token
      localStorage.setItem('accessToken', accessToken);

      // 跳转首页
      router.push('/');
    } catch (error) {
      console.error('登录失败', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {/* ... */}
    </form>
  );
}
```

---

## 🔧 后端实现清单

### 必须实现的中间件

#### 1. CORS 配置

```javascript
// app.js
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite 开发环境
    'https://echostar.com'
  ],
  credentials: true
}));
```

#### 2. JWT 认证中间件

```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      code: 4001,
      message: '未登录',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 4001,
      message: 'Token 无效或已过期',
      data: null
    });
  }
};
```

#### 3. 限流中间件

```javascript
// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10, // 最多 10 次
  message: {
    code: 4009,
    message: '请求过于频繁,请稍后再试',
    data: null
  }
});

export const createStoryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { code: 4009, message: '发布过于频繁', data: null }
});
```

---

### 路由注册示例

```javascript
// routes/index.js
import express from 'express';
import authRoutes from './auth.js';
import storyRoutes from './story.js';
import mapRoutes from './map.js';
import adminRoutes from './admin.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/stories', storyRoutes);
router.use('/map', mapRoutes);
router.use('/admin', adminRoutes);

export default router;
```

```javascript
// routes/auth.js
import express from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authLimiter, registerController);
router.post('/login', authLimiter, loginController);
router.get('/me', authenticate, getMeController);

export default router;
```

---

## 📝 接口测试

### 使用 Postman

1. 导入 OpenAPI 文件: `docs/openapi.yaml`
2. Postman 会自动生成所有接口
3. 设置环境变量:
   - `base_url`: `http://localhost:3000/api/v1`
   - `access_token`: (登录后获取)

### 使用 cURL

#### 注册

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "username": "testuser"
  }'
```

#### 登录

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

#### 获取用户信息

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 常见问题

### 1. CORS 跨域错误

**现象**: `Access to XMLHttpRequest has been blocked by CORS policy`

**解决**: 检查后端 CORS 配置是否包含前端域名

```javascript
app.use(cors({
  origin: 'http://localhost:5173', // 前端地址
  credentials: true
}));
```

---

### 2. 401 未登录错误

**检查清单**:
- [ ] Token 是否正确保存在 localStorage
- [ ] 请求头是否添加 `Authorization: Bearer {token}`
- [ ] Token 是否已过期(有效期 7 天)

---

### 3. 图片上传失败

**流程**:
1. 调用 `GET /stories/upload-token` 获取 OSS 凭证
2. 使用 `ali-oss` SDK 直传文件
3. 获取图片 URL 后,调用 `POST /stories` 发布故事

**示例代码**:

```typescript
import OSS from 'ali-oss';

// 1. 获取凭证
const credentials = await storyApi.getUploadToken();

// 2. 初始化 OSS 客户端
const client = new OSS({
  region: credentials.region,
  accessKeyId: credentials.accessKeyId,
  accessKeySecret: credentials.accessKeySecret,
  stsToken: credentials.stsToken,
  bucket: credentials.bucket
});

// 3. 上传文件
const fileName = `stories/${Date.now()}-${file.name}`;
const result = await client.put(fileName, file);

// 4. 使用图片 URL 发布故事
await storyApi.create({
  content: '今天天气不错',
  images: [result.url],
  location: { lng: 116.4074, lat: 39.9042 },
  emotionTag: '开心'
});
```

---

## 🔗 相关文档

- [架构概览](./01-架构概览.md)
- [数据模型](./03-数据模型.md)
- [API 设计规范](./04-API设计.md)
- [OpenAPI 规范文件](./openapi.yaml)

---

## ✅ 验收标准

### 前端团队

- [ ] 已生成 TypeScript 类型定义
- [ ] 已封装 API 客户端
- [ ] 已测试登录/注册流程
- [ ] 已测试图片上传流程
- [ ] 已测试地图查询接口

### 后端团队

- [ ] 已实现所有接口
- [ ] 已部署 Swagger UI 文档
- [ ] 已配置 CORS
- [ ] 已实现 JWT 认证
- [ ] 已实现限流中间件
- [ ] 已编写接口测试用例

---

## 📞 联系方式

如有问题,请在项目 Issue 中提出或联系团队负责人。
