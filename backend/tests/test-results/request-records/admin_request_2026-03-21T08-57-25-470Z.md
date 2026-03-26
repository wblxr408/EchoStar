# EchoStar API 测试报告 - Admin模块

**测试时间**: 2026-03-21T08:57:25.470Z

**服务器地址**: http://localhost:3000

**请求总数**: 44

---

## 1. POST http://localhost:3000/api/auth/register_2

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
  "username": "admin01",
  "email": "admin_test_admin_1774083444647@test.com",
  "password": "Admin123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4",
    "user": {
      "id": 1,
      "username": "admin01"
    }
  }
}
```

---

## 2. POST http://localhost:3000/api/auth/admin/login

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
  "email": "admin_test_admin_1774083444647@test.com",
  "password": "Admin123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4",
    "user": {
      "id": 1,
      "email": "admin_test_admin_1774083444647@test.com",
      "username": "admin01",
      "avatar": null
    }
  }
}
```

---

## 3. POST http://localhost:3000/api/auth/register_2

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
  "username": "user01",
  "email": "admin_test_user01_1774083444827@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8",
    "user": {
      "id": 2,
      "username": "user01"
    }
  }
}
```

---

## 4. POST http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
}
```

**请求体**:
```json
{
  "content": "user01 story",
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
    "content": "user01 story",
    "createdAt": "2026-03-21T08:57:24.907Z"
  }
}
```

---

## 5. POST http://localhost:3000/api/auth/register_2

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
  "username": "user02",
  "email": "admin_test_user02_1774083444915@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.yg0d88R0ODRYnieJrYcC3H8I-1y20UvBQzibeJfeTFQ",
    "user": {
      "id": 3,
      "username": "user02"
    }
  }
}
```

---

## 6. POST http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.yg0d88R0ODRYnieJrYcC3H8I-1y20UvBQzibeJfeTFQ"
}
```

**请求体**:
```json
{
  "content": "user02story",
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
    "id": 2,
    "content": "user02story",
    "createdAt": "2026-03-21T08:57:24.987Z"
  }
}
```

---

## 7. POST http://localhost:3000/api/auth/register_2

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
  "username": "user03",
  "email": "admin_test_user03_1774083444992@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.EwFPT1ziv2t1_ZJ7GVmyGgkdS1zQ5K01pq_mFE533BQ",
    "user": {
      "id": 4,
      "username": "user03"
    }
  }
}
```

---

## 8. POST http://localhost:3000/api/admin/users/2/ban

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
  "reason": "无Token封禁测试"
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

## 9. POST http://localhost:3000/api/admin/users/2/ban

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
}
```

**请求体**:
```json
{
  "reason": "自己封禁自己"
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

## 10. POST http://localhost:3000/api/admin/users/1/ban

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
}
```

**请求体**:
```json
{
  "reason": "管理员封禁自己"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "不能封禁管理员",
  "stack": "AdminError: 不能封禁管理员\n    at Object.banUser (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.service.js:114:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async banUser (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.controller.js:59:5)"
}
```

---

## 11. POST http://localhost:3000/api/admin/users/999999/ban

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
}
```

**请求体**:
```json
{
  "reason": "测试"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "用户不存在",
  "stack": "AdminError: 用户不存在\n    at Object.banUser (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.service.js:110:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async banUser (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.controller.js:59:5)"
}
```

---

## 12. POST http://localhost:3000/api/admin/users/2/ban

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
}
```

**请求体**:
```json
{
  "reason": "user01 违规，进行封禁"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "封禁成功"
}
```

---

## 13. POST http://localhost:3000/api/admin/users/2/ban

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
}
```

**请求体**:
```json
{
  "reason": "重复封禁"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "用户已被封禁或删除",
  "stack": "AdminError: 用户已被封禁或删除\n    at Object.banUser (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.service.js:118:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async banUser (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.controller.js:59:5)"
}
```

---

## 14. POST http://localhost:3000/api/auth/login

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
  "email": "admin_test_user01_1774083444827@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "该用户已被注销",
  "stack": "Error: 该用户已被注销\n    at Object.login (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:175:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async login (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:82:20)"
}
```

