# 2026/03/25 测试发现问题清单

**编写者**：仁鹏 | 测试  
**编写时间**：2026/03/25

## **阅读方法**
- 每个问题前均会 @对应开发人员，以便于开发人员快速定位问题。
- 查阅者阅读时，使用查找功能，查找对应开发人员名称，以便于快速定位问题。
- 开发人员类型：前端、后端、产品经理、架构师、安全、全部。（请勿忘记查找"@全部"）
- 例子：后端人员阅读时，使用查找功能，查找"@后端"即可，带上"@"以跳过正文称谓。
- 问题类型：了解、解决、商讨、重构
- 例子：@后端 @了解，表示后端人员了解该问题即可，即之后可能出问题，提前了解以预防。
- 例子：@全部 @商讨，表示涉及各部分人员，需要商讨解决方案。

## 问题

## 总览
**大量**接收参数的接口存在**参数无校验**问题，即传递错误类型或无意义参数时不报错。测试人员不确定这是为了保证健壮性还是属于错误。如果是错误，烦请后端对所有接收参数的接口添加参数验证。此外，此模块难以测试，详细功能的测试未进行（需要创建大量故事，且难以观测"推荐"功能的表现），要测试可能需要对接前端、创建更多故事、投入更多测试人员来"感知"推荐功能是否正常。

### 1. 选定无效标签进行漫游不报错 | @后端 ： @解决
- 现象见下：
- `GET http://localhost:3000/api/map/random?mood=无效标签`

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

### 2. 接口接收错误参数不报错 | @后端 ：@解决
- 现象：
- `GET http://localhost:3000/api/map/random?lat=abc&lng=def`

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
