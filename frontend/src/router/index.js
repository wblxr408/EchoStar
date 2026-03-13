import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/Map/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('../views/Publish/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin/index.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * 路由守卫
 */
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  // 需要登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Home' });
    return;
  }

  // 需要管理员权限
  if (to.meta.requiresAdmin && userStore.user?.role !== 'admin') {
    next({ name: 'Map' });
    return;
  }

  next();
});

export default router;
