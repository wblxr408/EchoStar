import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authApi } from '../api/auth';

/**
 * 用户状态管理
 */
export const useUserStore = defineStore('user', () => {
  // 从 localStorage 恢复用户信息
  const savedUser = localStorage.getItem('user');
  const user = ref(savedUser ? JSON.parse(savedUser) : null);
  const token = ref(localStorage.getItem('token') || null);
  const isLoggedIn = ref(!!token.value);
  const isGuest = ref(localStorage.getItem('isGuest') === 'true');

  /**
   * 登录
   */
  async function login(email, password) {
    const response = await authApi.login(email, password);
    console.log('登录响应:', response);
    // 适配多种后端响应格式
    // 格式1: { code, data: { accessToken, user } }
    // 格式2: { accessToken, user }
    // 格式3: { token, user }
    // 格式4: { data: { token, user } }
    const responseData = response.data || response;
    const accessToken = responseData.accessToken || responseData.token;
    const userData = responseData.user;
    
    if (accessToken && userData) {
      setAuth(accessToken, userData);
    } else {
      console.error('登录响应格式不正确:', response);
      throw new Error('登录响应格式错误');
    }
  }

  /**
   * 注册
   */
  async function register(email, password, username, verificationCode) {
    const response = await authApi.register(email, password, username, verificationCode);
    console.log('注册响应:', response);
    // 适配多种后端响应格式
    const responseData = response.data || response;
    const accessToken = responseData.accessToken || responseData.token;
    const userData = responseData.user;
    
    if (accessToken && userData) {
      setAuth(accessToken, userData);
    } else {
      console.error('注册响应格式不正确:', response);
      throw new Error('注册响应格式错误');
    }
  }

  /**
   * 管理员登录
   */
  async function adminLogin(email, password) {
    const response = await authApi.adminLogin(email, password);
    console.log('管理员登录响应:', response);
    // 适配后端响应格式 { code, data: { accessToken, user } }
    const responseData = response.data || response;
    const accessToken = responseData.accessToken || responseData.token;
    const userData = responseData.user;
    
    if (accessToken && userData) {
      // 确保用户角色为admin
      userData.role = 'admin';
      setAuth(accessToken, userData);
    } else {
      console.error('管理员登录响应格式不正确:', response);
      throw new Error('登录响应格式错误');
    }
  }

  /**
   * GitHub 登录
   */
  async function loginWithGitHub(code) {
    const response = await authApi.loginWithGitHub(code);
    // 适配后端响应格式 { code, data: { accessToken, user } }
    const { accessToken, user } = response.data || response;
    setAuth(accessToken, user);
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
    isGuest.value = false;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
  }

  /**
   * 设置认证信息
   */
  function setAuth(newToken, newUser) {
    token.value = newToken;
    user.value = newUser;
    isLoggedIn.value = true;
    isGuest.value = false;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.removeItem('isGuest');
    console.log('用户信息已保存:', newUser);
  }

  /**
   * 游客登录
   */
  function loginAsGuest() {
    isGuest.value = true;
    isLoggedIn.value = true;
    user.value = { username: '游客用户', id: 'guest', email: '' };
    localStorage.setItem('isGuest', 'true');
  }

  /**
   * 退出游客模式
   */
  function exitGuestMode() {
    isGuest.value = false;
    isLoggedIn.value = false;
    user.value = null;
    localStorage.removeItem('isGuest');
  }

  return {
    user,
    token,
    isLoggedIn,
    isGuest,
    login,
    register,
    adminLogin,
    loginWithGitHub,
    fetchUser,
    logout,
    setAuth,
    loginAsGuest,
    exitGuestMode
  };
});
