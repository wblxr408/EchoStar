import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from './auth.model.js';
import config from '../../config/index.js';

/**
 * Auth Service - 认证业务逻辑
 */
export const AuthService = {
  /**
   * 用户注册
   */
  async register(email, password) {
    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await User.create({
      email,
      password: hashedPassword,
      provider: 'email'
    });

    // 生成 Token
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar
      }
    };
  },

  /**
   * 用户登录
   */
  async login(email, password) {
    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('邮箱或密码错误');
    }

    // 生成 Token
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar
      }
    };
  },

  /**
   * GitHub OAuth 登录
   */
  async loginWithGitHub(code) {
    // 1. 用 code 换取 access_token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code
    }, {
      headers: { Accept: 'application/json' }
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. 用 access_token 获取用户信息
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });

    const githubUser = userResponse.data;

    // 3. 查找或创建用户
    let user = await User.findOne({ where: { githubId: githubUser.id } });
    if (!user) {
      user = await User.create({
        email: githubUser.email,
        githubId: githubUser.id,
        nickname: githubUser.login,
        avatar: githubUser.avatar_url,
        provider: 'github'
      });
    }

    // 4. 生成 Token
    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar
      }
    };
  },

  /**
   * 验证 Token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      throw new Error('Token 无效或已过期');
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'nickname', 'avatar', 'role', 'createdAt']
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  },

  /**
   * 生成 JWT Token
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }
};
