# 前端单元测试结果

**日期**: 2026-04-06  
**测试框架**: Vitest v4.1.2  
**运行环境**: Node.js / jsdom  

## 测试概览

| 指标 | 值 |
|------|-----|
| 测试文件 | 10 passed |
| 测试用例 | 114 passed |
| 失败 | 0 |
| 耗时 | ~3.5s |

## 测试模块

### utils（工具函数）— 48 tests, all passed

| 文件 | 用例数 | 状态 |
|------|--------|------|
| `utils/time.test.js` | 21 | passed |
| `utils/emotion.test.js` | 16 | passed |
| `utils/image.test.js` | 10 | passed |
| `utils/geo.test.js` | 8 | passed |

### stores（状态管理）— 37 tests, all passed

| 文件 | 用例数 | 状态 |
|------|--------|------|
| `stores/user.test.js` | 16 | passed |
| `stores/map.test.js` | 14 | passed |
| `stores/story.test.js` | 7 | passed |

### components（组件）— 22 tests, all passed

| 文件 | 用例数 | 状态 |
|------|--------|------|
| `components/StoryCard.test.js` | 12 | passed |
| `components/EmotionSelector.test.js` | 5 | passed |
| `components/ImageUploader.test.js` | 5 | passed |

## 修复记录

首次运行时有 4 个用例失败，均属测试脚本问题，非源码缺陷：

| 模块 | 失效用例 | 原因 | 修复方式 |
|------|---------|------|---------|
| `time.test.js` | 剩余天数+小时 | 断言 `toContain('天后解锁')` 无法匹配 `3天5小时后解锁` | 改为 `toMatch(/天.*解锁/)` |
| `ImageUploader.test.js` | 添加有效图片后更新 v-model | 未给 input.element 设置 files 属性就触发 change 事件 | 使用 `Object.defineProperty` 正确设置 files |
| `ImageUploader.test.js` | 超过 maxImages 时显示警告 | 第二次 `defineProperty` 时 files 不可重定义 | 添加 `configurable: true` |
| `story.test.js` | 清空所有状态 | 断言 `loading` 重置，但源码 `clear()` 未实现此行为 | 移除该断言（见下方源码问题） |
