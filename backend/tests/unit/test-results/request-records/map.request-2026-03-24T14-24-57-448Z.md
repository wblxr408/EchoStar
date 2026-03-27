# EchoStar API 测试报告 - Map模块

**测试时间**: 2026-03-24T14:24:57.448Z

**服务器地址**: http://localhost:3000

**请求总数**: 35

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
  "username": "map_test_user_1774362297045",
  "email": "map_test_1774362297045@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2MjI5NywiZXhwIjoxNzc0OTY3MDk3fQ.nB-ua-V8f_Zac19ehbWaRZYKOpp8SjFfMPodXB57qHo",
    "user": {
      "id": 1,
      "username": "map_test_user_1774362297045"
    }
  }
}
```

---

## 2. POST http://localhost:3000/api/stories

**测试说明**: 创建测试故事: 北京天安门故事1

**序号**: 2

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2MjI5NywiZXhwIjoxNzc0OTY3MDk3fQ.nB-ua-V8f_Zac19ehbWaRZYKOpp8SjFfMPodXB57qHo"
}
```

**请求体**:
```json
{
  "content": "北京天安门故事1",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "打卡",
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
    "content": "北京天安门故事1",
    "createdAt": "2026-03-24T14:24:57.216Z"
  }
}
```

---

## 3. POST http://localhost:3000/api/stories

**测试说明**: 创建测试故事: 北京天安门故事2

**序号**: 3

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2MjI5NywiZXhwIjoxNzc0OTY3MDk3fQ.nB-ua-V8f_Zac19ehbWaRZYKOpp8SjFfMPodXB57qHo"
}
```

**请求体**:
```json
{
  "content": "北京天安门故事2",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "开心",
  "location": {
    "lat": 39.90924,
    "lng": 116.39743
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 2,
    "content": "北京天安门故事2",
    "createdAt": "2026-03-24T14:24:57.244Z"
  }
}
```

---

## 4. POST http://localhost:3000/api/stories

**测试说明**: 创建测试故事: 北京天安门故事3

**序号**: 4

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2MjI5NywiZXhwIjoxNzc0OTY3MDk3fQ.nB-ua-V8f_Zac19ehbWaRZYKOpp8SjFfMPodXB57qHo"
}
```

**请求体**:
```json
{
  "content": "北京天安门故事3",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "治愈",
  "location": {
    "lat": 39.90925,
    "lng": 116.397432
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 3,
    "content": "北京天安门故事3",
    "createdAt": "2026-03-24T14:24:57.257Z"
  }
}
```

---

## 5. POST http://localhost:3000/api/stories

**测试说明**: 创建测试故事: 北京天安门故事4

**序号**: 5

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2MjI5NywiZXhwIjoxNzc0OTY3MDk3fQ.nB-ua-V8f_Zac19ehbWaRZYKOpp8SjFfMPodXB57qHo"
}
```

**请求体**:
```json
{
  "content": "北京天安门故事4",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "打卡",
  "location": {
    "lat": 39.90926,
    "lng": 116.397434
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 4,
    "content": "北京天安门故事4",
    "createdAt": "2026-03-24T14:24:57.269Z"
  }
}
```

---

## 6. POST http://localhost:3000/api/stories

**测试说明**: 创建测试故事: 北京天安门故事5

**序号**: 6

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2MjI5NywiZXhwIjoxNzc0OTY3MDk3fQ.nB-ua-V8f_Zac19ehbWaRZYKOpp8SjFfMPodXB57qHo"
}
```

**请求体**:
```json
{
  "content": "北京天安门故事5",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "开心",
  "location": {
    "lat": 39.90927,
    "lng": 116.397436
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 5,
    "content": "北京天安门故事5",
    "createdAt": "2026-03-24T14:24:57.280Z"
  }
}
```

---

## 7. POST http://localhost:3000/api/stories

**测试说明**: 创建测试故事: 北京故宫的故事

