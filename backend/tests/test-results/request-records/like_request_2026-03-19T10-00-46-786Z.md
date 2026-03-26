# EchoStar API 测试报告 - Like模块

**测试时间**: 2026-03-19T10:00:46.787Z

**服务器地址**: http://localhost:3000

---

## 1. 点赞/取消点赞切换

### 1.1 点赞切换测试

**序号**: 1

**请求类型**: POST

**接口地址**: http://localhost:3000/api/auth/register

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
  "username": "like_test_user_1773914446368",
  "email": "like_test_1773914446368@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM",
    "user": {
      "id": 1,
      "username": "like_test_user_1773914446368"
    }
  }
}
```

---

### 1.2 点赞切换测试

**序号**: 2

**请求类型**: POST

**接口地址**: http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{
  "content": "测试故事1用于点赞测试 1773914446514",
  "images": [
    "https://example.com/test-image1.jpg"
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
    "content": "测试故事1用于点赞测试 1773914446514",
    "createdAt": "2026-03-19T10:00:46.533Z"
  }
}
```

---

### 1.3 点赞切换测试

**序号**: 3

**请求类型**: POST

**接口地址**: http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{
  "content": "测试故事2用于点赞测试 1773914446552",
  "images": [
    "https://example.com/test-image2.jpg"
  ],
  "emotionTag": "治愈",
  "location": {
    "lat": 39.91923,
    "lng": 116.407428
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 2,
    "content": "测试故事2用于点赞测试 1773914446552",
    "createdAt": "2026-03-19T10:00:46.559Z"
  }
}
```

---

### 1.4 点赞切换测试

**序号**: 4

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
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
    "message": "点赞成功",
    "id": 1
  }
}
```

---

### 1.5 点赞切换测试

**序号**: 5

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
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
    "isLiked": false,
    "message": "已取消点赞"
  }
}
```

---

### 1.6 点赞切换测试

**序号**: 6

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
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
    "message": "点赞成功",
    "id": 2
  }
}
```

---

### 1.7 点赞切换测试

**序号**: 7

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{
  "storyId": 999999
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "故事不存在",
  "stack": "Error: 故事不存在\n    at LikeServiceClass.toggleLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:18:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async toggleLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:11:20)"
}
```

---

### 1.8 点赞切换测试

**序号**: 8

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"storyId\" is required"
  ]
}
```

---

### 1.9 点赞切换测试

**序号**: 9

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 401

**请求头**:
```json
{
  "Content-Type": "application/json"
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
  "code": 4001,
  "message": "未提供认证令牌"
}
```

---

## 2. 创建点赞

### 2.1 明确创建点赞测试

**序号**: 10

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{
  "storyId": 2
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 3,
    "storyId": 2,
    "createdAt": "2026-03-19T10:00:46.624Z"
  }
}
```

---

### 2.2 明确创建点赞测试

**序号**: 11

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{
  "storyId": 2
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "已经点赞过此故事",
  "stack": "Error: 已经点赞过此故事\n    at LikeServiceClass.createLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:64:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:26:18)"
}
```

---

### 2.3 点赞不存在的故事测试

**序号**: 12

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{
  "storyId": 999999
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "故事不存在",
  "stack": "Error: 故事不存在\n    at LikeServiceClass.createLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:55:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:26:18)"
}
```

---

### 2.4 缺少故事ID测试

**序号**: 13

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"storyId\" is required"
  ]
}
```

---

### 2.5 明确创建点赞测试

**序号**: 14

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

**返回状态**: 401

**请求头**:
```json
{
  "Content-Type": "application/json"
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
  "code": 4001,
  "message": "未提供认证令牌"
}
```

---

## 3. 取消点赞

### 3.1 取消点赞测试

**序号**: 15

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/2

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "取消点赞成功"
}
```

---

### 3.2 取消点赞测试

**序号**: 16

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/2

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "点赞记录不存在",
  "stack": "Error: 点赞记录不存在\n    at LikeServiceClass.deleteLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:96:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async deleteLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:41:5)"
}
```

---

### 3.3 取消不存在的点赞测试

**序号**: 17

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/999999

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "点赞记录不存在",
  "stack": "Error: 点赞记录不存在\n    at LikeServiceClass.deleteLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:96:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async deleteLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:41:5)"
}
```

---

### 3.4 取消点赞测试

**序号**: 18

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/invalid

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:12)\n    at async Like.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:21)\n    at async Like.findOne (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1240:12)\n    at async LikeServiceClass.deleteLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:91:18)\n    at async deleteLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:41:5)"
}
```

---

### 3.5 取消点赞测试

**序号**: 19

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/1

**返回状态**: 401

**请求头**:
```json
{
  "Content-Type": "application/json"
}
```

**返回内容**:
```json
{
  "code": 4001,
  "message": "未提供认证令牌"
}
```

---

## 4. 我的点赞

### 4.1 获取用户点赞列表测试

