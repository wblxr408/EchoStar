# EchoStar API 测试报告 - Favorite模块

**测试时间**: 2026-03-19T09:16:50.370Z

**服务器地址**: http://localhost:3000

---

## 1. 收藏/取消收藏切换

### 1.1 收藏切换测试

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
  "username": "favorite_test_user_1773911809960",
  "email": "favorite_test_1773911809960@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus",
    "user": {
      "id": 1,
      "username": "favorite_test_user_1773911809960"
    }
  }
}
```

---

### 1.2 收藏切换测试

**序号**: 2

**请求类型**: POST

**接口地址**: http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**请求体**:
```json
{
  "content": "测试故事1用于收藏测试 1773911810109",
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
    "content": "测试故事1用于收藏测试 1773911810109",
    "createdAt": "2026-03-19T09:16:50.125Z"
  }
}
```

---

### 1.3 收藏切换测试

**序号**: 3

**请求类型**: POST

**接口地址**: http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**请求体**:
```json
{
  "content": "测试故事2用于收藏测试 1773911810142",
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
    "content": "测试故事2用于收藏测试 1773911810142",
    "createdAt": "2026-03-19T09:16:50.148Z"
  }
}
```

---

### 1.4 收藏切换测试

**序号**: 4

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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
    "isFavorited": true,
    "message": "收藏成功",
    "id": 1
  }
}
```

---

### 1.5 收藏切换测试

**序号**: 5

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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
    "isFavorited": false,
    "message": "已取消收藏"
  }
}
```

---

### 1.6 收藏切换测试

**序号**: 6

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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
    "isFavorited": true,
    "message": "收藏成功",
    "id": 2
  }
}
```

---

### 1.7 收藏切换测试

**序号**: 7

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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
  "stack": "Error: 故事不存在\n    at FavoriteServiceClass.toggleFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:17:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async toggleFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.controller.js:11:20)"
}
```

---

### 1.8 收藏切换测试

**序号**: 8

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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

### 1.9 收藏切换测试

**序号**: 9

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites

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

## 2. 创建收藏

### 2.1 明确创建收藏测试

**序号**: 10

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites/create

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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
    "createdAt": "2026-03-19T09:16:50.210Z"
  }
}
```

---

### 2.2 明确创建收藏测试

**序号**: 11

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites/create

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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
  "message": "已经收藏过此故事",
  "stack": "Error: 已经收藏过此故事\n    at FavoriteServiceClass.createFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:55:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.controller.js:26:22)"
}
```

---

### 2.3 收藏不存在的故事测试

**序号**: 12

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites/create

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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
  "stack": "Error: 故事不存在\n    at FavoriteServiceClass.createFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:46:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.controller.js:26:22)"
}
```

---

### 2.4 缺少故事ID测试

**序号**: 13

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites/create

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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

### 2.5 明确创建收藏测试

**序号**: 14

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites/create

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

## 3. 取消收藏

### 3.1 取消收藏测试

**序号**: 15

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/favorites/2

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "取消收藏成功"
}
```

---

### 3.2 取消收藏测试

**序号**: 16

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/favorites/2

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "收藏记录不存在",
  "stack": "Error: 收藏记录不存在\n    at FavoriteServiceClass.deleteFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:80:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async deleteFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.controller.js:41:5)"
}
```

---

### 3.3 取消不存在的收藏测试

**序号**: 17

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/favorites/999999

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "收藏记录不存在",
  "stack": "Error: 收藏记录不存在\n    at FavoriteServiceClass.deleteFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:80:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async deleteFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.controller.js:41:5)"
}
```

---

### 3.4 取消收藏测试

**序号**: 18

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/favorites/invalid

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:12)\n    at async Favorite.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:21)\n    at async Favorite.findOne (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1240:12)\n    at async FavoriteServiceClass.deleteFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:75:22)\n    at async deleteFavorite (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.controller.js:41:5)"
}
```

---

### 3.5 取消收藏测试

**序号**: 19

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/favorites/1

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

## 4. 我的收藏

### 4.1 获取用户收藏列表测试

