import { ref, watch, onUnmounted, type Ref, type ComputedRef } from 'vue';

/**
 * 节流 Hook
 * @param fn 要节流的函数
 * @param limit 时间限制（毫秒）
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number = 300
): T {
  let inThrottle = false;
  let lastResult: unknown;
  let lastArgs: Parameters<T> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(this: unknown, ...args: Parameters<T>) {
    lastArgs = args;

    if (!inThrottle) {
      inThrottle = true;
      lastResult = fn.apply(this, args);

      timeoutId = setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn.apply(this, lastArgs);
        }
      }, limit);
    }

    return lastResult as ReturnType<T>;
  } as T;
}

/**
 * 响应式节流值
 * @param value 源值
 * @param limit 时间限制
 */
export function useThrottledValue<T>(value: Ref<T> | ComputedRef<T>, limit: number = 300): Ref<T> {
  const throttledValue = ref(value.value) as Ref<T>;
  let lastRun = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  watch(
    value,
    (newValue) => {
      const now = Date.now();
      const remaining = limit - (now - lastRun);

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      if (remaining <= 0) {
        lastRun = now;
        throttledValue.value = newValue;
      } else {
        timeoutId = setTimeout(() => {
          lastRun = Date.now();
          throttledValue.value = newValue;
        }, remaining);
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });

  return throttledValue;
}