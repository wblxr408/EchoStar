# 后端 API 声明文档

> **版本**: V1.4
> **更新日期**: 2026-03-22
> **Base URL**: `http://localhost:3000/api`

---

## 目录

1. [认证模块 (Auth)](#1-认证模块-auth)
2. [故事模块 (Story)](#2-故事模块-story)
3. [评论模块 (Comment)](#3-评论模块-comment)
4. [点赞模块 (Like)](#4-点赞模块-like)
5. [收藏模块 (Favorite)](#5-收藏模块-favorite)
6. [通知模块 (Notification)](#6-通知模块-notification)
7. [地图模块 (Map)](#7-地图模块-map)
8. [管理员模块 (Admin)](#8-管理员模块-admin)
9. [举报模块 (Report)](#9-举报模块-report)

---

## 统一响应格式

### 成功响应
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 失败响应
```json
{
  "code": 4001,
  "message": "未登录",
  "data": null
}
```

### 分页格式
```json
{
  "code": 0,
  "data": {
    "list": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

---

## 1. 认证模块 (Auth)

### 1.1 发送验证码
```http
POST /auth/send-code
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| email | 是 | string | 邮箱 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "验证码已发送到您的邮箱，有效期5分钟"
  }
}
```

**限流**: 60秒内不能重复发送

---

### 1.2 用户注册（需验证码）
```http
POST /auth/register
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| email | 是 | string | 邮箱 |
| password | 是 | string | 密码 |
| username | 是 | string | 用户名 |
| verificationCode | 是 | string | 邮箱验证码（5位数字） |

**响应**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "user123"
    }
  }
}
```

---

### 1.3 用户登录
```http
POST /auth/login
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| email | 是 | string | 邮箱 |
| password | 是 | string | 密码 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "user123",
      "avatar": "https://..."
    }
  }
}
```

---

### 1.4 GitHub OAuth 登录
```http
POST /auth/github
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| code | 是 | string | GitHub 授权码 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "githubuser",
      "avatar": "https://..."
    }
  }
}
```

---

### 1.5 获取当前用户信息
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
    "email": "user@example.com",
    "username": "user123",
    "avatar": "https://...",
    "bio": "个人简介",
    "role": "user",
    "status": "active",
    "createdAt": "2026-03-19T10:00:00Z"
  }
}
```

---

### 1.6 注销账号
```http
DELETE /auth/me
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "账号已注销"
  }
}
```

---

### 1.7 查看其他用户信息
```http
GET /auth/users/:userId
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "username": "user123",
    "avatar": "https://...",
    "bio": "个人简介",
    "stories": [
      {
        "id": 123,
        "content": "...",
        "createdAt": "2026-03-19T10:00:00Z",
        "viewCount": 10,
        "isTimeCapsule": false,
        "unlockAt": null
      }
    ]
  }
}
```

---

### 1.8 修改个人信息
```http
PUT /auth/users/me
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| username | 否 | string | 用户名 |
| avatarUrl | 否 | string | 头像 URL |
| bio | 否 | string | 个人简介 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "username": "user123",
    "avatar": "https://...",
    "bio": "个人简介"
  }
}
```

---

### 1.9 修改密码
```http
PUT /auth/users/me/password
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| oldPassword | 是 | string | 原密码 |
| newPassword | 是 | string | 新密码 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "密码修改成功"
  }
}
```

### 1.10 管理员登录
```http
POST /auth/admin/login
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| email | 是 | string | 邮箱 |
| password | 是 | string | 密码 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "user123",
      "avatar": "https://..."
    }
  }
}
```

---

### 1.11 忘记密码
```http
POST /auth/forgot-password
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| email | 是 | string | 邮箱 |
| password | 是 | string | 新密码 |
| verificationCode | 是 | string | 邮箱验证码（通过 1.1 接口获取） |

**响应**:
```json
{
  "code": 0,
  "message": "密码重置成功，请使用新密码登录"
}
```

**注意**:
- 需要先调用 `/auth/send-code` 获取验证码
- 仅支持邮箱注册用户（非OAuth用户）
- 验证码有效期为 5 分钟

---

### 1.12 管理员获取所有用户列表
```http
GET /auth/admin/users?page=1&pageSize=20&category=normal
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| page | 否 | number | 页码，默认 1 |
| pageSize | 否 | number | 每页数量，默认 20 |
| category | 否 | string | 用户类别：'normal'（包含 normal 和 recommended）或 'deleted'，默认 'normal' |