**序号**: 20

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/me

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "likes": [
      {
        "id": 2,
        "createdAt": "2026-03-19T10:00:46.596Z",
        "story": {
          "id": 1,
          "content": "测试故事1用于点赞测试 1773914446514",
          "images": [
            "https://example.com/test-image1.jpg"
          ],
          "emotionTag": "开心",
          "createdAt": "2026-03-19T10:00:46.533Z"
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 4.2 获取用户点赞列表测试

**序号**: 21

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/me?page=1&limit=5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "likes": [
      {
        "id": 2,
        "createdAt": "2026-03-19T10:00:46.596Z",
        "story": {
          "id": 1,
          "content": "测试故事1用于点赞测试 1773914446514",
          "images": [
            "https://example.com/test-image1.jpg"
          ],
          "emotionTag": "开心",
          "createdAt": "2026-03-19T10:00:46.533Z"
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 5,
      "totalPages": 1
    }
  }
}
```

---

### 4.3 获取用户点赞列表测试

**序号**: 22

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/me

**返回状态**: 401

**请求头**:
```json
{
  "Content-Type": "application/json"
}
```

**返回内容**:
```json
{
  "code": 4001,
  "message": "未提供认证令牌"
}
```

---

## 5. 故事点赞列表

### 5.1 获取故事点赞列表测试

**序号**: 23

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/story/1

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "likes": [
      {
        "id": 2,
        "createdAt": "2026-03-19T10:00:46.596Z",
        "user": {
          "id": 1,
          "username": "like_test_user_1773914446368",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 5.2 获取故事点赞列表测试

**序号**: 24

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/story/1?page=1&limit=5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "likes": [
      {
        "id": 2,
        "createdAt": "2026-03-19T10:00:46.596Z",
        "user": {
          "id": 1,
          "username": "like_test_user_1773914446368",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 5,
      "totalPages": 1
    }
  }
}
```

---

### 5.3 获取故事点赞列表测试

**序号**: 25

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/story/999999

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "likes": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 10,
      "totalPages": 0
    }
  }
}
```

---

### 5.4 获取故事点赞列表测试

**序号**: 26

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/story/invalid

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:12)\n    at async Like.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:21)\n    at async Promise.all (index 1)\n    at async Like.findAndCountAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1322:27)\n    at async LikeServiceClass.getLikesByStoryId (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:110:29)\n    at async getLikesByStoryId (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:56:20)"
}
```

---

## 6. 检查点赞状态

### 6.1 检查是否已点赞测试

**序号**: 27

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "1",
    "isLiked": true
  }
}
```

---

### 6.2 检查是否已点赞测试

**序号**: 28

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/2/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "2",
    "isLiked": false
  }
}
```

---

### 6.3 检查是否已点赞测试

**序号**: 29

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/999999/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "999999",
    "isLiked": false
  }
}
```

---

### 6.4 检查是否已点赞测试

**序号**: 30

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/invalid/check

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:12)\n    at async Like.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:21)\n    at async Like.findOne (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1240:12)\n    at async LikeServiceClass.checkIsLiked (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:156:18)\n    at async checkIsLiked (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:85:20)"
}
```

---

### 6.5 检查是否已点赞测试

**序号**: 31

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/check

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "WHERE parameter \"user_id\" has invalid \"undefined\" value",
  "stack": "Error: WHERE parameter \"user_id\" has invalid \"undefined\" value\n    at PostgresQueryGenerator.whereItemQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1770:13)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1761:25\n    at Array.forEach (<anonymous>)\n    at PostgresQueryGenerator.whereItemsQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1759:35)\n    at PostgresQueryGenerator.getWhereConditions (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:2108:19)\n    at PostgresQueryGenerator.selectQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1015:28)\n    at PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:59)\n    at Like.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:47)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async Like.findOne (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1240:12)"
}
```

---

## 7. 点赞统计

### 7.1 统计点赞数量测试

**序号**: 32

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/count

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "1",
    "likeCount": 1
  }
}
```

---

### 7.2 统计点赞数量测试

**序号**: 33

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/999999/count

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "999999",
    "likeCount": 0
  }
}
```

---

### 7.3 统计点赞数量测试

**序号**: 34

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/invalid/count

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.rawSelect (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:434:18)\n    at async Like.aggregate (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1277:19)\n    at async Like.count (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1306:20)\n    at async LikeServiceClass.getLikeCount (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:145:19)\n    at async getLikeCount (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:70:20)"
}
```

---

## 8. 批量检查点赞状态

### 8.1 批量检查点赞状态测试

**序号**: 35

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{
  "storyIds": [
    1,
    2,
    999999
  ]
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": [
    {
      "storyId": 1,
      "isLiked": true
    },
    {
      "storyId": 2,
      "isLiked": false
    },
    {
      "storyId": 999999,
      "isLiked": false
    }
  ]
}
```

---

### 8.2 批量检查点赞状态测试

**序号**: 36

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{
  "storyIds": []
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "至少需要 1 个故事ID"
  ]
}
```

---

### 8.3 缺少故事ID数组测试

**序号**: 37

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"storyIds\" is required"
  ]
}
```

---

### 8.4 无效的故事ID数组测试

**序号**: 38

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxNDQ0NiwiZXhwIjoxNzc0NTE5MjQ2fQ.3wwoQM1DP9I9zRxEZCEYTC6VBs_qxJii0zxw4-Uk5SM"
}
```

**请求体**:
```json
{
  "storyIds": "invalid"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"storyIds\" must be an array"
  ]
}
```

---

### 8.5 批量检查点赞状态测试

**序号**: 39

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json"
}
```

**请求体**:
```json
{
  "storyIds": [
    1
  ]
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "WHERE parameter \"user_id\" has invalid \"undefined\" value",
  "stack": "Error: WHERE parameter \"user_id\" has invalid \"undefined\" value\n    at PostgresQueryGenerator.whereItemQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1770:13)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1761:25\n    at Array.forEach (<anonymous>)\n    at PostgresQueryGenerator.whereItemsQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1759:35)\n    at PostgresQueryGenerator.getWhereConditions (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:2108:19)\n    at PostgresQueryGenerator.selectQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1015:28)\n    at PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:59)\n    at Like.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:47)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async LikeServiceClass.checkMultipleLiked (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:206:19)"
}
```

---