**序号**: 7

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2MjI5NywiZXhwIjoxNzc0OTY3MDk3fQ.nB-ua-V8f_Zac19ehbWaRZYKOpp8SjFfMPodXB57qHo"
}
```

**请求体**:
```json
{
  "content": "北京故宫的故事",
  "images": [
    "https://example.com/test.jpg"
  ],
  "emotionTag": "开心",
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
    "id": 6,
    "content": "北京故宫的故事",
    "createdAt": "2026-03-24T14:24:57.292Z"
  }
}
```

---

## 8. GET http://localhost:3000/api/map/explore?lat=39.90923&lng=116.397428&radius=5000

**测试说明**: 正常测试：在北京范围内查询故事

**序号**: 8

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
        "id": 6,
        "content": "北京故宫的故事",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.292Z"
      },
      {
        "id": 5,
        "content": "北京天安门故事5",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90927,
          "longitude": 116.397436
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.280Z"
      },
      {
        "id": 4,
        "content": "北京天安门故事4",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90926,
          "longitude": 116.397434
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.269Z"
      },
      {
        "id": 3,
        "content": "北京天安门故事3",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90925,
          "longitude": 116.397432
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.257Z"
      },
      {
        "id": 2,
        "content": "北京天安门故事2",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90924,
          "longitude": 116.39743
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.244Z"
      },
      {
        "id": 1,
        "content": "北京天安门故事1",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90923,
          "longitude": 116.397428
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.216Z"
      }
    ]
  }
}
```

---

## 9. GET http://localhost:3000/api/map/explore?lng=116.397428&radius=1000

**测试说明**: 边界测试：缺少纬度参数

**序号**: 9

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
  "code": 4000,
  "message": "缺少经纬度参数"
}
```

---

## 10. GET http://localhost:3000/api/map/explore?lat=39.90923&radius=1000

**测试说明**: 边界测试：缺少经度参数

**序号**: 10

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
  "code": 4000,
  "message": "缺少经纬度参数"
}
```

---

## 11. GET http://localhost:3000/api/map/explore?lat=91&lng=116.397428&radius=1000

**测试说明**: 边界测试：纬度超出范围（大于90）

**序号**: 11

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
  "code": 4000,
  "message": "纬度参数无效，范围应为 -90 到 90"
}
```

---

## 12. GET http://localhost:3000/api/map/explore?lat=-91&lng=116.397428&radius=1000

**测试说明**: 边界测试：纬度超出范围（小于-90）

**序号**: 12

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
  "code": 4000,
  "message": "纬度参数无效，范围应为 -90 到 90"
}
```

---

## 13. GET http://localhost:3000/api/map/explore?lat=39.90923&lng=181&radius=1000

**测试说明**: 边界测试：经度超出范围（大于180）

**序号**: 13

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
  "code": 4000,
  "message": "经度参数无效，范围应为 -180 到 180"
}
```

---

## 14. GET http://localhost:3000/api/map/explore?lat=39.90923&lng=116.397428&radius=5

**测试说明**: 边界测试：半径过小（小于10米）

**序号**: 14

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
  "code": 4000,
  "message": "半径参数无效，范围应为 10 到 5000 米"
}
```

---

## 15. GET http://localhost:3000/api/map/explore?lat=39.90923&lng=116.397428&radius=6000

**测试说明**: 边界测试：半径过大（大于5000米）

**序号**: 15

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
  "code": 4000,
  "message": "半径参数无效，范围应为 10 到 5000 米"
}
```

---

## 16. GET http://localhost:3000/api/map/explore?lat=abc&lng=116.397428&radius=1000

**测试说明**: 边界测试：纬度为非数字

**序号**: 16

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
  "code": 4000,
  "message": "纬度参数无效，范围应为 -90 到 90"
}
```

---

## 17. GET http://localhost:3000/api/map/explore?lat=31.2304&lng=121.4737&radius=1000

**测试说明**: 边界测试：在上海查询（应该查不到北京的故事）

