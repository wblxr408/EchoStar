import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/stores/user';

// mock authApi
vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    adminLogin: vi.fn(),
    loginWithGitHub: vi.fn(),
    getCurrentUser: vi.fn(),
    sendVerificationCode: vi.fn(),
  },
}));

import { authApi } from '@/api/auth';

describe('stores/user.js', () => {
  beforeEach(() => {
    // 每个测试用例创建独立的 Pinia
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('未登录时 user 为 null, token 为 null', () => {
      const store = useUserStore();
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.isLoggedIn).toBe(false);
      expect(store.isGuest).toBe(false);
    });

    it('从 localStorage 恢复状态', () => {
      localStorage.setItem('token', 'saved-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'test' }));

      setActivePinia(createPinia()); // 重新创建以读取 localStorage
      const store = useUserStore();
      expect(store.token).toBe('saved-token');
      expect(store.user).toEqual({ id: 1, username: 'test' });
      expect(store.isLoggedIn).toBe(true);
    });
  });

  describe('setAuth / logout', () => {
    it('setAuth 设置 token 和用户信息', () => {
      const store = useUserStore();
      store.setAuth('new-token', { id: 1, username: 'user1', email: 'a@b.com' });

      expect(store.token).toBe('new-token');
      expect(store.isLoggedIn).toBe(true);
      expect(store.isGuest).toBe(false);
      expect(store.user.id).toBe(1);
      expect(localStorage.getItem('token')).toBe('new-token');
    });

    it('logout 清空所有状态', () => {
      const store = useUserStore();
      store.setAuth('token', { id: 1, username: 'u' });
      store.loginAsGuest();

      store.logout();

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.isLoggedIn).toBe(false);
      expect(store.isGuest).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('isGuest')).toBeNull();
    });
  });

  describe('游客模式', () => {
    it('loginAsGuest 设置游客状态', () => {
      const store = useUserStore();
      store.loginAsGuest();

      expect(store.isGuest).toBe(true);
      expect(store.isLoggedIn).toBe(true);
      expect(store.user.username).toBe('游客用户');
      expect(localStorage.getItem('isGuest')).toBe('true');
    });

    it('exitGuestMode 退出游客模式', () => {
      const store = useUserStore();
      store.loginAsGuest();
      store.exitGuestMode();

      expect(store.isGuest).toBe(false);
      expect(store.isLoggedIn).toBe(false);
      expect(store.user).toBeNull();
    });
  });

  describe('setUser / updateUser', () => {
    it('setUser 正常化用户数据', () => {
      const store = useUserStore();
      store.setUser({ userId: 42, name: '张三', avatarUrl: 'http://a.jpg' });

      expect(store.user.id).toBe(42);
      expect(store.user.username).toBe('张三');
      expect(store.user.avatar).toBe('http://a.jpg');
    });

    it('setUser 处理 null/undefined', () => {
      const store = useUserStore();
      store.setUser(null);
      expect(store.user).toBeNull();
      store.setUser(undefined);
      expect(store.user).toBeNull();
    });

    it('updateUser 合并更新', () => {
      const store = useUserStore();
      store.setUser({ id: 1, username: 'old', email: 'old@e.com' });
      store.updateUser({ username: 'new', bio: 'hello' });

      expect(store.user.username).toBe('new');
      expect(store.user.email).toBe('old@e.com');
      expect(store.user.bio).toBe('hello');
    });
  });

  describe('login (API 调用)', () => {
    it('登录成功设置 token 和用户', async () => {
      authApi.login.mockResolvedValue({
        data: { accessToken: 'jwt-123', user: { id: 1, username: 'test' } },
      });

      const store = useUserStore();
      await store.login('a@b.com', 'pass');

      expect(store.token).toBe('jwt-123');
      expect(store.isLoggedIn).toBe(true);
    });

    it('登录失败抛出异常', async () => {
      authApi.login.mockResolvedValue({ data: {} });

      const store = useUserStore();
      await expect(store.login('a@b.com', 'pass')).rejects.toThrow('登录响应格式错误');
      expect(store.isLoggedIn).toBe(false);
    });
  });

  describe('register (API 调用)', () => {
    it('注册成功自动登录', async () => {
      authApi.register.mockResolvedValue({
        data: { accessToken: 'reg-token', user: { id: 2, username: 'newbie' } },
      });

      const store = useUserStore();
      await store.register('a@b.com', 'pass', 'newbie', '123456');

      expect(store.token).toBe('reg-token');
      expect(store.user.username).toBe('newbie');
    });
  });

  describe('adminLogin', () => {
    it('管理员登录成功附加 admin role', async () => {
      authApi.adminLogin.mockResolvedValue({
        data: { accessToken: 'admin-tk', user: { id: 99, username: 'admin' } },
      });

      const store = useUserStore();
      await store.adminLogin('admin@e.com', 'pass');

      expect(store.user.role).toBe('admin');
    });
  });

  describe('fetchUser', () => {
    it('无 token 时返回 null', async () => {
      const store = useUserStore();
      const result = await store.fetchUser();
      expect(result).toBeNull();
    });

    it('有 token 时获取并更新用户信息', async () => {
      authApi.getCurrentUser.mockResolvedValue({
        data: { id: 1, username: 'fresh', email: 'fresh@e.com' },
      });

      const store = useUserStore();
      store.setAuth('tk', { id: 1, username: 'old' });
      await store.fetchUser();

      expect(store.user.username).toBe('fresh');
    });

    it('fetchUser 失败时自动 logout', async () => {
      authApi.getCurrentUser.mockRejectedValue(new Error('401'));

      const store = useUserStore();
      store.setAuth('tk', { id: 1, username: 'u' });

      await expect(store.fetchUser()).rejects.toThrow('401');
      expect(store.isLoggedIn).toBe(false);
      expect(store.token).toBeNull();
    });
  });
});