**响应**:
```json
{
  "code": 0,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "user123",
        "email": "user@example.com",
        "role": "user",
        "status": "normal",
        "bio": "个人简介",
        "avatarUrl": "https://...",
        "createdAt": "2026-03-19T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20,
      "totalPages": 5
    }
  }
}
```

**注意**:
- 需要管理员权限
- `category=normal` 返回状态为 `normal` 和 `recommended` 的用户
- `category=deleted` 返回已删除的用户

---

## 2. 故事模块 (Story)

### 2.1 发布故事
```http
POST /stories
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| content | 是 | string | 故事正文，最多 1000 字 |
| images | 否 | string[] | 图片 URL 数组，1-9 张 |
| location | 是 | object | 经纬度对象 `{ lng: number, lat: number }` |
| emotionTag | 是 | string | 情绪标签：'治愈'/'难过'/'开心'/'打卡' |
| isTimeCapsule | 否 | boolean | 是否时光胶囊，默认 false |
| unlockAt | 否 | string | 解锁时间，格式: ISO 8601 |
| visibility | 否 | string | 可见性：'public'/'shadowban' |

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": 123,
    "content": "今天心情很好",
    "createdAt": "2026-03-19T10:00:00Z"
  }
}
```

---

### 2.2 我的故事列表
```http
GET /stories/me/list?page=1&limit=10
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 123,
        "content": "...",
        "images": ["https://..."],
        "createdAt": "2026-03-19T10:00:00Z",
        "viewCount": 10,
        "visibility": "public"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### 2.3 获取 OSS 上传凭证
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

---

### 2.4 查看故事详情
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
    "isRecommended": false,
    "viewCount": 42,
    "likeCount": 10,
    "commentCount": 5,
    "createdAt": "2026-03-19T10:00:00Z",
    "author": {
      "id": 1,
      "username": "user123",
      "avatar": "https://..."
    }
  }
}
```

**特殊逻辑**:
- 时光胶囊未解锁时，返回 `content: null`，仅显示倒计时
- Shadowban 的故事，仅作者本人可见

---

### 2.5 删除故事
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

### 2.6 修改故事内容
```http
POST /stories/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| content | 是 | string | 故事内容 |
| emotionTag | 是 | string | 情绪标签 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": 123,
    "content": "更新后的内容",
    "emotionTag": "治愈"
  }
}
```

---

### 2.7 修改故事可见性
```http
PUT /stories/:id/visibility
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| visibility | 是 | string | 可见性：'public' 或 'shadowban' |

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": 123,
    "visibility": "public"
  }
}
```

---

### 2.8 搜索故事
```http
GET /stories/search?keyword=关键词&page=1&limit=10
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| keyword | 是 | string | 搜索关键词 |
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 123,
        "content": "...",
        "images": ["https://..."],
        "location": {
          "lng": 116.4074,
          "lat": 39.9042
        },
        "emotionTag": "治愈",
        "isTimeCapsule": false,
        "isRecommended": false,
        "viewCount": 10,
        "likeCount": 5,
        "commentCount": 2,
        "createdAt": "2026-03-19T10:00:00Z",
        "author": {
          "id": 1,
          "username": "user123",
          "avatar": "https://..."
        }
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 2.9 解锁时光胶囊（定时任务）
```http
POST /stories/:id/unlock
```

**响应**:
```json
{
  "code": 0,
  "message": "时光胶囊解锁成功"
}
```

---

### 2.10 管理员获取所有帖子
```http
GET /stories/admin/all?page=1&limit=20&visibility=public
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 20 |
| visibility | 否 | string | 过滤：'public'/'shadowban'，不传则返回全部 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 123,
        "emotionTag": "治愈",
        "content": "今天心情很好...",
        "visibility": "public",
        "createdAt": "2026-03-22T10:00:00Z",
        "author": {
          "id": 1,
          "username": "user123",
          "avatar": "https://..."
        }
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

