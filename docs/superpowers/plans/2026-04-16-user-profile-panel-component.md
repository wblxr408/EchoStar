# UserProfilePanel 可复用组件 封装计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将"个人信息"面板从 `index.vue` 中提取为独立可复用 Vue 组件，通过 props 控制功能（编辑/点赞/收藏标签等），供搜索用户详情、未来其他场景复用。

**Architecture:** 创建 `UserProfilePanel.vue` 单文件组件，props 驱动的配置模式（`isOwnProfile`、`showLikesTab`、`showFavoritesTab`、`editable`），内部自管状态。通过 `v-model:visible` 控制显隐，emit 事件通知父组件。CSS 样式全量迁移到组件内（非 scoped，以复用现有类名）。

**Tech Stack:** Vue 3 Composition API + Pinia + 现有 API 模块

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `frontend/src/components/UserProfilePanel.vue` | **创建** | 主面板组件（~2100行：模板+逻辑+样式） |
| `frontend/src/views/Map/index.vue` | **修改** | 移除面板代码，替换为 `<UserProfilePanel>` 引用 |

---

## Props 接口设计

```typescript
interface Props {
  visible: boolean              // v-model:visible
  theme?: 'dark' | 'light'      // 主题
  isOwnProfile?: boolean         // 是否为自己的页面（默认 false）
  editable?: boolean             // 是否可编辑（默认 false）
  userId?: string | number       // 查看的目标用户ID（非own时必传）
  user?: {                       // 外部传入的用户数据（查看他人时）
    id: number
    username: string
    avatar?: string
    bio?: string
    vip?: number
  }
}
```

## Emit 接口设计

```typescript
interface Emits {
  (e: 'update:visible', val: boolean): void
  (e: 'close'): void
  (e: 'story-click', story: any): void       // 点击故事
  (e: 'open-login'): void                    // 未登录时点击登录
  (e: 'profile-updated'): void               // 用户信息更新后
}
```

## 功能矩阵

| 功能 | isOwnProfile=true | isOwnProfile=false |
|------|:-:|:-:|
| 头像显示 | ✅ | ✅ |
| 用户名+VIP+STAR-ID | ✅ | ✅ |
| Bio签名 | ✅ 可编辑 | ✅ 只读 |
| 作品标签 | ✅ | ✅ |
| 点赞标签 | ✅ | ❌ |
| 收藏标签 | ✅ | ❌ |
| 头像上传 | ✅ | ❌ |
| 编辑用户名/密码 | ✅ | ❌ |
| 切换账号 | ✅ | ❌ |
| 游客面板 | ✅ | ❌ |
| 退出登录 | ✅ | ❌ |
| 删除故事 | ✅ | ❌ |
| 取消点赞/收藏 | ✅ | ❌ |

---

### Task 1: 创建 UserProfilePanel.vue 骨架

**Files:**
- Create: `frontend/src/components/UserProfilePanel.vue`

- [ ] **Step 1: 创建组件文件，包含 props/emits 定义、模板骨架（空div）和 style 标签**

```vue
<template>
  <transition name="publish-modal">
    <div v-if="visible" class="user-modal-shell" @click.self="handleClose">
      <div class="user-sidebar show-sidebar" :class="{ dark: isDark }">
        <div class="user-sidebar-header">
          <h3>个人信息</h3>
          <button class="close-btn" @click.stop="handleClose">
            <span>×</span>
          </button>
        </div>
        <div class="user-sidebar-content">
          <!-- Task 2-5 will fill this -->
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import * as authApi from '@/api/auth'
import * as storyApi from '@/api/story'
import * as likeApi from '@/api/like'
import * as favoriteApi from '@/api/favorite'

const props = defineProps({
  visible: { type: Boolean, default: false },
  theme: { type: String, default: 'dark' },
  isOwnProfile: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  userId: { type: [String, Number], default: null },
  user: { type: Object, default: null },
})

const emit = defineEmits(['update:visible', 'close', 'story-click', 'open-login', 'profile-updated'])

const userStore = useUserStore()
const isDark = computed(() => props.theme === 'dark')

function handleClose() {
  emit('update:visible', false)
  emit('close')
}
</script>

<style>
/* Task 6 will migrate all CSS here */
</style>
```

