import api from "./index";
import { mapApiProxy } from "./mockProxy";

export const mapApi = {
  exploreStories(lat, lng, radius = 1000) {
    if (mapApiProxy) {
      return mapApiProxy.exploreStories(lat, lng, radius);
    }
    return api.get("/v1/map/explore", {
      params: { lat, lng, radius },
    });
  },

  randomWalk(lat, lng, mood) {
    if (mapApiProxy) {
      return mapApiProxy.randomWalk();
    }
    const params = { _t: Date.now() };
    if (lat != null && lng != null) {
      params.lat = lat;
      params.lng = lng;
    }
    if (mood) params.mood = mood;
    return api.get("/v1/map/random", { params });
  },

  getRecommendationFeed({ lat, lng, mood, page = 1, limit = 20 } = {}) {
    if (mapApiProxy) {
      return Promise.resolve({
        data: {
          stories: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
        },
      });
    }
    const params = { page, limit };
    if (lat != null && lng != null) {
      params.lat = lat;
      params.lng = lng;
    }
    if (mood) params.mood = mood;
    return api.get("/v1/map/feed", { params });
  },

  getLocationWall(lat, lng, radius = 50) {
    if (mapApiProxy) {
      return mapApiProxy.getLocationWall(lat, lng, radius);
    }
    return api.get("/v1/map/wall", {
      params: { lat, lng, radius },
    });
  },

  getClusterData(northEast, southWest, zoom) {
    if (mapApiProxy) {
      return mapApiProxy.getClusterData(northEast, southWest, zoom);
    }
    return api.get("/v1/map/clusters", {
      params: {
        northEast: JSON.stringify(northEast),
        southWest: JSON.stringify(southWest),
        zoom,
      },
    });
  },

  getAnnouncements() {
    if (mapApiProxy) {
      return mapApiProxy.getAnnouncements();
    }
    return api.get("/v1/announcements");
  },

  createAnnouncement(data) {
    return api.post("/v1/announcements", data);
  },
};