---

## 3. 评论模块 (Comment)

### 3.1 创建评论
```http
POST /comments
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| storyId | 是 | number | 故事 ID |
| content | 是 | string | 评论内容，最多 500 字 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": 123,
    "content": "评论内容",
    "createdAt": "2026-03-19T10:00:00Z"
  }
}
```

---

### 3.2 搜索评论
```http
GET /comments/search?keyword=关键词&page=1&limit=10
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| keyword | 是 | string | 搜索关键词 |
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 123,
        "content": "...",
        "createdAt": "2026-03-19T10:00:00Z",
        "storyId": 456,
        "user": {
          "id": 1,
          "username": "user123",
          "avatar": "https://..."
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3.3 获取用户的评论列表
```http
GET /comments/me?page=1&limit=10
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 123,
        "content": "...",
        "createdAt": "2026-03-19T10:00:00Z",
        "story": {
          "id": 456,
          "content": "故事内容预览..."
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3.4 获取故事评论列表
```http
GET /comments/story/:storyId?page=1&limit=10
```

**查询参数**:
| 参数 | 必填 | 说明 |
|------|-------|------|
| storyId | 是 | 故事 ID |
| page | 否 | 页码，默认 1 |
| limit | 否 | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 123,
        "content": "...",
        "createdAt": "2026-03-19T10:00:00Z",
        "user": {
          "id": 1,
          "username": "user123",
          "avatar": "https://..."
        }
      }
    ],
    "pagination": {
      "total": 20,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

---

### 3.5 统计评论数量
```http
GET /comments/:storyId/count
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "storyId": 123,
    "commentCount": 20
  }
}
```

---

### 3.6 删除评论
```http
DELETE /comments/:id
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

## 4. 点赞模块 (Like)

### 4.1 点赞/取消点赞（自动切换）
```http
POST /likes
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| storyId | 是 | number | 故事 ID |

**响应**:
```json
{
  "code": 0,
  "data": {
    "isLiked": true,
    "message": "点赞成功"
  }
}
```

---

### 4.2 创建点赞（明确点赞，不能取消）
```http
POST /likes/create
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| storyId | 是 | number | 故事 ID |

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": 123,
    "storyId": 456,
    "createdAt": "2026-03-19T10:00:00Z"
  }
}
```

---

### 4.3 取消点赞
```http
DELETE /likes/:storyId
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "message": "取消点赞成功"
}
```

---

### 4.4 获取故事点赞列表
```http
GET /likes/story/:storyId?page=1&limit=10
```

**查询参数**:
| 参数 | 必填 | 说明 |
|------|-------|------|
| storyId | 是 | 故事 ID |
| page | 否 | 页码，默认 1 |
| limit | 否 | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "likes": [
      {
        "id": 123,
        "createdAt": "2026-03-19T10:00:00Z",
        "user": {
          "id": 1,
          "username": "user123",
          "avatar": "https://..."
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

---

### 4.5 检查是否已点赞
```http
GET /likes/:storyId/check
Authorization: Bearer {token} (可选)
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "storyId": 123,
    "isLiked": true
  }
}
```

---

### 4.6 统计点赞数量
```http
GET /likes/:storyId/count
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "storyId": 123,
    "likeCount": 42
  }
}
```

---

### 4.7 获取用户的点赞列表
```http
GET /likes/me?page=1&limit=10
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "likes": [
      {
        "id": 123,
        "createdAt": "2026-03-19T10:00:00Z",
        "story": {
          "id": 456,
          "content": "...",
          "images": ["https://..."],
          "emotionTag": "治愈",
          "createdAt": "2026-03-19T10:00:00Z"
        }
      }
    ],
    "pagination": {
      "total": 20,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

---

### 4.8 批量检查多个故事的点赞状态
```http
POST /likes/check-multiple
Authorization: Bearer {token} (可选)
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 说明 |
|------|-------|------|
| storyIds | 是 | 故事 ID 数组 |

**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "storyId": 123,
      "isLiked": true
    },
    {
      "storyId": 456,
      "isLiked": false
    }
  ]
}
```

---

## 5. 收藏模块 (Favorite)

### 5.1 收藏/取消收藏（自动切换）
```http
POST /favorites
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| storyId | 是 | number | 故事 ID |

**响应**:
```json
{
  "code": 0,
  "data": {
    "isFavorited": true,
    "message": "收藏成功"
  }
}
```

---

### 5.2 创建收藏（明确收藏，不能取消）
```http
POST /favorites/create
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| storyId | 是 | number | 故事 ID |

**响应**:
```json
{
  "code": 0,
  "data": {
    "id": 123,
    "storyId": 456,
    "createdAt": "2026-03-19T10:00:00Z"
  }
}
```

---

### 5.3 取消收藏
```http
DELETE /favorites/:storyId
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "message": "取消收藏成功"
}
```

---

### 5.4 获取故事收藏列表
```http
GET /favorites/story/:storyId?page=1&limit=10
```

**查询参数**:
| 参数 | 必填 | 说明 |
|------|-------|------|
| storyId | 是 | 故事 ID |
| page | 否 | 页码，默认 1 |
| limit | 否 | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "favorites": [
      {
        "id": 123,
        "createdAt": "2026-03-19T10:00:00Z",
        "user": {
          "id": 1,
          "username": "user123",
          "avatar": "https://..."
        }
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 5.5 检查是否已收藏
```http
GET /favorites/:storyId/check
Authorization: Bearer {token} (可选)
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "storyId": 123,
    "isFavorited": true
  }
}
```

---

### 5.6 统计收藏数量
```http
GET /favorites/:storyId/count
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "storyId": 123,
    "favoriteCount": 15
  }
}
```

---

### 5.7 获取用户的收藏列表（我的收藏）
```http
GET /favorites/me?page=1&limit=10
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "favorites": [
      {
        "id": 123,
        "createdAt": "2026-03-19T10:00:00Z",
        "story": {
          "id": 456,
          "content": "...",
          "images": ["https://..."],
          "emotionTag": "治愈",
          "createdAt": "2026-03-19T10:00:00Z"
        }
      }
    ],
    "pagination": {
      "total": 20,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

---

### 5.8 批量检查多个故事的收藏状态
```http
POST /favorites/check-multiple
Authorization: Bearer {token} (可选)
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 说明 |
|------|-------|------|
| storyIds | 是 | 故事 ID 数组 |

**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "storyId": 123,
      "isFavorited": true
    },
    {
      "storyId": 456,
      "isFavorited": false
    }
  ]
}
```

---

## 6. 通知模块 (Notification)

### 6.1 获取我的通知列表（分页）
```http
GET /notifications/me?page=1&limit=10
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 10 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "notifications": [
      {
        "id": "uuid-string",
        "type": "like",
        "fromUserId": 1,
        "storyId": 123,
        "fromUser": {
          "id": 1,
          "username": "user123",
          "avatar": "https://..."
        },
        "fromUserName": "user123",
        "content": "user123 赞了你的故事",
        "createdAt": 1710856800000,
        "isRead": false
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

**通知类型**:
| type | 说明 |
|------|------|
| like | 点赞通知 |
| comment | 评论通知 |

---

### 6.2 获取未读通知数量
```http
GET /notifications/me/unread-count
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "userId": 1,
    "unreadCount": 5
  }
}
```

---

### 6.3 标记所有通知为已读
```http
PUT /notifications/me/mark-read
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "已标记 5 条通知为已读"
  }
}
```

---

### 6.4 清空所有通知
```http
DELETE /notifications/me
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "已清空 10 条通知"
  }
}
```

---

### 6.5 标记通知为已读
```http
PUT /notifications/:id/mark-read
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "message": "标记已读成功"
}
```

---

## 7. 地图模块 (Map)

### 7.1 范围查询故事
```http
GET /map/explore?lat=39.9042&lng=116.4074&radius=1000
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| lat | 是 | number | 纬度 |
| lng | 是 | number | 经度 |
| radius | 否 | number | 半径(米)，默认 1000，最大 5000 |

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
        "preview": "今天心情很好...",
        "distance": 120,
        "createdAt": "2小时前",
        "isTimeCapsule": false
      }
    ]
  }
}
```

---

### 7.2 随机漫步
```http
GET /map/random
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

