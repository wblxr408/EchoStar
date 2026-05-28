/**
 * Mock 数据代理 - 当 VITE_USE_MOCK=true 时使用 Mock 数据
 */

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// 本地 Mock 数据定义
const mockUser = {
  id: 1,
  username: '测试用户',
  email: 'test@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
  bio: '这是一个测试用户'
};

const mockStories = [];

const mockComments = [];

const mockNotifications = [];

// 模拟网络延迟
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Auth API
 */
export const mockAuthApi = {
  async sendVerificationCode(email) {
    await delay();
    return {
      code: 0,
      data: {
        success: true,
        message: '验证码已发送到您的邮箱，有效期5分钟'
      }
    };
  },

  async login(email, password) {
    await delay();
    if (email && password) {
      return {
        code: 0,
        data: {
          accessToken: 'mock_token_' + Date.now(),
          user: mockUser
        }
      };
    }
    throw new Error('邮箱或密码错误');
  },

  async register(email, password, username, verificationCode) {
    await delay();
    return {
      code: 0,
      data: {
        accessToken: 'mock_token_' + Date.now(),
        user: {
          ...mockUser,
          email,
          username: username || '新用户',
          id: Date.now()
        }
      }
    };
  },

  async loginWithGitHub(code) {
    await delay();
    return {
      code: 0,
      data: {
        accessToken: 'mock_github_token_' + Date.now(),
        user: {
          ...mockUser,
          username: 'github_user'
        }
      }
    };
  },

  async getCurrentUser() {
    await delay();
    return {
      code: 0,
      data: mockUser
    };
  },

  async deleteAccount() {
    await delay();
    return {
      code: 0,
      data: {
        success: true,
        message: '账号已注销'
      }
    };
  },

  async getUserById(userId) {
    await delay();
    return {
      code: 0,
      data: {
        id: userId,
        username: '其他用户',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Other',
        bio: '这是一个用户',
        stories: mockStories.slice(0, 2)
      }
    };
  },

  async updateProfile(data) {
    await delay();
    Object.assign(mockUser, data);
    return {
      code: 0,
      data: mockUser
    };
  },

  async changePassword(oldPassword, newPassword) {
    await delay();
    return {
      code: 0,
      data: {
        success: true,
        message: '密码修改成功'
      }
    };
  },

  async adminLogin(email, password) {
    await delay();
    if (email && password) {
      return {
        code: 0,
        data: {
          accessToken: 'admin_mock_token_' + Date.now(),
          user: {
            ...mockUser,
            role: 'admin'
          }
        }
      };
    }
    throw new Error('邮箱或密码错误');
  },

  async forgotPassword(email, password, verificationCode) {
    await delay();
    return {
      code: 0,
      message: '密码重置成功，请使用新密码登录'
    };
  },

  async getAdminUsers(params = {}) {
    await delay();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const category = params.category || 'normal';

    const mockUsers = [
      { id: 1, username: '用户A', email: 'userA@test.com', role: 'user', status: 'normal', bio: '测试用户', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=A', createdAt: '2026-03-01T10:00:00Z' },
      { id: 2, username: '用户B', email: 'userB@test.com', role: 'user', status: 'recommended', bio: '优质用户', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=B', createdAt: '2026-03-05T10:00:00Z' },
      { id: 3, username: '用户C', email: 'userC@test.com', role: 'user', status: 'deleted', bio: '已封禁', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=C', createdAt: '2026-03-10T10:00:00Z' }
    ];

    const filteredUsers = category === 'deleted'
      ? mockUsers.filter(u => u.status === 'deleted')
      : mockUsers.filter(u => u.status !== 'deleted');

    const start = (page - 1) * pageSize;

    return {
      code: 0,
      data: {
        users: filteredUsers.slice(start, start + pageSize),
        pagination: {
          total: filteredUsers.length,
          page,
          pageSize,
          totalPages: Math.ceil(filteredUsers.length / pageSize)
        }
      }
    };
  },

  async searchUsersByUsername(keyword, { page = 1, limit = 20 } = {}) {
    await delay();
    const results = mockUsers.filter(u =>
      u.status !== 'deleted' &&
      u.username.toLowerCase().includes(keyword.trim().toLowerCase())
    );
    const start = (page - 1) * limit;
    return {
      code: 0,
      data: {
        users: results.slice(start, start + limit),
        pagination: {
          total: results.length,
          page,
          limit,
          totalPages: Math.ceil(results.length / limit)
        }
      }
    };
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
      author: {
        id: mockUser.id,
        username: mockUser.username,
        avatar: mockUser.avatar
      },
      ...data,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString()
    };
    mockStories.unshift(newStory);
    return {
      code: 0,
      data: newStory
    };
  },

  async getStoryById(id) {
    await delay();
    const story = mockStories.find(s => s.id === id);
    if (!story) {
      return { code: 4004, message: '故事不存在' };
    }
    return {
      code: 0,
      data: {
        ...story,
        likeCount: story.likeCount ?? story.likes ?? 0,
        commentCount: story.commentCount ?? story.comments ?? 0,
        favoriteCount: story.favoriteCount ?? story.favorites ?? 0,
        viewCount: story.viewCount ?? story.views ?? 0
      }
    };
  },

  async deleteStory(id) {
    await delay();
    const index = mockStories.findIndex(s => s.id === id);
    if (index > -1) {
      mockStories.splice(index, 1);
    }
    return {
      code: 0,
      message: '删除成功'
    };
  },

  async updateStory(id, data) {
    await delay();
    const story = mockStories.find(s => s.id === id);
    if (story) {
      Object.assign(story, data);
    }
    return {
      code: 0,
      data: story
    };
  },

  async updateVisibility(id, visibility) {
    await delay();
    const story = mockStories.find(s => s.id === id);
    if (story) {
      story.visibility = visibility;
    }
    return {
      code: 0,
      data: { id, visibility }
    };
  },

  async getMyStories(params) {
    await delay();
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    const myStories = mockStories.filter(s => s.userId === mockUser.id || s.author?.id === mockUser.id);

    return {
      code: 0,
      data: {
        stories: myStories.slice(start, end),
        pagination: {
          page,
          limit,
          total: myStories.length,
          totalPages: Math.ceil(myStories.length / limit)
        }
      }
    };
  },

  async searchStories(keyword, params = {}) {
    await delay();
    const page = params.page || 1;
    const limit = params.limit || 10;
    const start = (page - 1) * limit;

    const results = mockStories.filter(s =>
      s.content?.includes(keyword) || s.emotionTag?.includes(keyword)
    );

    return {
      code: 0,
      data: {
        stories: results.slice(start, start + limit),
        pagination: {
          total: results.length,
          page,
          limit,
          totalPages: Math.ceil(results.length / limit)
        }
      }
    };
  },

  async unlockTimeCapsule(id) {
    await delay();
    return {
      code: 0,
      message: '时光胶囊解锁成功'
    };
  },

  async getUploadToken() {
    await delay();
    return {
      code: 0,
      data: {
        accessKeyId: 'mock_access_key',
        accessKeySecret: 'mock_secret',
        stsToken: 'mock_sts_token',
        bucket: 'echostar-images',
        region: 'oss-cn-hangzhou',
        expiration: new Date(Date.now() + 3600000).toISOString()
      }
    };
  },

  async getAdminStories(params = {}) {
    await delay();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    const visibility = params.visibility;
    const isRecommended = params.isRecommended;

    let stories = mockStories;
    if (visibility) {
      stories = stories.filter(s => s.visibility === visibility);
    }
    if (isRecommended === 'true' || isRecommended === true) {
      stories = stories.filter(s => s.isRecommended);
    }

    return {
      code: 0,
      data: {
        stories: stories.slice(start, start + limit).map(s => ({
          id: s.id,
          emotionTag: s.emotionTag || s.emotion,
          content: s.content,
          visibility: s.visibility || 'public',
          createdAt: s.createdAt,
          likeCount: s.likeCount ?? s.likes ?? 0,
          commentCount: s.commentCount ?? s.comments ?? 0,
          favoriteCount: s.favoriteCount ?? s.favorites ?? 0,
          viewCount: s.viewCount ?? s.views ?? 0,
          isRecommended: s.isRecommended || false,
          locationName: s.locationName,
          location: s.location,
          author: s.author || mockUser
        })),
        pagination: {
          total: stories.length,
          page,
          limit,
          totalPages: Math.ceil(stories.length / limit)
        }
      }
    };
  },

  async searchUsersByUsername(keyword, { page = 1, limit = 20 } = {}) {
    await delay();
    const results = mockUsers.filter(u =>
      u.status !== 'deleted' &&
      u.username.toLowerCase().includes(keyword.trim().toLowerCase())
    );
    const start = (page - 1) * limit;
    return {
      code: 0,
      data: {
        users: results.slice(start, start + limit),
        pagination: {
          total: results.length,
          page,
          limit,
          totalPages: Math.ceil(results.length / limit)
        }
      }
    };
  }
};

/**
 * Mock Map API
 */
export const mockMapApi = {
  async exploreStories(
    lat,
    lng,
    radius = 1000,
    { limit, emotionTag, createdAfter, createdBefore } = {},
  ) {
    await delay();
    let visibleStories = [...mockStories];

    if (emotionTag) {
      visibleStories = visibleStories.filter(
        (story) => story.emotionTag === emotionTag || story.emotion === emotionTag,
      );
    }

    if (createdAfter) {
      const createdAfterTime = new Date(createdAfter).getTime();
      if (Number.isFinite(createdAfterTime)) {
        visibleStories = visibleStories.filter(
          (story) => new Date(story.createdAt).getTime() >= createdAfterTime,
        );
      }
    }

    if (createdBefore) {
      const createdBeforeTime = new Date(createdBefore).getTime();
      if (Number.isFinite(createdBeforeTime)) {
        visibleStories = visibleStories.filter(
          (story) => new Date(story.createdAt).getTime() <= createdBeforeTime,
        );
      }
    }

    const normalizedLimit = Number(limit);
    if (Number.isFinite(normalizedLimit) && normalizedLimit > 0) {
      visibleStories = visibleStories.slice(0, normalizedLimit);
    }

    return {
      code: 0,
      data: {
        stories: visibleStories.map(s => ({
          id: s.id,
          content: s.content,
          images: s.images || [],
          location: s.location,
          locationName: s.locationName,
          emotionTag: s.emotionTag || s.emotion,
          username: s.author?.username || s.username || '',
          avatar: s.author?.avatar || s.avatar || '',
          author: s.author || {
            id: s.userId,
            username: s.username || '匿名用户',
            avatar: s.avatar || ''
          },
          distance: Math.floor(Math.random() * radius),
          createdAt: s.createdAt,
          isTimeCapsule: s.isTimeCapsule
        }))
      }
    };
  },

  async randomWalk(lat, lng, mood) {
    await delay();
    let filtered = mockStories;
    if (mood) {
      filtered = filtered.filter(s => s.emotionTag === mood || s.emotion === mood);
    }
    if (filtered.length === 0) filtered = mockStories;
    const randomStory = filtered[Math.floor(Math.random() * filtered.length)];
    return {
      code: 0,
      data: {
        location: randomStory?.location || { latitude: lat ?? 39.9, longitude: lng ?? 116.4 },
        story: randomStory
      }
    };
  },

  async getRecommendationFeed({ lat, lng, mood, page = 1, limit = 20 } = {}) {
    await delay();
    let filtered = mockStories;
    if (mood) {
      filtered = filtered.filter(s => s.emotionTag === mood || s.emotion === mood);
    }
    const offset = (page - 1) * limit;
    const pageStories = filtered.slice(offset, offset + limit);
    return {
      code: 0,
      data: {
        stories: pageStories,
        pagination: {
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit)
        }
      }
    };
  },

  async getLocationWall(lat, lng, radius = 50) {
    await delay();
    const nearbyStories = mockStories.filter(story => {
      const dist = Math.sqrt(
        Math.pow(story.location.lat - lat, 2) +
        Math.pow(story.location.lng - lng, 2)
      );
      return dist < 0.01;
    });
    return {
      code: 0,
      data: {
        stories: nearbyStories
      }
    };
  },

  async getClusterData(
    northEast,
    southWest,
    zoom,
    { emotionTag, createdAfter, createdBefore } = {},
  ) {
    await delay();

    let visibleStories = [...mockStories];

    if (emotionTag) {
      visibleStories = visibleStories.filter(
        (story) => story.emotionTag === emotionTag || story.emotion === emotionTag,
      );
    }

    if (createdAfter) {
      const createdAfterTime = new Date(createdAfter).getTime();
      if (Number.isFinite(createdAfterTime)) {
        visibleStories = visibleStories.filter(
          (story) => new Date(story.createdAt).getTime() >= createdAfterTime,
        );
      }
    }

    if (createdBefore) {
      const createdBeforeTime = new Date(createdBefore).getTime();
      if (Number.isFinite(createdBeforeTime)) {
        visibleStories = visibleStories.filter(
          (story) => new Date(story.createdAt).getTime() <= createdBeforeTime,
        );
      }
    }

    // 根据 zoom 级别模拟不同的聚合效果
    const z = zoom ?? 10;

    // zoom >= 15 时返回空数组，让前端显示原始标记点
    if (z >= 15) {
      return { code: 0, data: [] };
    }

    // 模拟聚合数量随 zoom 减小而增大
    const baseCount = Math.max(3, Math.floor(20 - z));

    return {
      code: 0,
      data: visibleStories.length === 0
        ? []
        : [
            {
              type: 'cluster',
              latitude: 39.9042,
              longitude: 116.4074,
              count: Math.min(baseCount, visibleStories.length),
              pointIds: visibleStories
                .slice(0, Math.min(baseCount, visibleStories.length))
                .map((story) => String(story.id))
            },
            ...(visibleStories.length >= 2
              ? [{
                  type: 'cluster',
                  latitude: 39.9142,
                  longitude: 116.4174,
                  count: Math.min(2, visibleStories.length),
                  pointIds: visibleStories
                    .slice(Math.max(0, visibleStories.length - 2))
                    .map((story) => String(story.id))
                }]
              : [])
          ]
    };
  },

  async getAnnouncements() {
    await delay();
    return {
      code: 0,
      data: {
        announcements: [
          {
            id: '1',
            type: 'info',
            title: '欢迎使用 EchoStar',
            content: '欢迎来到心灵栖息之所，在这里分享你的故事吧。',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '2',
            type: 'feature',
            title: '新功能上线：情感标签',
            content: '发布故事时可以选择情感标签，让更多人找到你的心声。',
            createdAt: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: '3',
            type: 'warning',
            title: '社区公约提醒',
            content: '请友善互动，尊重每一位创作者的感受。',
            createdAt: new Date(Date.now() - 604800000).toISOString()
          }
        ]
      }
    };
  },

  async createAnnouncement(data) {
    await delay();
    return {
      code: 0,
      message: '公告发布成功',
      data: {
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString()
      }
    };
  },

  async searchUsersByUsername(keyword, { page = 1, limit = 20 } = {}) {
    await delay();
    const results = mockUsers.filter(u =>
      u.status !== 'deleted' &&
      u.username.toLowerCase().includes(keyword.trim().toLowerCase())
    );
    const start = (page - 1) * limit;
    return {
      code: 0,
      data: {
        users: results.slice(start, start + limit),
        pagination: {
          total: results.length,
          page,
          limit,
          totalPages: Math.ceil(results.length / limit)
        }
      }
    };
  }
};

/**
 * Mock Comment API
 */
export const mockCommentApi = {
  async create(storyId, content) {
    await delay();
    const newComment = {
      id: Date.now().toString(),
      storyId,
      content,
      user: {
        id: mockUser.id,
        username: mockUser.username,
        avatar: mockUser.avatar
      },
      createdAt: new Date().toISOString()
    };
    mockComments.unshift(newComment);
    return {
      code: 0,
      data: newComment
    };
  },

  async search(keyword, params = {}) {
    await delay();
    const results = mockComments.filter(c => c.content?.includes(keyword));
    return {
      code: 0,
      data: {
        comments: results,
        pagination: { total: results.length, page: 1, limit: 10, totalPages: 1 }
      }
    };
  },

  async getMyComments(params = {}) {
    await delay();
    const myComments = mockComments.filter(c => c.user?.id === mockUser.id);
    return {
      code: 0,
      data: {
        comments: myComments,
        pagination: { total: myComments.length, page: 1, limit: 10, totalPages: 1 }
      }
    };
  },

  async getStoryComments(storyId, params = {}) {
    await delay();
    const comments = mockComments.filter(c => c.storyId === storyId);
    return {
      code: 0,
      data: {
        comments,
        pagination: { total: comments.length, page: 1, limit: 10, totalPages: 1 }
      }
    };
  },

  async getCount(storyId) {
    await delay();
    const count = mockComments.filter(c => c.storyId === storyId).length;
    return {
      code: 0,
      data: { storyId, commentCount: count }
    };
  },

  async delete(id) {
    await delay();
    const index = mockComments.findIndex(c => c.id === id);
    if (index > -1) {
      mockComments.splice(index, 1);
    }
    return { code: 0, message: '删除成功' };
  }
};

/**
 * Mock Like API
 */
export const mockLikeApi = {
  likedStories: new Set(),

  async toggle(storyId) {
    await delay();
    const isLiked = mockLikeApi.likedStories.has(storyId);
    if (isLiked) {
      mockLikeApi.likedStories.delete(storyId);
    } else {
      mockLikeApi.likedStories.add(storyId);
    }
    return {
      code: 0,
      data: {
        isLiked: !isLiked,
        message: isLiked ? '取消点赞成功' : '点赞成功'
      }
    };
  },

  async create(storyId) {
    await delay();
    mockLikeApi.likedStories.add(storyId);
    return {
      code: 0,
      data: {
        id: Date.now().toString(),
        storyId,
        createdAt: new Date().toISOString()
      }
    };
  },

  async remove(storyId) {
    await delay();
    mockLikeApi.likedStories.delete(storyId);
    return { code: 0, message: '取消点赞成功' };
  },

  async getStoryLikes(storyId, params = {}) {
    await delay();
    return {
      code: 0,
      data: {
        likes: [{ id: '1', createdAt: new Date().toISOString(), user: mockUser }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      }
    };
  },

  async check(storyId) {
    await delay();
    return {
      code: 0,
      data: { storyId, isLiked: mockLikeApi.likedStories.has(storyId) }
    };
  },

  async getCount(storyId) {
    await delay();
    return {
      code: 0,
      data: { storyId, likeCount: mockLikeApi.likedStories.has(storyId) ? 1 : 0 }
    };
  },

  async getMyLikes(params = {}) {
    await delay();
    return {
      code: 0,
      data: {
        likes: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      }
    };
  },

  async checkMultiple(storyIds) {
    await delay();
    return {
      code: 0,
      data: storyIds.map(id => ({
        storyId: id,
        isLiked: mockLikeApi.likedStories.has(id)
      }))
    };
  }
};

/**
 * Mock Favorite API
 */
export const mockFavoriteApi = {
  favoritedStories: new Set(),

  async toggle(storyId) {
    await delay();
    const isFavorited = mockFavoriteApi.favoritedStories.has(storyId);
    if (isFavorited) {
      mockFavoriteApi.favoritedStories.delete(storyId);
    } else {
      mockFavoriteApi.favoritedStories.add(storyId);
    }
    return {
      code: 0,
      data: {
        isFavorited: !isFavorited,
        message: isFavorited ? '取消收藏成功' : '收藏成功'
      }
    };
  },

  async create(storyId) {
    await delay();
    mockFavoriteApi.favoritedStories.add(storyId);
    return {
      code: 0,
      data: {
        id: Date.now().toString(),
        storyId,
        createdAt: new Date().toISOString()
      }
    };
  },

  async remove(storyId) {
    await delay();
    mockFavoriteApi.favoritedStories.delete(storyId);
    return { code: 0, message: '取消收藏成功' };
  },

  async getStoryFavorites(storyId, params = {}) {
    await delay();
    return {
      code: 0,
      data: {
        favorites: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      }
    };
  },

  async check(storyId) {
    await delay();
    return {
      code: 0,
      data: { storyId, isFavorited: mockFavoriteApi.favoritedStories.has(storyId) }
    };
  },

  async getCount(storyId) {
    await delay();
    return {
      code: 0,
      data: { storyId, favoriteCount: mockFavoriteApi.favoritedStories.has(storyId) ? 1 : 0 }
    };
  },

  async getMyFavorites(params = {}) {
    await delay();
    return {
      code: 0,
      data: {
        favorites: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      }
    };
  },

  async checkMultiple(storyIds) {
    await delay();
    return {
      code: 0,
      data: storyIds.map(id => ({
        storyId: id,
        isFavorited: mockFavoriteApi.favoritedStories.has(id)
      }))
    };
  }
};

/**
 * Mock Notification API
 */
export const mockNotificationApi = {
  async getMyNotifications(params = {}) {
    await delay();
    return {
      code: 0,
      data: {
        notifications: mockNotifications,
        pagination: { total: mockNotifications.length, page: 1, limit: 10, totalPages: 1 }
      }
    };
  },

  async getUnreadCount() {
    await delay();
    const count = mockNotifications.filter(n => !n.isRead).length;
    return {
      code: 0,
      data: { userId: mockUser.id, unreadCount: count }
    };
  },

  async markAllRead() {
    await delay();
    mockNotifications.forEach(n => n.isRead = true);
    return {
      code: 0,
      data: { success: true, message: `已标记 ${mockNotifications.length} 条通知为已读` }
    };
  },

  async clearAll() {
    await delay();
    const count = mockNotifications.length;
    mockNotifications.length = 0;
    return {
      code: 0,
      data: { success: true, message: `已清空 ${count} 条通知` }
    };
  },

  async markRead(id) {
    await delay();
    const notification = mockNotifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
    }
    return { code: 0, message: '标记已读成功' };
  }
};

/**
 * Mock Report API
 */
export const mockReportApi = {
  async create(targetType, targetId, reason) {
    await delay();
    return {
      code: 0,
      message: '举报提交成功',
      data: {
        id: Date.now().toString(),
        targetType,
        targetId,
        status: 'pending'
      }
    };
  },

  async getMyReports(params = {}) {
    await delay();
    return {
      code: 0,
      data: {
        reports: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    };
  },

  async getReports(params = {}) {
    await delay();
    return {
      code: 0,
      data: {
        reports: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    };
  },

  async getStoryReports(params = {}) {
    await delay();
    const status = params.status || 'pending';
    return {
      code: 0,
      data: {
        reports: status === 'pending' ? [
          {
            id: '101',
            targetType: 'story',
            targetId: 456,
            target: { type: 'story', id: 456, content: '这是一条需要审核的故事内容...', images: [], visibility: 'public', userId: 1 },
            reason: '内容违规',
            status: 'pending',
            createdAt: '2026-03-22T10:00:00Z',
            handledAt: null,
            reporter: { id: 2, username: '举报者', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=R1' },
            handler: null
          }
        ] : [],
        pagination: { total: status === 'pending' ? 1 : 0, page: 1, limit: 20, totalPages: 1 }
      }
    };
  },

  async getCommentReports(params = {}) {
    await delay();
    const status = params.status || 'pending';
    return {
      code: 0,
      data: {
        reports: status === 'pending' ? [
          {
            id: '102',
            targetType: 'comment',
            targetId: 789,
            target: { type: 'comment', id: 789, content: '不当评论内容...', status: 'normal', userId: 3, username: '评论者' },
            reason: '恶意攻击',
            status: 'pending',
            createdAt: '2026-03-22T11:00:00Z',
            handledAt: null,
            reporter: { id: 4, username: '举报者2', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=R2' },
            handler: null
          }
        ] : [],
        pagination: { total: status === 'pending' ? 1 : 0, page: 1, limit: 20, totalPages: 1 }
      }
    };
  },

  async handle(reportId, action) {
    await delay();
    return {
      code: 0,
      message: action === 'approve' ? '举报已批准，内容已处理' : '举报已拒绝'
    };
  },

  async getStatistics() {
    await delay();
    return {
      code: 0,
      data: { pending: 2, storyReports: 1, commentReports: 1 }
    };
  }
};

/**
 * Mock Admin API
 */
export const mockAdminApi = {
  async recommend(storyId, reason) {
    await delay();
    return { code: 0, message: '设置成功', data: { id: storyId, isRecommended: true } };
  },

  async unrecommend(storyId, reason) {
    await delay();
    return { code: 0, message: '取消推荐成功', data: { id: storyId, isRecommended: false } };
  },

  async shadowban(storyId, reason) {
    await delay();
    return { code: 0, message: 'Shadowban 成功' };
  },

  async restore(storyId) {
    await delay();
    return { code: 0, message: '恢复成功' };
  },

  async banUser(userId, reason) {
    await delay();
    return { code: 0, message: '封禁成功' };
  },

  async unbanUser(userId) {
    await delay();
    return { code: 0, message: '解封成功' };
  },

  async getStatistics() {
    await delay();
    return {
      code: 0,
      data: {
        totalUsers: 100,
        totalStories: 500,
        publicStories: 450,
        timeCapsules: 30,
        shadowbannedStories: 20,
        todayStories: 10
      }
    };
  },

  async getUsers(params = {}) {
    await delay();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const category = params.category || 'normal';

    const mockUsers = [
      { id: 1, username: '用户A', email: 'userA@test.com', role: 'user', status: 'normal', bio: '测试用户', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=A', createdAt: '2026-03-01T10:00:00Z' },
      { id: 2, username: '用户B', email: 'userB@test.com', role: 'user', status: 'recommended', bio: '优质用户', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=B', createdAt: '2026-03-05T10:00:00Z' },
      { id: 3, username: '用户C', email: 'userC@test.com', role: 'user', status: 'deleted', bio: '已封禁', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=C', createdAt: '2026-03-10T10:00:00Z' }
    ];

    const filteredUsers = category === 'deleted'
      ? mockUsers.filter(u => u.status === 'deleted')
      : mockUsers.filter(u => u.status !== 'deleted');

    const start = (page - 1) * pageSize;

    return {
      code: 0,
      data: {
        users: filteredUsers.slice(start, start + pageSize),
        pagination: {
          total: filteredUsers.length,
          page,
          pageSize,
          totalPages: Math.ceil(filteredUsers.length / pageSize)
        }
      }
    };
  },

  async searchUsersByUsername(keyword, { page = 1, limit = 20 } = {}) {
    await delay();
    const results = mockUsers.filter(u =>
      u.status !== 'deleted' &&
      u.username.toLowerCase().includes(keyword.trim().toLowerCase())
    );
    const start = (page - 1) * limit;
    return {
      code: 0,
      data: {
        users: results.slice(start, start + limit),
        pagination: {
          total: results.length,
          page,
          limit,
          totalPages: Math.ceil(results.length / limit)
        }
      }
    };
  }
};

/**
 * 导出代理 API
 */
export const authApiProxy = USE_MOCK ? mockAuthApi : null;
export const storyApiProxy = USE_MOCK ? mockStoryApi : null;
export const mapApiProxy = USE_MOCK ? mockMapApi : null;
export const commentApiProxy = USE_MOCK ? mockCommentApi : null;
export const likeApiProxy = USE_MOCK ? mockLikeApi : null;
export const favoriteApiProxy = USE_MOCK ? mockFavoriteApi : null;
export const notificationApiProxy = USE_MOCK ? mockNotificationApi : null;
export const reportApiProxy = USE_MOCK ? mockReportApi : null;
export const adminApiProxy = USE_MOCK ? mockAdminApi : null;
