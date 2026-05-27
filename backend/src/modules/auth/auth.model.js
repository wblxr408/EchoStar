import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

/**
 * User 模型
 *
 * 完全按照 docs/03-数据模型.md 文档要求实现
 */

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'username',
    comment: '用户名，唯一标识'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    field: 'email',
    validate: {
      isEmail: true
    },
    comment: '邮箱地址'
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'password_hash',
    comment: '密码哈希值（邮箱注册时需要）'
  },
  oauthProvider: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'oauth_provider',
    comment: 'OAuth 登录来源（github/null）'
  },
  oauthId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'oauth_id',
    comment: 'OAuth 用户 ID'
  },
  avatarUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'avatar_url',
    comment: '头像 URL'
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'user',
    field: 'role',
    validate: {
      isIn: [['user', 'admin']]
    },
    comment: '用户角色（user/admin）'
  },
  status: {
    type: DataTypes.ENUM('deleted', 'normal', 'recommended'),
    allowNull: false,
    defaultValue: 'normal',
    field: 'user_status',
    comment: '用户状态（deleted/normal/recommended）'
  },
  vip: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'vip',
    comment: 'VIP状态（0非会员，1会员）',
    validate: {
      isIn: [[0, 1]]
    }
  },
  emotionCoins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'emotion_coins',
    comment: '情绪币余额'
  },
  lastCheckInAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_check_in_at',
    comment: '最近一次签到时间'
  },
  checkInStreak: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'check_in_streak',
    comment: '连续签到天数'
  },
  bio: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'bio',
    comment: '个性签名'
  },
  bioFontFamily: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'bio_font_family',
    comment: '个性签名VIP字体'
  },
  bioFontEffect: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'bio_font_effect',
    comment: '个性签名VIP字体特效'
  },
  commentBg: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
    field: 'comment_bg',
    comment: 'VIP评论背景设置（{type, color, gradientColor, useGradient}）'
  },
  profileBg: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null,
    field: 'profile_bg',
    comment: 'VIP个人资料背景设置'
  }
}, {
  tableName: 'users',
  timestamps: true,
  // ✅ 只保留这一行：自动完成 createdAt → created_at 映射
  underscored: true,
  // ==============================
  // ❌ 删掉这两行冲突配置！（唯一修改）
  // createdAt: 'created_at',
  // updatedAt: 'updated_at',
  // ==============================
  indexes: [
    {
      name: 'idx_users_email',
      fields: ['email'],
      unique: false
    },
    {
      name: 'idx_users_oauth',
      fields: ['oauth_provider', 'oauth_id'],
      unique: false
    },
    {
      name: 'idx_users_status',
      fields: ['user_status'],
      unique: false
    }
  ]
});
