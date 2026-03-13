import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * AdminAction 模型 - 管理员操作记录
 */
export const AdminAction = sequelize.define('AdminAction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('recommend', 'shadowban', 'restore', 'delete'),
    allowNull: false
  },
  targetType: {
    type: DataTypes.ENUM('story', 'user'),
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
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
  timestamps: false,
  indexes: [
    {
      name: 'admin_actions_admin_id_idx',
      fields: ['adminId']
    },
    {
      name: 'admin_actions_target_idx',
      fields: ['targetType', 'targetId']
    }
  ]
});

/**
 * Report 模型 - 举报记录
 */
export const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  storyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stories',
      key: 'id'
    }
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  handledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  handledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'reports',
  timestamps: false,
  indexes: [
    {
      name: 'reports_status_idx',
      fields: ['status']
    },
    {
      name: 'reports_story_id_idx',
      fields: ['storyId']
    }
  ]
});
