import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * Blacklist 模型 - 存储被封禁用户的信息
 */
export const Blacklist = sequelize.define('Blacklist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'email',
    comment: '被封禁用户的邮箱地址'
  },
  bannedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'banned_at',
    comment: '被封禁的日期和时间'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'reason',
    comment: '被封禁的原因'
  },
  bannedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'banned_by',
    comment: '执行封禁操作的管理员ID'
  }
}, {
  tableName: 'blacklist',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_blacklist_email',
      fields: ['email'],
      unique: true
    },
    {
      name: 'idx_blacklist_banned_at',
      fields: ['banned_at']
    }
  ]
});