**序号**: 20

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/me

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "favorites": [
      {
        "id": 2,
        "createdAt": "2026-03-19T09:16:50.181Z",
        "story": {
          "id": 1,
          "content": "测试故事1用于收藏测试 1773911810109",
          "images": [
            "https://example.com/test-image1.jpg"
          ],
          "emotionTag": "开心",
          "createdAt": "2026-03-19T09:16:50.125Z"
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

### 4.2 获取用户收藏列表测试

**序号**: 21

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/me?page=1&limit=5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "favorites": [
      {
        "id": 2,
        "createdAt": "2026-03-19T09:16:50.181Z",
        "story": {
          "id": 1,
          "content": "测试故事1用于收藏测试 1773911810109",
          "images": [
            "https://example.com/test-image1.jpg"
          ],
          "emotionTag": "开心",
          "createdAt": "2026-03-19T09:16:50.125Z"
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

### 4.3 获取用户收藏列表测试

**序号**: 22

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/me

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

## 5. 故事收藏列表

### 5.1 获取故事收藏列表测试

**序号**: 23

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/story/1

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "favorites": [
      {
        "id": 2,
        "createdAt": "2026-03-19T09:16:50.181Z",
        "user": {
          "id": 1,
          "username": "favorite_test_user_1773911809960",
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

### 5.2 获取故事收藏列表测试

**序号**: 24

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/story/1?page=1&limit=5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "favorites": [
      {
        "id": 2,
        "createdAt": "2026-03-19T09:16:50.181Z",
        "user": {
          "id": 1,
          "username": "favorite_test_user_1773911809960",
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

### 5.3 获取故事收藏列表测试

**序号**: 25

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/story/999999

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "favorites": [],
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

### 5.4 获取故事收藏列表测试

**序号**: 26

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/story/invalid

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:12)\n    at async Favorite.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:21)\n    at async Promise.all (index 1)\n    at async Favorite.findAndCountAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1322:27)\n    at async FavoriteServiceClass.getFavoritesByStoryId (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:94:29)\n    at async getFavoritesByStoryId (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.controller.js:56:20)"
}
```

---

## 6. 检查收藏状态

### 6.1 检查是否已收藏测试

**序号**: 27

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/1/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "1",
    "isFavorited": true
  }
}
```

---

### 6.2 检查是否已收藏测试

**序号**: 28

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/2/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "2",
    "isFavorited": false
  }
}
```

---

### 6.3 检查是否已收藏测试

**序号**: 29

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/999999/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "999999",
    "isFavorited": false
  }
}
```

---

### 6.4 检查是否已收藏测试

**序号**: 30

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/invalid/check

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:12)\n    at async Favorite.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:21)\n    at async Favorite.findOne (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1240:12)\n    at async FavoriteServiceClass.checkIsFavorited (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:140:22)\n    at async checkIsFavorited (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.controller.js:85:20)"
}
```

---

### 6.5 检查是否已收藏测试

**序号**: 31

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/1/check

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
  "stack": "Error: WHERE parameter \"user_id\" has invalid \"undefined\" value\n    at PostgresQueryGenerator.whereItemQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1770:13)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1761:25\n    at Array.forEach (<anonymous>)\n    at PostgresQueryGenerator.whereItemsQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1759:35)\n    at PostgresQueryGenerator.getWhereConditions (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:2108:19)\n    at PostgresQueryGenerator.selectQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1015:28)\n    at PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:59)\n    at Favorite.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:47)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async Favorite.findOne (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1240:12)"
}
```

---

## 7. 收藏统计

### 7.1 统计收藏数量测试

**序号**: 32

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/1/count

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "1",
    "favoriteCount": 1
  }
}
```

---

### 7.2 统计收藏数量测试

**序号**: 33

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/999999/count

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "999999",
    "favoriteCount": 0
  }
}
```

---

### 7.3 统计收藏数量测试

**序号**: 34

**请求类型**: GET

**接口地址**: http://localhost:3000/api/favorites/invalid/count

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.rawSelect (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:434:18)\n    at async Favorite.aggregate (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1277:19)\n    at async Favorite.count (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1306:20)\n    at async FavoriteServiceClass.getFavoriteCount (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:129:19)\n    at async getFavoriteCount (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.controller.js:70:20)"
}
```

---

## 8. 批量检查收藏状态

### 8.1 批量检查收藏状态测试

**序号**: 35

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites/check-multiple

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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
      "isFavorited": true
    },
    {
      "storyId": 2,
      "isFavorited": false
    },
    {
      "storyId": 999999,
      "isFavorited": false
    }
  ]
}
```

---

### 8.2 批量检查收藏状态测试

**序号**: 36

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites/check-multiple

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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

**接口地址**: http://localhost:3000/api/favorites/check-multiple

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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

**接口地址**: http://localhost:3000/api/favorites/check-multiple

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkxMTgxMCwiZXhwIjoxNzc0NTE2NjEwfQ.3RwVWTuC5ZLZRWcqars3ItYN-z90XWZgOmC6_EHOvus"
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

### 8.5 批量检查收藏状态测试

**序号**: 39

**请求类型**: POST

**接口地址**: http://localhost:3000/api/favorites/check-multiple

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
  "stack": "Error: WHERE parameter \"user_id\" has invalid \"undefined\" value\n    at PostgresQueryGenerator.whereItemQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1770:13)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1761:25\n    at Array.forEach (<anonymous>)\n    at PostgresQueryGenerator.whereItemsQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1759:35)\n    at PostgresQueryGenerator.getWhereConditions (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:2108:19)\n    at PostgresQueryGenerator.selectQuery (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-generator.js:1015:28)\n    at PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:59)\n    at Favorite.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:47)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async FavoriteServiceClass.checkMultipleFavorited (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/favorite/favorite.service.js:190:23)"
}
```

---