**序号**: 17

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
    "stories": []
  }
}
```

---

## 18. GET http://localhost:3000/api/map/wall?lat=39.90923&lng=116.397428&radius=5000

**测试说明**: 正常测试：查询北京地区故事墙

**序号**: 18

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
        "id": 6,
        "content": "北京故宫的故事",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.9163,
          "longitude": 116.3972
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.292Z"
      },
      {
        "id": 5,
        "content": "北京天安门故事5",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90927,
          "longitude": 116.397436
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.280Z"
      },
      {
        "id": 4,
        "content": "北京天安门故事4",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90926,
          "longitude": 116.397434
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.269Z"
      },
      {
        "id": 3,
        "content": "北京天安门故事3",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90925,
          "longitude": 116.397432
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.257Z"
      },
      {
        "id": 2,
        "content": "北京天安门故事2",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90924,
          "longitude": 116.39743
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.244Z"
      },
      {
        "id": 1,
        "content": "北京天安门故事1",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90923,
          "longitude": 116.397428
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.216Z"
      }
    ]
  }
}
```

---

## 19. GET http://localhost:3000/api/map/wall?lng=116.397428&radius=50

**测试说明**: 边界测试：缺少纬度参数

**序号**: 19

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
  "code": 4000,
  "message": "缺少经纬度参数"
}
```

---

## 20. GET http://localhost:3000/api/map/wall?lat=39.90923&radius=50

**测试说明**: 边界测试：缺少经度参数

**序号**: 20

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
  "code": 4000,
  "message": "缺少经纬度参数"
}
```

---

## 21. GET http://localhost:3000/api/map/wall?lat=100&lng=116.397428&radius=50

**测试说明**: 边界测试：纬度超出范围（大于90）

**序号**: 21

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
  "code": 4000,
  "message": "纬度参数无效，范围应为 -90 到 90"
}
```

---

## 22. GET http://localhost:3000/api/map/wall?lat=39.90923&lng=200&radius=50

**测试说明**: 边界测试：经度超出范围（大于180）

**序号**: 22

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
  "code": 4000,
  "message": "经度参数无效，范围应为 -180 到 180"
}
```

---

## 23. GET http://localhost:3000/api/map/wall?lat=39.90923&lng=116.397428&radius=5

**测试说明**: 边界测试：半径过小（小于10米）

**序号**: 23

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
  "code": 4000,
  "message": "半径参数无效，范围应为 10 到 5000 米"
}
```

---

## 24. GET http://localhost:3000/api/map/wall?lat=39.90923&lng=116.397428&radius=6000

**测试说明**: 边界测试：半径过大（大于5000米）

**序号**: 24

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
  "code": 4000,
  "message": "半径参数无效，范围应为 10 到 5000 米"
}
```

---

## 25. GET http://localhost:3000/api/map/wall?lat=39.90923&lng=116.397428

**测试说明**: 正常测试：使用默认半径查询故事墙

**序号**: 25

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
        "id": 5,
        "content": "北京天安门故事5",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90927,
          "longitude": 116.397436
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.280Z"
      },
      {
        "id": 4,
        "content": "北京天安门故事4",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90926,
          "longitude": 116.397434
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.269Z"
      },
      {
        "id": 3,
        "content": "北京天安门故事3",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90925,
          "longitude": 116.397432
        },
        "locationName": null,
        "emotionTag": "治愈",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.257Z"
      },
      {
        "id": 2,
        "content": "北京天安门故事2",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90924,
          "longitude": 116.39743
        },
        "locationName": null,
        "emotionTag": "开心",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.244Z"
      },
      {
        "id": 1,
        "content": "北京天安门故事1",
        "images": [
          "https://example.com/test.jpg"
        ],
        "location": {
          "latitude": 39.90923,
          "longitude": 116.397428
        },
        "locationName": null,
        "emotionTag": "打卡",
        "isRecommended": false,
        "createdAt": "2026-03-24T14:24:57.216Z"
      }
    ]
  }
}
```

---

## 26. GET http://localhost:3000/api/map/clusters?northEast={"lat":41,"lng":118}&southWest={"lat":39,"lng":116}

**测试说明**: 正常测试：查询北京地区聚合数据（大范围）

**序号**: 26

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
  "data": [
    {
      "type": "cluster",
      "latitude": 39.90925000000003,
      "longitude": 116.39743199999943,
      "count": 5,
      "pointIds": [
        1,
        2,
        3,
        4,
        5
      ],
      "emotionTags": [
        "打卡",
        "开心",
        "治愈",
        "打卡",
        "开心"
      ],
      "mainEmotion": "打卡"
    },
    {
      "type": "point",
      "id": 6,
      "latitude": 39.9163,
      "longitude": 116.3972,
      "emotionTag": "开心"
    }
  ]
}
```

