/**
 * Composables 统一导出
 * Vue 3 组合式函数集合
 */

// Toast 通知
export { 
  useToast, 
  showToast, 
  showConfirm, 
  showPrompt, 
  toast,
  clearAllToasts 
} from './useToast.ts';

// 主题管理
export { useTheme } from './useTheme.js';
export type { Theme } from './useTheme.js';

// 地理位置
export { useLocation } from './useLocation.js';
export type { Location, LocationOptions } from './useLocation.js';

// 类型导出
export type { ToastType, Toast, ConfirmDialog, PromptDialog } from './useToast.ts';
