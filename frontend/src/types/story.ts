/**
 * 故事相关类型定义
 */

export interface Story {
  id: string | number;
  content: string;
  preview?: string;
  images?: string[];
  emotion?: string;
  emotionTag?: string;
  location: Location;
  author?: Author | string;
  user?: Author;
  username?: string;
  avatar?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  isTimeCapsule?: boolean;
  unlockAt?: string;
  isUnlocked?: boolean;
  isPinned?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Author {
  id?: string | number;
  username?: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StoryListResponse {
  stories: Story[];
  pagination: Pagination;
}

export interface CreateStoryData {
  content: string;
  emotionTag?: string;
  images?: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isTimeCapsule?: boolean;
  unlockAt?: string;
}

export interface StoryState {
  myStories: Story[];
  pagination: Pagination;
  loading: boolean;
}

export type EmotionType = 'happy' | 'sad' | 'neutral' | 'excited' | 'peaceful';

export const EMOTION_CONFIG: Record<EmotionType, { label: string; color: string; emoji: string }> = {
  happy: { label: '开心', color: '#ffd93d', emoji: '😊' },
  sad: { label: '难过', color: '#6bceff', emoji: '😢' },
  neutral: { label: '平静', color: '#c8d6e5', emoji: '😐' },
  excited: { label: '兴奋', color: '#ff6b9d', emoji: '🤩' },
  peaceful: { label: '祥和', color: '#a8e6cf', emoji: '😌' }
};
