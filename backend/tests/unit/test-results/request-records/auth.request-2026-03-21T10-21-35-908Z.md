# EchoStar API 测试报告 - Auth模块

**测试时间**: 2026-03-21T10:21:35.908Z

**服务器地址**: http://localhost:3000

**请求总数**: 30

---

## 1. POST http://localhost:3000/api/auth/register_2

**测试说明**: 创建测试用户1（无需验证码）

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
  "username": "auth_test_user1_1774088474881",
  "email": "auth_test_1774088474881@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4ODQ3NSwiZXhwIjoxNzc0NjkzMjc1fQ.npdUDU0-6TtRi_zhJuckwJkPxK-_rRa6dfKLv677GtA",
    "user": {
      "id": 1,
      "username": "auth_test_user1_1774088474881"
    }
  }
}
```

---

## 2. POST http://localhost:3000/api/auth/send-code

**测试说明**: 发送注册验证码

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
  "email": "2097922846@qq.com"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "验证码已发送"
  }
}
```

---

## 3. POST http://localhost:3000/api/auth/register

**测试说明**: 创建测试用户2（需要验证码）

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
  "username": "auth_test_user2_1774088475050",
  "email": "2097922846@qq.com",
  "password": "Test123456",
  "verificationCode": "24762"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4ODQ4NSwiZXhwIjoxNzc0NjkzMjg1fQ.2wwc4ZwR3Msw0zK55e0HyUjCtkywk9ztc8t-f7PpZjA",
    "user": {
      "id": 2,
      "username": "auth_test_user2_1774088475050"
    }
  }
}
```

---

## 4. POST http://localhost:3000/api/auth/login

**测试说明**: 正常测试：使用正确的邮箱和密码登录

**序号**: 4

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
  "email": "auth_test_1774088474881@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4ODQ4NSwiZXhwIjoxNzc0NjkzMjg1fQ.-Uo_oxAq7dbMRDp2x6ppowDB1pCrQAn9qH9dTabsN5A",
    "user": {
      "id": 1,
      "email": "auth_test_1774088474881@test.com",
      "username": "auth_test_user1_1774088474881",
      "avatar": null
    }
  }
}
```

---

## 5. POST http://localhost:3000/api/auth/login

**测试说明**: 边界测试：使用错误密码登录

**序号**: 5

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
  "email": "auth_test_1774088474881@test.com",
  "password": "WrongPassword123"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "邮箱或密码错误",
  "stack": "Error: 邮箱或密码错误\n    at Object.login (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:181:13)\n    at async login (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:67:20)"
}
```

---

## 6. POST http://localhost:3000/api/auth/login

**测试说明**: 边界测试：缺少密码参数登录

**序号**: 6

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
  "email": "auth_test_1774088474881@test.com"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "data and hash arguments required",
  "stack": "Error: data and hash arguments required\n    at Object.compare (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\bcrypt\\bcrypt.js:208:17)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\bcrypt\\promises.js:29:12\n    at new Promise (<anonymous>)\n    at module.exports.promise (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\bcrypt\\promises.js:20:12)\n    at Object.compare (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\bcrypt\\bcrypt.js:204:25)\n    at Object.login (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:179:42)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async login (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:67:20)"
}
```

---

## 7. GET http://localhost:3000/api/auth/me

**测试说明**: 正常测试：使用有效Token获取当前用户信息

**序号**: 7

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4ODQ3NSwiZXhwIjoxNzc0NjkzMjc1fQ.npdUDU0-6TtRi_zhJuckwJkPxK-_rRa6dfKLv677GtA"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "email": "auth_test_1774088474881@test.com",
    "username": "auth_test_user1_1774088474881",
    "avatar": null,
    "bio": null,
    "role": "user",
    "status": "normal",
    "createdAt": "2026-03-21T10:21:15.032Z"
  }
}
```

---

## 8. GET http://localhost:3000/api/auth/me

**测试说明**: 边界测试：缺少Token访问用户信息接口

**序号**: 8

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

## 9. PUT http://localhost:3000/api/auth/users/me

**测试说明**: 正常测试：修改用户名和简介

**序号**: 9

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4ODQ3NSwiZXhwIjoxNzc0NjkzMjc1fQ.npdUDU0-6TtRi_zhJuckwJkPxK-_rRa6dfKLv677GtA"
}
```

