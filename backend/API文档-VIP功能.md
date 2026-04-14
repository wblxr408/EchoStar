# EchoStar VIP功能 API文档

## 基础信息

- **Base URL**: `http://localhost:3000/api/v1` (开发环境)
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

---

## 通用响应格式

### 成功响应
```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    // 业务数据
  }
}
```

### 失败响应
```json
{
  "code": 400,
  "message": "错误描述"
}
```

---

## 认证说明

除特别说明外，所有接口需要在请求头中携带认证Token：

```http
Authorization: Bearer {accessToken}
```

---

# VIP接口

## 1. 查看当前用户VIP状态

获取当前登录用户的VIP状态信息。

### 接口信息
- **路径**: `/vip/status`
- **方法**: `GET`
- **认证**: 需要

### 请求示例
```http
GET /api/v1/vip/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 响应示例

**非VIP用户**:
```json
{
  "code": 0,
  "data": {
    "isVip": false
  }
}
```

**VIP用户**:
```json
{
  "code": 0,
  "data": {
    "isVip": true,
    "expiresAt": "2026-05-14T23:59:59.000Z"
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| isVip | boolean | 是否为VIP用户 |
| expiresAt | string/null | VIP到期时间（ISO 8601格式），非VIP时为null |

---

## 2. 获取用户VIP订单历史

获取当前登录用户的VIP订单历史记录，支持分页。

### 接口信息
- **路径**: `/vip/history`
- **方法**: `GET`
- **认证**: 需要

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

### 请求示例
```http
GET /api/v1/vip/history?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "orders": [
      {
        "id": 1,
        "createdAt": "2026-04-14T10:30:00.000Z",
        "expiresAt": "2026-05-14T23:59:59.000Z",
        "isActive": true,
        "admin": "admin_user"
      },
      {
        "id": 2,
        "createdAt": "2026-02-10T15:00:00.000Z",
        "expiresAt": "2026-03-10T23:59:59.000Z",
        "isActive": false,
        "admin": "admin_user"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 响应字段说明

**orders对象**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 订单ID |
| createdAt | string | VIP开通时间（ISO 8601格式） |
| expiresAt | string | VIP到期时间（ISO 8601格式） |
| isActive | boolean | 是否在有效期内 |
| admin | string | 操作管理员用户名 |

**pagination对象**:
| 字段 | 类型 | 说明 |
|------|------|------|
| total | number | 总记录数 |
| page | number | 当前页码 |
| limit | number | 每页数量 |
| totalPages | number | 总页数 |

---

# 管理员VIP接口

## 3. 升级用户为VIP

管理员将指定用户升级为VIP会员。

### 接口信息
- **路径**: `/admin/users/:userId/upgrade-vip`
- **方法**: `POST`
- **认证**: 需要管理员权限

### 请求参数

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 要升级的用户ID |

**请求体**:
```json
{
  "days": 30
}
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| days | number | 否 | 30 | VIP有效期（天数） |

### 请求示例
```http
POST /api/v1/admin/users/123/upgrade-vip
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "days": 30
}
```

### 响应示例
```json
{
  "code": 0,
  "message": "升级成功",
  "data": {
    "userId": 123,
    "vip": 1,
    "expiresAt": "2026-05-14T23:59:59.000Z"
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | number | 用户ID |
| vip | number | VIP状态（1会员） |
| expiresAt | string | VIP到期时间（ISO 8601格式） |

### 错误响应示例

**用户不存在**:
```json
{
  "code": 404,
  "message": "用户不存在"
}
```

**权限不足**:
```json
{
  "code": 403,
  "message": "需要管理员权限"
}
```

---

# 其他接口中的VIP字段

以下接口返回的用户信息中包含 `vip` 字段：

## 用户信息相关接口

### 4. 获取当前用户信息

获取当前登录用户的详细信息。

### 接口信息
- **路径**: `/auth/me`
- **方法**: `GET`
- **认证**: 需要

### 请求示例
```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "username": "example_user",
    "email": "user@example.com",
    "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/xxx.jpg",
    "bio": "这是我的个性签名",
    "role": "user",
    "status": "normal",
    "vip": 1,
    "createdAt": "2026-04-01T10:00:00.000Z"
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 用户ID |
| username | string | 用户名 |
| email | string | 邮箱 |
| avatar | string | 头像URL |
| bio | string | 个性签名 |
| role | string | 角色（user/admin） |
| status | string | 状态（deleted/normal/recommended） |
| vip | number | VIP状态（0非会员，1会员） |
| createdAt | string | 注册时间（ISO 8601格式） |

---

### 5. 修改个人信息

修改当前登录用户的个人信息。

### 接口信息
- **路径**: `/users/me`
- **方法**: `PUT`
- **认证**: 需要

### 请求参数

**请求体**:
```json
{
  "username": "new_username",
  "avatarUrl": "https://...",
  "bio": "新的个性签名"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 新用户名 |
| avatarUrl | string | 否 | 新头像URL |
| bio | string | 否 | 新个性签名 |

### 请求示例
```http
PUT /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "username": "new_username",
  "bio": "这是新的个性签名"
}
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "username": "new_username",
    "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/xxx.jpg",
    "bio": "这是新的个性签名",
    "vip": 1
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 用户ID |
| username | string | 用户名 |
| avatar | string | 头像URL |
| bio | string | 个性签名 |
| vip | number | VIP状态（0非会员，1会员） |

---

### 6. 查看其他用户信息

获取指定用户的公开信息。

### 接口信息
- **路径**: `/users/:userId`
- **方法**: `GET`
- **认证**: 可选

### 请求参数

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | number | 是 | 要查看的用户ID |

### 请求示例
```http
GET /api/v1/users/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "id": 123,
    "username": "other_user",
    "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/yyy.jpg",
    "bio": "对方用户的个性签名",
    "vip": 1,
    "stories": [
      {
        "id": "1234567890123456789",
        "content": "故事内容...",
        "createdAt": "2026-04-10T10:00:00.000Z",
        "viewCount": 150,
        "isTimeCapsule": false,
        "unlockAt": null
      }
    ]
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 用户ID |
| username | string | 用户名 |
| avatar | string | 头像URL |
| bio | string | 个性签名 |
| vip | number | VIP状态（0非会员，1会员） |
| stories | array | 用户的故事列表 |
| stories[].id | string | 故事ID |
| stories[].content | string | 故事内容 |
| stories[].createdAt | string | 创建时间 |
| stories[].viewCount | number | 浏览量 |
| stories[].isTimeCapsule | boolean | 是否为时光胶囊 |
| stories[].unlockAt | string/null | 解锁时间 |

---

### 7. 管理员获取用户列表

管理员获取所有用户列表，支持分页和状态过滤。

### 接口信息
- **路径**: `/admin/users`
- **方法**: `GET`
- **认证**: 需要管理员

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页数量 |
| category | string | 否 | normal | 用户类别（normal/deleted） |

### 请求示例
```http
GET /api/v1/admin/users?page=1&pageSize=20&category=normal
Authorization: Bearer {admin_token}
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "user_one",
        "email": "user1@example.com",
        "role": "user",
        "status": "normal",
        "bio": "用户1的签名",
        "avatarUrl": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/1.jpg",
        "vip": 1,
        "createdAt": "2026-03-01T10:00:00.000Z"
      },
      {
        "id": 2,
        "username": "user_two",
        "email": "user2@example.com",
        "role": "user",
        "status": "normal",
        "bio": "用户2的签名",
        "avatarUrl": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/2.jpg",
        "vip": 0,
        "createdAt": "2026-03-02T15:00:00.000Z"
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

### 响应字段说明

**users数组**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 用户ID |
| username | string | 用户名 |
| email | string | 邮箱 |
| role | string | 角色（user/admin） |
| status | string | 状态（deleted/normal/recommended） |
| bio | string | 个性签名 |
| avatarUrl | string | 头像URL |
| vip | number | VIP状态（0非会员，1会员） |
| createdAt | string | 注册时间 |

**pagination对象**:
| 字段 | 类型 | 说明 |
|------|------|------|
| total | number | 总用户数 |
| page | number | 当前页码 |
| pageSize | number | 每页数量 |
| totalPages | number | 总页数 |

---

## 故事相关接口

以下接口返回的故事作者信息中包含 `vip` 字段：

### 8. 查看故事详情

获取指定故事的详细信息，包含作者信息。

### 接口信息
- **路径**: `/stories/:id`
- **方法**: `GET`
- **认证**: 可选

### 请求参数

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 故事ID（雪花ID） |

### 请求示例
```http
GET /api/v1/stories/1234567890123456789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "id": "1234567890123456789",
    "content": "今天天气真好，出来散散步",
    "images": [
      "https://echostar2.oss-cn-hongkong.aliyuncs.com/story/img1.jpg"
    ],
    "location": {
      "lng": 116.404,
      "lat": 39.915
    },
    "locationName": "北京天安门广场",
    "emotionTag": "开心",
    "isTimeCapsule": false,
    "isRecommended": true,
    "viewCount": 256,
    "likeCount": 42,
    "commentCount": 8,
    "favoriteCount": 12,
    "createdAt": "2026-04-10T14:30:00.000Z",
    "visibilityStartTime": "00:00",
    "visibilityEndTime": "23:59",
    "author": {
      "id": 1,
      "username": "story_author",
      "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/author.jpg",
      "vip": 1
    }
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 故事ID（雪花ID） |
| content | string | 故事内容 |
| images | array | 图片URL数组 |
| location.lng | number | 经度 |
| location.lat | number | 纬度 |
| locationName | string | 位置名称 |
| emotionTag | string | 情绪标签（治愈/难过/开心/打卡） |
| isTimeCapsule | boolean | 是否为时光胶囊 |
| isRecommended | boolean | 是否为推荐故事 |
| viewCount | number | 浏览量 |
| likeCount | number | 点赞数 |
| commentCount | number | 评论数 |
| favoriteCount | number | 收藏数 |
| createdAt | string | 创建时间 |
| visibilityStartTime | string | 可见开始时间（HH:mm） |
| visibilityEndTime | string | 可见结束时间（HH:mm） |
| author.id | number | 作者ID |
| author.username | string | 作者用户名 |
| author.avatar | string | 作者头像URL |
| author.vip | number | 作者VIP状态（0非会员，1会员） |

---

### 9. 我的故事列表

获取当前登录用户发布的故事列表，支持分页。

### 接口信息
- **路径**: `/stories/me/list`
- **方法**: `GET`
- **认证**: 需要

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

### 请求示例
```http
GET /api/v1/stories/me/list?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": "1234567890123456789",
        "content": "今天天气真好，出来散散步",
        "images": [
          "https://echostar2.oss-cn-hongkong.aliyuncs.com/story/img1.jpg"
        ],
        "createdAt": "2026-04-10T14:30:00.000Z",
        "viewCount": 256,
        "likeCount": 42,
        "favoriteCount": 12,
        "visibility": "public",
        "location": {
          "lng": 116.404,
          "lat": 39.915
        },
        "locationName": "北京天安门广场",
        "author": {
          "id": 1,
          "username": "story_author",
          "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/author.jpg",
          "vip": 1
        }
      },
      {
        "id": "1234567890123456790",
        "content": "心情不太好",
        "images": [],
        "createdAt": "2026-04-09T20:15:00.000Z",
        "viewCount": 128,
        "likeCount": 18,
        "favoriteCount": 5,
        "visibility": "public",
        "location": {
          "lng": 116.397,
          "lat": 39.918
        },
        "locationName": "北京故宫",
        "author": {
          "id": 1,
          "username": "story_author",
          "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/author.jpg",
          "vip": 1
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

### 响应字段说明

**stories数组**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 故事ID（雪花ID） |
| content | string | 故事内容 |
| images | array | 图片URL数组 |
| createdAt | string | 创建时间 |
| viewCount | number | 浏览量 |
| likeCount | number | 点赞数 |
| favoriteCount | number | 收藏数 |
| visibility | string | 可见性（public/shadowban） |
| location.lng | number | 经度 |
| location.lat | number | 纬度 |
| locationName | string | 位置名称 |
| author.id | number | 作者ID |
| author.username | string | 作者用户名 |
| author.avatar | string | 作者头像URL |
| author.vip | number | 作者VIP状态（0非会员，1会员） |

**pagination对象**:
| 字段 | 类型 | 说明 |
|------|------|------|
| total | number | 总故事数 |
| page | number | 当前页码 |
| limit | number | 每页数量 |
| totalPages | number | 总页数 |

---

### 10. 搜索故事

根据关键词搜索公开故事，支持分页。

### 接口信息
- **路径**: `/stories/search`
- **方法**: `GET`
- **认证**: 可选

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

### 请求示例
```http
GET /api/v1/stories/search?keyword=北京&page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": "1234567890123456789",
        "content": "今天去了北京天安门，心情很好",
        "images": [
          "https://echostar2.oss-cn-hongkong.aliyuncs.com/story/img1.jpg"
        ],
        "location": {
          "lng": 116.404,
          "lat": 39.915
        },
        "locationName": "北京天安门广场",
        "emotionTag": "开心",
        "isTimeCapsule": false,
        "isRecommended": true,
        "viewCount": 256,
        "createdAt": "2026-04-10T14:30:00.000Z",
        "visibilityStartTime": "00:00",
        "visibilityEndTime": "23:59",
        "author": {
          "id": 1,
          "username": "beijing_user",
          "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/1.jpg",
          "vip": 1
        }
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

### 响应字段说明

**stories数组**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 故事ID（雪花ID） |
| content | string | 故事内容 |
| images | array | 图片URL数组 |
| location.lng | number | 经度 |
| location.lat | number | 纬度 |
| locationName | string | 位置名称 |
| emotionTag | string | 情绪标签 |
| isTimeCapsule | boolean | 是否为时光胶囊 |
| isRecommended | boolean | 是否为推荐故事 |
| viewCount | number | 浏览量 |
| createdAt | string | 创建时间 |
| visibilityStartTime | string | 可见开始时间 |
| visibilityEndTime | string | 可见结束时间 |
| author.id | number | 作者ID |
| author.username | string | 作者用户名 |
| author.avatar | string | 作者头像URL |
| author.vip | number | 作者VIP状态（0非会员，1会员） |

**pagination对象**: 同"我的故事列表"

---

### 11. 获取精选推荐故事

获取管理员推荐的精选故事列表，支持分页。

### 接口信息
- **路径**: `/stories/featured`
- **方法**: `GET`
- **认证**: 可选

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 20 | 每页数量 |

### 请求示例
```http
GET /api/v1/stories/featured?page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": "1234567890123456789",
        "content": "精选故事内容",
        "images": [
          "https://echostar2.oss-cn-hongkong.aliyuncs.com/story/featured1.jpg"
        ],
        "username": "featured_user",
        "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/featured.jpg",
        "author": {
          "id": 1,
          "username": "featured_user",
          "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/featured.jpg",
          "vip": 1
        },
        "location": {
          "latitude": 39.915,
          "longitude": 116.404
        },
        "locationName": "北京",
        "emotionTag": "治愈",
        "isRecommended": true,
        "likeCount": 128,
        "createdAt": "2026-04-10T14:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

### 响应字段说明

**stories数组**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 故事ID（雪花ID） |
| content | string | 故事内容 |
| images | array | 图片URL数组 |
| username | string | 作者用户名（保留字段） |
| avatar | string | 作者头像URL（保留字段） |
| location.latitude | number | 纬度 |
| location.longitude | number | 经度 |
| locationName | string | 位置名称 |
| emotionTag | string | 情绪标签 |
| isRecommended | boolean | 是否为推荐故事 |
| likeCount | number | 点赞数 |
| createdAt | string | 创建时间 |
| author.id | number | 作者ID |
| author.username | string | 作者用户名 |
| author.avatar | string | 作者头像URL |
| author.vip | number | 作者VIP状态（0非会员，1会员） |

**pagination对象**: 同"我的故事列表"

---

### 12. 地图附近故事

获取指定位置附近的故事。

### 接口信息
- **路径**: `/map/explore`
- **方法**: `GET`
- **认证**: 可选

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| latitude | number | 是 | 纬度 |
| longitude | number | 是 | 经度 |
| radius | number | 否 | 搜索半径（米） |

### 请求示例
```http
GET /api/v1/map/explore?latitude=39.915&longitude=116.404&radius=1000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 响应示例
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": "1234567890123456789",
        "content": "附近的故事内容",
        "images": [
          "https://echostar2.oss-cn-hongkong.aliyuncs.com/story/nearby1.jpg"
        ],
        "location": {
          "lng": 116.404,
          "lat": 39.915
        },
        "locationName": "北京天安门广场",
        "emotionTag": "开心",
        "isTimeCapsule": false,
        "viewCount": 188,
        "createdAt": "2026-04-10T14:30:00.000Z",
        "author": {
          "id": 1,
          "username": "nearby_user",
          "avatar": "https://echostar2.oss-cn-hongkong.aliyuncs.com/avatar/nearby.jpg",
          "vip": 1
        }
      }
    ]
  }
}
```

### 响应字段说明

**stories数组**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 故事ID（雪花ID） |
| content | string | 故事内容 |
| images | array | 图片URL数组 |
| location.lng | number | 经度 |
| location.lat | number | 纬度 |
| locationName | string | 位置名称 |
| emotionTag | string | 情绪标签 |
| isTimeCapsule | boolean | 是否为时光胶囊 |
| viewCount | number | 浏览量 |
| createdAt | string | 创建时间 |
| author.id | number | 作者ID |
| author.username | string | 作者用户名 |
| author.avatar | string | 作者头像URL |
| author.vip | number | 作者VIP状态（0非会员，1会员） |

---

# 状态码说明

## HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token无效或过期） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 业务错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 4001 | 此功能仅限VIP会员使用 |
| 4002 | 您的VIP已过期 |
| 4003 | 未找到VIP记录 |

---

# 数据类型说明

| 类型 | 说明 |
|------|------|
| string | 字符串 |
| number | 数字 |
| boolean | 布尔值（true/false） |
| null | 空值 |

---

# 时间格式

所有时间字段均采用 **ISO 8601** 格式：

```
YYYY-MM-DDTHH:mm:ss.sssZ
```

示例：
```
2026-04-14T10:30:00.000Z
```

时区为 UTC，前端需要进行时区转换显示。

---

# VIP状态说明

| vip值 | 说明 |
|-------|------|
| 0 | 非会员 |
| 1 | 会员 |

---

# 注意事项

1. **Token过期**: 用户Token过期后会收到401错误，需要重新登录获取新Token
2. **VIP过期**: 系统会在每天凌晨1点自动扫描并处理过期的VIP订单
3. **VIP延长**: 如果用户已有未过期的VIP，管理员升级时会在原到期时间基础上延长
4. **缓存**: 用户VIP状态变更后，缓存在5秒内更新生效

---

# 示例代码

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 设置Token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 查看VIP状态
export const getVipStatus = async () => {
  const response = await api.get('/vip/status');
  return response.data;
};

// 获取VIP订单历史
export const getVipHistory = async (page = 1, limit = 10) => {
  const response = await api.get('/vip/history', {
    params: { page, limit }
  });
  return response.data;
};

// 管理员升级用户VIP
export const upgradeUserVip = async (userId, days = 30) => {
  const response = await api.post(`/admin/users/${userId}/upgrade-vip`, {
    days
  });
  return response.data;
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// 查看其他用户信息
export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// 我的故事列表
export const getMyStories = async (page = 1, limit = 10) => {
  const response = await api.get('/stories/me/list', {
    params: { page, limit }
  });
  return response.data;
};

// 搜索故事
export const searchStories = async (keyword, page = 1, limit = 10) => {
  const response = await api.get('/stories/search', {
    params: { keyword, page, limit }
  });
  return response.data;
};

// 获取精选推荐故事
export const getFeaturedStories = async (page = 1, limit = 20) => {
  const response = await api.get('/stories/featured', {
    params: { page, limit }
  });
  return response.data;
};

// 地图附近故事
export const getNearbyStories = async (lat, lng, radius) => {
  const response = await api.get('/map/explore', {
    params: { latitude: lat, longitude: lng, radius }
  });
  return response.data;
};
```

### TypeScript

```typescript
// 通用响应类型
interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// VIP相关类型
interface VipStatusData {
  isVip: boolean;
  expiresAt?: string;
}

interface VipOrder {
  id: number;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  admin: string;
}

interface VipHistoryData {
  orders: VipOrder[];
  pagination: Pagination;
}

interface UpgradeVipData {
  userId: number;
  vip: number;
  expiresAt: string;
}

// 用户相关类型
interface UserData {
  id: number;
  username: string;
  email?: string;
  avatar: string;
  bio?: string;
  role: string;
  status: string;
  vip: number;
  createdAt?: string;
}

interface UserListData {
  users: UserData[];
  pagination: Pagination;
}

interface UserWithStories extends UserData {
  stories: {
    id: string;
    content: string;
    createdAt: string;
    viewCount: number;
    isTimeCapsule: boolean;
    unlockAt: string | null;
  }[];
}

// 故事相关类型
interface Author {
  id: number;
  username: string;
  avatar: string;
  vip: number;
}

interface Location {
  lng: number;
  lat: number;
}

interface Story {
  id: string;
  content: string;
  images: string[];
  location: Location;
  locationName?: string;
  emotionTag?: string;
  isTimeCapsule: boolean;
  isRecommended?: boolean;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  favoriteCount?: number;
  createdAt: string;
  visibilityStartTime?: string;
  visibilityEndTime?: string;
  visibility?: string;
  author: Author;
}

interface StoryListData {
  stories: Story[];
  pagination: Pagination;
}

// API函数类型
export const getVipStatus = (): Promise<ApiResponse<VipStatusData>>;
export const getVipHistory = (page?: number, limit?: number): Promise<ApiResponse<VipHistoryData>>;
export const upgradeUserVip = (userId: number, days?: number): Promise<ApiResponse<UpgradeVipData>>;
export const getCurrentUser = (): Promise<ApiResponse<UserData>>;
export const getUserById = (userId: number): Promise<ApiResponse<UserWithStories>>;
export const getMyStories = (page?: number, limit?: number): Promise<ApiResponse<StoryListData>>;
export const searchStories = (keyword: string, page?: number, limit?: number): Promise<ApiResponse<StoryListData>>;
export const getFeaturedStories = (page?: number, limit?: number): Promise<ApiResponse<StoryListData>>;
export const getNearbyStories = (lat: number, lng: number, radius?: number): Promise<ApiResponse<{ stories: Story[] }>>;
```

---

**文档版本**: v1.1
**更新日期**: 2026-04-14
