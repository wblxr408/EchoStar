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
import { VipService } from '../vip/vip.service.js';

const AUTH_LOOKUP_ATTRIBUTES = [
  'id',
  'email',
  'username',
  'passwordHash',
  'avatarUrl',
  'role',
  'vip',
  'emotionCoins',
  'oauthProvider',
  'status'
];

const USER_CREATE_FIELDS = [
  'username',
  'email',
  'passwordHash',
  'oauthProvider',
  'avatarUrl'
];


const AuthServiceImpl = {
    async sendVerificationCode(email) {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const fixedEmail = email.trim().toLowerCase();
    const codeKey = `verification_code:${fixedEmail}`;

    try {
      const redis = redisClient.getClient();

      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 465,
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
        console.log(`✅ 邮件发送成功 (邮箱: ${fixedEmail})`);
      } else {
        console.log(`\n🔑 [未配置邮件] 验证码: ${code} (邮箱: ${fixedEmail}, 5分钟有效)\n`);
      }

      console.log('🔍 准备执行Redis SET，Key:', codeKey, 'Value:', code);

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

    async register(email, password, username, verificationCode) {
    const redis = redisClient.getClient();
    const fixedEmail = email.trim().toLowerCase();
    const key = `verification_code:${fixedEmail}`;

    const blacklistEntry = await Blacklist.findOne({ where: { email: fixedEmail } });
    if (blacklistEntry) {
      throw new Error('您的账号已被封禁');
    }

    const storedCode = await redis.get(key);

    console.log('注册时的Redis Key:', key);
    console.log('从Redis取出的验证码:', storedCode);
    console.log('前端传来的验证码:', verificationCode);

    if (!storedCode) throw new Error('验证码不存在或已过期，请重新获取验证码');
    if (String(storedCode) !== String(verificationCode)) throw new Error('验证码错误');

    await redis.del(key);

    const existingUserByEmail = await User.findOne({
      where: { email: fixedEmail, status: ['normal', 'recommended'] },
      attributes: ['id']
    });
    if (existingUserByEmail) {
      throw new Error('邮箱已被注册');
    }
    const existingUserByUsername = await User.findOne({
      where: { username },
      attributes: ['id']
    });
    if (existingUserByUsername) throw new Error('用户名已被使用');

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = getRandomDefaultAvatar();
    const user = await User.create({
      username,
      email: fixedEmail,
      passwordHash: hashedPassword,
      oauthProvider: 'email',
      avatarUrl: defaultAvatar
    }, {
      fields: USER_CREATE_FIELDS
    });

    try {
      await VipService.upgradeUserToVip(user.id, null, 7);
    } catch (vipErr) {
      console.warn('[register] 赠送VIP失败，不影响注册:', vipErr.message);
    }

    return {
      accessToken: this.generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatarUrl,
        vip: 1,
        emotionCoins: user.emotionCoins || 0
      }
    };
  },

  async register_2(email, password, username) {
    const fixedEmail = email.trim().toLowerCase();

    const blacklistEntry = await Blacklist.findOne({ where: { email: fixedEmail } });
    if (blacklistEntry) {
      throw new Error('您的账号已被封禁');
    }

    const existingUserByEmail = await User.findOne({
      where: { email: fixedEmail, status: ['normal', 'recommended'] },
      attributes: ['id']
    });
    if (existingUserByEmail) {
      throw new Error('邮箱已被注册');
    }

    const existingUserByUsername = await User.findOne({
      where: { username },
      attributes: ['id']
    });
    if (existingUserByUsername) {
      throw new Error('用户名已被使用');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const defaultAvatar = getRandomDefaultAvatar();

    const user = await User.create({
      username,
      email: fixedEmail,
      passwordHash: hashedPassword,
      oauthProvider: 'email',
      avatarUrl: defaultAvatar
    }, {
      fields: USER_CREATE_FIELDS
    });

    try {
      await VipService.upgradeUserToVip(user.id, null, 7);
    } catch (vipErr) {
      console.warn('[register_2] 赠送VIP失败，不影响注册:', vipErr.message);
    }

    const token = this.generateToken(user.id);

    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatarUrl,
        vip: 1,
        emotionCoins: user.emotionCoins || 0
      }
    };
  },

  async adminLogin(email, password) {
    const admin = await User.findOne({
      where: { email, role: 'admin' },
      attributes: AUTH_LOOKUP_ATTRIBUTES
    })
    if(!admin){
      throw new Error('邮箱或密码错误')
    }
    const isValidPassword=await bcrypt.compare(password,admin.passwordHash)
    if(!isValidPassword){
      throw new Error('邮箱或密码错误')
    }
    const token=this.generateToken(admin.id)
    return {
      accessToken: token,
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        avatar: admin.avatarUrl,
        vip: admin.vip,
        emotionCoins: admin.emotionCoins || 0
      }
    }
  },

  async login(email, password) {
    const blacklistEntry = await Blacklist.findOne({ where: { email } });
    if (blacklistEntry) {
      throw new Error('您的账号已被封禁');
    }

    const user = await User.findOne({
      where: { email, status: ['normal', 'recommended'] },
      attributes: AUTH_LOOKUP_ATTRIBUTES
    });
    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('邮箱或密码错误');
    }

    const token = this.generateToken(user.id);

    return {
      accessToken: token,  
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatarUrl,
        vip: user.vip,
        emotionCoins: user.emotionCoins || 0
      }
    };
  },

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      throw new Error('Token 无效或已过期');
    }
  },

  async fetchUserRaw(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'username', 'avatarUrl', 'role', 'bio', 'bioFontFamily', 'bioFontEffect', 'status', 'createdAt', 'vip', 'emotionCoins', 'lastCheckInAt', 'checkInStreak']
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      bio: user.bio,
      bioFontFamily: user.bioFontFamily || null,
      bioFontEffect: user.bioFontEffect || null,
      status: user.status,
      vip: user.vip,
      emotionCoins: user.emotionCoins || 0,
      lastCheckInAt: user.lastCheckInAt || null,
      checkInStreak: user.checkInStreak || 0,
      createdAt: user.createdAt
    };
  },

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
      bioFontFamily: rawData.bioFontFamily || null,
      bioFontEffect: rawData.bioFontEffect || null,
      role: rawData.role,
      status: rawData.status,
      vip: rawData.vip,
      emotionCoins: rawData.emotionCoins || 0,
      lastCheckInAt: rawData.lastCheckInAt || null,
      checkInStreak: rawData.checkInStreak || 0,
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

    const lockKey = `pwd_lock:${fixedEmail}`;
    await redis.set(lockKey, '1');
    await redis.expire(lockKey, 30);

    const user = await User.findOne({
      where: { email: fixedEmail },
      attributes: ['id', 'oauthProvider', 'passwordHash']
    });
    if (!user) throw new Error('该邮箱未注册');
    if (user.oauthProvider !== 'email') throw new Error('该账号使用第三方登录，不支持通过邮箱重置密码');

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ passwordHash: hashedPassword });
    await redis.del(lockKey);

    return { success: true, message: '密码重置成功，请使用新密码登录' };
  },

  generateToken(userId) {
    const payload = { id: userId, userId };
    return jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  },

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
      bioFontFamily: rawData.bioFontFamily || null,
      bioFontEffect: rawData.bioFontEffect || null,
      vip: rawData.vip,
      emotionCoins: rawData.emotionCoins || 0,
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

  async updateProfile(userId, { username, avatarUrl, bio, bioFontFamily, bioFontEffect }) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('用户不存在');
    }

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

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (bio !== undefined) updateData.bio = bio;
    if (bioFontFamily !== undefined) updateData.bioFontFamily = bioFontFamily || null;
    if (bioFontEffect !== undefined) updateData.bioFontEffect = bioFontEffect || null;

    await user.update(updateData);

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
      ,
      emotionCoins: user.emotionCoins || 0
    };
  },

  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.oauthProvider !== 'email') {
      throw new Error('该账号使用第三方登录，不支持修改密码');
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      passwordHash: hashedPassword
    });

    await clearUserCache(user.id);

    return {
      success: true,
      message: '密码修改成功'
    };
  },

  async deleteAccount(userId) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.status === 'deleted') {
      throw new Error('账号已被注销');
    }

    await user.update({
      status: 'deleted'
    });

    await clearUserCache(user.id);

    return {
      success: true,
      message: '账号已注销'
    };
  },

  async getAllUsers(page = 1, pageSize = 20, category = 'normal') {
    const offset = (page - 1) * pageSize;

    const statusFilter = category === 'deleted' ? 'deleted' : { [Op.in]: ['normal', 'recommended'] };

    const { count, rows } = await User.findAndCountAll({
      where: { status: statusFilter },
      attributes: ['id', 'username', 'email', 'role', 'status', 'bio', 'avatarUrl', 'createdAt', 'vip', 'emotionCoins'],
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
  },

  async searchUsersByUsername(keyword, { page = 1, limit = 20 } = {}) {
    if (!keyword || typeof keyword !== 'string') {
      throw new Error('请提供搜索关键词');
    }

    const trimmedKeyword = keyword.trim().replace(/[%_\\]/g, '\\$&');

    if (trimmedKeyword === '') {
      throw new Error('搜索关键词不能为空');
    }

    if (trimmedKeyword.length < 1) {
      throw new Error('搜索关键词不能为空');
    }

    if (trimmedKeyword.length > 50) {
      throw new Error('搜索关键词不能超过50个字符');
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('页码必须大于0');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new Error('每页数量必须在1-100之间');
    }

    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await User.findAndCountAll({
      where: {
        username: {
          [Op.iLike]: `%${trimmedKeyword}%`
        },
        status: ['normal', 'recommended']
      },
      attributes: ['id', 'username', 'avatarUrl', 'bio', 'vip', 'emotionCoins', 'createdAt'],
      order: [['createdAt', 'DESC']],
      offset,
      limit: limitNum
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    };
  }
};

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