---

## 15. POST http://localhost:3000/api/stories

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
}
```

**请求体**:
```json
{
  "content": "user01 banned story",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "开心"
}
```

**返回内容**:
```json
{
  "code": 4003,
  "message": "用户已被删除"
}
```

---

## 16. POST http://localhost:3000/api/comments

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
}
```

**请求体**:
```json
{
  "storyId": 2,
  "content": "user01 self-comment"
}
```

**返回内容**:
```json
{
  "code": 4003,
  "message": "用户已被删除"
}
```

---

## 17. POST http://localhost:3000/api/likes

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
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
  "code": 4003,
  "message": "用户已被删除"
}
```

---

## 18. POST http://localhost:3000/api/favorites

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
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
  "code": 4003,
  "message": "用户已被删除"
}
```

---

## 19. GET http://localhost:3000/api/auth/me

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
}
```

**返回内容**:
```json
{
  "code": 4003,
  "message": "用户已被删除"
}
```

## 21. GET http://localhost:3000/api/stories/me/list?page=1&limit=10

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
}
```

**返回内容**:
```json
{
  "code": 4003,
  "message": "用户已被删除"
}
```

---

## 22. GET http://localhost:3000/api/notifications/me?page=1&limit=10

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
}
```

**返回内容**:
```json
{
  "code": 4003,
  "message": "用户已被删除"
}
```

---

## 23. GET http://localhost:3000/api/favorites/me?page=1&limit=10

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ._cZlwBGKrFDV62jtPfLv0HCkncd_5eRY_qw5hCXhZw8"
}
```

**返回内容**:
```json
{
  "code": 4003,
  "message": "用户已被删除"
}
```

---

## 24. POST http://localhost:3000/api/admin/stories/2/shadowban

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
  "reason": "无Token封禁测试"
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

## 25. POST http://localhost:3000/api/admin/stories/2/shadowban

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.yg0d88R0ODRYnieJrYcC3H8I-1y20UvBQzibeJfeTFQ"
}
```

**请求体**:
```json
{
  "reason": "用户封禁自己的故事"
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

## 26. POST http://localhost:3000/api/admin/stories/999999/shadowban

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
}
```

**请求体**:
```json
{
  "reason": "测试"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "故事不存在",
  "stack": "AdminError: 故事不存在\n    at Object.shadowbanStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.service.js:54:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async shadowbanStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.controller.js:28:5)"
}
```

---

## 27. POST http://localhost:3000/api/admin/stories/2/shadowban

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
}
```

**请求体**:
```json
{
  "reason": "user02 的故事违规，进行 shadowban"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "Shadowban 成功"
}
```

---

## 28. POST http://localhost:3000/api/admin/stories/2/shadowban

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
}
```

**请求体**:
```json
{
  "reason": "重复封禁"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "故事已经是 shadowban 状态",
  "stack": "AdminError: 故事已经是 shadowban 状态\n    at Object.shadowbanStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.service.js:59:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async shadowbanStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.controller.js:28:5)"
}
```

---

## 29. GET http://localhost:3000/api/stories/search?keyword=user02&page=1&limit=10

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.EwFPT1ziv2t1_ZJ7GVmyGgkdS1zQ5K01pq_mFE533BQ"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [],
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

## 30. GET http://localhost:3000/api/stories/2

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.EwFPT1ziv2t1_ZJ7GVmyGgkdS1zQ5K01pq_mFE533BQ"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "故事不存在",
  "stack": "Error: 故事不存在\n    at StoryServiceClass.getStoryById (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.service.js:137:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async getStoryById (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/story/story.controller.js:35:19)"
}
```

---