- [ ] **Step 2: 在 index.vue 中引入组件并替换现有面板模板（先保持功能不变）**

在 `index.vue` 中：
1. 在 `<script setup>` 中添加 `import UserProfilePanel from '@/components/UserProfilePanel.vue'`
2. 将第 727-1004 行的整个 `<div v-if="showUserSidebar" class="user-modal-shell">...</div>` 替换为：
```vue
<UserProfilePanel
  v-model:visible="showUserSidebar"
  :theme="effectiveMapTheme"
  :is-own-profile="true"
  :editable="true"
  :user="userStore.user"
  @story-click="openStoryFromCollection"
  @open-login="handleGuestLoginClick"
  @profile-updated="refreshUserPanel"
/>
```
3. 同样将搜索用户详情弹窗（第 115-180 行的 `.search-user-modal-shell`）替换为：
```vue
<UserProfilePanel
  v-model:visible="searchUserDetailOpen"
  :theme="effectiveMapTheme"
  :is-own-profile="false"
  :editable="false"
  :user="searchedUser"
  @story-click="openStoryFromCollection"
/>
```

- [ ] **Step 3: 验证两个面板骨架都能正常显示/隐藏（样式正确但内容为空）**

打开页面 → 点击"我的信息" → 弹窗应显示但内容为空（仅标题栏+关闭按钮）→ 关闭正常。

---

### Task 2: 迁移用户资料头部（头像+用户名+Bio）

**Files:**
- Modify: `frontend/src/components/UserProfilePanel.vue`

- [ ] **Step 1: 在组件中添加资料头部模板（isOwnProfile 分支：游客面板 vs 已登录面板；非 own：只读资料展示）**

将 `index.vue` 第 746-905 行的模板迁移到组件的 `<div class="user-sidebar-content">` 内部：

