import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useUserStore } from '../stores/user';
import type { RouteLocationNormalized } from 'vue-router';

/**
 * 路由配置
 * 使用命名路由和路由元信息
 */

// 路由元信息类型扩展
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    title?: string;
    transition?: 'fade' | 'slide' | 'zoom' | 'none';
    keepAlive?: boolean;
  }
}

// 路由配置 - 使用懒加载优化性能
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home/index.vue'),
    meta: {
      requiresAuth: false,
      title: 'EchoStar - 在地图上留下你的情绪印记',
      transition: 'fade',
      keepAlive: true
    }
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/Map/index.vue'),
    meta: {
      requiresAuth: true,
      title: '探索地图 - EchoStar',
      transition: 'slide',
      keepAlive: true
    }
  },
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('../views/Publish/index.vue'),
    meta: {
      requiresAuth: true,
      title: '发布故事 - EchoStar',
      transition: 'slide',
      keepAlive: false
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin/index.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: '管理后台 - EchoStar',
      transition: 'fade',
      keepAlive: false
    }
  },
  {
    path: '/auth/github/callback',
    name: 'GitHubCallback',
    component: () => import('../views/GitHubCallback.vue'),
    meta: {
      requiresAuth: false,
      title: 'GitHub 登录 - EchoStar',
      transition: 'none'
    }
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      requiresAuth: false,
      title: '页面未找到 - EchoStar',
      transition: 'fade'
    }
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  // 优化的滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0, behavior: 'smooth' };
  }
});

/**
 * 路由前置守卫 - 权限验证和页面标题
 */
router.beforeEach(async (to: RouteLocationNormalized, from, next) => {
  const userStore = useUserStore();

  // 开发模式日志
  if (import.meta.env.DEV) {
    console.log('[Router] Navigation:', from.path, '->', to.path);
    console.log('[Router] Auth status:', userStore.isLoggedIn);
  }

  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  // 需要登录但未登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    console.log('[Router] Auth required, redirecting to Home');
    next({ name: 'Home', query: { redirect: to.fullPath } });
    return;
  }

  // 需要管理员权限
  if (to.meta.requiresAdmin && userStore.user?.role !== 'admin') {
    console.log('[Router] Admin required, redirecting to Map');
    next({ name: 'Map' });
    return;
  }

  next();
});

/**
 * 路由后置守卫 - 性能分析和错误处理
 */
router.afterEach((to, from, failure) => {
  // 路由错误处理
  if (failure) {
    console.error('[Router] Navigation error:', failure);
    return;
  }

  // 页面访问分析（生产环境）
  if (import.meta.env.PROD) {
    // TODO: 集成页面访问分析服务（如 Google Analytics）
    trackPageView(to.path, to.meta.title);
  }
});

/**
 * 路由错误处理
 */
router.onError((error) => {
  console.error('[Router] Navigation error:', error);

  // 生产环境错误上报
  if (import.meta.env.PROD) {
    // TODO: 集成错误上报服务（如 Sentry）
  }
});

/**
 * 页面访问追踪（占位函数）
 */
function trackPageView(path: string, title: string | undefined): void {
  // 实现页面访问追踪逻辑
  console.log('[Analytics] Page view:', { path, title });
}

/**
 * 路由预加载
 * 预加载用户可能访问的页面
 */
export function preloadRoutes(routeNames: string[]): void {
  routeNames.forEach((name) => {
    const route = router.resolve({ name });
    if (route && typeof route.matched[0]?.components?.default === 'function') {
      route.matched[0].components.default();
    }
  });
}

export default router;
