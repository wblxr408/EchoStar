import { AuthService } from './auth.service.js';

/**
 * 用户注册
 */
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.register(email, password);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
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
    next(error);
  }
};

/**
 * GitHub OAuth 登录
 */
export const loginWithGitHub = async (req, res, next) => {
  try {
    const { code } = req.body;
    const result = await AuthService.loginWithGitHub(code);
    res.json({ code: 0, data: result });
  } catch (error) {
    next(error);
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