```vue
<div class="user-sidebar-content">
  <!-- 游客/未登录面板 -->
  <div v-if="isOwnProfile && (!userStore.isLoggedIn || userStore.isGuest)" class="guest-profile">
    <div class="guest-avatar"><span>👤</span></div>
    <div class="guest-info">
      <h4>{{ userStore.isGuest ? "游客用户" : "未登录" }}</h4>
      <p>{{ userStore.isGuest ? "登录后可体验完整功能" : "请登录以使用完整功能" }}</p>
    </div>
  </div>
  <div v-if="isOwnProfile && (!userStore.isLoggedIn || userStore.isGuest)" class="guest-actions">
    <button class="guest-action-btn login-btn" @click="emit('open-login')">
      <span class="btn-icon">🔑</span>
      <span class="btn-text">{{ userStore.isGuest ? "登录账号" : "登录" }}</span>
    </button>
    <button v-if="!userStore.isLoggedIn" class="guest-action-btn guest-btn" @click="handleEnterGuestMode">
      <span class="btn-icon">🚶</span><span class="btn-text">游客体验</span>
    </button>
    <button v-if="userStore.isGuest" class="guest-action-btn logout-btn" @click="handleGuestLogout">
      <span class="btn-icon">🚪</span><span class="btn-text">退出</span>
    </button>
  </div>

  <!-- 已登录/他人面板 -->
  <div v-else class="user-profile-new">
    <!-- 头像 -->
    <div class="user-avatar-wrapper">
      <div class="user-avatar-large" :class="{ clickable: isOwnProfile && editable }" @click="isOwnProfile && editable && triggerAvatarUpload()">
        <img :src="displayAvatar" alt="用户头像" />
        <div v-if="isOwnProfile && editable" class="avatar-overlay">
          <span class="avatar-edit-icon">📷</span>
          <span class="avatar-edit-text">更换头像</span>
        </div>
      </div>
      <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarChange" />
      <div v-if="avatarUploading" class="avatar-upload-status"><span class="upload-spinner">⌛</span><span>上传中...</span></div>
      <div v-if="avatarError" class="avatar-error">{{ avatarError }}</div>
    </div>

    <!-- 用户信息 -->
    <div class="user-identity-area">
      <div class="user-identity-top">
        <div class="user-name-row">
          <span class="vip-text-badge" v-if="displayUser.vip">VIP</span>
          <span class="user-display-name" :class="{ 'has-vip': displayUser.vip }">{{ displayUser.username || '未设置' }}</span>
          <button v-if="isOwnProfile && editable" class="icon-edit-btn" @click="handleOpenEditProfile" title="编辑资料">✏️</button>
        </div>
        <div class="user-star-id">STAR-ID: {{ displayUser.id ?? '' }}</div>
      </div>
      <div v-if="isOwnProfile && editable" class="user-identity-actions">
        <button class="switch-account-btn" @click="handleSwitchAccount">切换账号</button>
        <button class="logout-inline-btn" @click="handleLogout">退出登录</button>
      </div>
    </div>
  </div>

  <!-- Bio签名 -->
  <div v-if="displayUser.bio || (isOwnProfile && editable)" class="user-bio-area">
    <template v-if="isOwnProfile && editable && editingBioInline">
      <div class="bio-input-wrap">
        <textarea ref="bioInputRef" v-model="bioDraft" class="bio-input" maxlength="200" placeholder="写点什么介绍自己..." @input="bioChanged = true"></textarea>
        <div class="bio-char-count">{{ bioDraft.length }}/200</div>
      </div>
      <div class="bio-actions">
        <button class="bio-save-btn" @click="saveBioInline">保存</button>
        <button class="bio-cancel-btn" @click="cancelEditBio">取消</button>
      </div>
    </template>
    <template v-else>
      <div class="bio-content" :class="{ clickable: isOwnProfile && editable }" @click="isOwnProfile && editable && startEditBio()">
        <span class="bio-text">{{ displayUser.bio || (isOwnProfile && editable ? '点击添加个性签名...' : '') }}</span>
        <span v-if="isOwnProfile && editable" class="bio-edit-icon">✏️</span>
      </div>
    </template>
  </div>
</div>
```

- [ ] **Step 2: 迁移对应的响应式状态和函数**

添加到 `<script setup>` 中：
- `displayUser` computed（own 时从 userStore 取，否则从 props.user 取）
- `displayAvatar` computed
- 头像上传相关：`avatarInput`, `avatarPreview`, `avatarUploading`, `avatarError`, `currentAvatarFile` + `triggerAvatarUpload()`, `handleAvatarChange()`, `uploadAvatar()`
- Bio 编辑相关：`editingBioInline`, `bioDraft`, `bioInputRef`, `bioChanged` + `startEditBio()`, `cancelEditBio()`, `saveBioInline()`
- 编辑资料弹窗相关：`showEditProfileModal`, `editProfileForm` 系列 + `handleOpenEditProfile()`, `handleCloseEditProfile()`, `startEditUsername()`, `saveUsername()`, `startEditPassword()`, `savePassword()` + 对应 computed
- 账号切换相关：`showSwitchAccountModal`, `savedAccounts` + `handleSwitchAccount()`, `handleSwitchToAccount()`, `handleAddAccount()`, `saveAccountToStorage()`
- 游客相关：`handleEnterGuestMode()`, `handleGuestLogout()`
- 退出登录：`handleLogout()` — 通过 emit('open-login') 通知父组件处理登录弹窗
- `watch(visible)` — 面板打开时刷新数据

- [ ] **Step 3: 验证资料头部显示正常（own模式：头像/用户名/Bio/编辑按钮可见；他人模式：只读显示）**

---

### Task 3: 迁移内容标签列表（作品/点赞/收藏）

