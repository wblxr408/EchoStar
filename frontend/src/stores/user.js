import { defineStore } from "pinia";
import { ref } from "vue";
import { authApi } from "../api/auth";

export const useUserStore = defineStore("user", () => {
  const savedUser = localStorage.getItem("user");
  const user = ref(savedUser ? JSON.parse(savedUser) : null);
  const token = ref(localStorage.getItem("token") || null);
  const isLoggedIn = ref(!!token.value);
  const isGuest = ref(localStorage.getItem("isGuest") === "true");

  function persistUser(currentUser) {
    if (currentUser) {
      localStorage.setItem("user", JSON.stringify(currentUser));
      return;
    }

    localStorage.removeItem("user");
  }

  function normalizeUserPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    return {
      ...payload,
      id: payload.id ?? payload.userId ?? null,
      username: payload.username ?? payload.name ?? "",
      email: payload.email ?? "",
      avatar: payload.avatar ?? payload.avatarUrl ?? "",
    };
  }

  function setUser(nextUser) {
    const normalizedUser = normalizeUserPayload(nextUser);
    user.value = normalizedUser;
    persistUser(normalizedUser);
  }

  function updateUser(patch) {
    setUser({
      ...(user.value || {}),
      ...(patch || {}),
    });
  }

  async function login(email, password) {
    const response = await authApi.login(email, password);
    const responseData = response?.data ?? response;
    const accessToken = responseData?.accessToken || responseData?.token;
    const userData = responseData?.user;

    if (accessToken && userData) {
      setAuth(accessToken, userData);
      return;
    }

    console.error("登录响应格式不正确:", response);
    throw new Error("登录响应格式错误");
  }

  async function register(email, password, username, verificationCode) {
    const response = await authApi.register(
      email,
      password,
      username,
      verificationCode,
    );
    const responseData = response?.data ?? response;
    const accessToken = responseData?.accessToken || responseData?.token;
    const userData = responseData?.user;

    if (accessToken && userData) {
      setAuth(accessToken, userData);
      return;
    }

    console.error("注册响应格式不正确:", response);
    throw new Error("注册响应格式错误");
  }

  async function adminLogin(email, password) {
    const response = await authApi.adminLogin(email, password);
    const responseData = response?.data ?? response;
    const accessToken = responseData?.accessToken || responseData?.token;
    const userData = responseData?.user;

    if (accessToken && userData) {
      setAuth(accessToken, { ...userData, role: "admin" });
      return;
    }

    console.error("管理员登录响应格式不正确:", response);
    throw new Error("登录响应格式错误");
  }

  async function loginWithGitHub(code) {
    const response = await authApi.loginWithGitHub(code);
    const responseData = response?.data ?? response;
    setAuth(responseData?.accessToken, responseData?.user);
  }

  async function fetchUser() {
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

  function logout() {
    user.value = null;
    token.value = null;
    isLoggedIn.value = false;
    isGuest.value = false;
    localStorage.removeItem("token");
    persistUser(null);
    localStorage.removeItem("isGuest");
  }

  function setAuth(newToken, newUser) {
    token.value = newToken;
    isLoggedIn.value = true;
    isGuest.value = false;
    localStorage.setItem("token", newToken);
    setUser(newUser);
    localStorage.removeItem("isGuest");
  }

  function loginAsGuest() {
    isGuest.value = true;
    isLoggedIn.value = true;
    setUser({ username: "游客用户", id: "guest", email: "" });
    localStorage.setItem("isGuest", "true");
  }

  function exitGuestMode() {
    isGuest.value = false;
    isLoggedIn.value = false;
    setUser(null);
    localStorage.removeItem("isGuest");
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
    setUser,
    updateUser,
    loginAsGuest,
    exitGuestMode,
  };
});
