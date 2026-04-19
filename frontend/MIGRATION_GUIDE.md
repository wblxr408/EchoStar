# EchoStar 迁移指南

本文档说明了从 JavaScript 到 TypeScript 的迁移过程和相关注意事项。

## 迁移概述

### 已迁移的文件
- ✅ `main.js` → `main.ts`
- ✅ `App.vue` (添加 TypeScript)
- ✅ `views/Home/index.vue` (添加 TypeScript)
- ✅ `router/index.js` → `router/index.ts`
- ✅ `vite.config.js` → `vite.config.ts`

### 新增的 TypeScript 文件
- ✅ `src/types/global.d.ts` - 全局类型定义
- ✅ `src/composables/usePerformance.ts` - 性能监控
- ✅ `src/composables/useLazyImage.ts` - 图片懒加载
- ✅ `src/composables/useDebounce.ts` - 防抖
- ✅ `src/composables/useThrottle.ts` - 节流
- ✅ `src/composables/useErrorHandler.ts` - 错误处理
- ✅ `src/utils/request.ts` - 请求工具
- ✅ `tsconfig.json` - TypeScript 配置
- ✅ `tsconfig.node.json` - Node 环境配置

## 迁移步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 迁移 JavaScript 文件到 TypeScript

#### 步骤 2.1: 重命名文件
```bash
# 将 .js 文件重命名为 .ts
mv src/stores/user.js src/stores/user.ts
mv src/stores/map.js src/stores/map.ts
mv src/stores/story.js src/stores/story.ts
```

#### 步骤 2.2: 添加类型注解
```typescript
// ❌ JavaScript
function getUser() {
  return userStore.user;
}

// ✅ TypeScript
function getUser(): User | null {
  return userStore.user;
}
```

#### 步骤 2.3: 定义接口
```typescript
// 定义数据类型
interface User {
  id: string | number;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'guest';
}

interface Story {
  id: string;
  content: string;
  author: User;
  emotion: EmotionType;
  createdAt: Date;
  images?: string[];
}
```

### 3. 组件迁移

#### Vue SFC 迁移模板
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

// 定义 Props
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
});

// 定义 Emits
const emit = defineEmits<{
  update: [value: string];
  click: [event: MouseEvent];
}>();

// 响应式数据
const count = ref(0);

// 计算属性
const doubled = computed(() => props.count * 2);

// 方法
function handleClick(event: MouseEvent) {
  emit('click', event);
}
</script>
```

### 4. 类型定义文件

#### 全局类型 (`src/types/global.d.ts`)
```typescript
// 环境变量类型
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // ...其他环境变量
}

// 窗口对象扩展
declare global {
  interface Window {
    AMap?: any;
  }
}
```

#### API 类型 (`src/types/api.d.ts`)
```typescript
interface ApiResponse<T> {
  data: T;
  message: string;
  code: number;
}

interface UserResponse {
  id: string;
  username: string;
  email: string;
}
```

### 5. 配置文件更新

#### Vite 配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // 配置...
});
```

#### ESLint 配置
```javascript
// .eslintrc.cjs
module.exports = {
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser'
  }
};
```

## 迁移最佳实践

### 1. 渐进式迁移
不要一次性迁移所有文件，建议按以下顺序：
1. 工具函数和 composables
2. 类型定义
3. 状态管理 (stores)
4. 路由配置
5. 组件（从简单到复杂）

### 2. 使用 any 作为过渡
```typescript
// 初期可以使用 any，后期逐步替换
const data: any = await fetchData();

// 后期替换为具体类型
interface DataType {
  id: string;
  name: string;
}
const data: DataType = await fetchData();
```

### 3. 利用自动生成
```bash
# 使用 OpenAPI 生成 API 类型
npm run generate:types
```

### 4. 使用 Vue 3 的类型推断
```typescript
// Vue 会自动推断 Props 类型
const props = defineProps<{
  title: string;
  count?: number;
}>();
```

## 常见问题

### Q: 如何处理第三方库没有类型定义？
A:
1. 安装 `@types/package-name`
2. 创建 `src/types/vendor.d.ts` 手动声明
3. 使用 `declare module 'package-name'`

### Q: 如何处理复杂的数据结构？
A:
```typescript
// 使用联合类型
type Status = 'pending' | 'success' | 'error';

// 使用泛型
interface Response<T> {
  data: T;
  code: number;
}

// 使用递归类型
interface TreeNode {
  id: string;
  children?: TreeNode[];
}
```

### Q: 如何处理动态导入？
A:
```typescript
// 动态导入组件
const AsyncComponent = defineAsyncComponent(
  () => import('./Component.vue')
);

// 动态导入模块
const module = await import('./module');
```

## 验证迁移

### 类型检查
```bash
npm run typecheck
```

### Lint 检查
```bash
npm run lint
```

### 构建测试
```bash
npm run build
```

## 迁移后的优势

1. **类型安全** - 在编译时捕获错误
2. **更好的 IDE 支持** - 自动补全和跳转
3. **代码质量** - 强制更好的代码结构
4. **重构信心** - 类型系统保护重构
5. **文档作用** - 类型即文档

## 下一步

继续迁移剩余的文件：
- [ ] `src/stores/user.js` → `user.ts`
- [ ] `src/stores/map.js` → `map.ts`
- [ ] `src/stores/story.js` → `story.ts`
- [ ] `src/components/*.vue` (添加 TypeScript)
- [ ] `src/views/**/*.vue` (添加 TypeScript)

## 参考资源

- [Vue 3 + TypeScript](https://vuejs.org/guide/typescript/overview.html)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Vite TypeScript 支持](https://vitejs.dev/guide/features.html#typescript)
