/**
 * 用户相关类型定义
 */

export interface User {
  id: string | number | null;
  username: string;
  email: string;
  avatar?: string;
  avatarUrl?: string;
  role?: 'user' | 'admin' | 'guest';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  token?: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  verificationCode: string;
}

export interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isGuest: boolean;
}
