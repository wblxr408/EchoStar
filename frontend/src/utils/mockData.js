/**
 * Mock 数据 - 用于前端开发测试
 */

// 模拟用户数据
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: '测试用户',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  role: 'user',
  createdAt: new Date().toISOString()
};

// 模拟故事数据
export const mockStories = [
  {
    id: '1',
    userId: '1',
    username: '小明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    content: '今天天气真好！在公园里遇到了可爱的小猫 🐱',
    emotion: 'happy',
    images: [],
    location: {
      lat: 39.9042,
      lng: 116.4074,
      address: '北京市东城区天安门广场'
    },
    isTimeCapsule: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: '2',
    userId: '2',
    username: '小红',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    content: '工作终于结束了，累但充实 💪',
    emotion: 'neutral',
    images: [],
    location: {
      lat: 39.9142,
      lng: 116.4174,
      address: '北京市东城区王府井大街'
    },
    isTimeCapsule: false,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: '3',
    userId: '3',
    username: '阿伟',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom',
    content: '第一次来北京，被这里的氛围吸引了！',
    emotion: 'excited',
    images: [],
    location: {
      lat: 39.9242,
      lng: 116.4074,
      address: '北京市东城区南锣鼓巷'
    },
    isTimeCapsule: true,
    unlockAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '4',
    userId: '4',
    username: '小美',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    content: '心情不太好，但看到这个风景后治愈了 🌸',
    emotion: 'sad',
    images: [],
    location: {
      lat: 39.9342,
      lng: 116.4274,
      address: '北京市海淀区颐和园'
    },
    isTimeCapsule: false,
    createdAt: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: '5',
    userId: '5',
    username: '老张',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    content: '周末和家人一起出来散步，真惬意',
    emotion: 'peaceful',
    images: [],
    location: {
      lat: 39.9042,
      lng: 116.3974,
      address: '北京市西城区什刹海'
    },
    isTimeCapsule: false,
    createdAt: new Date(Date.now() - 14400000).toISOString()
  }
];

// 模拟地图上的故事点
export const mockMapMarkers = mockStories.map((story) => ({
  id: story.id,
  lat: story.location.lat,
  lng: story.location.lng,
  emotion: story.emotion,
  isTimeCapsule: story.isTimeCapsule,
  isUnlocked: !story.isTimeCapsule || new Date() >= new Date(story.unlockAt)
}));

// 模拟情绪统计
export const mockEmotionStats = {
  happy: 35,
  sad: 15,
  neutral: 25,
  excited: 15,
  peaceful: 10
};
