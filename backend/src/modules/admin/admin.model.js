import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../auth/auth.model.js';
import Story from '../story/story.model.js';

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
    type: DataTypes.INTEGER,
    allowNull: false,
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

/**
 * Report 模型 - 举报记录
 *
 * 注意：docs/03-数据模型.md 中未定义此表，但在 docs/04-API设计.md 中有相关接口
 */
export const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  storyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stories',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  handledBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
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
  underscored: true,  // ✅ 开启驼峰转换
  timestamps: false,  // 手动管理 createdAt 和 handledAt
  indexes: [
    {
      name: 'reports_status_idx',
      fields: ['status']
    },
    {
      name: 'reports_story_id_idx',
      fields: ['story_id']
    }
  ]
});

// 定义关联关系
AdminAction.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
AdminAction.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });

Report.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'handledBy', as: 'handler' });
