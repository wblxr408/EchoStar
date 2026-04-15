import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from './auth.model.js';
import { Blacklist } from './blacklist.model.js';
import config from '../../config/index.js';
import { redisClient, wrapWithCache } from '../../common/utils/redis.js';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { getRandomDefaultAvatar } from '../../common/utils/oss.js'; 
import { clearUserCache } from './auth.middleware.js';

/**
 * Auth Service - 认证业务逻辑
 */
const AuthServiceImpl = {
  /**
   * 发送验证码到邮箱
   */
    async sendVerificationCode(email) {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const fixedEmail = email.trim().toLowerCase();
    const codeKey = `verification_code:${fixedEmail}`;

    try {
      // 1. 先打印Redis客户端，看看拿到的是什么
      const redis = redisClient.getClient();
      console.log('🔍 拿到的Redis客户端:', redis);

      // 2. 邮件发送
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      const mailOptions = {
        from: `"EchoStar 官方团队" <${process.env.EMAIL_USER}>`,
        to: fixedEmail,
        subject: 'EchoStar 验证码',
        html: `你的验证码：${code}（5分钟有效）`
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ 邮件发送成功');

      // ===================== 终极调试：用最原始的方式 =====================
      console.log('🔍 准备执行Redis SET，Key:', codeKey, 'Value:', code);
      
      // 方式1：直接用最原始的命令
      try {
        await redis.set(codeKey, code);
        console.log('✅ SET 成功');
      } catch (setErr) {
        console.error('❌ SET 失败，错误:', setErr);
        throw setErr;
      }

      console.log('🔍 准备执行Redis EXPIRE，Key:', codeKey, '秒数: 300');
      try {
        await redis.expire(codeKey, 300);
        console.log('✅ EXPIRE 成功');
      } catch (expireErr) {
        console.error('❌ EXPIRE 失败，错误:', expireErr);
        throw expireErr;
      }

      return { success: true, message: '验证码已发送' };
    } catch (error) {
      console.error('❌ 总错误:', error);
      throw new Error('发送验证码失败');
    }
  },

  /**
   * 用户注册 (带验证码验证)
   */
    async register(email, password, username, verificationCode) {
    const redis = redisClient.getClient();
    const fixedEmail = email.trim().toLowerCase();
    const key = `verification_code:${fixedEmail}`;

    // 检查黑名单
    const blacklistEntry = await Blacklist.findOne({ where: { email: fixedEmail } });
    if (blacklistEntry) {
      throw new Error('您的账号已被封禁');
    }

    // 我们使用了 getdel 之前，现在用 get，所以要保持一致，或者用更安全的 get + del，或者刚才改错了
    // 根据您提供的代码，您用的是 get 和 del
    const storedCode = await redis.get(key);

    console.log('注册时的Redis Key:', key);
    console.log('从Redis取出的验证码:', storedCode);
    console.log('前端传来的验证码:', verificationCode);

    // 如果返回的直接是 500 而且提示验证码错误，可能是这里拿到的 storedCode 不是字符串
    if (!storedCode) throw new Error('验证码不存在或已过期，请重新获取验证码');
    if (String(storedCode) !== String(verificationCode)) throw new Error('验证码错误');

    await redis.del(key);

    const existingUserByEmail = await User.findOne({ where: { email: fixedEmail, status: ['normal', 'recommended'] } });
    if (existingUserByEmail) {
      throw new Error('邮箱已被注册');
    }
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) throw new Error('用户名已被使用');

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = getRandomDefaultAvatar();
    const user = await User.create({ 
      username, 
      email: fixedEmail, 
      passwordHash: hashedPassword, 
      oauthProvider: 'email',
      avatarUrl: defaultAvatar 
    });

    return { accessToken: this.generateToken(user.id), user: { id: user.id, username: user.username, avatar: user.avatarUrl } };
  },

  /**
   * 用户注册 (不带验证码，仅测试用)
   */
  async register_2(email, password, username) {
    const fixedEmail = email.trim().toLowerCase();

    // 检查黑名单
    const blacklistEntry = await Blacklist.findOne({ where: { email: fixedEmail } });
    if (blacklistEntry) {
      throw new Error('您的账号已被封禁');
    }

    // 1. 检查邮箱是否已存在
    const existingUserByEmail = await User.findOne({ where: { email: fixedEmail, status: ['normal', 'recommended'] } });
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

    // 4. 获取随机默认头像
    const defaultAvatar = getRandomDefaultAvatar();

    // 5. 创建用户
    const user = await User.create({
      username,
      email: fixedEmail,
      passwordHash: hashedPassword,
      oauthProvider: 'email',
      avatarUrl: defaultAvatar
    });

    // 6. 生成 Token
    const token = this.generateToken(user.id);

    return {
      accessToken: token,  // ✅ 修改为 accessToken
      user: {
        id: user.id,
        username: user.username,  // ✅ 普通注册只返回 id 和 username
        avatar: user.avatarUrl  // ✅ 返回头像
      }
    };
  },

  /**
   * 管理员登录
   */
  async adminLogin(email, password) {
    //查找管理员
    const admin=await User.findOne({where:{email,role:'admin'}})
    if(!admin){
      throw new Error('邮箱或密码错误')
    }
    //验证密码
    const isValidPassword=await bcrypt.compare(password,admin.passwordHash)
    if(!isValidPassword){
      throw new Error('邮箱或密码错误')
    }
    //生成token
    const token=this.generateToken(admin.id)
    return {
      accessToken: token,  // ✅ 修改为 accessToken
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        avatar: admin.avatarUrl  // ✅ 映射为 avatar
      }
    }
  },

  /**
   * 用户登录
   */
  async login(email, password) {
    // 检查黑名单
    const blacklistEntry = await Blacklist.findOne({ where: { email } });
    if (blacklistEntry) {
      throw new Error('您的账号已被封禁');
    }

    // 查找用户
    const user = await User.findOne({ where: { email, status: ['normal', 'recommended'] } });
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
      accessToken: token,  
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatarUrl 
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
   * 纯查询函数：获取用户原始数据（受缓存适配器管理）
   * 职责：数据库查询 + 数据转换
   * 注意：缓存通过 wrapWithCache 在外部手动应用
   */
  async fetchUserRaw(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'username', 'avatarUrl', 'role', 'bio', 'status', 'createdAt', 'vip']
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      bio: user.bio,
      status: user.status,
      vip: user.vip,
      createdAt: user.createdAt
    };
  },

  /**
   * 获取当前用户信息
   * 调用缓存的 fetchUserRaw
   */
  async getCurrentUser(userId) {
    const rawData = await this.fetchUserRaw(userId);

    if (rawData && rawData._updating) {
      return {
        id: userId,
        _updating: true,
        message: '用户信息正在更新中，请稍后再试'
      };
    }

    if (!rawData) {
      throw new Error('用户不存在');
    }

    return {
      id: rawData.id,
      email: rawData.email,
      username: rawData.username,
      avatar: rawData.avatarUrl,
      bio: rawData.bio,
      role: rawData.role,
      status: rawData.status,
      vip: rawData.vip,
      createdAt: rawData.createdAt
    };
  },

  async forgotPassword(email, password, verificationCode) {
    const redis = redisClient.getClient();
    const fixedEmail = email.trim().toLowerCase();
    const key = `verification_code:${fixedEmail}`;
    
    const storedCode = await redis.get(key);
    if (!storedCode) throw new Error('验证码不存在或已过期，请重新获取验证码');
    if (String(storedCode) !== String(verificationCode)) throw new Error('验证码错误');
    await redis.del(key);

    // 并发锁：绝对正确写法
    const lockKey = `pwd_lock:${fixedEmail}`;
    await redis.set(lockKey, '1');
    await redis.expire(lockKey, 30);

    const user = await User.findOne({ where: { email: fixedEmail } });
    if (!user) throw new Error('该邮箱未注册');
    if (user.oauthProvider !== 'email') throw new Error('该账号使用第三方登录，不支持通过邮箱重置密码');

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ passwordHash: hashedPassword });
    await redis.del(lockKey);

    return { success: true, message: '密码重置成功，请使用新密码登录' };
  },

  /**
   * 生成 JWT Token
   */
  generateToken(userId) {
    const payload = { id: userId, userId };
    return jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  },

  /**
   * 查看其他用户信息
   * 用户基本信息走缓存，故事列表实时查询
   */
  async getUserById(userId) {
    const rawData = await this.fetchUserRaw(userId);

    if (rawData && rawData._updating) {
      return {
        id: userId,
        _updating: true,
        message: '用户信息正在更新中，请稍后再试'
      };
    }

    if (!rawData) {
      throw new Error('用户不存在');
    }

    if (rawData.status === 'deleted') {
      throw new Error('用户已被删除');
    }

    // 联表查询该用户的故事列表（只返回 public 状态，不缓存）
    const { Story } = await import('../story/story.model.js');
    const stories = await Story.findAll({
      where: {
        userId: userId,
        visibility: 'public'
      },
      attributes: ['id', 'content', 'createdAt', 'viewCount', 'isTimeCapsule', 'unlockAt'],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    return {
      id: rawData.id,
      username: rawData.username,
      avatar: rawData.avatarUrl,
      bio: rawData.bio,
      vip: rawData.vip,
      stories: stories.map(story => ({
        id: story.id,
        content: story.content,
        createdAt: story.createdAt,
        viewCount: story.viewCount,
        isTimeCapsule: story.isTimeCapsule,
        unlockAt: story.unlockAt
      }))
    };
  },

  /**
   * 修改个人信息
   */
  async updateProfile(userId, { username, avatarUrl, bio }) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('用户不存在');
    }

    // 如果修改了用户名，检查唯一性
    if (username && username !== user.username) {
      const existingUser = await User.findOne({
        where: {
          username: username,
          id: { [Op.ne]: userId } 
        }
      });

      if (existingUser) {
        throw new Error('用户名已被使用');
      }
    }

    // 更新用户信息
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (bio !== undefined) updateData.bio = bio;

    await user.update(updateData);

    // 如果头像变更，清除该用户所有故事的 story:raw 缓存
    if (avatarUrl !== undefined) {
      try {
        const { Story } = await import('../story/story.model.js');
        const userStories = await Story.findAll({
          where: { userId: user.id },
          attributes: ['id']
        });
        if (userStories.length > 0) {
          const redis = redisClient.getClient();
          const pipeline = redis.pipeline();
          for (const s of userStories) {
            pipeline.del(`story:raw:${s.id}`);
          }
          await pipeline.exec();
        }
      } catch (cacheErr) {
        console.error('清除故事缓存失败:', cacheErr);
      }
    }

    await clearUserCache(user.id);

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatarUrl,
      bio: user.bio,
      vip: user.vip
    };
  },

  /**
   * 修改密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('用户不存在');
    }

    // 只允许邮箱注册用户修改密码
    if (user.oauthProvider !== 'email') {
      throw new Error('该账号使用第三方登录，不支持修改密码');
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('原密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await user.update({
      passwordHash: hashedPassword
    });

    await clearUserCache(user.id);

    return {
      success: true,
      message: '密码修改成功'
    };
  },

  /**
   * 注销账号（软删除）
   */
  async deleteAccount(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查用户状态
    if (user.status === 'deleted') {
      throw new Error('账号已被注销');
    }

    // 将用户状态改为 deleted
    await user.update({
      status: 'deleted'
    });

    await clearUserCache(user.id);

    return {
      success: true,
      message: '账号已注销'
    };
  },

  /**
   * 管理员获取所有用户列表（分页）
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {string} category - 用户类别: 'normal' | 'deleted'
   */
  async getAllUsers(page = 1, pageSize = 20, category = 'normal') {
    const offset = (page - 1) * pageSize;

    // normal 类别包含 normal 和 recommended
    const statusFilter = category === 'deleted' ? 'deleted' : { [Op.in]: ['normal', 'recommended'] };

    const { count, rows } = await User.findAndCountAll({
      where: { status: statusFilter },
      attributes: ['id', 'username', 'email', 'role', 'status', 'bio', 'avatarUrl', 'createdAt', 'vip'],
      order: [['createdAt', 'DESC']],
      offset,
      limit: pageSize
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    };
  }
};

// 创建实例并手动应用缓存包装器
AuthServiceImpl.fetchUserRaw = wrapWithCache(
  AuthServiceImpl,
  'fetchUserRaw',
  AuthServiceImpl.fetchUserRaw,
  'user:raw',
  3600,
  300,
  0
);

export const AuthService = AuthServiceImpl;
