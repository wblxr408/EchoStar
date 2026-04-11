import { ref } from 'vue';

/**
 * Toast 类型
 */
type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast 消息选项
 */
interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  closable?: boolean;
}

/**
 * Toast 钩子
 */
export function useToast() {
  const toasts = ref<Array<{
    id: string;
    message: string;
    type: ToastType;
    duration: number;
    closable: boolean;
  }>>([]);

  /**
   * 显示 Toast 消息
   */
  const showToast = (options: ToastOptions | string) => {
    const message = typeof options === 'string' ? options : options.message;
    const type = typeof options === 'string' ? 'info' : options.type || 'info';
    const duration = typeof options === 'string' ? 3000 : options.duration || 3000;
    const closable = typeof options === 'string' ? true : options.closable || true;

    const id = Date.now().toString();
    
    toasts.value.push({
      id,
      message,
      type,
      duration,
      closable
    });

    // 自动关闭
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  /**
   * 移除 Toast 消息
   */
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  /**
   * 清除所有 Toast
   */
  const clearAllToasts = () => {
    toasts.value = [];
  };

  // 便捷方法
  const success = (message: string, duration?: number) => {
    showToast({ message, type: 'success', duration });
  };

  const error = (message: string, duration?: number) => {
    showToast({ message, type: 'error', duration });
  };

  const warning = (message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration });
  };

  const info = (message: string, duration?: number) => {
    showToast({ message, type: 'info', duration });
  };

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
}

// 兼容旧的 API - 模块级单例
let _toastInstance: ReturnType<typeof useToast> | null = null;

function getToastInstance() {
  if (!_toastInstance) {
    _toastInstance = useToast();
  }
  return _toastInstance;
}

/** 显示 Toast（便捷调用） */
export const showToast = (options: ToastOptions | string) => {
  return getToastInstance().showToast(options);
};

/** 显示确认对话框 */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    resolve(window.confirm(message));
  });
}

/** 显示输入提示对话框 */
export function showPrompt(message: string): Promise<string | null> {
  return new Promise((resolve) => {
    const result = window.prompt(message);
    resolve(result);
  });
}

export const toast = {
  success: (message: string) => useToast().success(message),
  error: (message: string) => useToast().error(message),
  warning: (message: string) => useToast().warning(message),
  info: (message: string) => useToast().info(message)
};