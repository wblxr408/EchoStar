import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { User } from '../auth/auth.model.js';

/**
 * Story 模型
 */
export const Story = sequelize.define('Story', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: {
    type: DataTypes.JSONB, // 存储图片 URL 数组
    defaultValue: []
  },
  location: {
    type: DataTypes.GEOGRAPHY('POINT', 4326),
    allowNull: false,
    field: 'location'
  },
  emotionTag: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'emotion_tag'
  },
  isTimeCapsule: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_time_capsule'
  },
  unlockAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'unlock_at'
  },
  visibility: {
    type: DataTypes.ENUM('public', 'shadowban', 'deleted'),
    defaultValue: 'public'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  }
}, {
  tableName: 'stories',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      // PostGIS 空间索引
      name: 'idx_stories_location',
      fields: ['location'],
      using: 'GIST'
    },
    {
      name: 'idx_stories_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_stories_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_stories_visibility',
      fields: ['visibility']
    },
    {
      name: 'idx_stories_unlock_at',
      fields: ['unlock_at'],
      where: {
        is_time_capsule: true
      }
    }
  ]
});

/**
 * TimeCapsule 模型
 */
export const TimeCapsule = sequelize.define('TimeCapsule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  storyId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'stories',
      key: 'id'
    }
  },
  unlockAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isUnlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'time_capsules',
  timestamps: false,
  indexes: [
    {
      name: 'time_capsules_unlock_at_idx',
      fields: ['unlockAt', 'isUnlocked']
    }
  ]
});

// 关联关系
Story.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author'
});

User.hasMany(Story, {
  foreignKey: 'userId',
  as: 'stories'
});

Story.hasOne(TimeCapsule, {
  foreignKey: 'storyId',
  as: 'timeCapsule'
});

TimeCapsule.belongsTo(Story, {
  foreignKey: 'storyId',
  as: 'story'
});
