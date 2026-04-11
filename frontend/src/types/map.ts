/**
 * 地图相关类型定义
 */

export interface Location {
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  address?: string;
}

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

export interface Author {
  id?: string | number;
  username?: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface Cluster {
  id?: string | number;
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  count: number;
  pointIds?: (string | number)[];
  type?: 'cluster' | 'point';
}

export interface MapState {
  center: Location;
  zoom: number;
  userLocation: Location | null;
  stories: Story[];
  selectedStory: Story | null;
  clusters: Cluster[];
  theme: 'light' | 'dark';
  isLoading: boolean;
}

export interface MapMoveEvent {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface MapClickEvent {
  latitude: number;
  longitude: number;
  lat: number;
  lng: number;
  screenX: number;
  screenY: number;
}

export interface MarkerClickEvent {
  story: Story;
  screenX: number;
  screenY: number;
}
