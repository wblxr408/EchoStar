import { ref, watch, onUnmounted, type Ref, type ComputedRef } from 'vue';

/**
 * 防抖 Hook
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300,
  immediate: boolean = false
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;

  return function debounced(this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    lastArgs = args;

    const shouldCallNow = immediate && !timeoutId;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        fn.apply(this, args);
      }
    }, delay - (now - lastCallTime));

    lastCallTime = now;

    if (shouldCallNow) {
      fn.apply(this, args);
    }
  } as T;
}

/**
 * 响应式防抖值
 * @param value 源值
 * @param delay 延迟时间
 */
export function useDebouncedValue<T>(value: Ref<T> | ComputedRef<T>, delay: number = 300): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  watch(
    value,
    (newValue) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        debouncedValue.value = newValue;
      }, delay);
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });

  return debouncedValue;
}

/**
 * 取消防抖
 */
export function cancelDebounce(debouncedFn: (...args: unknown[]) => void): void {
  // 注意：这需要闭包访问 timeoutId
  // 在实际使用中，建议将 debounce 逻辑封装在类或对象中
}
