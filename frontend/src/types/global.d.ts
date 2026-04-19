/**
 * 全局类型定义
 */

/**
 * 环境变量类型
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AMAP_KEY: string;
  readonly VITE_OSS_REGION: string;
  readonly VITE_OSS_BUCKET: string;
  readonly VITE_OSS_ACCESS_KEY_ID: string;
  readonly VITE_OSS_ACCESS_KEY_SECRET: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * 窗口对象扩展
 */
declare global {
  interface Window {
    // 地图相关
    AMap?: any;
    __AMAP_SECURITY_KEY__?: string;

    // 调试工具
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: any;
  }
}

export {};