**请求体**:
```json
{
  "username": "auth_test_updated_1774088485663",
  "bio": "这是测试更新的个人简介"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "require is not defined",
  "stack": "ReferenceError: require is not defined\n    at Object.updateProfile (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:395:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async updateProfile (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:120:20)"
}
```

---

## 10. PUT http://localhost:3000/api/auth/users/me

**测试说明**: 边界测试：缺少Token修改个人信息

**序号**: 10

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
  "bio": "无Token测试"
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

## 11. GET http://localhost:3000/api/auth/users/1

**测试说明**: 正常测试：查看用户信息

**序号**: 11

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
    "username": "auth_test_user1_1774088474881",
    "avatar": null,
    "bio": null,
    "stories": []
  }
}
```

---

## 12. GET http://localhost:3000/api/auth/users/999999

**测试说明**: 边界测试：查看不存在的用户

**序号**: 12

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
  "message": "用户不存在",
  "stack": "Error: 用户不存在\n    at Object.getUserById (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:345:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async getUserById (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:106:18)"
}
```

---

## 13. PUT http://localhost:3000/api/auth/users/me/password

**测试说明**: 正常测试：使用正确的旧密码修改密码

**序号**: 13

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4ODQ3NSwiZXhwIjoxNzc0NjkzMjc1fQ.npdUDU0-6TtRi_zhJuckwJkPxK-_rRa6dfKLv677GtA"
}
```

**请求体**:
```json
{
  "oldPassword": "Test123456",
  "newPassword": "NewTest123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "密码修改成功"
  }
}
```

---

## 14. POST http://localhost:3000/api/auth/login

**测试说明**: 验证修改后的新密码可以登录

**序号**: 14

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
  "email": "auth_test_1774088474881@test.com",
  "password": "NewTest123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4ODQ4NSwiZXhwIjoxNzc0NjkzMjg1fQ.-Uo_oxAq7dbMRDp2x6ppowDB1pCrQAn9qH9dTabsN5A",
    "user": {
      "id": 1,
      "email": "auth_test_1774088474881@test.com",
      "username": "auth_test_user1_1774088474881",
      "avatar": null
    }
  }
}
```

---

## 15. PUT http://localhost:3000/api/auth/users/me/password

**测试说明**: 边界测试：使用错误的旧密码修改密码

**序号**: 15

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4ODQ4NSwiZXhwIjoxNzc0NjkzMjg1fQ.-Uo_oxAq7dbMRDp2x6ppowDB1pCrQAn9qH9dTabsN5A"
}
```

**请求体**:
```json
{
  "oldPassword": "WrongPassword",
  "newPassword": "AnotherPassword"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "原密码错误",
  "stack": "Error: 原密码错误\n    at Object.changePassword (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:438:13)\n    at async changePassword (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:134:20)"
}
```

---

## 16. PUT http://localhost:3000/api/auth/users/me/password

**测试说明**: 边界测试：缺少Token修改密码

**序号**: 16

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
  "oldPassword": "NewTest123456",
  "newPassword": "Test123456"
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

## 17. PUT http://localhost:3000/api/auth/users/me/password

**测试说明**: 恢复原密码

**序号**: 17

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4ODQ4NSwiZXhwIjoxNzc0NjkzMjg1fQ.-Uo_oxAq7dbMRDp2x6ppowDB1pCrQAn9qH9dTabsN5A"
}
```

**请求体**:
```json
{
  "oldPassword": "NewTest123456",
  "newPassword": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "密码修改成功"
  }
}
```

---

## 18. POST http://localhost:3000/api/auth/admin/login

**测试说明**: 边界测试：普通用户尝试管理员登录

**序号**: 18

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
  "email": "auth_test_1774088474881@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "邮箱或密码错误",
  "stack": "Error: 邮箱或密码错误\n    at Object.adminLogin (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:143:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async adminLogin (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:54:20)"
}
```

---

## 19. POST http://localhost:3000/api/auth/admin/login

**测试说明**: 边界测试：缺少密码管理员登录

**序号**: 19

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
  "email": "admin@test.com"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "邮箱或密码错误",
  "stack": "Error: 邮箱或密码错误\n    at Object.adminLogin (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:143:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async adminLogin (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:54:20)"
}
```

---

## 20. POST http://localhost:3000/api/auth/send-code

**测试说明**: 正常测试：发送验证码到有效邮箱

