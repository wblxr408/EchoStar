# EchoStar API 测试报告 - Like模块

**测试时间**: 2026-04-01T17:12:07.938Z

**服务器地址**: http://localhost:3000

---

## 1. 点赞/取消点赞切换

### 1.1 点赞切换测试

**测试说明**: 创建测试用户（为点赞模块测试创建数据基础）

**序号**: 1

**请求类型**: POST

**接口地址**: http://localhost:3000/api/auth/register_2

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
  "username": "like_test_user_1775063527575",
  "email": "like_test_1775063527575@test.com",
  "password": "Test123456"
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY",
    "user": {
      "id": 1,
      "username": "like_test_user_1775063527575",
      "avatar": "https://echostar.oss-cn-shanghai.aliyuncs.com/avatars/default-4.png"
    }
  }
}
```

---

### 1.2 点赞切换测试

**测试说明**: 创建测试故事1（为点赞测试创建数据基础）

**序号**: 2

**请求类型**: POST

**接口地址**: http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{
  "content": "测试故事1用于点赞测试 1775063527708",
  "images": [
    "https://example.com/test-image1.jpg"
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
    "content": "测试故事1用于点赞测试 1775063527708",
    "images": [
      "https://example.com/test-image1.jpg"
    ],
    "createdAt": "2026-04-01T17:12:07.727Z",
    "visibilityStartTime": null,
    "visibilityEndTime": null
  }
}
```

---

### 1.3 点赞切换测试

**测试说明**: 创建测试故事2（为点赞测试创建数据基础）

**序号**: 3

**请求类型**: POST

**接口地址**: http://localhost:3000/api/stories

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{
  "content": "测试故事2用于点赞测试 1775063527742",
  "images": [
    "https://example.com/test-image2.jpg"
  ],
  "emotionTag": "治愈",
  "location": {
    "lat": 39.91923,
    "lng": 116.407428
  }
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": {
    "id": 2,
    "content": "测试故事2用于点赞测试 1775063527742",
    "images": [
      "https://example.com/test-image2.jpg"
    ],
    "createdAt": "2026-04-01T17:12:07.750Z",
    "visibilityStartTime": null,
    "visibilityEndTime": null
  }
}
```

---

### 1.4 点赞切换测试

**测试说明**: 正常测试：点赞故事（第一次，应创建点赞）

**序号**: 4

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
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
    "likeCount": 1,
    "message": "Like created"
  }
}
```

---

### 1.5 点赞切换测试

**测试说明**: 正常测试：再次点赞同一故事（应取消点赞）

**序号**: 5

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
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
    "isLiked": false,
    "likeCount": 0,
    "message": "Like removed"
  }
}
```

---

### 1.6 点赞切换测试

**测试说明**: 正常测试：第三次点赞（应重新创建点赞）

**序号**: 7

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
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
    "likeCount": 1,
    "message": "Like created"
  }
}
```

---

### 1.7 点赞切换测试

**测试说明**: 边界测试：点赞不存在的故事（storyId=999999）

**序号**: 8

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{
  "storyId": 999999
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "Story not found",
  "stack": "Error: Story not found\n    at LikeServiceClass.toggleLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:44:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async toggleLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:11:20)"
}
```

---

### 1.8 点赞切换测试

**测试说明**: 边界测试：缺少故事ID（请求体为空对象）

**序号**: 9

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"storyId\" is required"
  ]
}
```

---

### 1.9 点赞切换测试

**测试说明**: 边界测试：无Token点赞

**序号**: 10

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes

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
  "storyId": 1
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

## 2. 检查点赞状态

### 2.1 检查是否已点赞测试

**测试说明**: 验证测试：取消点赞后通过 check 端点确认 isLiked=false

**序号**: 6

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
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
  "data": {
    "storyId": "1",
    "isLiked": false
  }
}
```

---

### 2.2 检查是否已点赞测试

**测试说明**: 验证测试：DELETE 取消点赞后通过 check 端点确认 isLiked=false

**序号**: 17

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/2/check

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
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
  "data": {
    "storyId": "2",
    "isLiked": true
  }
}
```

