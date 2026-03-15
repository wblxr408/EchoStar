/**
 * Mock 数据代理 - 当 VITE_USE_MOCK=true 时使用 Mock 数据
 */

import { mockUser, mockStories, mockMapMarkers } from '../utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// 模拟网络延迟
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Auth API
 */
export const mockAuthApi = {
  async login(email, password) {
    await delay();
    // 简单验证
    if (email && password) {
      return {
        token: 'mock_token_' + Date.now(),
        user: mockUser
      };
    }
    throw new Error('邮箱或密码错误');
  },

  async register(email, password) {
    await delay();
    return {
      token: 'mock_token_' + Date.now(),
      user: {
        ...mockUser,
        email,
        id: Date.now().toString()
      }
    };
  },

  async getCurrentUser() {
    await delay();
    return mockUser;
  }
};

/**
 * Mock Story API
 */
export const mockStoryApi = {
  async createStory(data) {
    await delay();
    const newStory = {
      id: Date.now().toString(),
      userId: mockUser.id,
      username: mockUser.username,
      avatar: mockUser.avatar,
      ...data,
      createdAt: new Date().toISOString()
    };
    mockStories.unshift(newStory);
    return newStory;
  },

  async getStoryById(id) {
    await delay();
    return mockStories.find(s => s.id === id) || null;
  },

  async deleteStory(id) {
    await delay();
    const index = mockStories.findIndex(s => s.id === id);
    if (index > -1) {
      mockStories.splice(index, 1);
    }
  },

  async getMyStories(params) {
    await delay();
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    const myStories = mockStories.filter(s => s.userId === mockUser.id);

    return {
      stories: myStories.slice(start, end),
      pagination: {
        page,
        limit,
        total: myStories.length,
        totalPages: Math.ceil(myStories.length / limit)
      }
    };
  },

  async getUploadToken() {
    await delay();
    return {
      signature: 'mock_signature',
      host: 'https://mock-oss.example.com',
      dir: 'mock-dir/',
      expire: Date.now() + 3600000
    };
  }
};

/**
 * Mock Map API
 */
export const mockMapApi = {
  async exploreStories(latitude, longitude, radius = 1000) {
    await delay();
    // 简单模拟：返回所有故事
    return {
      stories: mockStories,
      pagination: {
        page: 1,
        limit: mockStories.length,
        total: mockStories.length,
        totalPages: 1
      }
    };
  },

  async randomWalk() {
    await delay();
    // 随机返回一个故事
    const randomIndex = Math.floor(Math.random() * mockStories.length);
    return mockStories[randomIndex];
  },

  async getLocationWall(latitude, longitude, radius = 50) {
    await delay();
    // 返回附近的故事
    const nearbyStories = mockStories.filter(story => {
      const dist = Math.sqrt(
        Math.pow(story.location.lat - latitude, 2) +
        Math.pow(story.location.lng - longitude, 2)
      );
      return dist < 0.01; // 简化判断
    });
    return nearbyStories;
  },

  async getClusterData(northEast, southWest) {
    await delay();
    // 返回聚合数据
    return {
      clusters: [
        {
          lat: 39.9042,
          lng: 116.4074,
          count: 3,
          emotion: 'happy'
        },
        {
          lat: 39.9142,
          lng: 116.4174,
          count: 2,
          emotion: 'peaceful'
        }
      ]
    };
  }
};

/**
 * 导出代理 API
 */
export const authApiProxy = USE_MOCK ? mockAuthApi : null;
export const storyApiProxy = USE_MOCK ? mockStoryApi : null;
export const mapApiProxy = USE_MOCK ? mockMapApi : null;
