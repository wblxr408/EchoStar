import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { Comment } from '../comment/comment.model.js';

/**
 * Report 模型 - 举报记录
 *
 * 支持多态关联，可对故事和评论进行举报
 */
export const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  targetType: {
    type: DataTypes.ENUM('story', 'comment'),
    allowNull: false,
    comment: '举报目标类型'
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '举报目标ID'
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: '举报人ID'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '举报原因'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '处理状态'
  },
  handledBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: '处理人ID（管理员）'
  },
  handledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理时间'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'reports',
  underscored: true,
  timestamps: false,
  indexes: [
    {
      name: 'reports_target_idx',
      fields: ['target_type', 'target_id']
    },
    {
      name: 'reports_reporter_idx',
      fields: ['reporter_id']
    },
    {
      name: 'reports_status_idx',
      fields: ['status']
    },
    {
      name: 'reports_created_at_idx',
      fields: ['created_at']
    }
  ]
});

// 多态关联：根据 targetType 关联不同的模型
// 注意：Sequelize 多态关联需要在查询时通过条件关联实现

// 关联关系
Report.belongsTo(User, {
  foreignKey: 'reporterId',
  as: 'reporter'
});

Report.belongsTo(User, {
  foreignKey: 'handledBy',
  as: 'handler'
});
