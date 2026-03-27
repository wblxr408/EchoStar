# EchoStar API 测试报告 - Story模块

**测试时间**: 2026-03-24T16:29:30.689Z

**服务器地址**: http://localhost:3000

**请求总数**: 55

---

## 1. POST http://localhost:3000/api/auth/register_2

**测试说明**: 创建测试用户（无需验证码）

**序号**: 1

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
  "username": "story_test_user_1774369770022",
  "email": "story_test_1774369770022@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4",
    "user": {
      "id": 1,
      "username": "story_test_user_1774369770022"
    }
  }
}
```

---

## 2. POST http://localhost:3000/api/auth/register_2

**测试说明**: 创建管理员用户（无需验证码）

**序号**: 2

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
  "username": "story_test_admin_1774369770132",
  "email": "story_test_admin_1774369770132@test.com",
  "password": "Admin123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.6xG-GIxiVfaEMLy5oUSUDsXApZFtB4Oz1iO_BYl0shM",
    "user": {
      "id": 2,
      "username": "story_test_admin_1774369770132"
    }
  }
}
```

---

## 3. POST http://localhost:3000/api/auth/admin/login

**测试说明**: 管理员登录

**序号**: 3

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
  "email": "story_test_admin_1774369770132@test.com",
  "password": "Admin123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.6xG-GIxiVfaEMLy5oUSUDsXApZFtB4Oz1iO_BYl0shM",
    "user": {
      "id": 2,
      "email": "story_test_admin_1774369770132@test.com",
      "username": "story_test_admin_1774369770132",
      "avatar": null
    }
  }
}
```

---

## 4. POST http://localhost:3000/api/stories

**测试说明**: 正常测试：发布一个普通故事

**序号**: 4

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "这是一个测试故事",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "这是一个测试故事",
    "createdAt": "2026-03-24T16:29:30.289Z"
  }
}
```

---

## 5. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：无Token发布故事

**序号**: 5

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
  "content": "无Token测试",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "开心"
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

## 6. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：故事内容为空

**序号**: 6

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "故事内容不能为空"
  ]
}
```

---

## 7. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：故事内容超过1000字

**序号**: 7

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "故事内容不能超过 1000 字"
  ]
}
```

---

## 8. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：缺少位置参数

**序号**: 8

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试缺少位置",
  "images": [],
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"location\" is required"
  ]
}
```

---

## 9. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：缺少情感标签

**序号**: 9

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试缺少情感标签",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  }
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"emotionTag\" is required"
  ]
}
```

---

## 10. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：无效的情感标签

**序号**: 10

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试无效情感标签",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "无效标签"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"emotionTag\" must be one of [治愈, 难过, 开心, 打卡]"
  ]
}
```

---

## 11. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：纬度超出范围

**序号**: 11

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试纬度超出",
  "images": [],
  "location": {
    "lat": 100,
    "lng": 116.397428
  },
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"location.lat\" must be less than or equal to 90"
  ]
}
```

---

## 12. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：经度超出范围

**序号**: 12

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试经度超出",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 200
  },
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"location.lng\" must be less than or equal to 180"
  ]
}
```

---

## 13. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：图片数量超过9张

**序号**: 13

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试图片过多",
  "images": [
    "https://example.com/image.jpg",
    "https://example.com/image.jpg",
    "https://example.com/image.jpg",
    "https://example.com/image.jpg",
    "https://example.com/image.jpg",
    "https://example.com/image.jpg",
    "https://example.com/image.jpg",
    "https://example.com/image.jpg",
    "https://example.com/image.jpg",
    "https://example.com/image.jpg"
  ],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "最多上传 9 张图片"
  ]
}
```

---

## 14. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：图片URL格式无效

**序号**: 14

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试无效图片URL",
  "images": [
    "invalid-url"
  ],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"images[0]\" must be a valid uri"
  ]
}
```

---

## 15. POST http://localhost:3000/api/stories

**测试说明**: 正常测试：发布时光胶囊故事

**序号**: 15

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "这是一个时光胶囊故事",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "治愈",
  "isTimeCapsule": true,
  "unlockAt": "2027-03-24T16:29:30.365Z"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 2,
    "content": "这是一个时光胶囊故事",
    "createdAt": "2026-03-24T16:29:30.368Z"
  }
}
```

