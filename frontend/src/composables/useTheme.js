import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

/**
 * 主题类型
 */
type Theme = 'light' | 'dark';

/**
 * 主题存储键
 */
const THEME_KEY = 'theme';

/**
 * 全局主题状态
 */
const theme = ref<Theme>(getInitialTheme());

/**
 * 获取初始主题
 */
function getInitialTheme(): Theme {
  // 1. 优先使用本地存储的主题
  const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  
  // 2. 使用系统偏好
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * 应用主题到 DOM
 */
function applyTheme(newTheme: Theme): void {
  document.documentElement.setAttribute('data-theme', newTheme);
  document.documentElement.classList.toggle('dark-mode', newTheme === 'dark');
  
  // 更新 CSS 变量
  const root = document.documentElement;
  if (newTheme === 'dark') {
    root.style.setProperty('--bg-primary', '#0f0f23');
    root.style.setProperty('--bg-secondary', '#1a1a2e');
    root.style.setProperty('--text-primary', '#eaeaea');
    root.style.setProperty('--text-secondary', '#b8b8b8');
  } else {
    root.style.setProperty('--bg-primary', '#f8f9fa');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--text-primary', '#2d3436');
    root.style.setProperty('--text-secondary', '#636e72');
  }
}

/**
 * 主题 Composable
 */
export function useTheme() {
  const isDark = computed(() => theme.value === 'dark');
  const isLight = computed(() => theme.value === 'light');
  
  /**
   * 设置主题
   */
  function setTheme(newTheme: Theme): void {
    theme.value = newTheme;
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  }
  
  /**
   * 切换主题
   */
  function toggleTheme(): void {
    setTheme(theme.value === 'light' ? 'dark' : 'light');
  }
  
  /**
   * 设置为亮色主题
   */
  function setLight(): void {
    setTheme('light');
  }
  
  /**
   * 设置为暗色主题
   */
  function setDark(): void {
    setTheme('dark');
  }
  
  /**
   * 跟随系统主题
   */
  function followSystem(): void {
    localStorage.removeItem(THEME_KEY);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(systemTheme);
  }
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  function handleSystemThemeChange(e: MediaQueryListEvent): void {
    // 如果没有手动设置主题，则跟随系统
    if (!localStorage.getItem(THEME_KEY)) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  }
  
  onMounted(() => {
    // 应用初始主题
    applyTheme(theme.value);
    
    // 监听系统主题变化
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  });
  
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange);
  });
  
  return {
    // 状态
    theme: computed(() => theme.value),
    isDark,
    isLight,
    
    // 方法
    setTheme,
    toggleTheme,
    setLight,
    setDark,
    followSystem,
  };
}

// 导出类型
export type { Theme };