---

## 27. GET http://localhost:3000/api/map/clusters?northEast={"lat":39.91,"lng":116.4}&southWest={"lat":39.9,"lng":116.39}

**测试说明**: 正常测试：小范围聚合查询，应触发聚合

**序号**: 27

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
  "data": [
    {
      "type": "cluster",
      "latitude": 39.90925000000003,
      "longitude": 116.39743199999943,
      "count": 5,
      "pointIds": [
        1,
        2,
        3,
        4,
        5
      ],
      "emotionTags": [
        "打卡",
        "开心",
        "治愈",
        "打卡",
        "开心"
      ],
      "mainEmotion": "打卡"
    }
  ]
}
```

---

## 28. GET http://localhost:3000/api/map/clusters?southWest={"lat":39,"lng":116}

**测试说明**: 边界测试：缺少northEast参数

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
  "code": 4000,
  "message": "缺少边界参数"
}
```

---

## 29. GET http://localhost:3000/api/map/clusters?northEast={"lat":41,"lng":118}

**测试说明**: 边界测试：缺少southWest参数

**序号**: 29

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
  "code": 4000,
  "message": "缺少边界参数"
}
```

---

## 30. GET http://localhost:3000/api/map/clusters?northEast=invalid&southWest={"lat":39,"lng":116}

**测试说明**: 边界测试：northEast为无效JSON

**序号**: 30

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
  "code": 4000,
  "message": "边界参数格式错误，应为有效的 JSON"
}
```

---

## 31. GET http://localhost:3000/api/map/clusters?northEast={"lat":100,"lng":118}&southWest={"lat":39,"lng":116}

**测试说明**: 边界测试：northEast纬度超出范围

**序号**: 31

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
  "code": 4000,
  "message": "northEast.lat 参数无效，范围应为 -90 到 90"
}
```

---

## 32. GET http://localhost:3000/api/map/clusters?northEast={"lat":41,"lng":118}&southWest={"lat":39,"lng":200}

**测试说明**: 边界测试：southWest经度超出范围

**序号**: 32

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
  "code": 4000,
  "message": "southWest.lng 参数无效，范围应为 -180 到 180"
}
```

---

## 33. GET http://localhost:3000/api/map/clusters?northEast={"lng":118}&southWest={"lat":39,"lng":116}

**测试说明**: 边界测试：northEast缺少lat属性

**序号**: 33

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
  "code": 4000,
  "message": "northEast.lat 参数无效，范围应为 -90 到 90"
}
```

---

## 34. GET http://localhost:3000/api/map/clusters?northEast={"lat":41,"lng":118}&southWest={"lat":39}

**测试说明**: 边界测试：southWest缺少lng属性

**序号**: 34

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
  "code": 4000,
  "message": "southWest.lng 参数无效，范围应为 -180 到 180"
}
```

---

## 35. GET http://localhost:3000/api/map/clusters?northEast={"lat":20,"lng":120}&southWest={"lat":19,"lng":119}

**测试说明**: 边界测试：查询无故事区域

**序号**: 35

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
  "data": []
}
```

---

