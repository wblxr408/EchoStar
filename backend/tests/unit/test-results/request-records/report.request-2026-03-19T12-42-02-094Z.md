# EchoStar API 测试报告 - Report模块

**测试时间**: 2026-03-19T12:42:02.094Z

**服务器地址**: http://localhost:3000

---

## 1. 接口测试

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
  "username": "report_test_user_1773924121728",
  "email": "report_test_1773924121728@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc",
    "user": {
      "id": 1,
      "username": "report_test_user_1773924121728"
    }
  }
}
```

---

## 2. 接口测试

**序号**: 2

**请求类型**: POST

**接口地址**: http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "content": "测试故事用于举报测试 1773924121880",
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
    "content": "测试故事用于举报测试 1773924121880",
    "createdAt": "2026-03-19T12:42:01.897Z"
  }
}
```

---

## 3. 接口测试

**序号**: 3

**请求类型**: POST

**接口地址**: http://localhost:3000/api/comments

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "测试评论用于举报测试 1773924121913"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "测试评论用于举报测试 1773924121913",
    "createdAt": "2026-03-19T12:42:01.920Z"
  }
}
```

---

## 4. 举报故事测试

**序号**: 4

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 201

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetType": "story",
  "targetId": 1,
  "reason": "测试举报故事原因"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "举报提交成功",
  "data": {
    "id": 1,
    "targetType": "story",
    "targetId": 1,
    "status": "pending"
  }
}
```

---

## 5. 举报故事测试

**序号**: 5

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetType": "story",
  "targetId": 1,
  "reason": "重复举报测试"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "您已举报过该内容，请勿重复举报",
  "stack": "ReportError: 您已举报过该内容，请勿重复举报\n    at Object.createReport (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/report/report.service.js:62:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createReport (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/report/report.controller.js:11:20)"
}
```

---

## 6. 举报评论测试

**序号**: 6

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 201

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetType": "comment",
  "targetId": 1,
  "reason": "测试举报评论原因"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "举报提交成功",
  "data": {
    "id": 2,
    "targetType": "comment",
    "targetId": 1,
    "status": "pending"
  }
}
```

---

## 7. 举报不存在的故事测试

**序号**: 7

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetType": "story",
  "targetId": 999999,
  "reason": "举报不存在的故事"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "举报目标不存在",
  "stack": "ReportError: 举报目标不存在\n    at Object.createReport (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/report/report.service.js:45:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createReport (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/report/report.controller.js:11:20)"
}
```

---

## 8. 举报评论测试

**序号**: 8

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetType": "comment",
  "targetId": 999999,
  "reason": "举报不存在的评论"
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "举报目标不存在",
  "stack": "ReportError: 举报目标不存在\n    at Object.createReport (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/report/report.service.js:45:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createReport (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/report/report.controller.js:11:20)"
}
```

---

## 9. 举报-缺少类型测试

**序号**: 9

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetId": 1,
  "reason": "缺少类型测试"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "举报类型不能为空"
  ]
}
```

---

## 10. 举报故事-缺少目标ID测试

**序号**: 10

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetType": "story",
  "reason": "缺少目标ID测试"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "目标ID不能为空"
  ]
}
```

---

## 11. 举报故事-缺少原因测试

**序号**: 11

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetType": "story",
  "targetId": 1
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "举报原因不能为空"
  ]
}
```

---

## 12. 创建举报测试

**序号**: 12

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetType": "invalid",
  "targetId": 1,
  "reason": "无效类型测试"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "举报类型必须是 story 或 comment"
  ]
}
```

---

## 13. 举报故事测试

