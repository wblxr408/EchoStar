# VIP功能实现指导文档

## 一、功能概述

### 1.1 需求描述
- VIP会员系统：用户可通过管理员手动升级为VIP
- VIP状态存储在User表中（vip字段：0非会员，1会员）
- VIP订单表记录会员信息：用户ID、创建时间、到期时间、是否有效
- 每日凌晨自动扫描VIP订单，过期则取消VIP状态
- 用户信息和故事返回中需包含VIP状态

### 1.2 核心设计原则
- 数据库操作：直接操作数据库（非MQ异步）
- 缓存策略：用户VIP状态变更需清除用户缓存
- 权限控制：新增VIP权限中间件，保护VIP专属功能

---

## 二、数据库模型设计

### 2.1 修改User模型

**文件路径**: `backend/src/modules/auth/auth.model.js`

**修改内容**: 在User模型中添加vip字段

```javascript
// 在User模型的定义中添加以下字段
vip: {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 0,
  field: 'vip',
  comment: 'VIP状态（0非会员，1会员）',
  validate: {
    isIn: [[0, 1]]
  }
}
```

**注意事项**:
- 字段添加后需要执行数据库迁移
- 默认值为0，确保老用户默认非会员

---

### 2.2 新建VipOrder模型

**文件路径**: `backend/src/modules/vip/vip.model.js`（新建文件）

**模型定义**:

```javascript
import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../auth/auth.model.js';

/**
 * VipOrder 模型 - VIP订单记录
 */
export const VipOrder = sequelize.define('VipOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: '用户ID'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
    comment: 'VIP开通时间'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
    comment: 'VIP到期时间'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
    comment: '是否在有效期内'
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'admin_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '操作管理员ID'
  }
}, {
  tableName: 'vip_orders',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'idx_vip_orders_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_vip_orders_is_active',
      fields: ['is_active', 'expires_at']
    },
    {
      name: 'idx_vip_orders_expires_at',
      fields: ['expires_at']
    }
  ]
});

// 关联关系
VipOrder.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

VipOrder.belongsTo(User, {
  foreignKey: 'adminId',
  as: 'admin'
});

User.hasMany(VipOrder, {
  foreignKey: 'userId',
  as: 'vipOrders'
});
```

**索引说明**:
- `idx_vip_orders_user_id`: 快速查询用户的VIP订单
- `idx_vip_orders_is_active`: 优化过期扫描查询
- `idx_vip_orders_expires_at`: 支持按到期时间排序

---

## 三、VIP模块实现

### 3.1 模块结构

```
backend/src/modules/vip/
├── vip.model.js       # VIP订单模型（新建）
├── vip.service.js     # VIP业务逻辑（新建）
├── vip.controller.js  # VIP控制器（新建）
├── vip.routes.js      # VIP路由（新建）
├── vip.middleware.js  # VIP权限中间件（新建）
└── vip.validator.js   # 数据验证（新建，可选）
```

---

### 3.2 VIP Service层

**文件路径**: `backend/src/modules/vip/vip.service.js`

**核心方法**:

```javascript
import { VipOrder } from './vip.model.js';
import { User } from '../auth/auth.model.js';
import { clearUserCache } from '../auth/auth.middleware.js';

export const VipService = {
  /**
   * 检查用户VIP状态（供其他模块调用）
   * @param {number} userId - 用户ID
   * @returns {Promise<{isVip: boolean, expiresAt?: Date}>}
   */
  async checkUserVipStatus(userId) {
    // 查询最新的有效VIP订单
    const vipOrder = await VipOrder.findOne({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date()  // 未过期
        }
      },
      order: [['expiresAt', 'DESC']]
    });

    return {
      isVip: !!vipOrder,
      expiresAt: vipOrder?.expiresAt
    };
  },

  /**
   * 升级用户为VIP
   * @param {number} userId - 用户ID
   * @param {number} adminId - 管理员ID
   * @param {number} days - VIP天数
   */
  async upgradeUserToVip(userId, adminId, days = 30) {
    // 1. 查询用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 2. 检查是否已有未过期的VIP订单
    const existingVip = await VipOrder.findOne({
      where: {
        userId,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    let expiresAt;
    if (existingVip) {
      // 已有VIP，在原到期时间基础上延长
      expiresAt = new Date(existingVip.expiresAt);
      expiresAt.setDate(expiresAt.getDate() + days);

      // 标记旧订单为失效
      await existingVip.update({ isActive: false });
    } else {
      // 新开通VIP
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    // 3. 创建VIP订单
    await VipOrder.create({
      userId,
      adminId,
      expiresAt,
      isActive: true
    });

    // 4. 更新用户VIP状态
    await user.update({ vip: 1 });

    // 5. 清除用户缓存
    await clearUserCache(userId);

    return {
      userId,
      vip: 1,
      expiresAt
    };
  },

  /**
   * 取消用户VIP（管理员手动取消或自动过期）
   * @param {number} userId - 用户ID
   */
  async cancelUserVip(userId) {
    // 1. 查询用户
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 2. 失效所有VIP订单
    await VipOrder.update(
      { isActive: false },
      {
        where: {
          userId,
          isActive: true
        }
      }
    );

    // 3. 更新用户VIP状态
    await user.update({ vip: 0 });

    // 4. 清除用户缓存
    await clearUserCache(userId);

    return { success: true, message: 'VIP已取消' };
  },

  /**
   * 获取用户VIP订单历史
   * @param {number} userId - 用户ID
   */
  async getUserVipHistory(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await VipOrder.findAndCountAll({
      where: { userId },
      include: [{
        model: User,
        as: 'admin',
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      orders: rows.map(order => ({
        id: order.id,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
        isActive: order.isActive,
        admin: order.admin?.username || '系统'
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }
};
```

