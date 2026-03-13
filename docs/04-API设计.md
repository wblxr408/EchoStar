# 4. API 设计规范

> **文档版本**: V1.0
> **更新日期**: 2026-03-12
> **API 风格**: RESTful

---

## 4.1 基础信息

### 4.1.1 Base URL

```
开发环境: http://localhost:3000/api/v1
生产环境: https://api.echostar.com/v1
```

### 4.1.2 统一响应格式

**成功响应**:

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**失败响应**:

```json
{
  "code": 4001,
  "message": "未登录",
  "data": null
}
```

### 4.1.3 统一错误码

| Code | 含义           | HTTP Status |
| ---- | -------------- | ----------- |
| 0    | 成功           | 200         |
| 4000 | 请求参数错误   | 400         |
| 4001 | 未登录         | 401         |
| 4003 | 无权限         | 403         |
| 4004 | 资源不存在     | 404         |
| 4009 | 请求过于频繁   | 429         |
| 5000 | 服务器错误     | 500         |
| 5001 | 数据库错误     | 500         |
| 5002 | 第三方服务错误 | 502         |

---

## 4.2 认证方式

### 4.2.1 JWT Token

**登录成功后返回**:

```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "user123",
      "avatar": "https://..."
    }
  }
}
```

**后续请求携带 Token**:

```http
GET /api/v1/stories/my
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2.2 Token 过期处理

- `accessToken` 有效期: 7 天
- 过期后前端返回登录页
- 暂不实现 refreshToken (MVP 简化)

---

## 4.3 核心接口列表

### 4.3.1 Auth 模块

#### 1. 邮箱注册

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456",
  "username": "nickname"
}
```

**响应**:

```json
{
  "code": 0,
  "data": {
    "accessToken": "...",
    "user": { "id": 1, "username": "nickname" }
  }
}
```

---

#### 2. 邮箱登录

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456"
}
```

---

#### 3. GitHub OAuth 登录

```http
GET /auth/oauth/github
# 跳转到 GitHub 授权页

# GitHub 回调
GET /auth/oauth/github/callback?code=xxx
# 后端处理后重定向到前端,URL 带上 token
```

---

#### 4. 获取当前用户信息

```http
GET /auth/me
Authorization: Bearer {token}
```

**响应**:

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "username": "nickname",
    "email": "user@example.com",
    "avatar": "https://...",
    "role": "user"
  }
}
```

---

### 4.3.2 Story 模块

#### 1. 获取 OSS 上传凭证

```http
GET /stories/upload-token
Authorization: Bearer {token}
```

**响应**:

```json
{
  "code": 0,
  "data": {
    "accessKeyId": "xxx",
    "accessKeySecret": "xxx",
    "stsToken": "xxx",
    "bucket": "echostar-images",
    "region": "oss-cn-hangzhou",
    "expiration": "2026-03-12T12:00:00Z"
  }
}
```

**前端上传流程**:

```javascript
// 1. 获取凭证
const { data } = await api.get('/stories/upload-token');

// 2. 使用 ali-oss SDK 直传
import OSS from 'ali-oss';
const client = new OSS({
  region: data.region,
  accessKeyId: data.accessKeyId,
  accessKeySecret: data.accessKeySecret,
  stsToken: data.stsToken,
  bucket: data.bucket
});

const result = await client.put('stories/xxx.jpg', file);
// result.url 即为图片 URL
```

---

#### 2. 发布故事

```http
POST /stories
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "今天心情很好",
  "images": ["https://oss.../1.jpg", "https://oss.../2.jpg"],
  "location": {
    "lng": 116.4074,
    "lat": 39.9042
  },
  "emotionTag": "治愈",
  "isTimeCapsule": false,
  "unlockAt": null
}
```

**字段说明**:

| 字段              | 必填 | 说明                                  |
| ----------------- | ---- | ------------------------------------- |
| `content`       | 0    | 故事正文,最多 1000 字                 |
| `images`        | 1    | 图片 URL 数组,1-9 张                  |
| `location`      | 0    | 经纬度对象                            |
| `emotionTag`    | 1    | 情绪标签: '治愈'/'难过'/'开心'/'打卡' |
| `isTimeCapsule` | 1    | 是否时光胶囊,默认 false               |
| `unlockAt`      | 1    | 解锁时间,格式: ISO 8601               |

**响应**:

```json
{
  "code": 0,
  "data": {
    "id": 123,
    "content": "今天心情很好",
    "createdAt": "2026-03-12T10:00:00Z"
  }
}
```

---

#### 3. 查看故事详情

```http
GET /stories/:id
Authorization: Bearer {token} (可选)
```

**响应**:

```json
{
  "code": 0,
  "data": {
    "id": 123,
    "content": "今天心情很好",
    "images": ["https://..."],
    "location": {
      "lng": 116.4074,
      "lat": 39.9042
    },
    "emotionTag": "治愈",
    "isTimeCapsule": false,
    "viewCount": 42,
    "createdAt": "2026-03-12T10:00:00Z",
    "author": {
      "id": 1,
      "username": "匿名用户",  // 匿名显示
      "avatar": "https://..."
    }
  }
}
```

