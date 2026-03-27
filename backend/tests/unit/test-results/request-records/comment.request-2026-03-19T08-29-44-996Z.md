# EchoStar API 测试报告 - Comment模块

**测试时间**: 2026-03-19T08:29:44.996Z

**服务器地址**: http://localhost:3000

---

## 1. 创建评论

### 1.1 register - 创建评论测试

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
  "username": "comment_test_user_1773908984584",
  "email": "comment_test_1773908984584@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4",
    "user": {
      "id": 1,
      "username": "comment_test_user_1773908984584"
    }
  }
}
```

---

### 1.2 stories - 创建评论测试

**序号**: 2

**请求类型**: POST

**接口地址**: http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "content": "测试故事用于评论测试 1773908984745",
  "images": [
    "https://example.com/test-image.jpg"
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
    "content": "测试故事用于评论测试 1773908984745",
    "createdAt": "2026-03-19T08:29:44.764Z"
  }
}
```

---

### 1.3 comments - 创建评论测试

**序号**: 3

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "这是一条测试评论"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "这是一条测试评论",
    "createdAt": "2026-03-19T08:29:44.794Z"
  }
}
```

---

### 1.4 comments - 创建评论测试

**序号**: 4

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "测试评论 #1"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 2,
    "content": "测试评论 #1",
    "createdAt": "2026-03-19T08:29:44.806Z"
  }
}
```

---

### 1.5 comments - 创建评论测试

**序号**: 5

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "测试评论 #2"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 3,
    "content": "测试评论 #2",
    "createdAt": "2026-03-19T08:29:44.816Z"
  }
}
```

---

### 1.6 comments - 创建评论测试

**序号**: 6

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "测试评论 #3"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 4,
    "content": "测试评论 #3",
    "createdAt": "2026-03-19T08:29:44.826Z"
  }
}
```

---

### 1.7 comments - 创建评论测试

**序号**: 7

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "测试评论 #4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 5,
    "content": "测试评论 #4",
    "createdAt": "2026-03-19T08:29:44.834Z"
  }
}
```

---

### 1.8 comments - 创建评论测试

**序号**: 8

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "测试评论 #5"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 6,
    "content": "测试评论 #5",
    "createdAt": "2026-03-19T08:29:44.844Z"
  }
}
```

---

### 1.9 comments - 评论内容为空测试

**序号**: 9

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": ""
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "评论内容不能为空"
  ]
}
```

---

### 1.10 comments - 创建评论测试

**序号**: 10

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "content": "没有故事ID的评论"
}
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

### 1.11 comments - 创建评论测试

**序号**: 11

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "storyId": 999999,
  "content": "评论不存在的故事"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "故事不存在",
  "stack": "Error: 故事不存在\n    at CommentServiceClass.createComment (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.service.js:20:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createComment (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.controller.js:11:21)"
}
```

---

### 1.12 comments - 创建评论测试

**序号**: 12

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

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
  "storyId": 1,
  "content": "无Token评论"
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

### 1.13 comments - 创建评论测试

**序号**: 27

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "准备删除的评论"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 7,
    "content": "准备删除的评论",
    "createdAt": "2026-03-19T08:29:44.963Z"
  }
}
```

---

## 2. 故事评论列表

### 2.1 1 - 获取故事评论测试

**序号**: 13

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/story/1

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 6,
        "content": "测试评论 #5",
        "createdAt": "2026-03-19T08:29:44.844Z",
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 5,
        "content": "测试评论 #4",
        "createdAt": "2026-03-19T08:29:44.834Z",
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 4,
        "content": "测试评论 #3",
        "createdAt": "2026-03-19T08:29:44.826Z",
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 3,
        "content": "测试评论 #2",
        "createdAt": "2026-03-19T08:29:44.816Z",
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 2,
        "content": "测试评论 #1",
        "createdAt": "2026-03-19T08:29:44.806Z",
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 1,
        "content": "这是一条测试评论",
        "createdAt": "2026-03-19T08:29:44.794Z",
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 2.2 1?page=1&limit=3 - 获取故事评论测试

**序号**: 14

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/story/1?page=1&limit=3

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 6,
        "content": "测试评论 #5",
        "createdAt": "2026-03-19T08:29:44.844Z",
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 5,
        "content": "测试评论 #4",
        "createdAt": "2026-03-19T08:29:44.834Z",
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 4,
        "content": "测试评论 #3",
        "createdAt": "2026-03-19T08:29:44.826Z",
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 3,
      "totalPages": 2
    }
  }
}
```

---

### 2.3 999999 - 获取故事评论测试

**序号**: 15

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/story/999999

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "comments": [],
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

### 2.4 invalid - 获取故事评论测试

