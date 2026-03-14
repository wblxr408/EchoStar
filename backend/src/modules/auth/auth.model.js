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
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
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
    }
  ]
});
