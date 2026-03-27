# EchoStar API 测试报告 - 修改用户信息接口

**测试时间**: 2026-03-21T13:56:37.778Z

**服务器地址**: http://localhost:3000

**请求总数**: 5

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
  "username": "update_user_test_user_1774101397584",
  "email": "update_user_test_1774101397584@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDEwMTM5NywiZXhwIjoxNzc0NzA2MTk3fQ.Y8eaf8-wVp9K8Ym8HoC05twtPLZk0AG6cMby-5z2WRw",
    "user": {
      "id": 1,
      "username": "update_user_test_user_1774101397584"
    }
  }
}
```

---

## 2. GET http://localhost:3000/api/auth/me

**测试说明**: 获取当前用户信息（修改前）

**序号**: 2

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDEwMTM5NywiZXhwIjoxNzc0NzA2MTk3fQ.Y8eaf8-wVp9K8Ym8HoC05twtPLZk0AG6cMby-5z2WRw"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "email": "update_user_test_1774101397584@test.com",
    "username": "update_user_test_user_1774101397584",
    "avatar": null,
    "bio": null,
    "role": "user",
    "status": "normal",
    "createdAt": "2026-03-21T13:56:37.715Z"
  }
}
```

---

## 3. PUT http://localhost:3000/api/auth/users/me

**测试说明**: 正常测试：修改用户名和简介

**序号**: 3

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDEwMTM5NywiZXhwIjoxNzc0NzA2MTk3fQ.Y8eaf8-wVp9K8Ym8HoC05twtPLZk0AG6cMby-5z2WRw"
}
```

**请求体**:
```json
{
  "username": "update_user_test_updated_1774101397746",
  "bio": "这是测试更新的个人简介"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "username": "update_user_test_updated_1774101397746",
    "avatar": null,
    "bio": "这是测试更新的个人简介"
  }
}
```

---

## 4. GET http://localhost:3000/api/auth/me

**测试说明**: 获取当前用户信息（修改后）

**序号**: 4

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDEwMTM5NywiZXhwIjoxNzc0NzA2MTk3fQ.Y8eaf8-wVp9K8Ym8HoC05twtPLZk0AG6cMby-5z2WRw"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "email": "update_user_test_1774101397584@test.com",
    "username": "update_user_test_updated_1774101397746",
    "avatar": null,
    "bio": "这是测试更新的个人简介",
    "role": "user",
    "status": "normal",
    "createdAt": "2026-03-21T13:56:37.715Z"
  }
}
```

---

## 5. DELETE http://localhost:3000/api/auth/me

**测试说明**: 注销测试账号

**序号**: 5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDEwMTM5NywiZXhwIjoxNzc0NzA2MTk3fQ.Y8eaf8-wVp9K8Ym8HoC05twtPLZk0AG6cMby-5z2WRw"
}
```

**返回内容**:
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