---

### 7.3 同地点故事墙
```http
GET /map/wall?lat=39.9042&lng=116.4074&radius=100
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| lat | 是 | number | 纬度 |
| lng | 是 | number | 经度 |
| radius | 否 | number | 半径(米)，默认 50，最大 5000 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 123,
        "content": "...",
        "createdAt": "2026-03-19T10:00:00Z"
      }
    ]
  }
}
```

---

### 7.4 获取聚合数据
```http
GET /map/clusters?northEast={"lat":40,"lng":117}&southWest={"lat":39,"lng":116}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| northEast | 是 | object | 东北角坐标 JSON |
| southWest | 是 | object | 西南角坐标 JSON |

**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "location": {
        "lng": 116.4074,
        "lat": 39.9042
      },
      "count": 5,
      "stories": [...]
    }
  ]
}
```

---

## 8. 管理员模块 (Admin)

> **注意**: 所有管理员接口都需要管理员权限

### 8.1 设为推荐
```http
POST /admin/stories/:storyId/recommend
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| reason | 否 | string | 推荐理由 |

**响应**:
```json
{
  "code": 0,
  "message": "设置成功"
}
```

---

### 8.2 Shadowban 故事
```http
POST /admin/stories/:storyId/shadowban
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| reason | 否 | string | Shadowban 理由 |

