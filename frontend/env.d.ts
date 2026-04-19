/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_AMAP_KEY: string
  readonly VITE_OSS_REGION: string
  readonly VITE_OSS_BUCKET: string
  readonly VITE_OSS_ACCESS_KEY_ID: string
  readonly VITE_OSS_ACCESS_KEY_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 扩展 Window 接口
declare global {
  interface Window {
    AMap?: any;
    __AMAP_SECURITY_KEY__?: string;
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: any;
  }
}

export {}
