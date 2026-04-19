/**
 * 工具函数类型声明
 */

// time.js
export function formatRelativeTime(time: string | Date): string;
export function formatDateTime(time: string | Date, format?: string): string;
export function formatShortTime(time: string | Date): string;
export function isTimeCapsuleUnlocked(unlockAt: string | Date): boolean;
export function getTimeCapsuleCountdown(unlockAt: string | Date): string;

// emotion.js
export interface EmotionInfo {
  value: string;
  icon: string;
  label: string;
  color: string;
}

export const EMOTIONS: EmotionInfo[];
export const EMOTION_TAGS: EmotionInfo[];
export const EMOTION_CONFIG: Record<string, { label: string; color: string; emoji: string }>;

export function getEmotionEmoji(emotion?: string): string;
export function getEmotionLabel(emotion?: string): string;
export function getEmotionColor(emotion?: string): string;
export function getEmotionInfo(emotion?: string): EmotionInfo | null;
export function toEmotionTag(emotion: string): string;
export function fromEmotionTag(tag: string): string;

// geo.js
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export function getCurrentPosition(): Promise<GeoLocation>;
export function getAddressFromCoords(latitude: number, longitude: number): Promise<string>;
export function getCoordsFromAddress(address: string): Promise<GeoLocation>;

// image.js
export function compressImage(file: File, options?: {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}): Promise<Blob>;

export function fileToDataURL(file: File): Promise<string>;

export function downloadImage(url: string, filename?: string): Promise<void>;

// upload.js
export interface UploadOptions {
  file: File;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  url: string;
  name: string;
  size: number;
}

export function uploadImage(options: UploadOptions): Promise<UploadResult>;
export function uploadImages(files: File[], onProgress?: (progress: number) => UploadResult[]): Promise<UploadResult[]>;

// poiSearch.js
export interface POI {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;
}

export function searchPOI(keyword: string, location?: { lat: number; lng: number }): Promise<POI[]>;

// announcement.js
export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  priority?: 'low' | 'medium' | 'high';
}

export function getAnnouncements(): Promise<Announcement[]>;

// report.js
export interface ReportOptions {
  type: 'spam' | 'inappropriate' | 'harassment' | 'other';
  reason: string;
  targetId: string;
  targetType: 'story' | 'comment' | 'user';
}

export function submitReport(options: ReportOptions): Promise<void>;