**序号**: 20

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
  "email": "auth_test_1774088474881@test.com"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "验证码已发送"
  }
}
```

---

## 21. POST http://localhost:3000/api/auth/send-code

**测试说明**: 边界测试：缺少邮箱参数发送验证码

**序号**: 21

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json"
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
  "message": "Cannot read properties of undefined (reading 'trim')",
  "stack": "TypeError: Cannot read properties of undefined (reading 'trim')\n    at Object.sendVerificationCode (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:18:30)\n    at sendVerificationCode (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:12:38)\n    at Layer.handle [as handle_request] (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at Route.dispatch (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\express\\lib\\router\\route.js:119:3)\n    at Layer.handle [as handle_request] (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\express\\lib\\router\\index.js:284:15\n    at Function.process_params (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\express\\lib\\router\\index.js:346:12)\n    at next (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\express\\lib\\router\\index.js:280:10)\n    at Function.handle (C:\\Users\\20979\\RP_Projects\\ECHOSTAR\\EchoStar\\backend\\node_modules\\express\\lib\\router\\index.js:175:3)"
}
```

---

## 22. POST http://localhost:3000/api/auth/send-code

**测试说明**: 边界测试：使用无效邮箱格式发送验证码

**序号**: 22

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
  "email": "invalid-email"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "发送验证码失败",
  "stack": "Error: 发送验证码失败\n    at Object.sendVerificationCode (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:68:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async sendVerificationCode (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:12:20)"
}
```

---

## 23. POST http://localhost:3000/api/auth/send-code

**测试说明**: 发送忘记密码验证码

**序号**: 23

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
  "email": "2097922846@qq.com"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "验证码已发送"
  }
}
```

---

## 24. POST http://localhost:3000/api/auth/forgot-password

**测试说明**: 正常测试：使用验证码重置密码

**序号**: 24

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
  "email": "2097922846@qq.com",
  "password": "NewTest123456",
  "verificationCode": "42568"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "密码重置成功，请使用新密码登录"
}
```

---

## 25. POST http://localhost:3000/api/auth/login

**测试说明**: 验证重置后的新密码可以登录

**序号**: 25

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
  "email": "2097922846@qq.com",
  "password": "NewTest123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4ODQ5NSwiZXhwIjoxNzc0NjkzMjk1fQ.bjNnnEXsSLTJZI6I_2qAKK0gQlEDHWdeZj7jHeBval4",
    "user": {
      "id": 2,
      "email": "2097922846@qq.com",
      "username": "auth_test_user2_1774088475050",
      "avatar": null
    }
  }
}
```

---

## 26. PUT http://localhost:3000/api/auth/users/me/password

**测试说明**: 恢复原密码

**序号**: 26

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDA4ODQ5NSwiZXhwIjoxNzc0NjkzMjk1fQ.bjNnnEXsSLTJZI6I_2qAKK0gQlEDHWdeZj7jHeBval4"
}
```

**请求体**:
```json
{
  "oldPassword": "NewTest123456",
  "newPassword": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "密码修改成功"
  }
}
```

---

## 27. POST http://localhost:3000/api/auth/forgot-password

**测试说明**: 边界测试：使用错误的验证码重置密码

**序号**: 27

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
  "email": "2097922846@qq.com",
  "password": "NewTest123456",
  "verificationCode": "00000"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "验证码不存在或已过期，请重新获取验证码",
  "stack": "Error: 验证码不存在或已过期，请重新获取验证码\n    at Object.forgotPassword (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:305:28)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async forgotPassword (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:147:20)"
}
```

---

## 28. POST http://localhost:3000/api/auth/forgot-password

**测试说明**: 边界测试：缺少验证码参数重置密码

**序号**: 28

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
  "email": "2097922846@qq.com",
  "password": "NewTest123456"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "验证码不存在或已过期，请重新获取验证码",
  "stack": "Error: 验证码不存在或已过期，请重新获取验证码\n    at Object.forgotPassword (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.service.js:305:28)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async forgotPassword (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/auth/auth.controller.js:147:20)"
}
```

---

## 29. DELETE http://localhost:3000/api/auth/me

**测试说明**: 边界测试：缺少Token注销账号

**序号**: 29

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

## 30. DELETE http://localhost:3000/api/auth/me

**测试说明**: 正常测试：注销测试用户1

**序号**: 30

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDA4ODQ4NSwiZXhwIjoxNzc0NjkzMjg1fQ.-Uo_oxAq7dbMRDp2x6ppowDB1pCrQAn9qH9dTabsN5A"
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

