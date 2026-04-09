import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home/index.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/map",
    name: "Map",
    component: () => import("../views/Map/index.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/publish",
    name: "Publish",
    component: () => import("../views/Publish/index.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/admin",
    name: "Admin",
    component: () => import("../views/Admin/index.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/auth/github/callback",
    name: "GitHubCallback",
    component: () => import("../views/GitHubCallback.vue"),
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  console.log("=== 路由守卫被触发 ===");
  console.log("从:", from.path);
  console.log("到:", to.path);
  console.log("用户登录状态:", userStore.isLoggedIn);

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    console.log("需要登录，重定向到首页");
    next({ name: "Home" });
    return;
  }

  if (to.meta.requiresAdmin && userStore.user?.role !== "admin") {
    console.log("需要管理员权限，重定向到地图页");
    next({ name: "Map" });
    return;
  }

  console.log("允许跳转");
  next();
});

export default router;
