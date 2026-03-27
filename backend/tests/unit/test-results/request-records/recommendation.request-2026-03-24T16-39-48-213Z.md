# EchoStar API 测试报告 - Recommendation模块

**测试时间**: 2026-03-24T16:39:48.213Z

**服务器地址**: http://localhost:3000

**请求总数**: 52

---

## 1. POST http://localhost:3000/api/auth/register_2

**测试说明**: 创建测试用户1（用于主要测试）

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
  "username": "rec_test_user1_1774370387221",
  "email": "rec_test_user1_1774370387221@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0",
    "user": {
      "id": 1,
      "username": "rec_test_user1_1774370387221"
    }
  }
}
```

---

## 2. POST http://localhost:3000/api/auth/register_2

**测试说明**: 创建测试用户2（用于发布更多故事）

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
  "username": "rec_test_user2_1774370387369",
  "email": "rec_test_user2_1774370387369@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.GsmrTzD5n6FV82I4ZObnOeJErrvf-I_b7hPcE4aYJr8",
    "user": {
      "id": 2,
      "username": "rec_test_user2_1774370387369"
    }
  }
}
```

---

## 3. POST http://localhost:3000/api/stories

**测试说明**: 用户1发布故事: 开心 - 今天天气真好，心情很开心！

**序号**: 3

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**请求体**:
```json
{
  "content": "今天天气真好，心情很开心！",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "开心",
  "location": {
    "lat": 39.9087,
    "lng": 116.3975
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "content": "今天天气真好，心情很开心！",
    "createdAt": "2026-03-24T16:39:47.452Z"
  }
}
```

---

## 4. POST http://localhost:3000/api/stories

**测试说明**: 用户1发布故事: 难过 - 遇到一些不开心的事情...

**序号**: 4

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**请求体**:
```json
{
  "content": "遇到一些不开心的事情...",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "难过",
  "location": {
    "lat": 39.9163,
    "lng": 116.3972
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 2,
    "content": "遇到一些不开心的事情...",
    "createdAt": "2026-03-24T16:39:47.476Z"
  }
}
```

---

## 5. POST http://localhost:3000/api/stories

**测试说明**: 用户1发布故事: 治愈 - 听着音乐，感觉很治愈

**序号**: 5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**请求体**:
```json
{
  "content": "听着音乐，感觉很治愈",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "治愈",
  "location": {
    "lat": 39.9999,
    "lng": 116.2755
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 3,
    "content": "听着音乐，感觉很治愈",
    "createdAt": "2026-03-24T16:39:47.486Z"
  }
}
```

---

## 6. POST http://localhost:3000/api/stories

**测试说明**: 用户2发布故事: 打卡 - 打卡北京长城！

**序号**: 6

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.GsmrTzD5n6FV82I4ZObnOeJErrvf-I_b7hPcE4aYJr8"
}
```

**请求体**:
```json
{
  "content": "打卡北京长城！",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "打卡",
  "location": {
    "lat": 40.3597,
    "lng": 116.0199
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 4,
    "content": "打卡北京长城！",
    "createdAt": "2026-03-24T16:39:47.499Z"
  }
}
```

---

## 7. POST http://localhost:3000/api/stories

**测试说明**: 用户2发布故事: 开心 - 又一个开心的日子

**序号**: 7

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.GsmrTzD5n6FV82I4ZObnOeJErrvf-I_b7hPcE4aYJr8"
}
```

**请求体**:
```json
{
  "content": "又一个开心的日子",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "开心",
  "location": {
    "lat": 39.9929,
    "lng": 116.3966
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 5,
    "content": "又一个开心的日子",
    "createdAt": "2026-03-24T16:39:47.514Z"
  }
}
```

---

## 8. POST http://localhost:3000/api/stories

**测试说明**: 用户2发布故事: 治愈 - 治愈的午后时光

**序号**: 8

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.GsmrTzD5n6FV82I4ZObnOeJErrvf-I_b7hPcE4aYJr8"
}
```

**请求体**:
```json
{
  "content": "治愈的午后时光",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "治愈",
  "location": {
    "lat": 39.9405,
    "lng": 116.3342
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 6,
    "content": "治愈的午后时光",
    "createdAt": "2026-03-24T16:39:47.525Z"
  }
}
```

---

## 9. POST http://localhost:3000/api/stories

**测试说明**: 用户2发布故事: 难过 - 有些难过想找人倾诉

**序号**: 9

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.GsmrTzD5n6FV82I4ZObnOeJErrvf-I_b7hPcE4aYJr8"
}
```

