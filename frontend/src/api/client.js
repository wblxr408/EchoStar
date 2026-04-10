import api from "./index.js";

export const authApi = {
  register(email, password, username) {
    return api
      .post("/v1/auth/register", {
        email,
        password,
        username,
      })
      .then((res) => res.data);
  },

  login(email, password) {
    return api
      .post("/v1/auth/login", {
        email,
        password,
      })
      .then((res) => res.data);
  },

  me() {
    return api.get("/v1/auth/me").then((res) => res.data);
  },

  getGitHubOAuthUrl() {
    return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/v1/auth/oauth/github`;
  },

  updateProfile(data) {
    return api.put("/v1/auth/users/me", data).then((res) => res.data);
  },

  getAvatarUploadToken() {
    return api.get("/v1/auth/avatar/upload-token").then((res) => res.data);
  },
};

export const storyApi = {
  getUploadToken() {
    return api.get("/v1/stories/upload-token").then((res) => res.data);
  },

  create(data) {
    return api.post("/v1/stories", data).then((res) => res.data);
  },

  getById(id) {
    return api.get(`/v1/stories/${id}`).then((res) => res.data);
  },

  getMy(page = 1, limit = 20) {
    return api
      .get("/v1/stories/my", {
        params: { page, limit },
      })
      .then((res) => res.data);
  },

  delete(id) {
    return api.delete(`/v1/stories/${id}`);
  },
};

export const mapApi = {
  explore(lat, lng, radius = 1000) {
    return api
      .get("/v1/map/explore", {
        params: { lat, lng, radius },
      })
      .then((res) => res.data);
  },

  random() {
    return api.get("/v1/map/random").then((res) => res.data);
  },

  locationWall(lat, lng, radius = 100) {
    return api
      .get("/v1/map/location-wall", {
        params: { lat, lng, radius },
      })
      .then((res) => res.data);
  },

  cluster(bounds, zoom) {
    return api
      .get("/v1/map/cluster", {
        params: { bounds, zoom },
      })
      .then((res) => res.data);
  },
};

export const announcementApi = {};

export const adminApi = {
  getReports(status = "pending", page = 1, limit = 20) {
    return api
      .get("/v1/admin/reports", {
        params: { status, page, limit },
      })
      .then((res) => res.data);
  },

  featureStory(id, reason, pinned = false) {
    return api.post(`/v1/admin/stories/${id}/feature`, { reason, pinned });
  },

  shadowban(id, reason) {
    return api.post(`/v1/admin/stories/${id}/shadowban`, { reason });
  },

  restore(id) {
    return api.post(`/v1/admin/stories/${id}/restore`);
  },
};

export default {
  auth: authApi,
  story: storyApi,
  map: mapApi,
  announcement: announcementApi,
  admin: adminApi,
};