---

### 3.3 VIP Controller层

**文件路径**: `backend/src/modules/vip/vip.controller.js`

```javascript
import { VipService } from './vip.service.js';

/**
 * 查看当前用户VIP状态
 */
export const getCurrentUserVipStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const status = await VipService.checkUserVipStatus(userId);
    res.json({ code: 0, data: status });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取用户VIP订单历史
 */
export const getUserVipHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const result = await VipService.getUserVipHistory(userId, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};
```

---

### 3.4 VIP Routes

**文件路径**: `backend/src/modules/vip/vip.routes.js`

```javascript
import { Router } from 'express';
import * as vipController from './vip.controller.js';
import { authenticateJWT } from '../auth/auth.middleware.js';

const router = Router();

// 所有VIP路由都需要认证
router.use(authenticateJWT);

/**
 * GET /api/v1/vip/status - 查看当前用户VIP状态
 */
router.get('/status', vipController.getCurrentUserVipStatus);

/**
 * GET /api/v1/vip/history - 获取用户VIP订单历史
 */
router.get('/history', vipController.getUserVipHistory);

export default router;
```

---

### 3.5 VIP Middleware（可选）

**文件路径**: `backend/src/modules/vip/vip.middleware.js`

```javascript
import { VipService } from './vip.service.js';

/**
 * 要求VIP权限中间件
 */
export const requireVip = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isVip } = await VipService.checkUserVipStatus(userId);

    if (!isVip) {
      return res.status(403).json({
        code: 403,
        message: '此功能仅限VIP会员使用'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 可选VIP检查（将VIP状态附加到req对象）
 */
export const optionalVipCheck = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      req.isVip = false;
      return next();
    }

    const { isVip, expiresAt } = await VipService.checkUserVipStatus(userId);
    req.isVip = isVip;
    req.vipExpiresAt = expiresAt;
    next();
  } catch (error) {
    req.isVip = false;
    next();
  }
};
```

---

## 四、需要修改的现有模块

### 4.1 认证模块修改

#### 文件1: `backend/src/modules/auth/auth.model.js`
**修改点**: User模型添加vip字段（见2.1节）

---

#### 文件2: `backend/src/modules/auth/auth.service.js`
**修改点1**: `fetchUserRaw`方法返回值添加vip字段

```javascript
// 在fetchUserRaw方法的返回值中添加vip字段
return {
  id: user.id,
  email: user.email,
  username: user.username,
  avatarUrl: user.avatarUrl,
  role: user.role,
  bio: user.bio,
  status: user.status,
  vip: user.vip,  // ✅ 新增
  createdAt: user.createdAt
};
```

**修改点2**: `getCurrentUser`方法返回值添加vip字段

```javascript
return {
  id: rawData.id,
  email: rawData.email,
  username: rawData.username,
  avatar: rawData.avatarUrl,
  bio: rawData.bio,
  role: rawData.role,
  status: rawData.status,
  vip: rawData.vip,  // ✅ 新增
  createdAt: rawData.createdAt
};
```

**修改点3**: `getUserById`方法返回值添加vip字段

```javascript
return {
  id: rawData.id,
  username: rawData.username,
  avatar: rawData.avatarUrl,
  bio: rawData.bio,
  vip: rawData.vip,  // ✅ 新增
  stories: stories.map(...)
};
```

**修改点4**: `updateProfile`方法返回值添加vip字段

