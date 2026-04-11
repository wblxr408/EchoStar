/**
 * Stores 类型声明
 */

// user.js
export function useUserStore() {
  return {
    user: null,
    token: null,
    isLoggedIn: false,
    isGuest: false,
    isAdmin: false,
    username: '游客用户',
    avatar: '',
    login: async () => {},
    register: async () => {},
    logout: () => {},
    fetchUser: async () => {},
    loginAsGuest: () => {}
  };
}

// map.js
export function useMapStore() {
  return {
    theme: 'light',
    mapLoaded: false,
    mapCenter: [39.9042, 116.4074] as [number, number],
    mapZoom: 13,
    themeConfig: {
      primary: '#ffffff',
      secondary: '#f0f0f0',
      accent: '#667eea',
      background: '#ffffff'
    },
    setTheme: () => {},
    toggleTheme: () => {},
    setMapCenter: () => {},
    setMapZoom: () => {},
    setMapLoaded: () => {}
  };
}

// story.js
export function useStoryStore() {
  return {
    myStories: [],
    isLoading: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1
    },
    currentStory: null,
    hasStories: false,
    currentPageStories: [],
    setMyStories: () => {},
    addStory: () => {},
    updateStory: () => {},
    removeStory: () => {},
    setLoading: () => {},
    setPagination: () => {},
    changePage: () => {},
    setCurrentStory: () => {}
  };
}