**序号**: 13

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "targetType": "story",
  "targetId": 1,
  "reason": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "举报原因不能超过 500 字"
  ]
}
```

---

## 14. 举报故事测试

**序号**: 14

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports

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
  "targetType": "story",
  "targetId": 1,
  "reason": "无Token测试"
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

## 15. 获取用户举报列表测试

**序号**: 15

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports/me

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "reports": [
      {
        "id": 2,
        "targetType": "comment",
        "targetId": 1,
        "target": {
          "type": "comment",
          "id": 1,
          "content": "测试评论用于举报测试 1773924121913",
          "status": "active",
          "userId": 1
        },
        "reason": "测试举报评论原因",
        "status": "pending",
        "createdAt": "2026-03-19T12:42:01.956Z",
        "handledAt": null
      },
      {
        "id": 1,
        "targetType": "story",
        "targetId": 1,
        "target": {
          "type": "story",
          "id": 1,
          "content": "测试故事用于举报测试 1773924121880",
          "images": [
            "https://example.com/test-image.jpg"
          ],
          "visibility": "public",
          "userId": 1
        },
        "reason": "测试举报故事原因",
        "status": "pending",
        "createdAt": "2026-03-19T12:42:01.934Z",
        "handledAt": null
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

## 16. 获取用户举报列表测试

**序号**: 16

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports/me?page=1&limit=5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "reports": [
      {
        "id": 2,
        "targetType": "comment",
        "targetId": 1,
        "target": {
          "type": "comment",
          "id": 1,
          "content": "测试评论用于举报测试 1773924121913",
          "status": "active",
          "userId": 1
        },
        "reason": "测试举报评论原因",
        "status": "pending",
        "createdAt": "2026-03-19T12:42:01.956Z",
        "handledAt": null
      },
      {
        "id": 1,
        "targetType": "story",
        "targetId": 1,
        "target": {
          "type": "story",
          "id": 1,
          "content": "测试故事用于举报测试 1773924121880",
          "images": [
            "https://example.com/test-image.jpg"
          ],
          "visibility": "public",
          "userId": 1
        },
        "reason": "测试举报故事原因",
        "status": "pending",
        "createdAt": "2026-03-19T12:42:01.934Z",
        "handledAt": null
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 5,
      "totalPages": 1
    }
  }
}
```

---

## 17. 获取用户举报列表测试

**序号**: 17

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports/me?page=-1&limit=5

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"page\" must be a positive number"
  ]
}
```

---

## 18. 获取用户举报列表测试

**序号**: 18

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports/me

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

## 19. 管理员获取举报列表-无权限测试

**序号**: 19

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports?targetType=story&status=pending

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
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

## 20. 管理员获取举报列表-无权限测试

**序号**: 20

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports?status=pending

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
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

## 21. 管理员获取举报列表-无权限测试

**序号**: 21

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports?targetType=invalid&status=pending

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
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

## 22. 管理员获取举报列表-无权限测试

**序号**: 22

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports?targetType=story&status=invalid

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
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

## 23. 管理员获取举报列表测试

**序号**: 23

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports?targetType=story&status=pending

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

## 24. 处理举报-无管理员权限测试

**序号**: 24

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports/1/handle

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "action": "approve"
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

## 25. 处理举报-无管理员权限测试

**序号**: 25

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports/1/handle

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "action": "reject"
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

## 26. 处理举报-无管理员权限测试

**序号**: 26

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports/1/handle

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "action": "invalid"
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

## 27. 处理举报-无管理员权限测试

**序号**: 27

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports/1/handle

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 403,
  "message": "需要管理员权限"
}
```

---

## 28. 处理举报-无管理员权限测试

**序号**: 28

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports/999999/handle

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**请求体**:
```json
{
  "action": "approve"
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

## 29. 批准举报测试

**序号**: 29

**请求类型**: POST

**接口地址**: http://localhost:3000/api/reports/1/handle

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
  "action": "approve"
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

## 30. 获取举报统计测试

**序号**: 30

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports/statistics

**返回状态**: 403

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
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

## 31. 获取举报统计测试

**序号**: 31

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports/statistics

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

## 33. 获取用户举报列表测试

**序号**: 33

**请求类型**: GET

**接口地址**: http://localhost:3000/api/reports/me?page=1000&limit=10

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyNDEyMSwiZXhwIjoxNzc0NTI4OTIxfQ.hQ9rhn_1Nc3pv8u0m6Tz8H3Q5m9tDPbKzm-YcJjR4Xc"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "reports": [],
    "pagination": {
      "total": 0,
      "page": 1000,
      "limit": 10,
      "totalPages": 0
    }
  }
}
```

---