**Files:**
- Modify: `frontend/src/components/UserProfilePanel.vue`

- [ ] **Step 1: 添加标签栏模板（根据 isOwnProfile 控制显示的标签）**

在 `.user-sidebar-content` 中 Bio 区域之后添加：

```vue
<!-- 标签栏 -->
<div class="user-content-tabs" v-if="!isGuestView">
  <button class="content-tab" :class="{ active: userContentTab === 'posts' }" @click="switchTab('posts')">
    作品<span class="tab-count" v-if="postsTotalCount >= 0">{{ postsTotalCount }}</span>
  </button>
  <button v-if="isOwnProfile" class="content-tab" :class="{ active: userContentTab === 'likes' }" @click="switchTab('likes')">
    点赞<span class="tab-count" v-if="likesTotalCount >= 0">{{ likesTotalCount }}</span>
  </button>
  <button v-if="isOwnProfile" class="content-tab" :class="{ active: userContentTab === 'favorites' }" @click="switchTab('favorites')">
    收藏<span class="tab-count" v-if="favoritesTotalCount >= 0">{{ favoritesTotalCount }}</span>
  </button>
</div>

<!-- 内容列表 -->
<div class="user-content-list" ref="contentListRef" @scroll="handleContentListScroll" v-if="!isGuestView">
  <!-- 加载中 -->
  <div v-if="currentLoading" class="panel-loading"><span class="loading-spinner"></span> 加载中...</div>
  <!-- 空态 -->
  <div v-else-if="currentList.length === 0" class="panel-empty">
    <span class="empty-icon">{{ userContentTab === 'posts' ? '📝' : userContentTab === 'likes' ? '❤️' : '⭐️' }}</span>
    <span>{{ emptyText }}</span>
  </div>
  <!-- 列表 -->
  <div v-else class="panel-list">
    <div v-for="story in currentList" :key="story.id" class="panel-item" @click="handleStoryClick(story)">
      <div class="item-header">
        <img :src="story.authorAvatar || 'https://picsum.photos/80/80?random=1'" class="item-avatar" alt="头像" />
        <div class="item-meta">
          <span class="vip-name-row">
            <span class="item-author vip-username" :class="{ 'has-vip': story.authorVip }">{{ story.authorName || '匿名用户' }}</span>
            <span class="vip-text-badge-sm" v-if="story.authorVip">VIP</span>
          </span>
          <span class="item-time">{{ formatRelativeTime(story.createdAt) }}</span>
        </div>
        <div class="item-actions" v-if="isOwnProfile">
          <button v-if="userContentTab === 'likes'" class="item-action-btn" @click.stop="handleUnlike(story)" title="取消点赞">💔</button>
          <button v-if="userContentTab === 'favorites'" class="item-action-btn" @click.stop="handleToggleFavorite(story)" :title="story.isFavorited ? '取消收藏' : '重新收藏'">{{ story.isFavorited ? '💔' : '⭐️' }}</button>
          <button v-if="userContentTab === 'posts'" class="item-action-btn" @click.stop="handleDeleteStory(story)" title="删除">🗑️</button>
        </div>
      </div>
      <p class="item-content">{{ story.content }}</p>
      <div v-if="story.images?.length" class="item-images"><img :src="story.images[0]" alt="配图" /></div>
      <div class="item-footer">
        <span class="item-likes">❤️ {{ story.likeCount ?? 0 }}</span>
        <span class="item-likes">⭐️ {{ story.favoriteCount ?? 0 }}</span>
      </div>
    </div>
  </div>
  <!-- 加载更多 -->
  <div v-if="currentLoadingMore" class="panel-loading-more">加载更多...</div>
  <div v-else-if="!currentHasMore && currentList.length > 0" class="panel-no-more">没有更多了</div>
</div>
```

- [ ] **Step 2: 迁移标签列表相关的响应式状态和函数**

