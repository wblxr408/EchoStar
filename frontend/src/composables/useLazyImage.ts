import { ref, onMounted, onUnmounted, shallowRef } from 'vue';

/**
 * 图片懒加载 Composable
 * 使用 IntersectionObserver 实现高性能图片懒加载
 */
export function useLazyImage(src: string, options?: IntersectionObserverInit) {
  const imageRef = shallowRef<HTMLImageElement | null>(null);
  const isLoaded = ref(false);
  const isError = ref(false);
  const currentSrc = ref('');
  let observer: IntersectionObserver | null = null;

  /**
   * 加载图片
   */
  function loadImage(): void {
    const img = new Image();

    img.onload = () => {
      currentSrc.value = src;
      isLoaded.value = true;
    };

    img.onerror = () => {
      isError.value = true;
      currentSrc.value = src; // 仍然设置 src，让浏览器显示默认图标
    };

    // 优先使用 WebP 格式（如果支持）
    if (supportsWebP() && src.match(/\.(jpg|jpeg|png)$/i)) {
      img.src = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    } else {
      img.src = src;
    }
  }

  /**
   * 检测 WebP 支持
   */
  function supportsWebP(): boolean {
    if (typeof window === 'undefined') return false;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * 设置 Intersection Observer
   */
  function setupObserver(): void {
    if (!('IntersectionObserver' in window)) {
      // 浏览器不支持，直接加载
      loadImage();
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            if (observer && imageRef.value) {
              observer.unobserve(imageRef.value);
            }
          }
        });
      },
      {
        rootMargin: '50px', // 提前 50px 开始加载
        threshold: 0.01,
        ...options
      }
    );

    if (imageRef.value) {
      observer.observe(imageRef.value);
    }
  }

  /**
   * 重新加载图片
   */
  function reload(): void {
    isLoaded.value = false;
    isError.value = false;
    loadImage();
  }

  onMounted(() => {
    if (imageRef.value) {
      setupObserver();
    }
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  return {
    imageRef,
    isLoaded,
    isError,
    currentSrc,
    reload
  };
}

/**
 * 响应式图片 Composable
 * 根据设备像素比加载不同尺寸的图片
 */
export function useResponsiveImage(src: string, sizes: Record<number, string>) {
  const bestSrc = ref('');

  function getBestSrc(): void {
    const dpr = window.devicePixelRatio || 1;
    const sortedSizes = Object.entries(sizes)
      .map(([k, v]) => [parseInt(k, 10), v] as [number, string])
      .sort((a, b) => a[0] - b[0]);

    let selectedSrc = sizes[1]; // 默认 1x

    for (const [size, url] of sortedSizes) {
      if (dpr >= size) {
        selectedSrc = url;
      }
    }

    bestSrc.value = selectedSrc;
  }

  onMounted(() => {
    getBestSrc();
  });

  return {
    bestSrc
  };
}

/**
 * 图片预加载 Composable
 * 预加载关键图片资源
 */
export function useImagePreloader() {
  const preloadQueue = ref<Set<string>>(new Set());
  const loadedImages = ref<Set<string>>(new Set());

  /**
   * 预加载单张图片
   */
  function preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (loadedImages.value.has(src)) {
        resolve();
        return;
      }

      if (preloadQueue.value.has(src)) {
        // 等待正在加载的图片
        const checkInterval = setInterval(() => {
          if (loadedImages.value.has(src)) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
        return;
      }

      preloadQueue.value.add(src);

      const img = new Image();
      img.onload = () => {
        loadedImages.value.add(src);
        preloadQueue.value.delete(src);
        resolve();
      };
      img.onerror = () => {
        preloadQueue.value.delete(src);
        reject(new Error(`Failed to preload image: ${src}`));
      };
      img.src = src;
    });
  }

  /**
   * 批量预加载图片
   */
  async function preloadImages(srcs: string[]): Promise<void> {
    const promises = srcs.map((src) => preloadImage(src).catch(() => {
      // 单个图片失败不影响其他图片
      console.warn(`Failed to preload: ${src}`);
    }));
    await Promise.all(promises);
  }

  /**
   * 取消预加载
   */
  function cancelPreload(src: string): void {
    preloadQueue.value.delete(src);
  }

  /**
   * 清空所有预加载
   */
  function clearAll(): void {
    preloadQueue.value.clear();
    loadedImages.value.clear();
  }

  return {
    preloadQueue,
    loadedImages,
    preloadImage,
    preloadImages,
    cancelPreload,
    clearAll
  };
}
