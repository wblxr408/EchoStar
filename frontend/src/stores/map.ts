import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

/**
 * 地图和主题状态管理
 */
export const useMapStore = defineStore('map', () => {
  // 主题状态
  const theme = ref<'light' | 'dark'>('light');
  
  // 地图配置
  const mapLoaded = ref(false);
  const mapCenter = ref<[number, number]>([39.9042, 116.4074]); // 北京
  const mapZoom = ref(13);

  // 主题配置
  const themeConfig = computed<ThemeConfig>(() => ({
    primary: theme.value === 'dark' ? '#1a1a2e' : '#ffffff',
    secondary: theme.value === 'dark' ? '#16213e' : '#f0f0f0',
    accent: theme.value === 'dark' ? '#e8b86d' : '#667eea',
    background: theme.value === 'dark' ? '#02040b' : '#ffffff'
  }));

  /**
   * 设置主题
   */
  function setTheme(newTheme: 'light' | 'dark'): void {
    theme.value = newTheme;
    localStorage.setItem('theme', newTheme);
  }

  /**
   * 切换主题
   */
  function toggleTheme(): void {
    setTheme(theme.value === 'light' ? 'dark' : 'light');
  }

  /**
   * 设置地图中心
   */
  function setMapCenter(center: [number, number]): void {
    mapCenter.value = center;
  }

  /**
   * 设置地图缩放
   */
  function setMapZoom(zoom: number): void {
    mapZoom.value = zoom;
  }

  /**
   * 标记地图已加载
   */
  function setMapLoaded(loaded: boolean): void {
    mapLoaded.value = loaded;
  }

  return {
    // 状态
    theme,
    mapLoaded,
    mapCenter,
    mapZoom,
    // 计算属性
    themeConfig,
    // 方法
    setTheme,
    toggleTheme,
    setMapCenter,
    setMapZoom,
    setMapLoaded
  };
});