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
    allowNull: true,
    field: 'admin_id',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '操作管理员ID（激活码方式可为空）'
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

/**
 * EmotionCoinLedger 模型 - 情绪币流水
 */
export const EmotionCoinLedger = sequelize.define('EmotionCoinLedger', {
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
    onDelete: 'CASCADE'
  },
  direction: {
    type: DataTypes.ENUM('earn', 'spend', 'recharge', 'gift'),
    allowNull: false,
    field: 'direction'
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'amount'
  },
  balanceAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'balance_after'
  },
  source: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'source'
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'title'
  },
  referenceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'reference_id'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    field: 'metadata'
  }
}, {
  tableName: 'emotion_coin_ledgers',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'idx_emotion_coin_ledgers_user_id',
      fields: ['user_id', 'created_at']
    },
    {
      name: 'idx_emotion_coin_ledgers_source_ref',
      fields: ['user_id', 'source', 'reference_id']
    }
  ]
});

/**
 * EmotionCoinInventory 模型 - 情绪币商品/权益背包
 */
export const EmotionCoinInventory = sequelize.define('EmotionCoinInventory', {
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
    onDelete: 'CASCADE'
  },
  itemKey: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'item_key'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'quantity'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expires_at'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    field: 'metadata'
  }
}, {
  tableName: 'emotion_coin_inventory',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'idx_emotion_coin_inventory_user_item',
      fields: ['user_id', 'item_key'],
      unique: true
    }
  ]
});

EmotionCoinLedger.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(EmotionCoinLedger, {
  foreignKey: 'userId',
  as: 'emotionCoinLedgers'
});

EmotionCoinInventory.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(EmotionCoinInventory, {
  foreignKey: 'userId',
  as: 'emotionCoinInventory'
});
