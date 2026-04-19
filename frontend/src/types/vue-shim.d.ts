/**
 * Vue 类型声明
 * 确保所有 .vue 文件都被 TypeScript 正确识别
 */

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// 声明 .js 文件（如果需要导入）
declare module '*.js' {
  const value: any;
  export default value;
}

// 声明工具函数模块
declare module '../utils/time' {
  export function formatRelativeTime(time: string | Date): string;
  export function formatDateTime(time: string | Date, format?: string): string;
  export function formatShortTime(time: string | Date): string;
  export function isTimeCapsuleUnlocked(unlockAt: string | Date): boolean;
  export function getTimeCapsuleCountdown(unlockAt: string | Date): string;
}

declare module '../utils/emotion' {
  export interface EmotionInfo {
    value: string;
    icon: string;
    label: string;
    color: string;
  }

  export const EMOTIONS: EmotionInfo[];
  export const EMOTION_TAGS: EmotionInfo[];
  export function getEmotionEmoji(emotion?: string): string;
  export function getEmotionLabel(emotion?: string): string;
  export function getEmotionColor(emotion?: string): string;
  export function getEmotionInfo(emotion?: string): EmotionInfo | null;
  export function toEmotionTag(emotion: string): string;
  export function fromEmotionTag(tag: string): string;
}