**请求体**:
```json
{
  "content": "有些难过想找人倾诉",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "难过",
  "location": {
    "lat": 39.8946,
    "lng": 116.3222
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 7,
    "content": "有些难过想找人倾诉",
    "createdAt": "2026-03-24T16:39:47.538Z"
  }
}
```

---

## 10. POST http://localhost:3000/api/stories

**测试说明**: 用户2发布故事: 打卡 - 打卡网红景点

**序号**: 10

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.GsmrTzD5n6FV82I4ZObnOeJErrvf-I_b7hPcE4aYJr8"
}
```

**请求体**:
```json
{
  "content": "打卡网红景点",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "打卡",
  "location": {
    "lat": 39.9324,
    "lng": 116.4536
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 8,
    "content": "打卡网红景点",
    "createdAt": "2026-03-24T16:39:47.551Z"
  }
}
```

---

## 11. POST http://localhost:3000/api/likes

**测试说明**: 用户1点赞开心类故事 ID=1（建立偏好）

**序号**: 11

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
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

## 12. POST http://localhost:3000/api/likes

**测试说明**: 用户1点赞开心类故事 ID=5（建立偏好）

**序号**: 12

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**请求体**:
```json
{
  "storyId": 5
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

## 13. POST http://localhost:3000/api/likes

**测试说明**: 用户1点赞治愈类故事 ID=3（建立偏好）

**序号**: 13

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**请求体**:
```json
{
  "storyId": 3
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "isLiked": true,
    "message": "点赞成功",
    "id": 3
  }
}
```

---

## 14. GET http://localhost:3000/api/map/random

**测试说明**: 正常测试：无参数随机漫步

**序号**: 14

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 40.3597,
      "longitude": 116.0199
    },
    "story": {
      "id": 4,
      "content": "打卡北京长城！",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 40.3597,
        "longitude": 116.0199
      },
      "locationName": null,
      "emotionTag": "打卡",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.499Z"
    }
  }
}
```

---

## 15. GET http://localhost:3000/api/map/random?lat=39.90923&lng=116.397428

**测试说明**: 正常测试：带北京位置的随机漫步

**序号**: 15

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9929,
      "longitude": 116.3966
    },
    "story": {
      "id": 5,
      "content": "又一个开心的日子",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9929,
        "longitude": 116.3966
      },
      "locationName": null,
      "emotionTag": "开心",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.514Z"
    }
  }
}
```

---

## 16. GET http://localhost:3000/api/map/random?mood=开心

**测试说明**: 正常测试：筛选开心类故事的随机漫步

**序号**: 16

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9929,
      "longitude": 116.3966
    },
    "story": {
      "id": 5,
      "content": "又一个开心的日子",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9929,
        "longitude": 116.3966
      },
      "locationName": null,
      "emotionTag": "开心",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.514Z"
    }
  }
}
```

---

## 17. GET http://localhost:3000/api/map/random?mood=难过

**测试说明**: 正常测试：筛选难过类故事的随机漫步

**序号**: 17

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9163,
      "longitude": 116.3972
    },
    "story": {
      "id": 2,
      "content": "遇到一些不开心的事情...",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9163,
        "longitude": 116.3972
      },
      "locationName": null,
      "emotionTag": "难过",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.476Z"
    }
  }
}
```

---

## 18. GET http://localhost:3000/api/map/random?mood=治愈

**测试说明**: 正常测试：筛选治愈类故事的随机漫步

**序号**: 18

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9163,
      "longitude": 116.3972
    },
    "story": {
      "id": 2,
      "content": "遇到一些不开心的事情...",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9163,
        "longitude": 116.3972
      },
      "locationName": null,
      "emotionTag": "难过",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.476Z"
    }
  }
}
```

---

## 19. GET http://localhost:3000/api/map/random?mood=打卡

**测试说明**: 正常测试：筛选打卡类故事的随机漫步

**序号**: 19

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9405,
      "longitude": 116.3342
    },
    "story": {
      "id": 6,
      "content": "治愈的午后时光",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9405,
        "longitude": 116.3342
      },
      "locationName": null,
      "emotionTag": "治愈",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.525Z"
    }
  }
}
```

---

## 20. GET http://localhost:3000/api/map/random?mood=无效标签

**测试说明**: 边界测试：无效的情感标签（应被忽略或返回错误）

**序号**: 20

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9405,
      "longitude": 116.3342
    },
    "story": {
      "id": 6,
      "content": "治愈的午后时光",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9405,
        "longitude": 116.3342
      },
      "locationName": null,
      "emotionTag": "治愈",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.525Z"
    }
  }
}
```

---

## 21. GET http://localhost:3000/api/map/random?lat=abc&lng=def

**测试说明**: 边界测试：无效的经纬度格式

**序号**: 21

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9163,
      "longitude": 116.3972
    },
    "story": {
      "id": 2,
      "content": "遇到一些不开心的事情...",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9163,
        "longitude": 116.3972
      },
      "locationName": null,
      "emotionTag": "难过",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.476Z"
    }
  }
}
```

