# EchoStar API 测试报告 - Like跨用户回归测试

**测试时间**: 2026-04-01T17:25:03.792Z

**服务器地址**: http://localhost:3000

---

### 1. 注册用户1

**测试说明**: 注册用户1

**序号**: 1

**请求类型**: POST

**接口地址**: http://localhost:3000/api/auth/register_2

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json"
}
```

**请求体**:
```json
{
  "username": "cross_like_u1_1775064292702",
  "email": "cross_like_u1_1775064292702@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjQzMDMsImV4cCI6MTc3NTY2OTEwM30.0h8H8XbCIrMvj8s2kDyyd0tsbsyDS0ZpSy3qTZsKOgI",
    "user": {
      "id": 1,
      "username": "cross_like_u1_1775064292702",
      "avatar": "https://echostar.oss-cn-shanghai.aliyuncs.com/avatars/default-7.png"
    }
  }
}
```

---

### 2. 用户1发布故事1

**测试说明**: 用户1发布故事1

**序号**: 2

**请求类型**: POST

**接口地址**: http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
}
```

**请求体**:
```json
{
  "content": "跨用户点赞测试故事 1775064292702",
  "images": [
    "https://example.com/cross-like-test.jpg"
  ],
  "emotionTag": "开心",
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "跨用户点赞测试故事 1775064292702",
    "images": [
      "https://example.com/cross-like-test.jpg"
    ],
    "createdAt": "2026-04-01T17:25:03.553Z",
    "visibilityStartTime": null,
    "visibilityEndTime": null
  }
}
```

---

### 3. 注册用户2

**测试说明**: 注册用户2

**序号**: 3

**请求类型**: POST

**接口地址**: http://localhost:3000/api/auth/register_2

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json"
}
```

**请求体**:
```json
{
  "username": "cross_like_u2_1775064292702",
  "email": "cross_like_u2_1775064292702@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcklkIjoyLCJpYXQiOjE3NzUwNjQzMDMsImV4cCI6MTc3NTY2OTEwM30.bvvNYJuFKTdEhimsiq48cXWs25RI3nauxrc7XIye9_s",
    "user": {
      "id": 2,
      "username": "cross_like_u2_1775064292702",
      "avatar": "https://echostar.oss-cn-shanghai.aliyuncs.com/avatars/default-1.png"
    }
  }
}
```

---

### 4. 用户2点赞故事1 (第1轮)

**测试说明**: 用户2点赞故事1 (第1轮)

**序号**: 4

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
}
```

**请求体**:
```json
{
  "storyId": 1
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "isLiked": true,
    "likeCount": 1,
    "message": "Like created"
  }
}
```

---

### 5. 用户1检查对故事1的点赞状态 (第1轮)

**测试说明**: 用户1检查对故事1的点赞状态 (第1轮)

**序号**: 5

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "1",
    "isLiked": false
  }
}
```

---

### 6. 用户2取消点赞 (第1轮)

**测试说明**: 用户2取消点赞 (第1轮)

**序号**: 6

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/1

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "取消点赞成功"
}
```

---

### 7. 用户1检查对故事1的点赞状态 (第1轮)

**测试说明**: 用户1检查对故事1的点赞状态 (第1轮)

**序号**: 7

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "1",
    "isLiked": false
  }
}
```

---

### 8. 用户2点赞故事1 (第2轮)

**测试说明**: 用户2点赞故事1 (第2轮)

**序号**: 8

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
}
```

**请求体**:
```json
{
  "storyId": 1
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "isLiked": true,
    "likeCount": 1,
    "message": "Like created"
  }
}
```

---

### 9. 用户1检查对故事1的点赞状态 (第2轮)

**测试说明**: 用户1检查对故事1的点赞状态 (第2轮)

**序号**: 9

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "1",
    "isLiked": false
  }
}
```

---

### 10. 用户2取消点赞 (第2轮)

**测试说明**: 用户2取消点赞 (第2轮)

**序号**: 10

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/1

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "取消点赞成功"
}
```

---

### 11. 用户1检查对故事1的点赞状态 (第2轮)

**测试说明**: 用户1检查对故事1的点赞状态 (第2轮)

**序号**: 11

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "1",
    "isLiked": false
  }
}
```

---

## 测试统计

- **总计**: 20
- **通过**: 20
- **失败**: 0
