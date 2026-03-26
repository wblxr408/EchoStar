import api from './index';
import { authApiProxy } from './mockProxy';

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 发送验证码
   */
  sendVerificationCode(email) {
    if (authApiProxy) {
      return authApiProxy.sendVerificationCode(email);
    }
    return api.post('/v1/auth/send-code', { email });
  },

  /**
   * 用户注册（需验证码）
   */
  register(email, password, username, verificationCode) {
    if (authApiProxy) {
      return authApiProxy.register(email, password, username, verificationCode);
    }
    return api.post('/v1/auth/register', { email, password, username, verificationCode });
  },

  /**
   * 用户登录
   */
  login(email, password) {
    if (authApiProxy) {
      return authApiProxy.login(email, password);
    }
    return api.post('/v1/auth/login', { email, password });
  },

  /**
   * GitHub OAuth 登录
   */
  loginWithGitHub(code) {
    if (authApiProxy) {
      return authApiProxy.loginWithGitHub(code);
    }
    return api.post('/v1/auth/github', { code });
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    if (authApiProxy) {
      return authApiProxy.getCurrentUser();
    }
    return api.get('/v1/auth/me');
  },

  /**
   * 注销账号
   */
  deleteAccount() {
    if (authApiProxy) {
      return authApiProxy.deleteAccount();
    }
    return api.delete('/v1/auth/me');
  },

  /**
   * 查看其他用户信息
   */
  getUserById(userId) {
    if (authApiProxy) {
      return authApiProxy.getUserById(userId);
    }
    return api.get(`/v1/auth/users/${userId}`);
  },

  /**
   * 修改个人信息
   */
  updateProfile(data) {
    if (authApiProxy) {
      return authApiProxy.updateProfile(data);
    }
    return api.put('/v1/auth/users/me', data);
  },

  /**
   * 修改密码
   */
  changePassword(oldPassword, newPassword) {
    if (authApiProxy) {
      return authApiProxy.changePassword(oldPassword, newPassword);
    }
    return api.put('/v1/auth/users/me/password', { oldPassword, newPassword });
  },

  /**
   * 管理员登录
   */
  adminLogin(email, password) {
    if (authApiProxy) {
      return authApiProxy.adminLogin(email, password);
    }
    return api.post('/v1/auth/admin/login', { email, password });
  },

  /**
   * 忘记密码
   */
  forgotPassword(email, password, verificationCode) {
    if (authApiProxy) {
      return authApiProxy.forgotPassword(email, password, verificationCode);
    }
    return api.post('/v1/auth/forgot-password', { email, password, verificationCode });
  },

  /**
   * 管理员获取所有用户列表
   */
  getAdminUsers(params = {}) {
    if (authApiProxy) {
      return authApiProxy.getAdminUsers(params);
    }
    return api.get('/v1/auth/admin/users', { params });
  },

  /**
   * 获取头像上传凭证
   */
  getAvatarUploadToken() {
    if (authApiProxy) {
      return authApiProxy.getAvatarUploadToken();
    }
    return api.get('/v1/auth/avatar/upload-token');
  }
};
