import axios from 'axios';

/**
 * Axios 实例配置
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 请求拦截器 - 添加 Token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器 - 统一错误处理
 */
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let errorMessage = '请求失败';

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Token 过期或无效，跳转登录
          localStorage.removeItem('token');
          window.location.href = '/';
          errorMessage = '登录已过期，请重新登录';
          break;
        case 403:
          errorMessage = '权限不足';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 429:
          errorMessage = '请求过于频繁，请稍后再试';
          break;
        case 500:
          errorMessage = '服务器错误，请稍后再试';
          break;
        default:
          errorMessage = data?.message || '请求失败';
      }
    } else {
      errorMessage = '网络错误，请检查网络连接';
    }

    // 创建带中文错误信息的错误对象
    const customError = new Error(errorMessage);
    customError.status = error.response?.status;
    customError.originalError = error;

    return Promise.reject(customError);
  }
);

export default api;