---

## 22. GET http://localhost:3000/api/map/random

**测试说明**: 正常测试：无Token随机漫步

**序号**: 22

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
    "location": {
      "latitude": 39.9324,
      "longitude": 116.4536
    },
    "story": {
      "id": 8,
      "content": "打卡网红景点",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9324,
        "longitude": 116.4536
      },
      "locationName": null,
      "emotionTag": "打卡",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.551Z"
    }
  }
}
```

---

## 23. GET http://localhost:3000/api/map/random?lat=39.90923&lng=116.397428&mood=开心

**测试说明**: 正常测试：带位置和情感筛选的随机漫步

**序号**: 23

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9324,
      "longitude": 116.4536
    },
    "story": {
      "id": 8,
      "content": "打卡网红景点",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9324,
        "longitude": 116.4536
      },
      "locationName": null,
      "emotionTag": "打卡",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.551Z"
    }
  }
}
```

---

## 24. GET http://localhost:3000/api/map/random

**测试说明**: 随机漫步第1次调用

**序号**: 24

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9163,
      "longitude": 116.3972
    },
    "story": {
      "id": 2,
      "content": "遇到一些不开心的事情...",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9163,
        "longitude": 116.3972
      },
      "locationName": null,
      "emotionTag": "难过",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.476Z"
    }
  }
}
```

---

## 25. GET http://localhost:3000/api/map/random

**测试说明**: 随机漫步第2次调用

**序号**: 25

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9999,
      "longitude": 116.2755
    },
    "story": {
      "id": 3,
      "content": "听着音乐，感觉很治愈",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9999,
        "longitude": 116.2755
      },
      "locationName": null,
      "emotionTag": "治愈",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.486Z"
    }
  }
}
```

---

## 26. GET http://localhost:3000/api/map/random

**测试说明**: 随机漫步第3次调用

**序号**: 26

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 40.3597,
      "longitude": 116.0199
    },
    "story": {
      "id": 4,
      "content": "打卡北京长城！",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 40.3597,
        "longitude": 116.0199
      },
      "locationName": null,
      "emotionTag": "打卡",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.499Z"
    }
  }
}
```

---

## 27. GET http://localhost:3000/api/map/random

**测试说明**: 随机漫步第4次调用

**序号**: 27

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.9324,
      "longitude": 116.4536
    },
    "story": {
      "id": 8,
      "content": "打卡网红景点",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.9324,
        "longitude": 116.4536
      },
      "locationName": null,
      "emotionTag": "打卡",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.551Z"
    }
  }
}
```

---

## 28. GET http://localhost:3000/api/map/random

**测试说明**: 随机漫步第5次调用

**序号**: 28

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "location": {
      "latitude": 39.8946,
      "longitude": 116.3222
    },
    "story": {
      "id": 7,
      "content": "有些难过想找人倾诉",
      "images": [
        "https://example.com/test.jpg"
      ],
      "location": {
        "latitude": 39.8946,
        "longitude": 116.3222
      },
      "locationName": null,
      "emotionTag": "难过",
      "isRecommended": false,
      "createdAt": "2026-03-24T16:39:47.538Z"
    }
  }
}
```

---

## 29. GET http://localhost:3000/api/map/feed

**测试说明**: 正常测试：获取推荐流

**序号**: 29

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 30. GET http://localhost:3000/api/map/feed?lat=39.90923&lng=116.397428

**测试说明**: 正常测试：带北京位置的推荐流

**序号**: 30

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
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
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 31. GET http://localhost:3000/api/map/feed?mood=开心

**测试说明**: 正常测试：筛选开心类故事的推荐流

**序号**: 31

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 32. GET http://localhost:3000/api/map/feed?mood=难过

**测试说明**: 正常测试：筛选难过类故事的推荐流

**序号**: 32

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 33. GET http://localhost:3000/api/map/feed?mood=治愈

**测试说明**: 正常测试：筛选治愈类故事的推荐流

**序号**: 33

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 34. GET http://localhost:3000/api/map/feed?mood=打卡

**测试说明**: 正常测试：筛选打卡类故事的推荐流

**序号**: 34

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 35. GET http://localhost:3000/api/map/feed?page=1&limit=5

**测试说明**: 正常测试：使用分页参数获取推荐流

**序号**: 35

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 5,
      "totalPages": 2
    }
  }
}
```

---

## 36. GET http://localhost:3000/api/map/feed?page=2&limit=3

**测试说明**: 正常测试：获取第二页推荐流