---

### 2.3 检查是否已点赞测试

**测试说明**: 无

**序号**: 29

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/check

**返回状态**: 500

**请求头**:
```json
{
  "0": "正",
  "1": "常",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "检",
  "6": "查",
  "7": "已",
  "8": "点",
  "9": "赞",
  "10": "故",
  "11": "事",
  "12": "的",
  "13": "点",
  "14": "赞",
  "15": "状",
  "16": "态",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 2.4 检查是否已点赞测试

**测试说明**: 无

**序号**: 30

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/2/check

**返回状态**: 500

**请求头**:
```json
{
  "0": "正",
  "1": "常",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "检",
  "6": "查",
  "7": "未",
  "8": "点",
  "9": "赞",
  "10": "故",
  "11": "事",
  "12": "的",
  "13": "点",
  "14": "赞",
  "15": "状",
  "16": "态",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 2.5 检查是否已点赞测试

**测试说明**: 无

**序号**: 31

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/999999/check

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "检",
  "6": "查",
  "7": "不",
  "8": "存",
  "9": "在",
  "10": "故",
  "11": "事",
  "12": "的",
  "13": "点",
  "14": "赞",
  "15": "状",
  "16": "态",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 2.6 检查是否已点赞测试

**测试说明**: 无

**序号**: 32

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/invalid/check

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "无",
  "6": "效",
  "7": "故",
  "8": "事",
  "9": "I",
  "10": "D",
  "11": "格",
  "12": "式",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 2.7 检查是否已点赞测试

**测试说明**: 无

**序号**: 33

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/check

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "无",
  "6": "T",
  "7": "o",
  "8": "k",
  "9": "e",
  "10": "n",
  "11": "检",
  "12": "查",
  "13": "点",
  "14": "赞",
  "15": "状",
  "16": "态",
  "17": "（",
  "18": "可",
  "19": "选",
  "20": "认",
  "21": "证",
  "22": "，",
  "23": "应",
  "24": "成",
  "25": "功",
  "26": "）",
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
  "error": "Invalid character in header content [\"0\"]"
}
```

---

## 3. 创建点赞

### 3.1 明确创建点赞测试

**测试说明**: 正常测试：明确创建点赞（/likes/create）

**序号**: 11

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
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
    "likeCount": 1
  }
}
```

---

### 3.2 明确创建点赞测试

**测试说明**: 边界测试：重复创建点赞（已点赞的故事）

**序号**: 12

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
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
  "code": 500,
  "message": "Story already liked",
  "stack": "Error: Story already liked\n    at LikeServiceClass.createLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:89:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:26:18)"
}
```

---

### 3.3 点赞不存在的故事测试

**测试说明**: 边界测试：创建点赞不存在的故事（storyId=999999）

**序号**: 13

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

**返回状态**: 500

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{
  "storyId": 999999
}
```

**返回内容**:
```json
{
  "code": 500,
  "message": "Story not found",
  "stack": "Error: Story not found\n    at LikeServiceClass.createLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.service.js:84:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async createLike (file:///C:/Users/20979/RP_Projects/ECHOSTAR/EchoStar/backend/src/modules/like/like.controller.js:26:18)"
}
```

---

### 3.4 缺少故事ID测试

**测试说明**: 边界测试：缺少故事ID（请求体为空对象）

