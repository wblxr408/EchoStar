# EchoStar API 测试报告 - Notification模块

**测试时间**: 2026-03-19T12:13:55.556Z

**服务器地址**: http://localhost:3000

**请求总数**: 19

---

## 1. POST http://localhost:3000/api/auth/register

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
  "username": "notification_test_user_A_1773922434654",
  "email": "notification_test_A_1773922434654@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y",
    "user": {
      "id": 1,
      "username": "notification_test_user_A_1773922434654"
    }
  }
}
```

---

## 2. POST http://localhost:3000/api/auth/register

**序号**: 2

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y"
}
```

**请求体**:
```json
{
  "username": "notification_test_user_B_1773922434793",
  "email": "notification_test_B_1773922434793@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0",
    "user": {
      "id": 2,
      "username": "notification_test_user_B_1773922434793"
    }
  }
}
```

---

## 3. POST http://localhost:3000/api/stories

**序号**: 3

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y"
}
```

**请求体**:
```json
{
  "content": "测试故事用于通知测试 1773922434857",
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
    "content": "测试故事用于通知测试 1773922434857",
    "createdAt": "2026-03-19T12:13:54.874Z"
  }
}
```

---

## 4. POST http://localhost:3000/api/likes

**序号**: 4

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0"
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

## 5. POST http://localhost:3000/api/comments

**序号**: 5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "用户B评论1"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "用户B评论1",
    "createdAt": "2026-03-19T12:13:54.917Z"
  }
}
```

---

## 6. POST http://localhost:3000/api/favorites

**序号**: 6

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0"
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

## 7. DELETE http://localhost:3000/api/likes/1

**序号**: 7

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0"
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

## 8. POST http://localhost:3000/api/comments

**序号**: 8

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "用户B评论2"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 2,
    "content": "用户B评论2",
    "createdAt": "2026-03-19T12:13:54.948Z"
  }
}
```

---

## 9. DELETE http://localhost:3000/api/favorites/1

**序号**: 9

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0"
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

## 10. POST http://localhost:3000/api/likes

**序号**: 10

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0"
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

## 11. POST http://localhost:3000/api/comments

**序号**: 11

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0"
}
```

**请求体**:
```json
{
  "storyId": 1,
  "content": "用户B评论3"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 3,
    "content": "用户B评论3",
    "createdAt": "2026-03-19T12:13:54.975Z"
  }
}
```

---

## 12. POST http://localhost:3000/api/favorites

**序号**: 12

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.kQPX_nlmnDbDI0JDSMtEuYm9U2fKjiADkTmCWI4VhM0"
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

## 13. GET http://localhost:3000/api/notifications/me

**序号**: 13

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "notifications": [
      {
        "id": "ffb79272-39ab-41e7-bf9a-f16f7a58f388",
        "type": "comment",
        "fromUserId": 2,
        "storyId": 1,
        "fromUser": {
          "id": 2,
          "username": "notification_test_user_B_1773922434793",
          "avatar": null
        },
        "fromUserName": "notification_test_user_B_1773922434793",
        "content": "notification_test_user_B_1773922434793 评论了你的故事: 用户B评论3",
        "createdAt": 1773922434978,
        "isRead": false
      },
      {
        "id": "76b9c463-2325-46f6-b538-8899e0fcc6e7",
        "type": "comment",
        "fromUserId": 2,
        "storyId": 1,
        "fromUser": {
          "id": 2,
          "username": "notification_test_user_B_1773922434793",
          "avatar": null
        },
        "fromUserName": "notification_test_user_B_1773922434793",
        "content": "notification_test_user_B_1773922434793 评论了你的故事: 用户B评论2",
        "createdAt": 1773922434950,
        "isRead": false
      },
      {
        "id": "bc3dca35-eb9d-43b6-a788-6e02526fc910",
        "type": "comment",
        "fromUserId": 2,
        "storyId": 1,
        "fromUser": {
          "id": 2,
          "username": "notification_test_user_B_1773922434793",
          "avatar": null
        },
        "fromUserName": "notification_test_user_B_1773922434793",
        "content": "notification_test_user_B_1773922434793 评论了你的故事: 用户B评论1",
        "createdAt": 1773922434921,
        "isRead": false
      },
      {
        "id": "c3c02875-9de4-4824-8257-cf9cd48a4f5c",
        "type": "like",
        "fromUserId": 2,
        "storyId": 1,
        "fromUser": {
          "id": 2,
          "username": "notification_test_user_B_1773922434793",
          "avatar": null
        },
        "fromUserName": "notification_test_user_B_1773922434793",
        "content": "notification_test_user_B_1773922434793 赞了你的故事",
        "createdAt": 1773922434909,
        "isRead": false
      }
    ],
    "pagination": {
      "total": 4,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

## 14. GET http://localhost:3000/api/notifications/me/unread-count

**序号**: 14

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "userId": 1,
    "unreadCount": 4
  }
}
```

---

## 15. PUT http://localhost:3000/api/notifications/ffb79272-39ab-41e7-bf9a-f16f7a58f388/mark-read

**序号**: 15

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y"
}
```

**返回内容**:
```json
{
  "code": 0,
  "message": "标记已读成功"
}
```

---

## 16. PUT http://localhost:3000/api/notifications/me/mark-read

**序号**: 16

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "已标记 3 条通知为已读"
  }
}
```

---

## 17. GET http://localhost:3000/api/notifications/me/unread-count

**序号**: 17

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "userId": 1,
    "unreadCount": 0
  }
}
```

---

## 18. DELETE http://localhost:3000/api/notifications/me

**序号**: 18

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "已清空 4 条通知"
  }
}
```

---

## 19. GET http://localhost:3000/api/notifications/me

**序号**: 19

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MzkyMjQzNCwiZXhwIjoxNzc0NTI3MjM0fQ.zoiGViqdAQv4v1Pr6AVhUphuMBGCUbTg1JaAD1iti3Y"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "notifications": [],
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

