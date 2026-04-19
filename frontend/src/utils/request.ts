import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { useErrorHandler } from '../composables/useErrorHandler';

/**
 * 优化的 API 请求工具
 * 基于 Axios，提供统一的请求拦截、错误处理和重试机制
 */

// 请求配置接口
interface RequestConfig extends AxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
  skipAuth?: boolean;
}

// 响应拦截器类型
type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
type ErrorInterceptor = (error: unknown) => Promise<never>;

/**
 * 创建优化的 Axios 实例
 */
export function createRequest(
  baseURL: string,
  errorHandler?: ReturnType<typeof useErrorHandler>
): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15000, // 15秒超时
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 添加认证 token
      if (!(config as RequestConfig).skipAuth) {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      // 添加请求 ID 用于追踪
      config.headers['X-Request-ID'] = generateRequestId();

      // 开发环境日志
      if (import.meta.env.DEV) {
        console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
      }

      return config;
    },
    (error) => {
      console.error('[Request Error]', error);
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      // 开发环境日志
      if (import.meta.env.DEV) {
        console.log(`[Response] ${response.config.url}`, response.data);
      }

      return response;
    },
    async (error) => {
      const config = error.config as RequestConfig;

      // 处理网络错误
      if (!error.response) {
        if (errorHandler) {
          errorHandler.addError(
            '网络连接失败，请检查网络设置',
            error,
            'NETWORK_ERROR'
          );
        }
        return Promise.reject(error);
      }

      // 处理特定状态码
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 未授权，清除 token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (typeof window !== 'undefined') {
            window.location.href = '/?redirect=' + encodeURIComponent(window.location.pathname);
          }
          break;

        case 403:
          if (errorHandler) {
            errorHandler.addError('没有权限执行此操作', data, 'FORBIDDEN');
          }
          break;

        case 404:
          if (errorHandler) {
            errorHandler.addError('请求的资源不存在', data, 'NOT_FOUND');
          }
          break;

        case 429:
          // 请求过于频繁，延迟重试
          const retryAfter = error.response.headers['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return instance(config);

        case 500:
        case 502:
        case 503:
        case 504:
          // 服务器错误，尝试重试
          if (config.retry === undefined) {
            config.retry = 2; // 默认重试2次
          }

          if (config.retry > 0) {
            config.retry--;
            const retryDelay = config.retryDelay || 1000;
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return instance(config);
          }

          if (errorHandler) {
            errorHandler.addError('服务器错误，请稍后重试', data, 'SERVER_ERROR');
          }
          break;
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * 生成唯一的请求 ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 请求缓存管理器
 */
class RequestCache {
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();

  /**
   * 获取缓存数据
   */
  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 设置缓存数据
   */
  set(key: string, data: unknown, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清除过期缓存
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 全局缓存实例
export const requestCache = new RequestCache();

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.clearExpired();
  }, 60000); // 每分钟清理一次
}

/**
 * 带缓存的请求
 */
export async function cachedRequest<T>(
  instance: AxiosInstance,
  config: RequestConfig,
  ttl: number = 60000
): Promise<T> {
  const cacheKey = `${config.method}-${config.url}-${JSON.stringify(config.params)}`;

  // 尝试从缓存获取
  const cachedData = requestCache.get(cacheKey) as T | null;
  if (cachedData !== null) {
    return cachedData;
  }

  // 发送请求
  const response = await instance.request<T>(config);

  // 缓存响应
  requestCache.set(cacheKey, response.data, ttl);

  return response.data;
}

/**
 * 取消请求管理器
 */
export class RequestCanceler {
  private pendingRequests = new Map<string, AbortController>();

  /**
   * 添加请求
   */
  add(requestKey: string): AbortController {
    // 如果存在相同 key 的请求，先取消
    const existingController = this.pendingRequests.get(requestKey);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    this.pendingRequests.set(requestKey, controller);
    return controller;
  }

  /**
   * 移除请求
   */
  remove(requestKey: string): void {
    this.pendingRequests.delete(requestKey);
  }

  /**
   * 取消所有请求
   */
  cancelAll(): void {
    for (const controller of this.pendingRequests.values()) {
      controller.abort();
    }
    this.pendingRequests.clear();
  }
}

// 全局取消器实例
export const requestCanceler = new RequestCanceler();

// 页面卸载时取消所有请求
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    requestCanceler.cancelAll();
  });
}