**序号**: 14

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"storyId\" is required"
  ]
}
```

---

### 3.5 明确创建点赞测试

**测试说明**: 边界测试：无Token创建点赞

**序号**: 15

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/create

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
  "storyId": 1
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

## 4. 取消点赞

### 4.1 取消点赞测试

**测试说明**: 无

**序号**: 16

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/2

**返回状态**: 500

**请求头**:
```json
{
  "0": "正",
  "1": "常",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "取",
  "6": "消",
  "7": "点",
  "8": "赞",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 4.2 取消点赞测试

**测试说明**: 无

**序号**: 18

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/2

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "重",
  "6": "复",
  "7": "取",
  "8": "消",
  "9": "点",
  "10": "赞",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 4.3 取消不存在的点赞测试

**测试说明**: 无

**序号**: 19

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/999999

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "取",
  "6": "消",
  "7": "不",
  "8": "存",
  "9": "在",
  "10": "的",
  "11": "故",
  "12": "事",
  "13": "点",
  "14": "赞",
  "15": "（",
  "16": "s",
  "17": "t",
  "18": "o",
  "19": "r",
  "20": "y",
  "21": "I",
  "22": "d",
  "23": "=",
  "24": "9",
  "25": "9",
  "26": "9",
  "27": "9",
  "28": "9",
  "29": "9",
  "30": "）",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 4.4 取消点赞测试

**测试说明**: 无

**序号**: 20

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/invalid

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "无",
  "6": "效",
  "7": "的",
  "8": "故",
  "9": "事",
  "10": "I",
  "11": "D",
  "12": "（",
  "13": "s",
  "14": "t",
  "15": "o",
  "16": "r",
  "17": "y",
  "18": "I",
  "19": "d",
  "20": "=",
  "21": "i",
  "22": "n",
  "23": "v",
  "24": "a",
  "25": "l",
  "26": "i",
  "27": "d",
  "28": "）",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 4.5 取消点赞测试

**测试说明**: 无

**序号**: 21

**请求类型**: DELETE

**接口地址**: http://localhost:3000/api/likes/1

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "无",
  "6": "T",
  "7": "o",
  "8": "k",
  "9": "e",
  "10": "n",
  "11": "取",
  "12": "消",
  "13": "点",
  "14": "赞",
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
  "error": "Invalid character in header content [\"0\"]"
}
```

---

## 5. 我的点赞

### 5.1 获取用户点赞列表测试

**测试说明**: 无

**序号**: 22

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/me

**返回状态**: 500

**请求头**:
```json
{
  "0": "正",
  "1": "常",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "获",
  "6": "取",
  "7": "用",
  "8": "户",
  "9": "点",
  "10": "赞",
  "11": "列",
  "12": "表",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 5.2 获取用户点赞列表测试

**测试说明**: 无

**序号**: 23

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/me?page=1&limit=5

**返回状态**: 500

**请求头**:
```json
{
  "0": "正",
  "1": "常",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "分",
  "6": "页",
  "7": "获",
  "8": "取",
  "9": "点",
  "10": "赞",
  "11": "列",
  "12": "表",
  "13": "（",
  "14": "l",
  "15": "i",
  "16": "m",
  "17": "i",
  "18": "t",
  "19": "=",
  "20": "5",
  "21": "）",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 5.3 获取用户点赞列表测试

**测试说明**: 无

**序号**: 24

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/me

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "无",
  "6": "T",
  "7": "o",
  "8": "k",
  "9": "e",
  "10": "n",
  "11": "获",
  "12": "取",
  "13": "点",
  "14": "赞",
  "15": "列",
  "16": "表",
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
  "error": "Invalid character in header content [\"0\"]"
}
```

---

## 6. 故事点赞列表

### 6.1 获取故事点赞列表测试

**测试说明**: 无

**序号**: 25

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/story/1

**返回状态**: 500

**请求头**:
```json
{
  "0": "正",
  "1": "常",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "获",
  "6": "取",
  "7": "故",
  "8": "事",
  "9": "点",
  "10": "赞",
  "11": "列",
  "12": "表",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 6.2 获取故事点赞列表测试

**测试说明**: 无

**序号**: 26

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/story/1?page=1&limit=5

**返回状态**: 500

**请求头**:
```json
{
  "0": "正",
  "1": "常",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "分",
  "6": "页",
  "7": "获",
  "8": "取",
  "9": "故",
  "10": "事",
  "11": "点",
  "12": "赞",
  "13": "（",
  "14": "l",
  "15": "i",
  "16": "m",
  "17": "i",
  "18": "t",
  "19": "=",
  "20": "5",
  "21": "）",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 6.3 获取故事点赞列表测试

**测试说明**: 无

**序号**: 27

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/story/999999

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "获",
  "6": "取",
  "7": "不",
  "8": "存",
  "9": "在",
  "10": "故",
  "11": "事",
  "12": "的",
  "13": "点",
  "14": "赞",
  "15": "列",
  "16": "表",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 6.4 获取故事点赞列表测试

**测试说明**: 无

**序号**: 28

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/story/invalid

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "无",
  "6": "效",
  "7": "故",
  "8": "事",
  "9": "I",
  "10": "D",
  "11": "格",
  "12": "式",
  "13": "（",
  "14": "s",
  "15": "t",
  "16": "o",
  "17": "r",
  "18": "y",
  "19": "I",
  "20": "d",
  "21": "=",
  "22": "i",
  "23": "n",
  "24": "v",
  "25": "a",
  "26": "l",
  "27": "i",
  "28": "d",
  "29": "）",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

## 7. 点赞统计

### 7.1 统计点赞数量测试

**测试说明**: 无

**序号**: 34

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/1/count

**返回状态**: 500

**请求头**:
```json
{
  "0": "正",
  "1": "常",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "统",
  "6": "计",
  "7": "故",
  "8": "事",
  "9": "点",
  "10": "赞",
  "11": "数",
  "12": "量",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 7.2 统计点赞数量测试

**测试说明**: 无

**序号**: 35

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/999999/count

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "统",
  "6": "计",
  "7": "不",
  "8": "存",
  "9": "在",
  "10": "故",
  "11": "事",
  "12": "的",
  "13": "点",
  "14": "赞",
  "15": "数",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

### 7.3 统计点赞数量测试

**测试说明**: 无

**序号**: 36

**请求类型**: GET

**接口地址**: http://localhost:3000/api/likes/invalid/count

**返回状态**: 500

**请求头**:
```json
{
  "0": "边",
  "1": "界",
  "2": "测",
  "3": "试",
  "4": "：",
  "5": "无",
  "6": "效",
  "7": "故",
  "8": "事",
  "9": "I",
  "10": "D",
  "11": "格",
  "12": "式",
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "error": "Invalid character in header content [\"0\"]"
}
```

---

## 8. 批量检查点赞状态

### 8.1 批量检查点赞状态测试

**测试说明**: 正常测试：批量检查多个故事的点赞状态

**序号**: 37

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

**返回状态**: 200

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{
  "storyIds": [
    1,
    2,
    999999
  ]
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": [
    {
      "storyId": 1,
      "isLiked": true
    },
    {
      "storyId": 2,
      "isLiked": true
    },
    {
      "storyId": 999999,
      "isLiked": false
    }
  ]
}
```

---

### 8.2 批量检查点赞状态测试

**测试说明**: 边界测试：storyIds为空数组

**序号**: 38

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{
  "storyIds": []
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "至少需要 1 个故事ID"
  ]
}
```

---

### 8.3 缺少故事ID数组测试

**测试说明**: 边界测试：缺少storyIds字段

**序号**: 39

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"storyIds\" is required"
  ]
}
```

---

### 8.4 无效的故事ID数组测试

**测试说明**: 边界测试：storyIds为非数组（字符串）

**序号**: 40

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

**返回状态**: 400

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJpYXQiOjE3NzUwNjM1MjcsImV4cCI6MTc3NTY2ODMyN30.DmBYSn_KZCfJ_M0H1z4wiIRpwpPPPF2TXreFyecaomY"
}
```

**请求体**:
```json
{
  "storyIds": "invalid"
}
```

**返回内容**:
```json
{
  "code": 4000,
  "message": "输入验证失败",
  "errors": [
    "\"storyIds\" must be an array"
  ]
}
```

---

### 8.5 批量检查点赞状态测试

**测试说明**: 边界测试：无Token批量检查点赞（可选认证，应成功）

**序号**: 41

**请求类型**: POST

**接口地址**: http://localhost:3000/api/likes/check-multiple

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
  "storyIds": [
    1
  ]
}
```

**返回内容**:
```json
{
  "code": 0,
  "data": [
    {
      "storyId": 1,
      "isLiked": false
    }
  ]
}
```

---

