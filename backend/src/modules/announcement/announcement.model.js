import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * Announcement 公告模型
 */
export const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    field: 'id'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'title',
    comment: '公告标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'content',
    comment: '公告内容'
  },
  type: {
    type: DataTypes.ENUM('info', 'feature', 'warning', 'urgent'),
    defaultValue: 'info',
    allowNull: false,
    field: 'type',
    comment: '公告类型：info-信息, feature-新功能, warning-警告, urgent-紧急'
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'author_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_pinned',
    comment: '是否置顶'
  }
}, {
  tableName: 'announcements',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'idx_announcements_type',
      fields: ['type']
    },
    {
      name: 'idx_announcements_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_announcements_is_pinned',
      fields: ['is_pinned']
    }
  ]
});
