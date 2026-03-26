import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';

/**
 * Like 模型
 */
export const Like = sequelize.define('Like', {
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
    onDelete: 'NO ACTION'  // 用户被删除时不删除点赞记录
  },
  storyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'story_id',
    references: {
      model: 'stories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION'  // 故事被删除时不删除点赞记录
  }
}, {
  tableName: 'likes',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'idx_likes_user_id_story_id',
      fields: ['user_id', 'story_id'],
      unique: true  // 联合唯一索引，防止重复点赞
    },
    {
      name: 'idx_likes_story_id',
      fields: ['story_id']
    },
    {
      name: 'idx_likes_created_at',
      fields: ['created_at']
    }
  ]
});

// 关联关系
Like.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Like.belongsTo(Story, {
  foreignKey: 'storyId',
  as: 'story'
});

User.hasMany(Like, {
  foreignKey: 'userId',
  as: 'likes'
});

Story.hasMany(Like, {
  foreignKey: 'storyId',
  as: 'likes'
});
