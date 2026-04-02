import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';

/**
 * Comment 模型
 * id 使用雪花ID（BIGINT）
 */
export const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
    field: 'id'
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
    onDelete: 'NO ACTION'  // 用户被删除时不删除评论
  },
  storyId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'story_id',
    references: {
      model: 'stories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION'  // 故事被删除时不删除评论
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '评论内容'
  },
  status: {
    type: DataTypes.ENUM('active', 'deleted'),
    allowNull: false,
    defaultValue: 'active',
    field: 'status',
    comment: '评论状态（active/deleted）'
  }
}, {
  tableName: 'comments',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'idx_comments_story_id_status',
      fields: ['story_id', 'status']
    },
    {
      name: 'idx_comments_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_comments_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_comments_content',
      fields: ['content'],
      type: 'FULLTEXT'  // PostgreSQL 不支持 FULLTEXT，但 Sequelize 会忽略
    }
  ]
});

// 关联关系
Comment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Comment.belongsTo(Story, {
  foreignKey: 'storyId',
  as: 'story'
});

User.hasMany(Comment, {
  foreignKey: 'userId',
  as: 'comments'
});

Story.hasMany(Comment, {
  foreignKey: 'storyId',
  as: 'comments'
});