---

## 16. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：时光胶囊解锁时间在过去

**序号**: 16

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试过去解锁时间",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "开心",
  "isTimeCapsule": true,
  "unlockAt": "2026-03-23T16:29:30.376Z"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "解锁时间必须在未来"
  ]
}
```

---

## 17. POST http://localhost:3000/api/stories

**测试说明**: 边界测试：无效的visibility值

**序号**: 17

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试无效可见性",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "开心",
  "visibility": "invalid"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "可见性只能为 public 或 shadowban"
  ]
}
```

---

## 18. GET http://localhost:3000/api/stories/1

**测试说明**: 正常测试：查看故事详情

**序号**: 18

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "这是一个测试故事",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "location": {
      "lng": 116.397428,
      "lat": 39.90923
    },
    "locationName": null,
    "emotionTag": "开心",
    "isTimeCapsule": false,
    "isRecommended": false,
    "viewCount": 0,
    "likeCount": 0,
    "commentCount": 0,
    "createdAt": "2026-03-24T16:29:30.289Z",
    "author": {
      "id": 1,
      "username": "story_test_user_1774369770022",
      "avatar": null
    }
  }
}
```

---

## 19. GET http://localhost:3000/api/stories/999999

**测试说明**: 边界测试：查看不存在的故事

**序号**: 19

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
  "message": "故事不存在",
  "stack": "Error: 故事不存在\n    at StoryServiceClass.getStoryById (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:142:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async getStoryById (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:37:19)"
}
```

---

## 20. GET http://localhost:3000/api/stories/invalid

**测试说明**: 边界测试：无效的故事ID格式

**序号**: 20

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
  "message": "invalid input syntax for type integer: \"invalid\"",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:12)\n    at async Story.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:21)\n    at async Story.findOne (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1240:12)\n    at async Story.findByPk (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1221:12)\n    at async StoryServiceClass.fetchStoryRaw (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:67:19)\n    at async StoryServiceClass.fetchStoryRaw (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:93:22)\n    at async StoryServiceClass.getStoryById (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:139:21)"
}
```

---

## 21. GET http://localhost:3000/api/stories/1

**测试说明**: 正常测试：无Token查看公开故事

**序号**: 21

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "这是一个测试故事",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "location": {
      "lng": 116.397428,
      "lat": 39.90923
    },
    "locationName": null,
    "emotionTag": "开心",
    "isTimeCapsule": false,
    "isRecommended": false,
    "viewCount": 1,
    "likeCount": 0,
    "commentCount": 0,
    "createdAt": "2026-03-24T16:29:30.289Z",
    "author": {
      "id": 1,
      "username": "story_test_user_1774369770022",
      "avatar": null
    }
  }
}
```

---

## 22. GET http://localhost:3000/api/stories/me/list?page=1&limit=10

**测试说明**: 正常测试：获取我的故事列表

**序号**: 22

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 2,
        "content": "这是一个时光胶囊故事",
        "images": [],
        "createdAt": "2026-03-24T16:29:30.368Z",
        "viewCount": 0,
        "visibility": "public",
        "locationName": null
      },
      {
        "id": 1,
        "content": "这是一个测试故事",
        "images": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "createdAt": "2026-03-24T16:29:30.289Z",
        "viewCount": 0,
        "visibility": "public",
        "locationName": null
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

---

## 23. GET http://localhost:3000/api/stories/me/list

**测试说明**: 边界测试：无Token获取我的故事列表

**序号**: 23

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

## 24. GET http://localhost:3000/api/stories/me/list?page=2&limit=5

**测试说明**: 正常测试：使用分页参数获取故事列表

**序号**: 24

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [],
    "pagination": {
      "total": 2,
      "page": 2,
      "limit": 5,
      "totalPages": 1
    }
  }
}
```

---

## 25. GET http://localhost:3000/api/stories/me/list?page=-1&limit=10

**测试说明**: 边界测试：使用负数页码

**序号**: 25

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "OFFSET must not be negative",
  "stack": "Error\n    at Query.run (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\postgres\\query.js:50:25)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\sequelize.js:315:28\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PostgresQueryInterface.select (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\dialects\\abstract\\query-interface.js:407:12)\n    at async Story.findAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1140:21)\n    at async Promise.all (index 1)\n    at async Story.findAndCountAll (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\sequelize\\lib\\model.js:1322:27)\n    at async StoryServiceClass.getMyStories (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:220:29)\n    at async getMyStories (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:67:20)"
}
```