添加到 `<script setup>`：
- 列表状态：`postsList`, `likesList`, `favoritesList`, `*Loading`, `*LoadingMore`, `*Page`, `*HasMore`, `*PageSize`, `*TotalCount`
- `userContentTab` ref
- `currentList`/`currentLoading`/`currentLoadingMore`/`currentHasMore` computed
- `isGuestView` computed
- `switchTab(tab)` / `loadPostsData(isLoadMore)` / `loadLikesData(isLoadMore)` / `loadFavoritesData(isLoadMore)`
- `handleContentListScroll(event)`
- `handleStoryClick(story)` / `handleUnlike(story)` / `handleDeleteStory(story)` / `handleToggleFavorite(story)`
- `normalizeUserPanelStory(item, fallbackAuthor)` 工具函数
- `formatRelativeTime(time)` — 从 index.vue 中复用或提取

**注意**：`loadPostsData` 需要区分 own（调用 `storyApi.getMyStories`）和非 own（调用 `storyApi.getUserStories(userId)` 或类似 API），如果后端没有 getUserStories 接口则需要根据搜索详情页已有的逻辑（通过 `authApi.getUserById` 获取故事列表）来处理。

- [ ] **Step 3: 验证三个标签的数据加载和展示（own模式：3个tab；他人模式：仅作品tab）**

---

### Task 4: 迁移编辑资料弹窗和切换账号弹窗

**Files:**
- Modify: `frontend/src/components/UserProfilePanel.vue`

- [ ] **Step 1: 添加编辑资料弹窗模板**

迁移 `index.vue` 中 `.edit-profile-modal` 相关的模板 HTML（用户名编辑、密码修改表单）。

- [ ] **Step 2: 添加切换账号弹窗模板**

迁移 `index.vue` 中 `.switch-account-modal` 相关的模板 HTML。

- [ ] **Step 3: 验证编辑资料弹窗打开/关闭、保存用户名、修改密码功能正常**

---

### Task 5: 迁移 CSS 样式

**Files:**
- Modify: `frontend/src/components/UserProfilePanel.vue`
- Modify: `frontend/src/views/Map/index.vue`

- [ ] **Step 1: 将以下 CSS 选择器从 index.vue 的 `<style>` 迁移到 UserProfilePanel.vue 的 `<style>` 中**

需要迁移的选择器列表（约 1200 行）：
1. `.user-modal-shell` 系列（10776+）
2. `.user-sidebar` 基础样式（8913-9260）
3. `.user-profile-new` / `.user-identity-*` / `.user-name-row` / `.user-display-name`（12065+）
4. `.vip-text-badge*` / `.vip-name-row` / `.vip-username` / `.has-vip`（12128+）
5. `.icon-edit-btn` / `.user-star-id` / `.user-identity-actions` / `.switch-account-btn` / `.logout-inline-btn`（12175+）
6. `.user-bio-area` / `.bio-content` / `.bio-text` / `.bio-input-wrap` / `.bio-char-count` / `.bio-actions`（12240+）
7. `.user-content-tabs` / `.content-tab` / `.tab-count`（12309+）
8. `.user-content-list` / `.panel-loading` / `.panel-empty` / `.panel-list` / `.panel-item` / `.item-*`（12373+）
9. `.guest-profile*` / `.guest-actions*`（9076+）
10. `.user-sidebar-header` / `.close-btn`（8990+）
11. `.edit-profile-modal*` / `.modal-overlay`（12409+）
12. 浅色/深色模式适配样式（10841-11216）
13. 过渡动画 `.publish-modal-*`（8544+）— 仅 `.map-search-user-detail` 和 `.user-sidebar` 相关
14. `.search-user-profile` 相关样式（13245+）— 可删除（已被统一）

**注意**：使用非 scoped `<style>` 因为样式类名需要在子元素间共享。对于可能冲突的类名（如 `.panel-item`），使用 `.user-sidebar` 作为前缀限定作用域。

- [ ] **Step 2: 从 index.vue 中删除已迁移的 CSS**

确保不遗漏任何样式行。