## 31. POST http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.EwFPT1ziv2t1_ZJ7GVmyGgkdS1zQ5K01pq_mFE533BQ"
}
```

**请求体**:
```json
{
  "storyId": 2,
  "content": "user03 comment on shadowbanned story"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "user03 comment on shadowbanned story",
    "createdAt": "2026-03-21T08:57:25.266Z"
  }
}
```

---

## 32. POST http://localhost:3000/api/likes

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.EwFPT1ziv2t1_ZJ7GVmyGgkdS1zQ5K01pq_mFE533BQ"
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
    "isLiked": true,
    "message": "点赞成功",
    "id": 1
  }
}
```

---

## 33. POST http://localhost:3000/api/favorites

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.EwFPT1ziv2t1_ZJ7GVmyGgkdS1zQ5K01pq_mFE533BQ"
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
    "isFavorited": true,
    "message": "收藏成功",
    "id": 1
  }
}
```

---

## 34. GET http://localhost:3000/api/comments/story/2?page=1&limit=10

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.EwFPT1ziv2t1_ZJ7GVmyGgkdS1zQ5K01pq_mFE533BQ"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "user03 comment on shadowbanned story",
        "createdAt": "2026-03-21T08:57:25.266Z",
        "user": {
          "id": 4,
          "username": "user03",
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

## 35. POST http://localhost:3000/api/admin/users/2/unban

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
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
  "message": "解封成功"
}
```

---

## 36. POST http://localhost:3000/api/admin/users/2/unban

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
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
  "message": "用户当前不是封禁状态",
  "stack": "AdminError: 用户当前不是封禁状态\n    at Object.unbanUser (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.service.js:143:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async unbanUser (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.controller.js:74:5)"
}
```

---

## 37. POST http://localhost:3000/api/admin/stories/2/restore

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
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
  "message": "恢复成功"
}
```

---

## 38. POST http://localhost:3000/api/admin/stories/2/restore

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
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
  "message": "故事已经是公开状态",
  "stack": "AdminError: 故事已经是公开状态\n    at Object.restoreStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.service.js:85:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async restoreStory (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/admin/admin.controller.js:43:5)"
}
```

---

## 39. POST http://localhost:3000/api/auth/login

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
  "email": "admin_test_user01_1774083444827@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.N5V9rfVCgHckaVZpxoVi1MHEExiz_Gd1JJUnMVuORiI",
    "user": {
      "id": 2,
      "email": "admin_test_user01_1774083444827@test.com",
      "username": "user01",
      "avatar": null
    }
  }
}
```

---

## 40. POST http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.N5V9rfVCgHckaVZpxoVi1MHEExiz_Gd1JJUnMVuORiI"
}
```

**请求体**:
```json
{
  "content": "user01 story after unban",
  "images": [
    "https://example.com/test.jpg"
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
    "id": 3,
    "content": "user01 story after unban",
    "createdAt": "2026-03-21T08:57:25.432Z"
  }
}
```

---

## 41. POST http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.EwFPT1ziv2t1_ZJ7GVmyGgkdS1zQ5K01pq_mFE533BQ"
}
```

**请求体**:
```json
{
  "storyId": 2,
  "content": "user03 comment user02 story after unshadowban"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 2,
    "content": "user03 comment user02 story after unshadowban",
    "createdAt": "2026-03-21T08:57:25.446Z"
  }
}
```

---

## 42. GET http://localhost:3000/api/admin/statistics

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

## 43. GET http://localhost:3000/api/admin/statistics

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4MzQ0NSwiZXhwIjoxNzc0Njg4MjQ1fQ.N5V9rfVCgHckaVZpxoVi1MHEExiz_Gd1JJUnMVuORiI"
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

## 44. GET http://localhost:3000/api/admin/statistics

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4MzQ0NCwiZXhwIjoxNzc0Njg4MjQ0fQ.RJVIdXGRsWmYX2cf0xDMAtBiSjtm1oeGHhHF0Ocy9Y4"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "totalUsers": 4,
    "totalStories": 3,
    "publicStories": 3,
    "timeCapsules": 0,
    "shadowbannedStories": 0,
    "todayStories": 3
  }
}
```

---

