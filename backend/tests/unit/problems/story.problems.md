# 2026/03/24 测试发现问题清单

**编写者**：仁鹏 | 测试  
**编写时间**：2026/03/24

## **阅读方法**
- 每个问题前均会 @对应开发人员，以便于开发人员快速定位问题。
- 查阅者阅读时，使用查找功能，查找对应开发人员名称，以便于快速定位问题。
- 开发人员类型：前端、后端、产品经理、架构师、安全、全部。（请勿忘记查找"@全部"）
- 例子：后端人员阅读时，使用查找功能，查找"@后端"即可，带上"@"以跳过正文称谓。
- 问题类型：了解、解决、商讨、重构
- 例子：@后端 @了解，表示后端人员了解该问题即可，即之后可能出问题，提前了解以预防。
- 例子：@全部 @商讨，表示涉及各部分人员，需要商讨解决方案。

## 问题

### 1. 发布故事 locationName 字段接收问题 | @后端 ：@解决
- 接口：`POST http://localhost:3000/api/stories`
- 现象：
- **请求体**:
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
  "locationName": "北京天安门",
  "emotionTag": "开心"
}
```
- **返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"locationName\" is not allowed"
  ]
}
```
- 原因：story.service.js 中接收并使用了 locationName 字段，但 story.validator.js 中缺少对应的验证规则，导致 Joi 拒绝了这个字段。
- 解决方案：story.validator.js 添加 locationName 字段验证。

### 2. 我的故事列表限制分页之后返回空故事列表问题 | @后端 ：@解决
- 接口：`GET http://localhost:3000/api/stories/me/list?page=2&limit=5`
- 现象：不加限制参数时正常返回故事列表，加了分页参数后返回空列表。total 正常显示为 2，表示有两个故事。

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2Njg3MywiZXhwIjoxNzc0OTcxNjczfQ.QzRU_IUEOko6M8fHn6Uf_87lUvFiLdjeqg6D20cN4NA"
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

### 3. 修改故事内容未做参数验证 | @后端 ：@解决
- 接口：`POST http://localhost:3000/api/stories/1`
- 现象：修改故事的相关属性时没有做参数验证，需修正。由于故事属性较多，测试没有一一测试，烦请后端人员检查所有的故事修改方法，确保正确验证参数。

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2Njg3MywiZXhwIjoxNzc0OTcxNjczfQ.QzRU_IUEOko6M8fHn6Uf_87lUvFiLdjeqg6D20cN4NA"
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


### 4. 重复删除故事未报错 | @后端 ：@解决
- 接口：`DELETE http://localhost:3000/api/stories/3`
- 现象：二次删除故事不报错，而是操作成功。

**第一次删除 - 请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2Njg3MywiZXhwIjoxNzc0OTcxNjczfQ.QzRU_IUEOko6M8fHn6Uf_87lUvFiLdjeqg6D20cN4NA"
}
```

**第一次删除 - 返回内容**:
```json
{
  "code": 0,
  "message": "删除成功"
}
```

**第二次删除 - 请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NDM2Njg3MywiZXhwIjoxNzc0OTcxNjczfQ.QzRU_IUEOko6M8fHn6Uf_87lUvFiLdjeqg6D20cN4NA"
}
```

**第二次删除 - 返回内容**:
```json
{
  "code": 0,
  "message": "删除成功"
}
```


### 5. 管理员获取全部故事列表限制页参数时只返回空列表 | @后端 ：@解决
- 接口：`GET http://localhost:3000/api/stories/admin/all?page=2&limit=10`
- 现象：对 page、limit 传递参数时返回空列表。返回值 total 字段是 2，表示有故事，但是返回了空列表。请后端人员对所有有分页限制参数的接口都排查一下是否存在此问题。由于这种接口比较多且分散在各个模块，难以组织进行测试，测试就不再一一测试了。

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NDM2Njg3MywiZXhwIjoxNzc0OTcxNjczfQ.hlFBCNVXsi19L0fAV0lCpFzOFGoKDgmRXfi5n47fA-o"
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

### 6. 数据同步问题 | @后端 ：@解决
- 现象：点赞量、浏览量等同步不及时。测试不清楚是否后端设计了延迟更新的策略，请后端注意确保数据能同步。详见下面的请求记录，注意注释。
- `GET http://localhost:3000/api/stories/1`

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

> 注：故事 1 的浏览量显示为 1。

---

- `GET http://localhost:3000/api/stories/me/list?page=1&limit=10`

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

> 注：此处故事 1 的浏览量显示为 0，与上一接口返回的浏览量 1 不一致。