- [ ] **Step 3: 从 index.vue 中删除搜索用户详情弹窗的旧 CSS（`.map-search-user-detail`, `.search-user-modal-shell` 等）**

这些样式已被 UserProfilePanel 的 `.user-sidebar` 替代。

- [ ] **Step 4: 验证所有场景下样式正确（own面板、搜索用户面板、浅色/深色模式切换）**

---

### Task 6: 清理 index.vue

**Files:**
- Modify: `frontend/src/views/Map/index.vue`

- [ ] **Step 1: 删除已迁移到组件的响应式状态变量**

从 `index.vue` 中移除所有仅用于用户面板的 ref/computed：
- `showUserSidebar` → 已通过 `v-model:visible` 由组件管理
- `userContentTab`, `postsTotalCount`, `likesTotalCount`, `favoritesTotalCount`
- `editingBioInline`, `bioDraft`, `bioInputRef`, `bioChanged`
- `isEditingUsername`, `editingUsername`, `usernameError`, `checkingUsername`, `canSaveUsername`
- `avatarInput`, `avatarPreview`, `avatarUploading`, `avatarError`, `currentAvatarFile`
- 密码编辑相关状态
- `showEditProfileModal`, `editProfileForm` 系列
- `showSwitchAccountModal`, `savedAccounts`, `isSwitchingAccount`
- `postsList`, `likesList`, `favoritesList` 及其分页/加载状态
- `showLikesPanel`, `showPostsPanel`, `showFavoritesPanel`（旧版）

**保留在 index.vue 中的**：
- `searchUserDetailOpen`, `searchedUser`, `searchedUserStories`（搜索用户场景的状态）
- 或者全部移入组件，index.vue 只传 props

- [ ] **Step 2: 删除已迁移的函数**

从 `index.vue` 中移除：
- `closeUserPanel()`, `refreshUserPanel()`
- `startEditBio()`, `cancelEditBio()`, `saveBioInline()`
- `handleOpenEditProfile()`, `handleCloseEditProfile()`
- `startEditUsername()`, `cancelEditUsername()`, `saveUsername()`
- `startEditPassword()`, `cancelEditPassword()`, `savePassword()`
- `triggerAvatarUpload()`, `handleAvatarChange()`, `uploadAvatar()`
- `handleSwitchAccount()`, `handleSwitchToAccount()`, `handleAddAccount()`
- `switchUserContentTab()`, `loadPostsData()`, `loadLikesData()`, `loadFavoritesData()`
- `handleUnlike()`, `handleDeleteStory()`, `handleToggleFavoriteFromList()`
- `normalizeUserPanelStory()`

**保留在 index.vue 中的**（仍被其他地方使用）：
- `openStoryFromCollection()` — story 面板逻辑
- `formatRelativeTime()` — 被多处使用
- `showToast()`, `showConfirm()` — 全局工具

- [ ] **Step 3: 从 index.vue 中删除搜索用户详情弹窗的模板和状态**

搜索用户详情现在由 `<UserProfilePanel :is-own-profile="false" />` 处理，可以删除：
- `.search-user-modal-shell` 模板块
- `searchedUser`, `searchedUserStories` 状态（如果移入组件）
- `openUserDetail()`, `closeUserDetail()` → 改为 `searchUserDetailOpen = true; searchedUser = user;`
- `handleUserSearchScroll()` — 如果分页已由组件管理

- [ ] **Step 4: 全面功能测试**

测试清单：
- [ ] own 模式：打开/关闭、头像上传、编辑 Bio、切换标签、滚动加载、编辑资料弹窗、切换账号弹窗、退出登录
- [ ] 搜索用户模式：点击用户卡片打开详情、只显示作品标签、只读信息
- [ ] 浅色模式：文字颜色正确、关闭按钮样式正确
- [ ] 深色模式：文字颜色正确、渐变背景正确
- [ ] 过渡动画：打开/关闭动画流畅
- [ ] 事件传递：点击故事正确打开详情面板
