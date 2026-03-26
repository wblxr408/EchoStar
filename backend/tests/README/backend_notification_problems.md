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

### 1. 通知列表请求返回值冗余 | @后端 @解决
- **现象**：
  - `http://localhost:3000/api/notifications/me` 访问返回值将进行操作（点赞等）产生通知的用户的 id、username 又添加到外层的 fromUserId、fromUserName 中，产生冗余。
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
- **解决方案**：去除冗余字段（fromUserId、fromUserName），保留 fromUser 对象即可。

### 2. 收藏不产生通知 | @后端 @产品经理 @商讨 @解决
- **现象**：详情见 test-results 下面的 test-records 的测试流程（文件内所有请求一次性完成，按顺序排列，可见用户 B 进行各种操作之后，用户 A 并未收到收藏相关的通知）。
- **解决方案**：与产品经理商讨收藏是否需要产生通知后，再决定是否修改。