**序号**: 16

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/story/invalid

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.rawSelect (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:434:18)\n    at async Comment.aggregate (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1277:19)\n    at async Comment.count (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1306:20)\n    at async Promise.all (index 0)\n    at async Comment.findAndCountAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1322:27)\n    at async CommentServiceClass.getCommentsByStoryId (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.service.js:50:29)\n    at async getCommentsByStoryId (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.controller.js:30:20)"
}
```

---

## 3. 我的评论

### 3.1 me - 获取用户评论测试

**序号**: 17

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/me

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 6,
        "content": "测试评论 #5",
        "createdAt": "2026-03-19T08:29:44.844Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      },
      {
        "id": 5,
        "content": "测试评论 #4",
        "createdAt": "2026-03-19T08:29:44.834Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      },
      {
        "id": 4,
        "content": "测试评论 #3",
        "createdAt": "2026-03-19T08:29:44.826Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      },
      {
        "id": 3,
        "content": "测试评论 #2",
        "createdAt": "2026-03-19T08:29:44.816Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      },
      {
        "id": 2,
        "content": "测试评论 #1",
        "createdAt": "2026-03-19T08:29:44.806Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      },
      {
        "id": 1,
        "content": "这是一条测试评论",
        "createdAt": "2026-03-19T08:29:44.794Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      }
    ],
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3.2 me?page=1&limit=5 - 获取用户评论测试

**序号**: 18

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/me?page=1&limit=5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 6,
        "content": "测试评论 #5",
        "createdAt": "2026-03-19T08:29:44.844Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      },
      {
        "id": 5,
        "content": "测试评论 #4",
        "createdAt": "2026-03-19T08:29:44.834Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      },
      {
        "id": 4,
        "content": "测试评论 #3",
        "createdAt": "2026-03-19T08:29:44.826Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      },
      {
        "id": 3,
        "content": "测试评论 #2",
        "createdAt": "2026-03-19T08:29:44.816Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      },
      {
        "id": 2,
        "content": "测试评论 #1",
        "createdAt": "2026-03-19T08:29:44.806Z",
        "story": {
          "id": 1,
          "content": "测试故事用于评论测试 1773908984745"
        }
      }
    ],
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 5,
      "totalPages": 2
    }
  }
}
```

---

### 3.3 me - 获取用户评论测试

**序号**: 19

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/me

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

## 4. 评论统计

### 4.1 count - 统计评论数量测试

**序号**: 20

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/1/count

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "1",
    "commentCount": 6
  }
}
```

---

### 4.2 count - 统计评论数量测试

**序号**: 21

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/999999/count

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "storyId": "999999",
    "commentCount": 0
  }
}
```

---

### 4.3 count - 统计评论数量测试

**序号**: 22

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/invalid/count

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.rawSelect (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:434:18)\n    at async Comment.aggregate (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1277:19)\n    at async Comment.count (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1306:20)\n    at async CommentServiceClass.getCommentCount (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.service.js:109:19)\n    at async getCommentCount (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.controller.js:59:20)"
}
```

---

## 5. 搜索评论

### 5.1 search?keyword=测试 - 搜索评论测试

**序号**: 23

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/search?keyword=测试

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 6,
        "content": "测试评论 #5",
        "createdAt": "2026-03-19T08:29:44.844Z",
        "storyId": 1,
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 5,
        "content": "测试评论 #4",
        "createdAt": "2026-03-19T08:29:44.834Z",
        "storyId": 1,
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 4,
        "content": "测试评论 #3",
        "createdAt": "2026-03-19T08:29:44.826Z",
        "storyId": 1,
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 3,
        "content": "测试评论 #2",
        "createdAt": "2026-03-19T08:29:44.816Z",
        "storyId": 1,
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 2,
        "content": "测试评论 #1",
        "createdAt": "2026-03-19T08:29:44.806Z",
        "storyId": 1,
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 1,
        "content": "这是一条测试评论",
        "createdAt": "2026-03-19T08:29:44.794Z",
        "storyId": 1,
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 5.2 search?keyword=测试&page=1&limit=3 - 搜索评论测试

**序号**: 24

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/search?keyword=测试&page=1&limit=3

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 6,
        "content": "测试评论 #5",
        "createdAt": "2026-03-19T08:29:44.844Z",
        "storyId": 1,
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 5,
        "content": "测试评论 #4",
        "createdAt": "2026-03-19T08:29:44.834Z",
        "storyId": 1,
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      },
      {
        "id": 4,
        "content": "测试评论 #3",
        "createdAt": "2026-03-19T08:29:44.826Z",
        "storyId": 1,
        "user": {
          "id": 1,
          "username": "comment_test_user_1773908984584",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 3,
      "totalPages": 2
    }
  }
}
```

---

### 5.3 search - 搜索评论测试

**序号**: 25

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/search

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 400,
  "message": "请提供搜索关键词"
}
```

---

### 5.4 search?keyword= - 搜索评论测试

**序号**: 26

**请求类型**: GET

**接口地址**: http://localhost:3000/api/comments/search?keyword=

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 400,
  "message": "请提供搜索关键词"
}
```

---

## 6. 删除评论

### 6.1 7 - 删除评论测试

**序号**: 28

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/comments/7

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

### 6.2 999999 - 删除不存在评论测试

**序号**: 29

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/comments/999999

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "评论不存在",
  "stack": "Error: 评论不存在\n    at CommentServiceClass.deleteComment (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.service.js:92:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async deleteComment (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.controller.js:45:5)"
}
```

---

### 6.3 invalid - 删除评论测试

**序号**: 30

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/comments/invalid

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:12)\n    at async Comment.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:21)\n    at async Comment.findOne (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1240:12)\n    at async Comment.findByPk (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1221:12)\n    at async CommentServiceClass.deleteComment (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.service.js:89:21)\n    at async deleteComment (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/comment/comment.controller.js:45:5)"
}
```

---

### 6.4 1 - 删除评论测试

**序号**: 31

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/comments/1

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

### 6.5 7 - 删除评论测试

**序号**: 32

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/comments/7

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkwODk4NCwiZXhwIjoxNzc0NTEzNzg0fQ.VYOAzhw0iSSGoFjvxv-sCj4oYULcEaoIZMvL2bsuSF4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