---

## 26. GET http://localhost:3000/api/stories/search?keyword=测试&page=1&limit=10

**测试说明**: 正常测试：搜索故事

**序号**: 26

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 1,
        "content": "这是一个测试故事",
        "images": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "location": {
          "lng": 116.397428,
          "lat": 39.90923
        },
        "locationName": null,
        "emotionTag": "开心",
        "isTimeCapsule": false,
        "isRecommended": false,
        "viewCount": 0,
        "createdAt": "2026-03-24T16:29:30.289Z",
        "author": {
          "id": 1,
          "username": "story_test_user_1774369770022",
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

## 27. GET http://localhost:3000/api/stories/search?page=1&limit=10

**测试说明**: 边界测试：缺少搜索关键词

**序号**: 27

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json"
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

## 28. GET http://localhost:3000/api/stories/search?keyword=&page=1&limit=10

**测试说明**: 边界测试：空搜索关键词

**序号**: 28

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json"
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

## 29. GET http://localhost:3000/api/stories/search?keyword=故事&page=1&limit=10

**测试说明**: 正常测试：无Token搜索故事

**序号**: 29

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 2,
        "content": "这是一个时光胶囊故事",
        "images": [],
        "location": {
          "lng": 116.397428,
          "lat": 39.90923
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isTimeCapsule": true,
        "isRecommended": false,
        "viewCount": 0,
        "createdAt": "2026-03-24T16:29:30.368Z",
        "author": {
          "id": 1,
          "username": "story_test_user_1774369770022",
          "avatar": null
        }
      },
      {
        "id": 1,
        "content": "这是一个测试故事",
        "images": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "location": {
          "lng": 116.397428,
          "lat": 39.90923
        },
        "locationName": null,
        "emotionTag": "开心",
        "isTimeCapsule": false,
        "isRecommended": false,
        "viewCount": 0,
        "createdAt": "2026-03-24T16:29:30.289Z",
        "author": {
          "id": 1,
          "username": "story_test_user_1774369770022",
          "avatar": null
        }
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

---

## 30. POST http://localhost:3000/api/stories/1

**测试说明**: 正常测试：修改故事内容

**序号**: 30

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "这是修改后的故事内容",
  "emotionTag": "治愈"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "这是修改后的故事内容",
    "emotionTag": "治愈"
  }
}
```

---

## 31. POST http://localhost:3000/api/stories/1

**测试说明**: 边界测试：无Token修改故事

**序号**: 31

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
  "content": "无Token修改测试"
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

## 32. POST http://localhost:3000/api/stories/999999

**测试说明**: 边界测试：修改不存在的故事

**序号**: 32

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "修改不存在的故事"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "故事不存在",
  "stack": "Error: 故事不存在\n    at StoryServiceClass.modifyStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:287:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async StoryServiceClass.modifyStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:137:20)\n    at async modifyStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:108:20)"
}
```

---

## 33. POST http://localhost:3000/api/auth/register_2

**测试说明**: 创建另一个测试用户

**序号**: 33

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
  "username": "story_test_other_1774369770506",
  "email": "story_test_other_1774369770506@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.clapCBC62O5KDSvetqzbhlEg4DXyfVmV26trgbtjxZo",
    "user": {
      "id": 3,
      "username": "story_test_other_1774369770506"
    }
  }
}
```

---

## 34. POST http://localhost:3000/api/stories/1

**测试说明**: 边界测试：修改其他用户的故事

**序号**: 34

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.clapCBC62O5KDSvetqzbhlEg4DXyfVmV26trgbtjxZo"
}
```

**请求体**:
```json
{
  "content": "修改别人的故事"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "无权修改此故事",
  "stack": "Error: 无权修改此故事\n    at StoryServiceClass.modifyStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:291:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async StoryServiceClass.modifyStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:137:20)\n    at async modifyStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:108:20)"
}
```

---