```javascript
return {
  id: user.id,
  username: user.username,
  avatar: user.avatarUrl,
  bio: user.bio,
  vip: user.vip  // ✅ 新增
};
```

**修改点5**: `getAllUsers`方法返回值添加vip字段

```javascript
attributes: [
  'id', 'username', 'email', 'role', 'status',
  'bio', 'avatarUrl', 'createdAt', 'vip'  // ✅ 新增
]
```

---

### 4.2 故事模块修改

#### 文件: `backend/src/modules/story/story.service.js`

**修改点1**: `getStoryById`方法返回的author信息添加vip字段

```javascript
// 在getStoryById方法的返回对象中添加vip
author: {
  id: story.userId,
  username: author?.username || '匿名用户',
  avatar: author?.avatarUrl || null,
  vip: author?.vip || 0  // ✅ 新增
}
```

**修改点2**: `getMyStories`方法返回的author信息添加vip字段

```javascript
author: {
  id: story.userId,
  username: story.author?.username || '匿名用户',
  avatar: story.author?.avatarUrl || null,
  vip: story.author?.vip || 0  // ✅ 新增
}
```

**修改点3**: `searchStories`方法返回的author信息添加vip字段

```javascript
author: {
  id: story.userId,
  username: story.author?.username || '匿名用户',
  avatar: story.author?.avatarUrl || null,
  vip: story.author?.vip || 0  // ✅ 新增
}
```

**修改点4**: `getFeaturedStories`方法返回的author信息添加vip字段

```javascript
author: story.author ? {
  id: story.author.id,
  username: story.author.username || '匿名用户',
  avatar: story.author.avatarUrl || null,
  vip: story.author.vip || 0  // ✅ 新增
} : null
```

**修改点5**: `getAllStoriesForAdmin`方法返回的author信息添加vip字段

```javascript
author: {
  id: story.author?.id || story.userId,
  username: story.author?.username || '匿名用户',
  avatar: story.author?.avatarUrl || null,
  vip: story.author?.vip || 0  // ✅ 新增
}
```

---

### 4.3 管理员模块修改

#### 文件1: `backend/src/modules/admin/admin.service.js`

**新增方法**: upgradeUserToVip

```javascript
/**
 * 升级用户为VIP
 * @param {number} userId - 用户ID
 * @param {number} adminId - 管理员ID
 * @param {number} days - VIP天数
 */
async upgradeUserToVip(userId, adminId, days = 30) {
  const { VipService } = await import('../vip/vip.service.js');
  return await VipService.upgradeUserToVip(userId, adminId, days);
}
```

---

#### 文件2: `backend/src/modules/admin/admin.controller.js`

**新增控制器方法**:

```javascript
/**
 * 升级用户为VIP
 */
export const upgradeUserToVip = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.body;
    const adminId = req.user.id;

    const result = await AdminService.upgradeUserToVip(userId, adminId, days);
    res.json({
      code: 0,
      message: '升级成功',
      data: result
    });
  } catch (error) {
    if (error.name === 'AdminError') {
      return res.status(error.statusCode || 400).json({
        code: error.statusCode || 400,
        message: error.message
      });
    }
    next(error);
  }
};
```

---

#### 文件3: `backend/src/routes/admin.routes.js`

**新增路由**:

```javascript
/**
 * POST /api/admin/users/:userId/upgrade-vip - 升级用户为VIP
 */
router.post('/users/:userId/upgrade-vip', adminController.upgradeUserToVip);
```

---

## 五、定时任务实现

### 5.1 VIP过期检查任务

**文件路径**: `backend/src/jobs/check-vip-expiry.js`（新建文件）

