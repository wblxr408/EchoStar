import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';

/**
 * Favorite 模型
 */
export const Favorite = sequelize.define('Favorite', {
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
    onDelete: 'NO ACTION'  // 用户被删除时不删除收藏记录
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
    onDelete: 'NO ACTION'  // 故事被删除时不删除收藏记录
  }
}, {
  tableName: 'favorites',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      name: 'idx_favorites_user_id_story_id',
      fields: ['user_id', 'story_id'],
      unique: true  // 联合唯一索引，防止重复收藏
    },
    {
      name: 'idx_favorites_story_id',
      fields: ['story_id']
    },
    {
      name: 'idx_favorites_created_at',
      fields: ['created_at']
    }
  ]
});

// 关联关系
Favorite.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Favorite.belongsTo(Story, {
  foreignKey: 'storyId',
  as: 'story'
});

User.hasMany(Favorite, {
  foreignKey: 'userId',
  as: 'favorites'
});

Story.hasMany(Favorite, {
  foreignKey: 'storyId',
  as: 'favorites'
});