## 35. POST http://localhost:3000/api/stories/1

**测试说明**: 边界测试：修改为无效的情感标签

**序号**: 35

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "测试内容",
  "emotionTag": "无效标签"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "测试内容",
    "emotionTag": "无效标签"
  }
}
```

---

## 36. PUT http://localhost:3000/api/stories/1/visibility

**测试说明**: 正常测试：修改故事可见性为public

**序号**: 36

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "visibility": "public"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "visibility": "public"
  }
}
```

---

## 37. PUT http://localhost:3000/api/stories/1/visibility

**测试说明**: 边界测试：无Token修改可见性

**序号**: 37

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
  "visibility": "public"
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

## 38. PUT http://localhost:3000/api/stories/1/visibility

**测试说明**: 边界测试：无效的visibility值

**序号**: 38

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "visibility": "invalid"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "可见性只能为 public 或 shadowban",
  "stack": "Error: 可见性只能为 public 或 shadowban\n    at StoryServiceClass.updateVisibility (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:321:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async StoryServiceClass.updateVisibility (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:137:20)\n    at async updateVisibility (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:124:20)"
}
```

---

## 39. PUT http://localhost:3000/api/stories/1/visibility

**测试说明**: 边界测试：缺少visibility参数

**序号**: 39

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "可见性只能为 public 或 shadowban",
  "stack": "Error: 可见性只能为 public 或 shadowban\n    at StoryServiceClass.updateVisibility (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:321:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async StoryServiceClass.updateVisibility (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:137:20)\n    at async updateVisibility (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:124:20)"
}
```

---

## 40. PUT http://localhost:3000/api/stories/999999/visibility

**测试说明**: 边界测试：修改不存在的故事可见性

**序号**: 40

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "visibility": "public"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "故事不存在",
  "stack": "Error: 故事不存在\n    at StoryServiceClass.updateVisibility (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:312:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async StoryServiceClass.updateVisibility (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:137:20)\n    at async updateVisibility (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:124:20)"
}
```

---

## 41. POST http://localhost:3000/api/stories

**测试说明**: 创建用于删除测试的故事

**序号**: 41

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**请求体**:
```json
{
  "content": "这是要被删除的故事",
  "images": [],
  "location": {
    "lat": 39.90923,
    "lng": 116.397428
  },
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 3,
    "content": "这是要被删除的故事",
    "createdAt": "2026-03-24T16:29:30.612Z"
  }
}
```

---

## 42. DELETE http://localhost:3000/api/stories/3

**测试说明**: 正常测试：删除故事

**序号**: 42

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
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

## 43. DELETE http://localhost:3000/api/stories/1

**测试说明**: 边界测试：无Token删除故事

**序号**: 43

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

## 44. DELETE http://localhost:3000/api/stories/999999

**测试说明**: 边界测试：删除不存在的故事

**序号**: 44

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "故事不存在",
  "stack": "Error: 故事不存在\n    at StoryServiceClass.deleteStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:202:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async StoryServiceClass.deleteStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:137:20)\n    at async deleteStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:52:5)"
}
```

---

## 45. DELETE http://localhost:3000/api/stories/3

**测试说明**: 边界测试：重复删除已删除的故事

**序号**: 45

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
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

## 46. GET http://localhost:3000/api/stories/upload-token

**测试说明**: 正常测试：获取OSS上传凭证

**序号**: 46

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessKeyId": "your_access_key_id",
    "policy": "eyJleHBpcmF0aW9uIjoiMjAyNi0wMy0yNFQxNzoyOTozMC42NDZaIiwiY29uZGl0aW9ucyI6W1siY29udGVudC1sZW5ndGgtcmFuZ2UiLDAsMTA0ODU3NjBdLFsic3RhcnRzLXdpdGgiLCIka2V5IiwidXBsb2Fkcy8iXV19",
    "signature": "Yx9evVBETIzmmVSy/PwUVfWzwgE=",
    "host": "https://echostar.oss-cn-beijing.aliyuncs.com",
    "expire": 1774373370646,
    "dir": "uploads/"
  }
}
```

---

## 47. GET http://localhost:3000/api/stories/upload-token

**测试说明**: 边界测试：无Token获取OSS上传凭证

**序号**: 47

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

## 48. POST http://localhost:3000/api/stories/2/unlock

**测试说明**: 边界测试：解锁未到时间的时光胶囊

**序号**: 48

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
  "message": "尚未到解锁时间",
  "stack": "Error: 尚未到解锁时间\n    at StoryServiceClass.unlockTimeCapsule (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:273:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async StoryServiceClass.unlockTimeCapsule (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:137:20)\n    at async unlockTimeCapsule (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:92:20)"
}
```

