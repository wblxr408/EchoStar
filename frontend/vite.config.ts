import { defineConfig, loadEnv, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { resolve } from 'path';

/**
 * Vite 配置 - 全面优化版
 * 基于 Vite 5+ 最佳实践和 Vue 3 优化
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      vue(),

      // 自动导入 Vue API
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'pinia'
        ],
        dts: 'src/types/auto-imports.d.ts',
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json'
        }
      }),

      // 自动导入组件
      Components({
        dts: 'src/types/components.d.ts',
        dirs: ['src/components'],
        extensions: ['vue']
      }),

      // Gzip 压缩
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240, // 10kb 以上才压缩
        deleteOriginFile: false
      }),

      // Brotli 压缩（比 gzip 更高效）
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false
      }),

      // 打包分析
      isAnalyze && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean) as Plugin[],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': resolve(__dirname, './src')
      },
      // 添加文件扩展名，减少解析时间
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.vue']
    },

    server: {
      port: 5173,
      open: true,
      cors: true,
      // 严格的端口检查
      strictPort: false,
      // 热更新配置
      hmr: {
        overlay: true
      },
      // 预构建优化
      optimizeDeps: {
        include: [
          'vue',
          'vue-router',
          'pinia',
          'axios'
        ]
      },
      // 代理配置
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          // 避免将 /api 重写
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          // 超时配置
          timeout: 30000
        }
      },
      // 文件监听优化
      watch: {
        usePolling: false,
        // 减少监听的文件
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
      }
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      // 目标现代浏览器，启用更高效的转换
      target: 'esnext',
      // CSS 代码分割
      cssCodeSplit: true,
      // 更积极的 CSS 压缩
      cssMinify: 'lightningcss',
      // 压缩选项
      minify: 'esbuild',
      // ESBuild 配置
      esbuild: {
        // 生产环境移除 console 和 debugger
        drop: mode === 'production' ? ['console', 'debugger'] : [],
        legalComments: 'none',
        // 使用 Tree Shaking
        treeShaking: true,
        // 启用更激进的压缩
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
        // 目标环境
        target: 'es2020'
      },
      // Rollup 选项
      rollupOptions: {
        // 输入配置
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          // 更细粒度的代码分割策略
          manualChunks: (id) => {
            // Vue 核心生态 - 单独打包
            if (id.includes('node_modules/vue/') ||
                id.includes('node_modules/@vue/') ||
                id.includes('node_modules/vue-router/') ||
                id.includes('node_modules/pinia/')) {
              return 'vue-vendor';
            }
            // 网络请求库 - 单独打包
            if (id.includes('node_modules/axios/')) {
              return 'axios';
            }
            // OSS SDK - 单独打包（大型库）
            if (id.includes('node_modules/ali-oss/')) {
              return 'ali-oss';
            }
            // 其他 node_modules
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
          },
          // 优化的文件命名 - 使用内容哈希
          chunkFileNames: 'assets/js/[name]-[hash:8].js',
          entryFileNames: 'assets/js/[name]-[hash:8].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') ?? [];
            const ext = info[info.length - 1];
            const name = info[0];

            if (/\.(css|scss|sass|less)$/.test(assetInfo.name ?? '')) {
              return `assets/css/[name]-[hash:8][extname]`;
            }
            if (/\.(png|jpg|jpeg|webp|gif|svg|ico)$/.test(assetInfo.name ?? '')) {
              return `assets/images/[name]-[hash:8][extname]`;
            }
            if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name ?? '')) {
              return `assets/fonts/[name]-[hash:8][extname]`;
            }
            return `assets/${ext}/[name]-[hash:8][extname]`;
          },
          // 内联阈值
          assetInlineLimit: 4096,
          // 启用持续缓存
          experimentalMinChunkSize: 20000
        },
        // 外部化（如果有需要）
        external: [],
        // Treeshaking 配置
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: true,
          unknownGlobalSideEffects: false
        }
      },
      // 块大小警告阈值（提高阈值以减少警告）
      chunkSizeWarningLimit: 1000,
      // 压缩大小阈值
      reportCompressedSize: true,
      // 最大并行处理
      maxParallelFileOps: 10,
      // 公共路径
      assetsInlineLimit: 4096
    },

    // CSS 优化
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          // 全局注入变量，无需每次手动导入
          additionalData: `@use "@/styles/variables.scss" as *;`,
          // 启用源映射
          sourceMap: mode === 'development'
        }
      },
      // CSS 模块化支持
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: mode === 'production'
          ? '[hash:base64:6]'
          : '[name]__[local]--[hash:base64:5]'
      },
      // 开发环境使用 lightningcss
      devSourcemap: mode === 'development'
    },

    // 依赖预构建优化
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios'
      ],
      exclude: [
        // 动态导入的大型库
        'ali-oss'
      ],
      // 强制预构建
      force: false,
      // ESBuild 选项
      esbuildOptions: {
        target: 'esnext',
        // 启用 JSX 支持（如果需要）
        jsx: 'automatic'
      }
    },

    // 定义环境变量
    define: {
      // Vue 生产环境优化
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_OPTIONS_API__: false, // 禁用 Options API 以减少包体积
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      // 生产环境标记
      __DEV__: JSON.stringify(mode === 'development'),
      __PROD__: JSON.stringify(mode === 'production')
    },

    // 预览服务器配置
    preview: {
      port: 4173,
      open: true,
      // 支持历史模式
      historyApiFallback: true
    },

    // 实验性功能
    experimental: {
      // 启用构建缓存
      buildRust: false
    },

    // 开发服务器优化
    optimizeDeps: {
      disabled: mode === 'build'
    }
  };
});
