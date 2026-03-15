import api from './index';
import { authApiProxy } from './mockProxy';

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 用户注册
   */
  register(email, password) {
    if (authApiProxy) {
      return authApiProxy.register(email, password);
    }
    return api.post('/auth/register', { email, password });
  },

  /**
   * 用户登录
   */
  login(email, password) {
    if (authApiProxy) {
      return authApiProxy.login(email, password);
    }
    return api.post('/auth/login', { email, password });
  },

  /**
   * GitHub OAuth 登录
   */
  loginWithGitHub(code) {
    if (authApiProxy) {
      return authApiProxy.login(code);
    }
    return api.post('/auth/github', { code });
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    if (authApiProxy) {
      return authApiProxy.getCurrentUser();
    }
    return api.get('/auth/me');
  }
};