**特殊逻辑**:

- 时光胶囊未解锁时,返回 `content: null`,仅显示倒计时
- Shadowban 的故事,仅作者本人可见

---

#### 4. 我的故事列表

```http
GET /stories/my?page=1&limit=20
Authorization: Bearer {token}
```

**响应**:

```json
{
  "code": 0,
  "data": {
    "total": 42,
    "list": [
      {
        "id": 123,
        "content": "...",
        "images": [],
        "createdAt": "...",
        "viewCount": 10,
        "visibility": "public"  // 显示可见性状态
      }
    ]
  }
}
```

---

#### 5. 删除故事

```http
DELETE /stories/:id
Authorization: Bearer {token}
```

**响应**:

```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

### 4.3.3 Map 模块

#### 1. 范围查询

```http
GET /map/explore?lat=39.9042&lng=116.4074&radius=1000
```

**参数**:

| 参数       | 必填 | 说明                         |
| ---------- | ---- | ---------------------------- |
| `lat`    | 0    | 纬度                         |
| `lng`    | 0    | 经度                         |
| `radius` | 1    | 半径(米),默认 1000,最大 5000 |

**响应**:

```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 123,
        "location": {
          "lng": 116.4074,
          "lat": 39.9042
        },
        "emotionTag": "治愈",
        "preview": "今天心情很好...",  // 前 30 字
        "distance": 120,  // 距离(米)
        "createdAt": "2小时前",
        "isTimeCapsule": false
      }
    ]
  }
}
```

---

#### 2. 随机漫步

```http
GET /map/PCG
```

**响应**:

```json
{
  "code": 0,
  "data": {
    "location": {
      "lng": 121.4737,
      "lat": 31.2304
    },
    "story": {
      "id": 456,
      "content": "...",
      "images": []
    }
  }
}
```

**算法逻辑**:

1. 从数据库随机选取一个有故事的城市
2. 在该城市范围内随机选择一个故事
3. 优先选择最近 7 天的故事

---

#### 3. 同地点故事墙

```http
GET /map/location-wall?lat=39.9042&lng=116.4074&radius=100
```

**说明**: 查询指定坐标 100 米内的所有故事

**响应**:

```json
{
  "code": 0,
  "data": {
    "total": 12,
    "stories": [
      {
        "id": 123,
        "content": "...",
        "createdAt": "2026-03-10T10:00:00Z"
      }
    ]
  }
}
```

---

#### 4. 点聚合数据

```http
GET /map/cluster?bounds=39.9,116.3,40.0,116.5&zoom=12
```

**参数**:

| 参数       | 说明                                         |
| ---------- | -------------------------------------------- |
| `bounds` | 地图视野范围:`sw_lat,sw_lng,ne_lat,ne_lng` |
| `zoom`   | 地图缩放级别 (3-18)                          |

**响应**:

```json
{
  "code": 0,
  "data": {
    "clusters": [
      {
        "location": {
          "lng": 116.4074,
          "lat": 39.9042
        },
        "count": 5,  // 聚合点数量
        "stories": [...]  // 该聚合点下的故事
      }
    ]
  }
}
```

**实现建议**: 前端使用 `supercluster` 库做聚合,后端只返回原始点数据

---

### 4.3.4 Admin 模块

#### 1. 设为推荐

```http
POST /admin/stories/:id/recommend
Authorization: Bearer {token}  (需要 admin 角色)

{
  "reason": "优质内容"
}
```

---

#### 2. Shadowban

```http
POST /admin/stories/:id/shadowban
Authorization: Bearer {token}

{
  "reason": "违规内容"
}
```

**效果**: 故事 `visibility` 改为 `shadowban`,仅作者可见

---

#### 3. 恢复正常

```http
POST /admin/stories/:id/restore
Authorization: Bearer {token}
```

---

#### 4. 举报列表

```http
GET /admin/reports?status=pending
Authorization: Bearer {token}
```

---

## 4.4 分页规范

**统一使用 `page` + `limit`**:

```http
GET /stories/my?page=1&limit=20
```

**响应格式**:

```json
{
  "code": 0,
  "data": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "list": [...]
  }
}
```

---

## 4.5 限流策略

| 接口      | 限流规则        |
| --------- | --------------- |
| 登录/注册 | 10 次/分钟/IP   |
| 发布故事  | 5 次/分钟/用户  |
| 上传凭证  | 20 次/分钟/用户 |
| 查询接口  | 100 次/分钟/IP  |

**实现**: 使用 Redis + `express-rate-limit`

---

## 4.6 CORS 配置

```javascript
// app.js
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:5173',  // 开发环境
    'https://echostar.com'    // 生产环境
  ],
  credentials: true
}));
```

---

## 验收标准

- [ ] 前后端团队已对齐所有接口
- [ ] Postman 测试集已创建
- [X] 错误码文档已共享
- [ ] 限流中间件已实现
- [ ] CORS 配置已测试通过