**序号**: 36

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
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
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 2,
      "limit": 3,
      "totalPages": 3
    }
  }
}
```

---

## 37. GET http://localhost:3000/api/map/feed?page=-1&limit=100

**测试说明**: 边界测试：负数页码

**序号**: 37

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

---

## 38. GET http://localhost:3000/api/map/feed?limit=100

**测试说明**: 边界测试：limit超过最大值（应被限制为50）

**序号**: 38

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

---

## 39. GET http://localhost:3000/api/map/feed?mood=无效标签

**测试说明**: 边界测试：无效的情感标签（应被忽略）

**序号**: 39

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 40. GET http://localhost:3000/api/map/feed

**测试说明**: 正常测试：无Token获取推荐流

**序号**: 40

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
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 41. GET http://localhost:3000/api/map/feed?lat=39.90923&lng=116.397428&mood=开心&page=1&limit=10

**测试说明**: 正常测试：带位置和情感筛选的推荐流

**序号**: 41

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
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
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

## 42. GET http://localhost:3000/api/map/feed?limit=20

**测试说明**: 验证用户偏好：用户1点赞了开心类故事

**序号**: 42

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 43. GET http://localhost:3000/api/map/feed?limit=0

**测试说明**: 边界测试：limit为0（应被处理为最小值1）

**序号**: 43

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 1,
      "totalPages": 8
    }
  }
}
```

---

## 44. GET http://localhost:3000/api/map/feed?limit=10

**测试说明**: 验证无偏好用户：user2没有点赞记录

**序号**: 44

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.GsmrTzD5n6FV82I4ZObnOeJErrvf-I_b7hPcE4aYJr8"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

## 45. GET http://localhost:3000/api/map/feed?limit=5

**测试说明**: 用户1的推荐流

**序号**: 45

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 5,
      "totalPages": 2
    }
  }
}
```

---

## 46. GET http://localhost:3000/api/map/feed?limit=5

**测试说明**: 用户2的推荐流

**序号**: 46

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.GsmrTzD5n6FV82I4ZObnOeJErrvf-I_b7hPcE4aYJr8"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 5,
      "totalPages": 2
    }
  }
}
```

---

## 47. GET http://localhost:3000/api/map/feed?lat=39.9092&lng=116.3974&limit=5

**测试说明**: 北京附近位置的推荐流

**序号**: 47

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
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
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 5,
      "totalPages": 2
    }
  }
}
```

---

## 48. GET http://localhost:3000/api/map/feed?lat=40.3597&lng=116.0199&limit=5

**测试说明**: 长城附近位置的推荐流

**序号**: 48

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 5,
      "totalPages": 2
    }
  }
}
```

---

## 49. GET http://localhost:3000/api/map/feed?mood=开心&limit=10

**测试说明**: 验证情感筛选：开心

**序号**: 49

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

## 50. GET http://localhost:3000/api/map/feed?mood=难过&limit=10

**测试说明**: 验证情感筛选：难过

**序号**: 50

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

## 51. GET http://localhost:3000/api/map/feed?mood=治愈&limit=10

**测试说明**: 验证情感筛选：治愈

**序号**: 51

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

## 52. GET http://localhost:3000/api/map/feed?mood=打卡&limit=10

**测试说明**: 验证情感筛选：打卡

**序号**: 52

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM3MDM4NywiZXhwIjoxNzc0OTc1MTg3fQ.BSBXLYOs-OQwnvYcG47tisjXCkLTbeQG80JW8tgt5P0"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "stories": [
      {
        "id": 8,
        "content": "打卡网红景点",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9324,
          "longitude": 116.4536
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.551Z"
      },
      {
        "id": 6,
        "content": "治愈的午后时光",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9405,
          "longitude": 116.3342
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.525Z"
      },
      {
        "id": 5,
        "content": "又一个开心的日子",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9929,
          "longitude": 116.3966
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.514Z"
      },
      {
        "id": 4,
        "content": "打卡北京长城！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 40.3597,
          "longitude": 116.0199
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.499Z"
      },
      {
        "id": 3,
        "content": "听着音乐，感觉很治愈",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9999,
          "longitude": 116.2755
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.486Z"
      },
      {
        "id": 1,
        "content": "今天天气真好，心情很开心！",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9087,
          "longitude": 116.3975
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.452Z"
      },
      {
        "id": 7,
        "content": "有些难过想找人倾诉",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.8946,
          "longitude": 116.3222
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.538Z"
      },
      {
        "id": 2,
        "content": "遇到一些不开心的事情...",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "难过",
        "isRecommended": false,
        "createdAt": "2026-03-24T16:39:47.476Z"
      }
    ],
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

