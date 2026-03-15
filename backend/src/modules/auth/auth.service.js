import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from './auth.model.js';
import config from '../../config/index.js';
import { redisClient } from '../../common/utils/redis.js';
import nodemailer from 'nodemailer';

/**
 * Auth Service - 认证业务逻辑
 */
export const AuthService = {
  /**
   * 发送验证码到邮箱
   */
  async sendVerificationCode(email) {
    // 1. 生成5位随机验证码
    const code = Math.floor(10000 + Math.random() * 90000).toString();

    try {
      // 2. 发送邮件
      const transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.auth.user,
          pass: config.email.auth.pass
        }
      });

      const mailOptions = {
        from: config.email.auth.user,
        to: email,
        subject: 'EchoStar 注册验证码',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; text-align: center;">欢迎使用 EchoStar</h2>
              <p style="color: #666; font-size: 16px;">您的注册验证码是：</p>
              <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                ${code}
              </div>
              <p style="color: #999; font-size: 14px; text-align: center;">验证码有效期为 5 分钟</p>
              <p style="color: #666; font-size: 14px; text-align: center;">如果您没有请求此验证码，请忽略此邮件。</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      // 3. 将验证码存储到Redis中，有效期5分钟（300秒）
      const redis = redisClient.getClient();
      const key = `verification_code:${email}`;
      await redis.setex(key, 300, code);

      return {
        success: true,
        message: '验证码已发送到您的邮箱，有效期5分钟'
      };
    } catch (error) {
      console.error('发送验证码失败:', error);
      throw new Error('发送验证码失败，请稍后重试');
    }
  },

  /**
   * 用户注册
   */
  async register(email, password, username) {
    // 1. 检查邮箱是否已存在
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      throw new Error('邮箱已被注册');
    }

    // 2. 检查用户名是否已存在
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      throw new Error('用户名已被使用');
    }

    // 3. 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. 创建用户
    const user = await User.create({
      username,
      email,
      passwordHash: hashedPassword,
      oauthProvider: 'email'
    });

    // 5. 生成 Token
    const token = this.generateToken(user.id);

    return {
      accessToken: token,  // ✅ 修改为 accessToken
      user: {
        id: user.id,
        username: user.username  // ✅ 普通注册只返回 id 和 username
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
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('邮箱或密码错误');
    }

    // 生成 Token
    const token = this.generateToken(user.id);

    return {
      accessToken: token,  // ✅ 修改为 accessToken
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatarUrl  // ✅ 映射为 avatar
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
    let user = await User.findOne({
      where: {
        oauthProvider: 'github',
        oauthId: String(githubUser.id)
      }
    });

    if (!user) {
      // 新用户：确保用户名唯一
      let username = githubUser.login;
      let usernameSuffix = 1;

      // 检查用户名是否已被占用
      while (await User.findOne({ where: { username } })) {
        username = `${githubUser.login}${usernameSuffix}`;
        usernameSuffix++;
      }

      // 创建用户
      user = await User.create({
        username,  // ✅ 使用确保唯一的用户名
        email: githubUser.email,
        oauthProvider: 'github',
        oauthId: String(githubUser.id),
        avatarUrl: githubUser.avatar_url
      });
    }

    // 4. 生成 Token
    const token = this.generateToken(user.id);

    return {
      accessToken: token,  // ✅ 修改为 accessToken
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatarUrl  // ✅ 映射为 avatar
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
      attributes: ['id', 'email', 'username', 'avatarUrl', 'role', 'createdAt']
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatarUrl,  // ✅ 映射为 avatar
      role: user.role
    };
  },

  /**
   * 用户注册 (带验证码验证) - register_2
   */
  async register_2(email, password, username, verificationCode) {
    // 1. 验证验证码
    const redis = redisClient.getClient();
    const key = `verification_code:${email}`;
    const storedCode = await redis.get(key);

    if (!storedCode) {
      throw new Error('验证码不存在或已过期，请重新获取验证码');
    }

    if (storedCode !== verificationCode) {
      throw new Error('验证码错误');
    }

    // 2. 验证成功后删除验证码
    await redis.del(key);

    // 3. 检查邮箱是否已存在
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      throw new Error('邮箱已被注册');
    }

    // 4. 检查用户名是否已存在
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      throw new Error('用户名已被使用');
    }

    // 5. 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. 创建用户
    const user = await User.create({
      username,
      email,
      passwordHash: hashedPassword,
      oauthProvider: 'email'
    });

    // 7. 生成 Token
    const token = this.generateToken(user.id);

    return {
      accessToken: token,  // ✅ 修改为 accessToken
      user: {
        id: user.id,
        username: user.username  // ✅ 普通注册只返回 id 和 username
      }
    };
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