---

## 49. POST http://localhost:3000/api/stories/999999/unlock

**测试说明**: 边界测试：解锁不存在的故事

**序号**: 49

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
  "message": "故事不存在",
  "stack": "Error: 故事不存在\n    at StoryServiceClass.unlockTimeCapsule (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:265:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async StoryServiceClass.unlockTimeCapsule (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:137:20)\n    at async unlockTimeCapsule (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:92:20)"
}
```

---

## 50. POST http://localhost:3000/api/stories/1/unlock

**测试说明**: 边界测试：解锁非时光胶囊故事

**序号**: 50

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
  "message": "此故事不是时光胶囊",
  "stack": "Error: 此故事不是时光胶囊\n    at StoryServiceClass.unlockTimeCapsule (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:269:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async StoryServiceClass.unlockTimeCapsule (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/common/utils/redis.js:137:20)\n    at async unlockTimeCapsule (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:92:20)"
}
```

---

## 51. GET http://localhost:3000/api/stories/admin/all?page=1&limit=20

**测试说明**: 正常测试：管理员获取所有帖子

**序号**: 51

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.6xG-GIxiVfaEMLy5oUSUDsXApZFtB4Oz1iO_BYl0shM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 2,
        "emotionTag": "治愈",
        "content": "这是一个时光胶囊故事",
        "visibility": "public",
        "locationName": null,
        "createdAt": "2026-03-24T16:29:30.368Z",
        "author": {
          "id": 1,
          "username": "story_test_user_1774369770022",
          "avatar": null
        }
      },
      {
        "id": 1,
        "emotionTag": "无效标签",
        "content": "测试内容",
        "visibility": "public",
        "locationName": null,
        "createdAt": "2026-03-24T16:29:30.289Z",
        "author": {
          "id": 1,
          "username": "story_test_user_1774369770022",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 52. GET http://localhost:3000/api/stories/admin/all

**测试说明**: 边界测试：无Token获取所有帖子

**序号**: 52

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

## 53. GET http://localhost:3000/api/stories/admin/all

**测试说明**: 边界测试：普通用户尝试获取所有帖子

**序号**: 53

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.-H0tTlqa8_v-1TGTj9mVWzui5zbNX8NI63GzTadKXx4"
}
```

**返回内容**:
```json
{
  "code": 403,
  "message": "需要管理员权限"
}
```

---

## 54. GET http://localhost:3000/api/stories/admin/all?visibility=public&page=1&limit=20

**测试说明**: 正常测试：管理员按可见性筛选帖子

**序号**: 54

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.6xG-GIxiVfaEMLy5oUSUDsXApZFtB4Oz1iO_BYl0shM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 2,
        "emotionTag": "治愈",
        "content": "这是一个时光胶囊故事",
        "visibility": "public",
        "locationName": null,
        "createdAt": "2026-03-24T16:29:30.368Z",
        "author": {
          "id": 1,
          "username": "story_test_user_1774369770022",
          "avatar": null
        }
      },
      {
        "id": 1,
        "emotionTag": "无效标签",
        "content": "测试内容",
        "visibility": "public",
        "locationName": null,
        "createdAt": "2026-03-24T16:29:30.289Z",
        "author": {
          "id": 1,
          "username": "story_test_user_1774369770022",
          "avatar": null
        }
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 55. GET http://localhost:3000/api/stories/admin/all?page=2&limit=10

**测试说明**: 正常测试：管理员使用分页参数

**序号**: 55

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM2OTc3MCwiZXhwIjoxNzc0OTc0NTcwfQ.6xG-GIxiVfaEMLy5oUSUDsXApZFtB4Oz1iO_BYl0shM"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [],
    "pagination": {
      "total": 2,
      "page": 2,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

