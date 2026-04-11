import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api/auth';
import type { User, AuthResponse } from '../types/user';

/**
 * 用户状态管理
 * 使用 TypeScript 和 Composition API
 */
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const isLoggedIn = ref(!!token.value);
  const isGuest = ref(localStorage.getItem('isGuest') === 'true');

  // 计算属性
  const isAdmin = computed(() => user.value?.role === 'admin');
  const username = computed(() => user.value?.username ?? '游客用户');
  const avatar = computed(() => user.value?.avatar ?? '');

  /**
   * 持久化用户数据
   */
  function persistUser(currentUser: User | null): void {
    if (currentUser) {
      localStorage.setItem('user', JSON.stringify(currentUser));
      return;
    }
    localStorage.removeItem('user');
  }

  /**
   * 标准化用户数据格式
   */
  function normalizeUserPayload(payload: Record<string, unknown> | null): User | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    return {
      ...payload,
      id: (payload.id ?? payload.userId ?? null) as string | number | null,
      username: (payload.username ?? payload.name ?? '') as string,
      email: (payload.email ?? '') as string,
      avatar: (payload.avatar ?? payload.avatarUrl ?? '') as string,
      role: (payload.role ?? 'user') as string
    } as User;
  }

  /**
   * 设置用户
   */
  function setUser(nextUser: Record<string, unknown> | null): void {
    const normalizedUser = normalizeUserPayload(nextUser as Record<string, unknown>);
    user.value = normalizedUser;
    persistUser(normalizedUser);
  }

  /**
   * 更新用户部分信息
   */
  function updateUser(patch: Partial<User>): void {
    setUser({
      ...(user.value || {}),
      ...patch
    });
  }

  /**
   * 登录
   */
  async function login(email: string, password: string): Promise<void> {
    const response = await authApi.login(email, password);
    const responseData = response?.data ?? response;
    const accessToken = responseData?.accessToken || responseData?.token;
    const userData = responseData?.user;

    if (accessToken && userData) {
      setAuth(accessToken, userData);
      return;
    }

    console.error('登录响应格式不正确:', response);
    throw new Error('登录响应格式错误');
  }

  /**
   * 注册
   */
  async function register(email: string, password: string, username: string, verificationCode: string): Promise<void> {
    const response = await authApi.register(email, password, username, verificationCode);
    const responseData = response?.data ?? response;
    const accessToken = responseData?.accessToken || responseData?.token;
    const userData = responseData?.user;

    if (accessToken && userData) {
      setAuth(accessToken, userData);
      return;
    }

    console.error('注册响应格式不正确:', response);
    throw new Error('注册响应格式错误');
  }

  /**
   * 管理员登录
   */
  async function adminLogin(email: string, password: string): Promise<void> {
    const response = await authApi.adminLogin(email, password);
    const responseData = response?.data ?? response;
    const accessToken = responseData?.accessToken || responseData?.token;
    const userData = responseData?.user;

    if (accessToken && userData) {
      setAuth(accessToken, { ...userData, role: 'admin' });
      return;
    }

    console.error('管理员登录响应格式不正确:', response);
    throw new Error('登录响应格式错误');
  }

  /**
   * GitHub 登录
   */
  async function loginWithGitHub(code: string): Promise<void> {
    const response = await authApi.loginWithGitHub(code);
    const responseData = response?.data ?? response;
    setAuth(responseData?.accessToken, responseData?.user);
  }

  /**
   * 获取当前用户信息
   */
  async function fetchUser(): Promise<User | null> {
    if (!token.value) return null;

    try {
      const response = await authApi.getCurrentUser();
      const userData = response?.data ?? response;
      setUser(userData);
      return user.value;
    } catch (error) {
      logout();
      throw error;
    }
  }

  /**
   * 登出
   */
  function logout(): void {
    user.value = null;
    token.value = null;
    isLoggedIn.value = false;
    isGuest.value = false;
    localStorage.removeItem('token');
    persistUser(null);
    localStorage.removeItem('isGuest');
  }

  /**
   * 设置认证信息
   */
  function setAuth(newToken: string, newUser: Record<string, unknown>): void {
    token.value = newToken;
    isLoggedIn.value = true;
    isGuest.value = false;
    localStorage.setItem('token', newToken);
    setUser(newUser);
    localStorage.removeItem('isGuest');
  }

  /**
   * 游客登录
   */
  function loginAsGuest(): void {
    isGuest.value = true;
    isLoggedIn.value = true;
    setUser({ username: '游客用户', id: 'guest', email: '', role: 'guest' });
    localStorage.setItem('isGuest', 'true');
  }

  /**
   * 退出游客模式
   */
  function exitGuestMode(): void {
    isGuest.value = false;
    isLoggedIn.value = false;
    setUser(null);
    localStorage.removeItem('isGuest');
  }

  return {
    // 状态
    user,
    token,
    isLoggedIn,
    isGuest,
    // 计算属性
    isAdmin,
    username,
    avatar,
    // 方法
    login,
    register,
    adminLogin,
    loginWithGitHub,
    fetchUser,
    logout,
    setAuth,
    setUser,
    updateUser,
    loginAsGuest,
    exitGuestMode
  };
});