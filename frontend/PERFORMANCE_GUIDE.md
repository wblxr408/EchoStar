# EchoStar 性能优化指南

本文档说明了项目的性能优化策略和最佳实践。

## 优化概述

### 已实现的优化

#### 1. 构建优化
- ✅ 使用 Vite 的现代构建工具链
- ✅ 启用代码分割和 Tree Shaking
- ✅ 配置 Gzip 和 Brotli 压缩
- ✅ 智能的 chunk 分割策略
- ✅ 移除生产环境的 console 和 debugger
- ✅ CSS 代码分割和优化

#### 2. 运行时优化
- ✅ 使用 `shallowRef` 和 `shallowReactive` 避免深层响应式
- ✅ 图片懒加载（IntersectionObserver）
- ✅ 路由懒加载
- ✅ 组件缓存（KeepAlive）
- ✅ 防抖和节流优化
- ✅ 请求缓存机制
- ✅ 请求取消管理

#### 3. TypeScript 迁移
- ✅ 从 JavaScript 迁移到 TypeScript
- ✅ 类型安全的代码
- ✅ 更好的 IDE 支持

#### 4. 代码质量
- ✅ ESLint 配置
- ✅ Prettier 代码格式化
- ✅ 严格的 TypeScript 配置
- ✅ 自动导入（Vue API 和组件）

## 性能指标

### 目标指标
- 首次内容绘制 (FCP): < 1.5s
- 最大内容绘制 (LCP): < 2.5s
- 首次输入延迟 (FID): < 100ms
- 累积布局偏移 (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

### 监控工具
使用浏览器 DevTools 的 Performance 和 Lighthouse 进行性能分析。

## 最佳实践

### 1. 响应式优化

```typescript
// ❌ 使用 ref 会导致深层响应式
const complexData = ref({ nested: { deep: { value: 1 } } });

// ✅ 使用 shallowRef 避免深层响应式
const complexData = shallowRef({ nested: { deep: { value: 1 } } });

// ✅ 使用 shallowReactive
const state = shallowReactive({ items: [] });
```

### 2. 列表渲染优化

```vue
<template>
  <!-- ✅ 使用唯一的 key -->
  <div v-for="item in visibleItems" :key="item.id">
    {{ item.name }}
  </div>

  <!-- ✅ 限制渲染数量 -->
  <div v-for="item in items.slice(0, 20)" :key="item.id">
    {{ item.name }}
  </div>
</template>
```

### 3. 图片优化

```vue
<template>
  <!-- ✅ 使用懒加载 -->
  <img
    v-if="isImageVisible"
    :src="imageUrl"
    loading="lazy"
    decoding="async"
  />
</template>

<script setup>
const { imageRef, isLoaded } = useLazyImage(imageUrl)
</script>
```

### 4. 事件处理优化

```typescript
// ✅ 使用防抖
import { useDebounce } from '@/composables/useDebounce'

const handleSearch = useDebounce((query: string) => {
  // 搜索逻辑
}, 300)

// ✅ 使用节流
import { useThrottle } from '@/composables/useThrottle'

const handleScroll = useThrottle(() => {
  // 滚动处理
}, 16)
```

### 5. 计算属性优化

```typescript
// ✅ 使用 computed 缓存结果
const filteredItems = computed(() => {
  return items.value.filter(item => item.active)
})

// ✅ 复杂计算使用缓存
const expensiveValue = computed(() => {
  // 复杂计算逻辑
})
```

## 代码分割策略

### Vite 配置
```typescript
manualChunks: (id) => {
  // Vue 核心
  if (id.includes('node_modules/vue/')) return 'vue-vendor'

  // 网络请求
  if (id.includes('node_modules/axios/')) return 'axios'

  // OSS SDK
  if (id.includes('node_modules/ali-oss/')) return 'ali-oss'

  // 其他库
  if (id.includes('node_modules/')) return 'vendor'
}
```

### 路由懒加载
```typescript
const routes = [
  {
    path: '/map',
    component: () => import('../views/Map/index.vue')
  }
]
```

## 缓存策略

### 请求缓存
```typescript
// ✅ 使用带缓存的请求
import { cachedRequest } from '@/utils/request'

const data = await cachedRequest(api, config, 60000) // 缓存 60 秒
```

### 组件缓存
```vue
<template>
  <keep-alive :include="['Home', 'Map']">
    <router-view />
  </keep-alive>
</template>
```

## 监控和分析

### 打包分析
```bash
npm run build:analyze
```

### 性能分析
```bash
npm run build:check
```

## 性能检查清单

- [ ] 所有图片都使用懒加载
- [ ] 大型列表使用虚拟滚动
- [ ] 复杂计算使用 computed
- [ ] 事件处理使用防抖/节流
- [ ] 请求添加缓存
- [ ] 路由使用懒加载
- [ ] 使用 shallowRef/shallowReactive
- [ ] 避免不必要的响应式
- [ ] 代码已分割
- [ ] 资源已压缩
- [ ] 使用现代浏览器特性

## 常见问题

### Q: 如何解决首屏加载慢？
A:
1. 启用路由懒加载
2. 使用代码分割
3. 图片懒加载
4. 启用压缩
5. 使用 CDN

### Q: 如何优化列表渲染性能？
A:
1. 使用虚拟滚动
2. 限制渲染数量
3. 使用唯一的 key
4. 避免在模板中复杂计算

### Q: 如何减少包体积？
A:
1. Tree Shaking
2. 代码分割
3. 移除未使用的代码
4. 使用更小的替代库

## 相关文档

- [Vue 3 性能优化](https://vuejs.org/guide/best-practices/performance.html)
- [Vite 性能优化](https://vitejs.dev/guide/performance.html)
- [Web 性能优化](https://web.dev/performance/)