```javascript
import { VipOrder } from '../modules/vip/vip.model.js';
import { User } from '../modules/auth/auth.model.js';
import { clearUserCache } from '../modules/auth/auth.middleware.js';
import { Op } from 'sequelize';
import logger from '../common/utils/logger.js';

/**
 * 检查VIP过期任务
 * 每日凌晨执行，将过期的VIP订单标记为失效，并更新用户状态
 */
export async function checkVipExpiry() {
  try {
    logger.info('🔄 开始检查VIP过期...');

    // 1. 查询所有已过期但仍标记为有效的VIP订单
    const expiredOrders = await VipOrder.findAll({
      where: {
        isActive: true,
        expiresAt: {
          [Op.lt]: new Date()  // 到期时间小于当前时间
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'vip']
      }]
    });

    if (expiredOrders.length === 0) {
      logger.info('✅ 没有过期的VIP订单');
      return;
    }

    logger.info(`📋 发现 ${expiredOrders.length} 个过期的VIP订单`);

    // 2. 批量处理过期订单
    for (const order of expiredOrders) {
      // 标记订单为失效
      await order.update({ isActive: false });

      // 检查用户是否还有其他有效的VIP订单
      const hasActiveVip = await VipOrder.findOne({
        where: {
          userId: order.userId,
          isActive: true,
          id: { [Op.ne]: order.id },  // 排除当前订单
          expiresAt: { [Op.gt]: new Date() }
        }
      });

      // 如果没有其他有效VIP订单，则将用户VIP状态改为0
      if (!hasActiveVip && order.user?.vip === 1) {
        await order.user.update({ vip: 0 });

        // 清除用户缓存
        await clearUserCache(order.userId);

        logger.info(`✅ 用户 ${order.userId} VIP已过期，状态已更新`);
      }
    }

    logger.info(`✅ VIP过期检查完成，处理了 ${expiredOrders.length} 个订单`);
  } catch (error) {
    logger.error('❌ VIP过期检查失败:', error);
    throw error;
  }
}
```

---

### 5.2 在应用中集成定时任务

**文件路径**: `backend/src/app.js`

**修改点**: 导入定时任务并设置定时执行

```javascript
// 导入定时任务
import { syncStoryViewCount } from './jobs/sync-story-view-count.js';
import { syncLikeToDatabase } from './jobs/sync-like-to-db.js';
import { syncFavoriteToDatabase } from './jobs/sync-favorite-to-db.js';
import { checkVipExpiry } from './jobs/check-vip-expiry.js';  // ✅ 新增

// 在定时任务区域（isPrimaryWorker判断内）添加：

// 定时任务：每天凌晨1点检查VIP过期
setInterval(() => {
  checkVipExpiry().catch(err => {
    console.error('❌ 检查VIP过期失败:', err);
  });
}, 24 * 60 * 60 * 1000);  // 每24小时执行一次

// 启动时执行一次VIP过期检查
checkVipExpiry().catch(err => {
  console.error('❌ 启动时检查VIP过期失败:', err);
});
```

---

### 5.3 使用node-cron更精确的时间控制（推荐）

**安装依赖**:
```bash
npm install node-cron
```

**修改 app.js**:

```javascript
import cron from 'node-cron';
import { checkVipExpiry } from './jobs/check-vip-expiry.js';

// 使用node-cron每天凌晨1点执行
cron.schedule('0 1 * * *', () => {
  console.log('🕐 开始执行VIP过期检查...');
  checkVipExpiry().catch(err => {
    console.error('❌ 检查VIP过期失败:', err);
  });
}, {
  timezone: 'Asia/Shanghai'  // 设置时区
});

// 启动时执行一次
checkVipExpiry().catch(err => {
  console.error('❌ 启动时检查VIP过期失败:', err);
});
```

---

## 六、应用集成

### 6.1 修改主应用文件

**文件路径**: `backend/src/app.js`

**修改点1**: 导入VIP路由

```javascript
import vipRoutes from './routes/vip.routes.js';  // ✅ 新增
```

**修改点2**: 注册VIP路由

```javascript
// API 路由 (v1 版本)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/stories', storyRoutes);
app.use('/api/v1/map', mapRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/vip', vipRoutes);  // ✅ 新增

// 兼容旧版 API 路由 (不带 v1 前缀)
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/vip', vipRoutes);  // ✅ 新增
```

---

### 6.2 响应码定义

**文件路径**: `backend/src/common/constants/response-code.js`

**新增业务错误码**:

```javascript
// VIP相关业务错误 (4000+)
VIP_REQUIRED: 4001,
VIP_EXPIRED: 4002,
VIP_NOT_FOUND: 4003
```

**新增错误消息映射**:

```javascript
[ResponseCode.VIP_REQUIRED]: '此功能仅限VIP会员使用',
[ResponseCode.VIP_EXPIRED]: '您的VIP已过期',
[ResponseCode.VIP_NOT_FOUND]: '未找到VIP记录'
```

---

## 七、数据库迁移SQL

### 7.1 User表添加vip字段

```sql
ALTER TABLE users ADD COLUMN vip INTEGER NOT NULL DEFAULT 0;
COMMENT ON COLUMN users.vip IS 'VIP状态（0非会员，1会员）';

-- 创建索引（可选，用于VIP用户查询）
CREATE INDEX idx_users_vip ON users(vip);
```

### 7.2 创建VipOrder表

