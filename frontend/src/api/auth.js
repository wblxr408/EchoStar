import api from "./index";
import { authApiProxy } from "./mockProxy";

export const authApi = {
  sendVerificationCode(email) {
    if (authApiProxy) {
      return authApiProxy.sendVerificationCode(email);
    }
    return api.post("/v1/auth/send-code", { email });
  },

  register(email, password, username, verificationCode) {
    if (authApiProxy) {
      return authApiProxy.register(email, password, username, verificationCode);
    }
    return api.post("/v1/auth/register", {
      email,
      password,
      username,
      verificationCode,
    });
  },

  login(email, password) {
    if (authApiProxy) {
      return authApiProxy.login(email, password);
    }
    return api.post("/v1/auth/login", { email, password });
  },

  loginWithGitHub(code) {
    if (authApiProxy) {
      return authApiProxy.loginWithGitHub(code);
    }
    return api.post("/v1/auth/github", { code });
  },

  getCurrentUser() {
    if (authApiProxy) {
      return authApiProxy.getCurrentUser();
    }
    return api.get("/v1/auth/me");
  },

  deleteAccount() {
    if (authApiProxy) {
      return authApiProxy.deleteAccount();
    }
    return api.delete("/v1/auth/me");
  },

  getUserById(userId) {
    if (authApiProxy) {
      return authApiProxy.getUserById(userId);
    }
    return api.get(`/v1/auth/users/${userId}`);
  },

  updateProfile(data) {
    if (authApiProxy) {
      return authApiProxy.updateProfile(data);
    }
    return api.put("/v1/auth/users/me", data);
  },

  changePassword(oldPassword, newPassword) {
    if (authApiProxy) {
      return authApiProxy.changePassword(oldPassword, newPassword);
    }
    return api.put("/v1/auth/users/me/password", { oldPassword, newPassword });
  },

  adminLogin(email, password) {
    if (authApiProxy) {
      return authApiProxy.adminLogin(email, password);
    }
    return api.post("/v1/auth/admin/login", { email, password });
  },

  forgotPassword(email, password, verificationCode) {
    if (authApiProxy) {
      return authApiProxy.forgotPassword(email, password, verificationCode);
    }
    return api.post("/v1/auth/forgot-password", {
      email,
      password,
      verificationCode,
    });
  },

  getAdminUsers(params = {}) {
    if (authApiProxy) {
      return authApiProxy.getAdminUsers(params);
    }
    return api.get("/v1/auth/admin/users", { params });
  },

  getAvatarUploadToken() {
    if (authApiProxy) {
      return authApiProxy.getAvatarUploadToken();
    }
    return api.get("/v1/auth/avatar/upload-token");
  },
};
