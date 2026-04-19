import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

/**
 * Vue 应用主入口
 * 使用 Composition API 和现代化配置
 */

const app = createApp(App);

// 使用 Pinia 状态管理
const pinia = createPinia();
app.use(pinia);

// 使用 Vue Router
app.use(router);

/**
 * 全局错误处理器
 */
app.config.errorHandler = (err: unknown, instance, info: string) => {
  console.error('Vue Error:', err);
  console.error('Component:', instance);
  console.error('Error Info:', info);

  // 生产环境可以添加错误上报服务
  if (import.meta.env.PROD) {
    // TODO: 集成错误上报服务（如 Sentry）
  }
};

/**
 * 全局警告处理器（仅开发模式）
 */
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg: string, instance, trace: string) => {
    console.warn('Vue Warning:', msg);
    console.warn('Trace:', trace);
  };
}

// 挂载应用
app.mount('#app');
