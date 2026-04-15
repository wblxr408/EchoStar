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