**响应**:
```json
{
  "code": 0,
  "message": "Shadowban 成功"
}
```

---

### 8.3 恢复故事
```http
POST /admin/stories/:storyId/restore
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "message": "恢复成功"
}
```

---

### 8.4 封禁用户
```http
POST /admin/users/:userId/ban
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| reason | 否 | string | 封禁理由 |

**响应**:
```json
{
  "code": 0,
  "message": "封禁成功"
}
```

**注意**:
- 不能封禁管理员
- 封禁后用户状态变为 `deleted`，无法进行任何操作
- 封禁前需确保用户存在且未被封禁

---

### 8.5 解封用户
```http
POST /admin/users/:userId/unban
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "message": "解封成功"
}
```

**注意**:
- 仅可解封状态为 `deleted` 的用户
- 解封后用户状态恢复为 `normal`

---

### 8.6 数据统计
```http
GET /admin/statistics
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "totalUsers": 100,
    "totalStories": 500,
    "publicStories": 450,
    "timeCapsules": 30,
    "shadowbannedStories": 20,
    "todayStories": 10
  }
}
```

---

## 9. 举报模块 (Report)

### 9.1 创建举报（用户）
```http
POST /reports
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| targetType | 是 | string | 举报目标类型：'story' 或 'comment' |
| targetId | 是 | number | 举报目标 ID |
| reason | 是 | string | 举报原因，最多 500 字 |

**响应** (HTTP 201)
```json
{
  "code": 0,
  "message": "举报提交成功",
  "data": {
    "id": 123,
    "targetType": "story",
    "targetId": 456,
    "status": "pending"
  }
}
```

---

