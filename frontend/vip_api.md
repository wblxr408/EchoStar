\1. VIP 模块 (用户侧)1.1 查看当前用户 VIP 状态•请求: GET /api/v1/vip/status•权限: 需要登录 (Bearer Token)•响应 data:JSON{  "isVip": true,  "expiresAt": "2026-05-14T00:00:00.000Z" // 如果是VIP则有此字段 }1.2 获取用户 VIP 订单历史•请求: GET /api/v1/vip/history•权限: 需要登录 (Bearer Token)•参数 (Query):•page: 页码 (默认 1)•limit: 每页数量 (默认 10)•响应 data:JSON{  "orders": [    {      "id": 1,      "createdAt": "2026-04-14T10:00:00.000Z",      "expiresAt": "2026-05-14T10:00:00.000Z",      "isActive": true,      "admin": "admin_username" // 操作管理员用户名    }  ],  "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 } }

5. 其他附注（通用中间件）
除常规鉴权外，若您未来计划开发仅对 VIP 用户开放的接口，可直接在路由中使用 requireVip 中间件：
JavaScript
import { requireVip } from '../modules/vip/vip.middleware.js';
示例：VIP 专属高级搜索
router.get('/search/advanced', authenticateJWT, requireVip, ...);
若普通用户请求该接口，将返回 HTTP 状态码 403，并提示“此功能仅限 VIP 会员使用”。