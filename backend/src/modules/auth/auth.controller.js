import { AuthService } from './auth.service.js';
import { redisClient } from '../../common/utils/redis.js';
import { generateAvatarUploadToken } from '../../common/utils/oss.js';

/**
 * 发送验证码
 */
export const sendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const redisKey = `vc_time:${email}`; // 频率控制专用键

    // 检查60秒内是否已发送过验证码
    const redis=redisClient.getClient();
    const lastSent = await redis.get(redisKey);
    if (lastSent && Date.now() - parseInt(lastSent) < 60 * 1000) {
      return res.status(429).json({ 
        code: 1, 
        message: '验证码发送过于频繁，请60秒后再试' 
      });
    }

    // 调用服务层发送验证码
    const result = await AuthService.sendVerificationCode(email);
    
    // 记录本次发送时间（60秒过期）
     await redis.set(redisKey, Date.now());
    await redis.expire(redisKey, 60);
    
    res.json({ code: 0, data: result });
  } catch(error) {
    next(error);
  }
}



/**
 * 用户注册 (带验证码验证)
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, username, verificationCode, code } = req.body;

    // 兼容前端可能传 code 或 verificationCode 的情况
    const finalCode = verificationCode || code;

    if (!finalCode) {
      return res.status(400).json({
        code: 400,
        message: '请输入验证码'
      });
    }

    const result = await AuthService.register(email, password, username, finalCode);
    res.json({ code: 0, data: result });
  } catch (error) {
    if (error.message === '验证码错误' || error.message === '验证码不存在或已过期，请重新获取验证码') {
      return res.status(400).json({
        code: 400,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * 用户注册 (不带验证码，仅测试用)
 */
export const register_2 = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;
    const result = await AuthService.register_2(email, password, username );
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 管理员登录
 */
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.adminLogin(email, password);
    res.json({ code: 0, data: result });
  } catch (error) {
    return res.status(401).json({ code: 1, message: error.message });
  }
};

/**
 * 用户登录
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json({ code: 0, data: result });
  } catch (error) {
    return res.status(401).json({ code: 1, message: error.message });
  }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id; // 来自 JWT 中间件
    const user = await AuthService.getCurrentUser(userId);
    res.json({ code: 0, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * 查看其他用户信息
 */
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await AuthService.getUserById(userId);
    res.json({ code: 0, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * 修改个人信息
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, avatarUrl, bio } = req.body;
    const result = await AuthService.updateProfile(userId, { username, avatarUrl, bio });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 修改密码
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(userId, oldPassword, newPassword);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 忘记密码 - 发送验证码重置密码
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, password, verificationCode } = req.body;
    const result = await AuthService.forgotPassword(email, password, verificationCode);
    res.json({ code: 0, message: result.message });
  } catch (error) {
    next(error);
  }
};

/**
 * 注销账号
 */
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await AuthService.deleteAccount(userId);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 管理员获取所有用户列表
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, category = 'normal' } = req.query;

    const result = await AuthService.getAllUsers(
      parseInt(page),
      parseInt(pageSize),
      category
    );

    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取头像上传凭证
 */
export const getAvatarUploadToken = async (req, res, next) => {
  try {
    const token = generateAvatarUploadToken();
    res.json({ code: 0, data: token });
  } catch (error) {
    next(error);
  }
};

/**
 * 根据用户名模糊搜索用户
 */
export const searchUsersByUsername = async (req, res, next) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;

    // 直接调用service，所有验证在service层完成
    const result = await AuthService.searchUsersByUsername(keyword, { page, limit });
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
  }
};
