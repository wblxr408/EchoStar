import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let errorMessage = "请求失败";

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          if (data?.message !== "邮箱或密码错误") {
            localStorage.removeItem("token");
            window.location.href = "/";
          }
          errorMessage = data?.message || "登录已过期，请重新登录";
          break;
        case 403:
          errorMessage = "权限不足";
          break;
        case 404:
          errorMessage = "请求的资源不存在";
          break;
        case 429:
          errorMessage = "请求过于频繁，请稍后再试";
          break;
        case 500:
          errorMessage = "服务器错误，请稍后再试";
          break;
        default:
          errorMessage = data?.message || "请求失败";
      }
    } else {
      errorMessage = "网络错误，请检查网络连接";
    }

    const customError = new Error(errorMessage);
    customError.status = error.response?.status;
    customError.originalError = error;

    return Promise.reject(customError);
  },
);

export default api;
