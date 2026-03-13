import api from './index';

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 用户注册
   */
  register(email, password) {
    return api.post('/auth/register', { email, password });
  },

  /**
   * 用户登录
   */
  login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  /**
   * GitHub OAuth 登录
   */
  loginWithGitHub(code) {
    return api.post('/auth/github', { code });
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    return api.get('/auth/me');
  }
};