### 9.2 获取用户自己的举报列表
```http
GET /reports/me?page=1&limit=20
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 说明 |
|------|-------|------|
| page | 否 | 页码，默认 1 |
| limit | 否 | 每页数量，默认 20 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "reports": [
      {
        "id": 123,
        "targetType": "story",
        "targetId": 456,
        "target": {
          "type": "story",
          "id": 456,
          "content": "...",
          "images": [],
          "visibility": "public",
          "userId": 1
        },
        "reason": "违规内容",
        "status": "pending",
        "createdAt": "2026-03-19T10:00:00Z",
        "handledAt": null
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

### 9.3 获取举报列表（管理员）
```http
GET /reports?targetType=story|comment&status=pending|approved|rejected&page=1&limit=20
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 说明 |
|------|-------|------|
| targetType | 是 | 举报目标类型：'story' 或 'comment' |
| status | 否 | 状态：'pending'/'approved'/'rejected'，默认 'pending' |
| page | 否 | 页码，默认 1 |
| limit | 否 | 每页数量，默认 20 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "reports": [
      {
        "id": 123,
        "targetType": "story",
        "targetId": 456,
        "target": {
          "type": "story",
          "id": 456,
          "content": "...",
          "images": [],
          "visibility": "public",
          "userId": 1
        },
        "reason": "违规内容",
        "status": "pending",
        "createdAt": "2026-03-19T10:00:00Z",
        "handledAt": null,
        "reporter": {
          "id": 2,
          "username": "user456",
          "avatarUrl": "https://..."
        },
        "handler": null
      }
    ],
    "pagination": {
      "total": 20,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

### 9.4 处理举报（管理员）
```http
POST /reports/:reportId/handle
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数 | 说明 |
|------|------|
| reportId | number | 举报 ID |

**请求参数**:
| 字段 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| action | 是 | string | 操作类型：'approve'（批准）或 'reject'（拒绝） |

**响应**:
```json
{
  "code": 0,
  "message": "举报已批准，内容已处理"
}
```

---

### 9.5 获取故事举报列表（管理员）
```http
GET /reports/stories?status=pending|approved|rejected&page=1&limit=20
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| status | 否 | string | 过滤：'pending'（默认）/ 'approved'/'rejected' |
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 20 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "reports": [
      {
        "id": 123,
        "targetType": "story",
        "targetId": 456,
        "target": {
          "type": "story",
          "id": 456,
          "content": "违规内容...",
          "images": [],
          "visibility": "public",
          "userId": 1
        },
        "reason": "举报原因",
        "status": "pending",
        "createdAt": "2026-03-22T10:00:00Z",
        "handledAt": null,
        "reporter": {
          "id": 2,
          "username": "user456",
          "avatarUrl": "https://..."
        },
        "handler": null
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

### 9.6 获取评论举报列表（管理员）
```http
GET /reports/comments?status=pending|approved|rejected&page=1&limit=20
Authorization: Bearer {token}
```

**查询参数**:
| 参数 | 必填 | 类型 | 说明 |
|------|-------|------|------|
| status | 否 | string | 过滤：'pending'（默认）/ 'approved'/'rejected' |
| page | 否 | number | 页码，默认 1 |
| limit | 否 | number | 每页数量，默认 20 |

**响应**:
```json
{
  "code": 0,
  "data": {
    "reports": [
      {
        "id": 124,
        "targetType": "comment",
        "targetId": 789,
        "target": {
          "type": "comment",
          "id": 789,
          "content": "评论内容...",
          "status": "deleted",
          "userId": 3,
          "username": "user789"
        },
        "reason": "举报原因",
        "status": "pending",
        "createdAt": "2026-03-22T10:00:00Z",
        "handledAt": null,
        "reporter": {
          "id": 4,
          "username": "user124",
          "avatarUrl": "https://..."
        },
        "handler": null
      }
    ],
    "pagination": {
      "total": 30,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

---

### 9.7 获取举报统计（管理员）
```http
GET /reports/statistics
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 0,
  "data": {
    "pending": 5,
    "storyReports": 3,
    "commentReports": 2
  }
}
```

---

## 统一错误码

| Code | 含义 | HTTP Status |
|------|------|-------------|
| 0 | 成功 | 200 |
| 4000 | 请求参数错误 | 400 |
| 4001 | 未登录 | 401 |
| 4003 | 无权限 | 403 |
| 4004 | 资源不存在 | 404 |
| 4009 | 请求过于频繁 | 429 |
| 5000 | 服务器错误 | 500 |
| 5001 | 数据库错误 | 500 |
| 5002 | 第三方服务错误 | 502 |

---

## 限流策略

| 接口 | 限流规则 |
|---------|---------|
| 登录/注册 | 10 次/分钟/IP |
| 发布故事 | 5 次/分钟/用户 |
| 上传凭证 | 20 次/分钟/用户 |
| 查询接口 | 100 次/分钟/IP |

---

## 认证方式

### JWT Token

**登录成功后返回**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

**后续请求携带 Token**:
```http
GET /api/stories/my
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token 过期处理**:
- `accessToken` 有效期: 7 天
- 过期后前端返回登录页
