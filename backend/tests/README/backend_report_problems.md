# 2026/03/19 测试发现问题清单

**编写者**：仁鹏 | 测试  
**编写时间**：2026/03/19

## **阅读方法**
- 每个问题前均会 @对应开发人员，以便于开发人员快速定位问题。
- 查阅者阅读时，使用查找功能，查找对应开发人员名称，以便于快速定位问题。
- 开发人员类型：前端、后端、产品经理、架构师、安全、全部。（请勿忘记查找"@全部"）
- 例子：后端人员阅读时，使用查找功能，查找"@后端"即可，带上"@"以跳过正文称谓。
- 问题类型：了解、解决、商讨、重构
- 例子：@后端 @了解，表示后端人员了解该问题即可，即之后可能出问题，提前了解以预防。
- 例子：@全部 @商讨，表示涉及各部分人员，需要商讨解决方案。

## 问题


### 1. 请求用户举报列表返回值冗余 | @后端 ：@解决
- 现象：
- http://localhost:3000/api/reports/me targetType 和 targetId 与 target 中的字段重复
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