```sql
CREATE TABLE vip_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  admin_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

COMMENT ON TABLE vip_orders IS 'VIP订单记录表';
COMMENT ON COLUMN vip_orders.user_id IS '用户ID';
COMMENT ON COLUMN vip_orders.created_at IS 'VIP开通时间';
COMMENT ON COLUMN vip_orders.expires_at IS 'VIP到期时间';
COMMENT ON COLUMN vip_orders.is_active IS '是否在有效期内';
COMMENT ON COLUMN vip_orders.admin_id IS '操作管理员ID';

-- 创建索引
CREATE INDEX idx_vip_orders_user_id ON vip_orders(user_id);
CREATE INDEX idx_vip_orders_is_active ON vip_orders(is_active, expires_at);
CREATE INDEX idx_vip_orders_expires_at ON vip_orders(expires_at);
```

---

## 八、接口清单

### 8.1 VIP相关接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/vip/status` | 查看当前用户VIP状态 | 需要 |
| GET | `/api/v1/vip/history` | 获取用户VIP订单历史 | 需要 |

### 8.2 管理员VIP接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/admin/users/:userId/upgrade-vip` | 升级用户为VIP | 管理员 |

**升级VIP请求参数**:
```json
{
  "days": 30  // 可选，默认30天
}
```

**升级VIP响应**:
```json
{
  "code": 0,
  "message": "升级成功",
  "data": {
    "userId": 123,
    "vip": 1,
    "expiresAt": "2026-05-14T00:00:00.000Z"
  }
}
```

---

## 九、实现注意事项

### 9.1 缓存一致性
- 用户VIP状态变更时，必须调用 `clearUserCache(userId)` 清除缓存
- VIP状态变更涉及的两个缓存键：
  - `user:info:${userId}` - JWT中间件使用
  - `user:raw:${userId}` - Service层使用

### 9.2 事务处理
- VIP订单创建和用户VIP状态更新建议使用事务保证原子性
- 示例：

```javascript
const transaction = await sequelize.transaction();
try {
  await VipOrder.create({...}, { transaction });
  await user.update({ vip: 1 }, { transaction });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### 9.3 定时任务执行
- 建议使用 `node-cron` 替代 `setInterval`，更精确控制执行时间
- 设置时区为 `Asia/Shanghai`，确保凌晨1点准确执行
- 定时任务只在主进程执行（使用 `isPrimaryWorker` 判断）

### 9.4 数据库索引
- VipOrder表的 `idx_vip_orders_is_active` 索引对过期扫描查询至关重要
- User表的 `idx_users_vip` 索引可选，用于VIP用户列表查询

### 9.5 错误处理
- VIP检查失败时不应该阻塞用户正常使用
- VIP中间件应优雅降级，非VIP用户返回友好提示

---

## 十、测试建议

### 10.1 功能测试
1. 管理员升级用户VIP，验证User表和VipOrder表数据正确
2. 验证用户信息和故事接口返回的vip字段
3. 测试VIP过期后定时任务是否正确处理
4. 验证缓存清除机制

### 10.2 接口测试
1. VIP状态查询接口
2. VIP订单历史接口
3. 管理员升级VIP接口

### 10.3 性能测试
1. 大量VIP用户过期时定时任务执行效率
2. VIP状态检查对接口响应时间的影响

---

## 十一、后续扩展建议

1. **VIP等级系统**: 可将vip字段扩展为多级（1/2/3...），支持不同等级的特权
2. **支付集成**: 对接第三方支付，实现用户自助购买VIP
3. **VIP特权**: 添加VIP专属功能（如：更多故事发布次数、特殊表情包、高级搜索等）
4. **VIP推荐**: 在推荐算法中给予VIP用户更高权重
5. **VIP标识**: 在用户头像等UI位置显示VIP徽章

---

## 十二、文件清单

### 需要新建的文件
```
backend/src/modules/vip/vip.model.js
backend/src/modules/vip/vip.service.js
backend/src/modules/vip/vip.controller.js
backend/src/modules/vip/vip.routes.js
backend/src/modules/vip/vip.middleware.js (可选)
backend/src/modules/vip/vip.validator.js (可选)
backend/src/jobs/check-vip-expiry.js
backend/VIP功能实现指导.md (本文档)
```

### 需要修改的文件
```
backend/src/modules/auth/auth.model.js
backend/src/modules/auth/auth.service.js
backend/src/modules/story/story.service.js
backend/src/modules/admin/admin.service.js
backend/src/modules/admin/admin.controller.js
backend/src/routes/admin.routes.js
backend/src/app.js
backend/src/common/constants/response-code.js
```

---

**文档生成时间**: 2026-04-14
**适用版本**: EchoStar Backend v1.0.0
