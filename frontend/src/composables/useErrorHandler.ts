import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 错误处理 Composable
 * 提供统一的错误处理机制
 */
export interface ErrorInfo {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: number;
}

export function useErrorHandler() {
  const errors = ref<ErrorInfo[]>([]);
  const hasError = ref(false);
  const currentError = ref<ErrorInfo | null>(null);

  /**
   * 添加错误
   */
  function addError(message: string, details?: unknown, code?: string): void {
    const errorInfo: ErrorInfo = {
      message,
      code,
      details,
      timestamp: Date.now()
    };

    errors.value.push(errorInfo);
    currentError.value = errorInfo;
    hasError.value = true;

    // 控制台输出
    console.error('[Error]', message, details);

    // 生产环境上报错误
    if (import.meta.env.PROD) {
      reportError(errorInfo);
    }
  }

  /**
   * 清除当前错误
   */
  function clearCurrentError(): void {
    currentError.value = null;
    hasError.value = false;
  }

  /**
   * 清除所有错误
   */
  function clearAllErrors(): void {
    errors.value = [];
    currentError.value = null;
    hasError.value = false;
  }

  /**
   * 清除过期错误（超过5分钟）
   */
  function clearOldErrors(): void {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    errors.value = errors.value.filter(
      (error) => now - error.timestamp < fiveMinutes
    );
  }

  /**
   * 错误上报（占位函数）
   */
  function reportError(errorInfo: ErrorInfo): void {
    // TODO: 集成错误上报服务（如 Sentry）
    console.log('[Error Report]', errorInfo);
  }

  /**
   * 处理异步错误
   */
  async function handleAsyncError<T>(
    asyncFn: () => Promise<T>,
    errorMessage: string = '操作失败'
  ): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      addError(
        errorMessage,
        error instanceof Error ? error.message : error,
        error instanceof Error ? error.name : undefined
      );
      return null;
    }
  }

  /**
   * 全局错误监听
   */
  function setupGlobalErrorHandler(): void {
    // 未捕获的错误
    window.addEventListener('error', (event) => {
      addError(
        event.message || '发生未知错误',
        { filename: event.filename, lineno: event.lineno, colno: event.colno },
        'UNCAUGHT_ERROR'
      );
    });

    // 未捕获的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      addError(
        '未处理的 Promise 拒绝',
        event.reason,
        'UNHANDLED_REJECTION'
      );
    });

    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target && (event.target as HTMLElement).tagName) {
        addError(
          `资源加载失败: ${(event.target as HTMLElement).tagName}`,
          { src: (event.target as HTMLImageElement).src },
          'RESOURCE_ERROR'
        );
      }
    }, true);
  }

  /**
   * 移除全局错误监听
   */
  function removeGlobalErrorHandler(): void {
    // 注意：由于没有存储监听器的引用，这里无法精确移除
    // 实际应用中应该存储监听器引用
  }

  onMounted(() => {
    setupGlobalErrorHandler();
    // 每分钟清理一次过期错误
    const interval = setInterval(clearOldErrors, 60000);

    onUnmounted(() => {
      clearInterval(interval);
      removeGlobalErrorHandler();
    });
  });

  return {
    errors,
    hasError,
    currentError,
    addError,
    clearCurrentError,
    clearAllErrors,
    clearOldErrors,
    handleAsyncError
  };
}

/**
 * 用户友好的错误消息
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // 常见错误类型的友好提示
    const errorMessages: Record<string, string> = {
      'Network Error': '网络连接失败，请检查网络设置',
      'Unauthorized': '请先登录',
      'Forbidden': '没有权限执行此操作',
      'Not Found': '请求的资源不存在',
      'Request Timeout': '请求超时，请重试',
      'Internal Server Error': '服务器错误，请稍后重试'
    };

    return errorMessages[error.message] || error.message || '操作失败，请稍后重试';
  }

  return '发生未知错误，请稍后重试';
}
