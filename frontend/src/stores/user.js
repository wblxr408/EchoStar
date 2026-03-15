import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authApi } from '../api/auth';

/**
 * 用户状态管理
 */
export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);
  const isLoggedIn = ref(!!token.value);

  /**
   * 登录
   */
  async function login(email, password) {
    const data = await authApi.login(email, password);
    setAuth(data.token, data.user);
  }

  /**
   * 注册
   */
  async function register(email, password) {
    const data = await authApi.register(email, password);
    setAuth(data.token, data.user);
  }

  /**
   * GitHub 登录
   */
  async function loginWithGitHub(code) {
    const data = await authApi.loginWithGitHub(code);
    setAuth(data.token, data.user);
  }

  /**
   * 获取用户信息
   */
  async function fetchUser() {
    if (!token.value) return;

    try {
      const data = await authApi.getCurrentUser();
      user.value = data;
    } catch (error) {
      // Token 无效，清除登录状态
      logout();
    }
  }

  /**
   * 登出
   */
  function logout() {
    user.value = null;
    token.value = null;
    isLoggedIn.value = false;
    localStorage.removeItem('token');
  }

  /**
   * 设置认证信息
   */
  function setAuth(newToken, newUser) {
    token.value = newToken;
    user.value = newUser;
    isLoggedIn.value = true;
    localStorage.setItem('token', newToken);
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    register,
    loginWithGitHub,
    fetchUser,
    logout,
    setAuth
  };
});
