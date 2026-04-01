import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../auth/auth.model.js';
import {Story} from '../story/story.model.js';

/**
 * AdminAction 模型 - 管理员操作记录
 *
 * 完全按照 docs/03-数据模型.md 文档要求实现
 */
export const AdminAction = sequelize.define('AdminAction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  storyId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'story_id',
    references: {
      model: 'stories',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  actionType: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admin_actions',
  underscored: true,
  timestamps: false,
  indexes: [
    {
      name: 'idx_admin_actions_story',
      fields: ['story_id']
    },
    {
      name: 'idx_admin_actions_admin',
      fields: ['admin_id']
    }
  ]
});

// 定义关联关系
AdminAction.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
AdminAction.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });
