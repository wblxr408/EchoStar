import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * Story 模型
 */
export const Story = sequelize.define('Story', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON, // 存储图片 URL 数组
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  locationName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emotion: {
    type: DataTypes.ENUM('happy', 'sad', 'neutral', 'excited', 'peaceful'),
    allowNull: true
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'time_capsule', 'shadowban'),
    defaultValue: 'public'
  },
  isRecommended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stories',
  timestamps: true,
  indexes: [
    {
      // PostGIS 空间索引（需要在迁移时手动创建）
      name: 'stories_location_idx',
      fields: ['latitude', 'longitude']
    },
    {
      name: 'stories_user_id_idx',
      fields: ['userId']
    },
    {
      name: 'stories_created_at_idx',
      fields: ['createdAt']
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
Story.hasOne(TimeCapsule, {
  foreignKey: 'storyId',
  as: 'timeCapsule'
});

TimeCapsule.belongsTo(Story, {
  foreignKey: 'storyId',
  as: 'story'
});
