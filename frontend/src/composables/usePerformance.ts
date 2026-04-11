import { ref, onMounted, onUnmounted, type Ref } from 'vue';

/**
 * 性能监控 Composable
 * 用于监控和优化页面性能
 */
export function usePerformance() {
  const fps = ref(0);
  const isLowPerformance = ref(false);
  const memoryUsage = ref(0);
  const isVisible = ref(true);
  let frameCount = 0;
  let lastTime = performance.now();
  let rafId: number | null = null;
  let visibilityObserver: IntersectionObserver | null = null;

  /**
   * 计算 FPS
   */
  function calculateFPS(): void {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime >= lastTime + 1000) {
      fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime));
      frameCount = 0;
      lastTime = currentTime;

      // 检测低性能设备
      isLowPerformance.value = fps.value < 30;
    }

    rafId = requestAnimationFrame(calculateFPS);
  }

  /**
   * 获取内存使用情况（Chrome 支持）
   */
  function updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        memoryUsage.value = Math.round(memory.usedJSHeapSize / 1048576); // MB
      }
    }
  }

  /**
   * 开始性能监控
   */
  function startMonitoring(): void {
    rafId = requestAnimationFrame(calculateFPS);
    updateMemoryUsage();
  }

  /**
   * 停止性能监控
   */
  function stopMonitoring(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  /**
   * 监听元素可见性
   */
  function observeVisibility(element: Ref<HTMLElement | null>): void {
    if (!element.value) return;

    if (typeof IntersectionObserver !== 'undefined') {
      visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          isVisible.value = entry.isIntersecting;
          if (!entry.isIntersecting) {
            stopMonitoring();
          } else {
            startMonitoring();
          }
        },
        { threshold: 0.1 }
      );

      visibilityObserver.observe(element.value);
    }
  }

  /**
   * 根据性能调整配置
   */
  function getPerformanceConfig<T>(lowPerfConfig: T, normalConfig: T): T {
    return isLowPerformance.value ? lowPerfConfig : normalConfig;
  }

  /**
   * 节流函数（基于性能自适应）
   */
  function throttleByPerformance(
    fn: (...args: unknown[]) => void,
    delay: number
  ): (...args: unknown[]) => void {
    let lastCall = 0;

    return (...args: unknown[]) => {
      const now = performance.now();
      const adaptiveDelay = isLowPerformance.value ? delay * 2 : delay;

      if (now - lastCall >= adaptiveDelay) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  /**
   * 防抖函数（基于性能自适应）
   */
  function debounceByPerformance(
    fn: (...args: unknown[]) => void,
    delay: number
  ): (...args: unknown[]) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: unknown[]) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      const adaptiveDelay = isLowPerformance.value ? delay * 2 : delay;
      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, adaptiveDelay);
    };
  }

  onMounted(() => {
    startMonitoring();
  });

  onUnmounted(() => {
    stopMonitoring();
    if (visibilityObserver) {
      visibilityObserver.disconnect();
    }
  });

  return {
    fps,
    isLowPerformance,
    memoryUsage,
    isVisible,
    startMonitoring,
    stopMonitoring,
    observeVisibility,
    getPerformanceConfig,
    throttleByPerformance,
    debounceByPerformance
  };
}
