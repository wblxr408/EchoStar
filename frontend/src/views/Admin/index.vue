<template>
  <div class="admin-page">
    <!-- 顶部导航 -->
    <header class="admin-header">
      <div class="header-left">
        <h1>🌟 EchoStar 管理后台</h1>
        <span class="admin-badge">管理员</span>
      </div>
      <div class="header-right">
        <button class="btn-announcement" @click="showAnnouncementModal = true">
          <span>📢</span> 发布公告
        </button>
        <button class="btn-logout" @click="handleLogout">
          <span>🚪</span> 退出登录
        </button>
      </div>
    </header>

    <div class="admin-container">
      <!-- 左侧导航菜单 -->
      <aside class="admin-sidebar">
        <nav class="nav-menu">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="nav-item"
            :class="{ 'active': currentTab === tab.key }"
            @click="currentTab = tab.key"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            <span class="nav-label">{{ tab.label }}</span>
            <span v-if="tab.badge > 0" class="nav-badge">{{ tab.badge }}</span>
          </button>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="admin-main">
        <!-- 数据概览（统计卡片，对齐 API 8.6） -->
        <section v-if="currentTab === 'statistics'" class="content-section">
          <div class="section-header">
            <h2>📊 数据概览</h2>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <h3>总用户数</h3>
                <p class="stat-value">{{ stats.totalUsers }}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📖</div>
              <div class="stat-info">
                <h3>总故事数</h3>
                <p class="stat-value">{{ stats.totalStories }}</p>
              </div>
            </div>
            <div class="stat-card success">
              <div class="stat-icon">🌍</div>
              <div class="stat-info">
                <h3>公开故事</h3>
                <p class="stat-value">{{ stats.publicStories }}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏳</div>
              <div class="stat-info">
                <h3>时光胶囊</h3>
                <p class="stat-value">{{ stats.timeCapsules }}</p>
              </div>
            </div>
            <div class="stat-card warning">
              <div class="stat-icon">👻</div>
              <div class="stat-info">
                <h3>已隐藏故事</h3>
                <p class="stat-value">{{ stats.shadowbannedStories }}</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <h3>今日新增</h3>
                <p class="stat-value">{{ stats.todayStories }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 故事管理（内容管理，API 8.1-8.3） -->
        <section v-if="currentTab === 'stories'" class="content-section">
          <div class="section-header">
            <h2>✨ 故事管理</h2>
            <div class="filter-bar">
              <select v-model="storyFilter" class="filter-select">
                <option value="all">全部故事</option>
                <option value="recommended">已推荐</option>
                <option value="shadowbanned">已隐藏</option>
              </select>
              <button class="btn-primary" @click="refreshStories">
                <span>🔄</span> 刷新
              </button>
            </div>
          </div>

          <div class="stories-grid">
            <div
              v-for="story in filteredStories"
              :key="story.id"
              class="story-card"
              :class="{
                'is-shadowbanned': story.isShadowbanned,
                'has-story-badge': story.isShadowbanned || story.isRecommended
              }"
              @click="openStoryDetail(story.id)"
            >
              <div class="story-badges">
                <span v-if="story.isRecommended && !story.isShadowbanned" class="badge recommended">⭐ 已推荐</span>
                <span v-if="story.isShadowbanned" class="badge shadowbanned">👻 已隐藏</span>
              </div>
              <div class="story-content">
                <p class="story-text" :title="story.content">{{ story.content }}</p>
                <div class="story-meta">
                  <div class="story-tags">
                    <span class="emotion-tag">{{ story.emotionTag || story.emotion }}</span>
                    <span class="location-tag" :title="story.locationName || formatLocation(story.location)">
                      📍 {{ story.locationName || formatLocation(story.location) }}
                    </span>
                  </div>
                  <div class="story-stats">
                    <span class="story-stat-item">
                      <span class="story-stat-label">点赞</span>
                      <span class="story-stat-value">{{ story.likeCount }}</span>
                    </span>
                    <span class="story-stat-item">
                      <span class="story-stat-label">评论</span>
                      <span class="story-stat-value">{{ story.commentCount }}</span>
                    </span>
                    <span class="story-stat-item">
                      <span class="story-stat-label">收藏</span>
                      <span class="story-stat-value">{{ story.favoriteCount }}</span>
                    </span>
                    <span class="story-stat-item">
                      <span class="story-stat-label">浏览</span>
                      <span class="story-stat-value">{{ story.viewCount }}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div class="story-actions" @click.stop>
                <!-- API 8.1 推荐 -->
                <button
                  v-if="story.isRecommended && !story.isShadowbanned"
                  class="btn-action unrecommend"
                  @click="handleUnrecommendStory(story.id)"
                >
                  ⭐ 取消推荐
                </button>
                <button
                  v-else-if="!story.isShadowbanned"
                  class="btn-action recommend"
                  @click="handleRecommendStory(story.id)"
                >
                  ⭐ 推荐
                </button>
                <!-- API 8.2 Shadowban -->
                <button
                  v-if="!story.isShadowbanned"
                  class="btn-action shadowban"
                  @click="handleShadowbanStory(story.id)"
                >
                  👻 隐藏
                </button>
                <!-- API 8.3 恢复 -->
                <button
                  v-if="story.isShadowbanned"
                  class="btn-action restore"
                  @click="handleRestoreStory(story.id)"
                >
                  ↩️ 恢复
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 用户管理（API 8.4-8.5） -->
        <section v-if="currentTab === 'users'" class="content-section">
          <div class="section-header">
            <h2>👥 用户管理</h2>
            <div class="filter-tabs">
              <button
                v-for="tab in userTabs"
                :key="tab.key"
                class="filter-btn"
                :class="{ 'active': userFilter === tab.key }"
                @click="userFilter = tab.key"
              >
                {{ tab.label }} ({{ tab.count }})
              </button>
            </div>
          </div>

          <!-- 封禁账号池 -->
          <div v-if="userFilter === 'banned'" class="users-list">
            <div class="list-header">
              <h3>🚫 封禁账号池</h3>
              <p class="list-desc">被封禁的用户状态变为 deleted，无法进行任何操作</p>
            </div>
            <table class="users-table">
              <thead>
                <tr>
                  <th>用户信息</th>
                  <th>封禁原因</th>
                  <th>封禁时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in bannedUsers" :key="user.id">
                  <td>
                    <div class="user-cell">
                      <img :src="user.avatar" class="user-avatar">
                      <div class="user-info">
                        <span class="user-name">{{ user.name }}</span>
                        <span class="user-email">{{ user.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.banReason }}</td>
                  <td>{{ formatShortTime(user.bannedAt) }}</td>
                  <td>
                    <!-- API 8.5 解封 -->
                    <button class="btn-unban" @click="handleUnbanUser(user.id)">
                      解封
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 正常用户 -->
          <div v-if="userFilter === 'normal'" class="users-list">
            <div class="search-bar">
              <input v-model="userSearch" placeholder="搜索用户..." class="search-input">
            </div>
            <table class="users-table">
              <thead>
                <tr>
                  <th>用户信息</th>
                  <th>发布故事</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredNormalUsers" :key="user.id">
                  <td>
                    <div class="user-cell">
                      <img :src="user.avatar" class="user-avatar">
                      <div class="user-info">
                        <span class="user-name">{{ user.name }}</span>
                        <span class="user-email">{{ user.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.storyCount }}</td>
                  <td>{{ formatShortTime(user.createdAt) }}</td>
                  <td>
                    <!-- API 8.4 封禁 -->
                    <button class="btn-ban" @click="showBanDialog(user.id)">
                      封禁
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 举报处理（API 9.3-9.5） -->
        <section v-if="currentTab === 'reports'" class="content-section">
          <div class="section-header">
            <h2>🚨 举报处理中心</h2>
            <div class="filter-tabs">
              <button
                v-for="filter in reportFilters"
                :key="filter.key"
                class="filter-btn"
                :class="{ 'active': reportFilter === filter.key }"
                @click="reportFilter = filter.key"
              >
                {{ filter.label }} ({{ filter.count }})
              </button>
            </div>
          </div>

          <div class="reports-list">
            <div v-for="report in filteredReports" :key="report.id" class="report-card">
              <div class="report-header">
                <div class="report-type" :class="report.targetType">
                  {{ report.targetType === 'story' ? '📝 故事' : '💬 评论' }}
                </div>
                <span class="report-time">{{ formatShortTime(report.createdAt) }}</span>
              </div>

              <div class="report-content">
                <div class="story-preview">
                  <div class="story-info">
                    <p class="story-text">{{ report.target?.content || '内容已删除' }}</p>
                    <div class="story-meta">
                      <span>👤 用户ID: {{ report.target?.userId }}</span>
                    </div>
                  </div>
                </div>

                <div class="report-reason">
                  <strong>举报原因：</strong>{{ report.reason }}
                </div>

                <div class="reporter-info">
                  <span>举报人：{{ report.reporter?.username || '匿名' }}</span>
                </div>
              </div>

              <div class="report-actions">
                <template v-if="report.status === 'approved'">
                  <span class="report-status approved">已批准</span>
                  <button class="btn-action restore" @click="handleRestoreReport(report.id)">
                    恢复待处理
                  </button>
                </template>
                <template v-else-if="report.status === 'rejected'">
                  <span class="report-status rejected">已驳回</span>
                  <button class="btn-action restore" @click="handleRestoreReport(report.id)">
                    恢复待处理
                  </button>
                </template>
                <template v-else>
                  <!-- API 9.4 驳回举报 -->
                  <button class="btn-action dismiss" @click="handleDismissReport(report.id)">
                    驳回举报
                  </button>
                  <!-- API 9.4 批准举报 -->
                  <button class="btn-action approve" @click="handleApproveReport(report.id)">
                    批准举报
                  </button>
                </template>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- 故事详情弹窗 -->
    <div v-if="showStoryDetail" class="modal-overlay" @click.self="showStoryDetail = false">
      <div class="story-detail-modal">
        <!-- 关闭按钮 -->
        <button class="detail-close" @click="showStoryDetail = false">&times;</button>

        <!-- 加载中 -->
        <div v-if="!storyDetail" class="detail-loading">
          <div class="loading-spinner"></div>
          <p>加载故事详情中...</p>
        </div>

        <!-- 详情内容 -->
        <div v-else-if="storyDetail" class="detail-body">
          <!-- 图片轮播 -->
          <div v-if="storyDetail.images?.length" class="detail-images">
            <img :src="storyDetail.images[currentImageIndex]" alt="故事图片">
            <div v-if="storyDetail.images.length > 1" class="image-nav">
              <button class="image-btn" @click="currentImageIndex = Math.max(0, currentImageIndex - 1)">&lt;</button>
              <span class="image-counter">{{ currentImageIndex + 1 }} / {{ storyDetail.images.length }}</span>
              <button class="image-btn" @click="currentImageIndex = Math.min(storyDetail.images.length - 1, currentImageIndex + 1)">&gt;</button>
            </div>
          </div>

          <!-- 作者信息 -->
          <div class="detail-author">
            <img :src="storyDetail.author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" class="detail-avatar">
            <div class="detail-author-info">
              <span class="detail-username">{{ storyDetail.author?.username || '未知用户' }}</span>
              <span class="detail-time">{{ formatShortTime(storyDetail.createdAt) }}</span>
            </div>
            <div class="detail-badges">
              <span v-if="storyDetail.isRecommended && storyDetail.visibility !== 'shadowban'" class="badge-sm recommended">⭐ 已推荐</span>
              <span v-if="storyDetail.visibility === 'shadowban'" class="badge-sm shadowbanned">👻 已隐藏</span>
              <span v-if="storyDetail.isTimeCapsule" class="badge-sm capsule">⏳ 时光胶囊</span>
            </div>
          </div>

          <!-- 标签信息 -->
          <div class="detail-tags">
            <span class="detail-tag emotion">{{ storyDetail.emotionTag }}</span>
            <span v-if="storyDetail.location" class="detail-tag location">📍 {{ formatLocation(storyDetail.location) }}</span>
          </div>

          <!-- 时光胶囊倒计时 -->
          <div v-if="storyDetail.isTimeCapsule && storyDetail.unlockAt" class="detail-capsule-info">
            <div class="capsule-lock">
              <span>🔒 时光胶囊将在以下时间解锁：</span>
              <strong>{{ formatShortTime(storyDetail.unlockAt) }}</strong>
            </div>
            <p class="capsule-tip">解锁前内容不可见</p>
          </div>

          <!-- 故事正文 -->
          <div class="detail-text">
            <p v-if="storyDetail.content">{{ storyDetail.content }}</p>
            <p v-else class="text-locked">🔒 时光胶囊尚未解锁，内容暂不可见</p>
          </div>

          <!-- 数据统计 -->
          <div class="detail-stats">
            <div class="detail-stat">
              <span class="stat-icon">❤️</span>
              <span class="stat-num">{{ storyDetail.likeCount || 0 }}</span>
              <span class="stat-label">点赞</span>
            </div>
            <div class="detail-stat">
              <span class="stat-icon">💬</span>
              <span class="stat-num">{{ storyDetail.commentCount || 0 }}</span>
              <span class="stat-label">评论</span>
            </div>
            <div class="detail-stat">
              <span class="stat-icon">⭐</span>
              <span class="stat-num">{{ storyDetail.favoriteCount || 0 }}</span>
              <span class="stat-label">收藏</span>
            </div>
            <div class="detail-stat">
              <span class="stat-icon">👁️</span>
              <span class="stat-num">{{ storyDetail.viewCount || 0 }}</span>
              <span class="stat-label">浏览</span>
            </div>
          </div>

          <!-- 管理操作 -->
          <div class="detail-actions">
            <button
              v-if="storyDetail.isRecommended && storyDetail.visibility !== 'shadowban'"
              class="detail-btn unrecommend"
              @click="handleUnrecommendFromDetail(storyDetail.id)"
            >
              ⭐ 取消推荐
            </button>
            <button
              v-else-if="storyDetail.visibility !== 'shadowban'"
              class="detail-btn recommend"
              @click="handleRecommendFromDetail(storyDetail.id)"
            >
              ⭐ 推荐
            </button>
            <button
              v-if="storyDetail.visibility !== 'shadowban'"
              class="detail-btn shadowban"
              @click="handleShadowbanFromDetail(storyDetail.id)"
            >
              👻 隐藏
            </button>
            <button
              v-if="storyDetail.visibility === 'shadowban'"
              class="detail-btn restore"
              @click="handleRestoreFromDetail(storyDetail.id)"
            >
              ↩️ 恢复
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 封禁弹窗（API 8.4） -->
    <div v-if="showBanModal" class="modal-overlay" @click.self="showBanModal = false">
      <div class="modal-content">
        <h3>🚫 封禁账号</h3>
        <p>确定要封禁用户 <strong>{{ selectedUser?.name }}</strong> 吗？</p>
        <div class="form-group">
          <label>封禁原因</label>
          <select v-model="banReason">
            <option value="spam">垃圾广告</option>
            <option value="abuse">恶意攻击</option>
            <option value="illegal">违法违规</option>
            <option value="cheat">作弊行为</option>
            <option value="other">其他原因</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showBanModal = false">取消</button>
          <button class="btn-confirm" @click="confirmBan">确认封禁</button>
        </div>
      </div>
    </div>
    <!-- 发布公告模态框 -->
    <transition name="ann-modal-fade">
      <div
        v-if="showAnnouncementModal"
        class="ann-modal-backdrop"
        @click.self="cancelAnnouncement"
      >
        <div class="ann-modal" @click.stop>
          <div class="ann-modal-header">
            <h3>发布公告</h3>
            <button class="ann-close-btn" @click="cancelAnnouncement">&times;</button>
          </div>
          <div class="ann-modal-body">
            <div class="ann-form-group">
              <label>公告类型</label>
              <select v-model="announcementForm.type" class="ann-select">
                <option value="info">📢 通知</option>
                <option value="warning">⚠️ 警告</option>
                <option value="feature">✨ 更新</option>
                <option value="emotion">💝 互动</option>
              </select>
            </div>
            <div class="ann-form-group">
              <label>标题</label>
              <input
                v-model="announcementForm.title"
                type="text"
                class="ann-input"
                placeholder="请输入公告标题"
                maxlength="100"
              />
            </div>
            <div class="ann-form-group">
              <label>内容</label>
              <textarea
                v-model="announcementForm.content"
                class="ann-textarea"
                placeholder="请输入公告内容"
                rows="5"
                maxlength="1000"
              ></textarea>
            </div>
          </div>
          <div class="ann-modal-footer">
            <button class="ann-btn ann-btn-cancel" @click="cancelAnnouncement">取消</button>
            <button
              class="ann-btn ann-btn-submit"
              :disabled="announcementSubmitting || !announcementForm.title.trim() || !announcementForm.content.trim()"
              @click="submitAnnouncement"
            >
              {{ announcementSubmitting ? '发布中...' : '发布' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { adminApi } from '@/api/admin';
import { reportApi } from '@/api/report';
import { storyApi } from '@/api/story';
import { mapApi } from '@/api/map';
import { formatShortTime } from '@/utils/time';
import { showToast, showConfirm, showPrompt } from '../../composables/useToast.js';

const router = useRouter();
const userStore = useUserStore();

// 当前选中的标签页
const currentTab = ref('statistics');

// 统计数据自动刷新定时器
let statisticsRefreshTimer = null;

// 标签配置（删除公告，添加数据概览）
const tabs = ref([
  { key: 'statistics', label: '数据概览', icon: '📊', badge: 0 },
  { key: 'stories', label: '故事管理', icon: '✨', badge: 0 },
  { key: 'users', label: '用户管理', icon: '👥', badge: 0 },
  { key: 'reports', label: '举报处理', icon: '🚨', badge: 0 }
]);

// ============ 数据统计（API 8.6） ============
const stats = ref({
  totalUsers: 0,
  totalStories: 0,
  publicStories: 0,
  timeCapsules: 0,
  shadowbannedStories: 0,
  todayStories: 0
});

async function loadStatistics() {
  try {
    const response = await adminApi.getStatistics();
    const data = response.data || response;
    if (data) {
      stats.value = { ...stats.value, ...data };
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 清除统计刷新定时器
function clearStatisticsTimer() {
  if (statisticsRefreshTimer) {
    clearInterval(statisticsRefreshTimer);
    statisticsRefreshTimer = null;
  }
}

// 启动统计刷新定时器
function startStatisticsTimer() {
  clearStatisticsTimer();
  statisticsRefreshTimer = setInterval(() => {
    loadStatistics();
  }, 2 * 60 * 1000); // 2分钟刷新一次
}

// 监听标签页切换
watch(currentTab, (newTab) => {
  if (newTab === 'statistics') {
    loadStatistics();
    startStatisticsTimer();
  } else {
    clearStatisticsTimer();
  }
});

// ============ 故事管理（API 2.10, 8.1-8.3） ============
const storyFilter = ref('all');
const stories = ref([]);

const filteredStories = computed(() => {
  if (storyFilter.value === 'recommended') {
    return stories.value.filter(s => s.isRecommended);
  }
  if (storyFilter.value === 'shadowbanned') {
    return stories.value.filter(s => s.visibility === 'shadowban');
  }
  return stories.value;
});

function toCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
}

function normalizeAdminStory(story) {
  return {
    ...story,
    likeCount: toCount(story.likeCount ?? story.likes),
    commentCount: toCount(story.commentCount ?? story.comments),
    favoriteCount: toCount(story.favoriteCount ?? story.favorites),
    viewCount: toCount(story.viewCount ?? story.views),
    isRecommended: Boolean(story.isRecommended),
    isShadowbanned: story.visibility === 'shadowban'
  };
}

async function loadStories() {
  try {
    const params = {};
    if (storyFilter.value === 'shadowbanned') {
      params.visibility = 'shadowban';
    }
    const response = await storyApi.getAdminStories(params);
    const data = response.data || response;
    stories.value = (data?.stories || []).map(normalizeAdminStory);
  } catch (error) {
    console.error('加载故事列表失败:', error);
  }
}

function refreshStories() {
  loadStories();
}

// ============ 故事详情弹窗 ============
const showStoryDetail = ref(false);
const storyDetail = ref(null);
const storyDetailLoading = ref(false);
const currentImageIndex = ref(0);

async function openStoryDetail(storyId) {
  showStoryDetail.value = true;
  storyDetailLoading.value = true;
  storyDetail.value = null;
  currentImageIndex.value = 0;
  try {
    const response = await storyApi.getStoryById(storyId);
    const data = response.data || response;
    storyDetail.value = {
      ...data,
      likeCount: toCount(data.likeCount),
      commentCount: toCount(data.commentCount),
      favoriteCount: toCount(data.favoriteCount),
      viewCount: toCount(data.viewCount),
      isRecommended: Boolean(data.isRecommended)
    };
  } catch (error) {
    console.error('加载故事详情失败:', error);
    showToast('加载故事详情失败', 'error');
    showStoryDetail.value = false;
  } finally {
    storyDetailLoading.value = false;
  }
}

function formatLocation(loc) {
  if (typeof loc === 'string') return loc;
  if (loc?.address) return loc.address;
  if (loc?.lng && loc?.lat) return `${Number(loc.lng).toFixed(4)}, ${Number(loc.lat).toFixed(4)}`;
  return '未知位置';
}

async function handleRecommendFromDetail(storyId) {
  const reason = await showPrompt('请输入推荐理由：', {
    theme: 'light',
    placeholder: '例如：内容优质、值得优先展示'
  });
  if (reason === null || !reason.trim()) return;
  try {
    const response = await adminApi.recommend(storyId, reason);
    const data = response.data || response;
    if (storyDetail.value && data.isRecommended !== undefined) {
      storyDetail.value.isRecommended = data.isRecommended;
    }
    const story = stories.value.find(s => s.id === storyId);
    if (story && data.isRecommended !== undefined) {
      story.isRecommended = data.isRecommended;
    }
    showToast('推荐成功', 'success');
  } catch (error) {
    console.error('推荐失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

async function handleUnrecommendFromDetail(storyId) {
  if (!await showConfirm('确定取消推荐该故事？')) return;
  try {
    const response = await adminApi.unrecommend(storyId);
    const data = response.data || response;
    if (storyDetail.value && data.isRecommended !== undefined) {
      storyDetail.value.isRecommended = data.isRecommended;
    }
    const story = stories.value.find(s => s.id === storyId);
    if (story && data.isRecommended !== undefined) {
      story.isRecommended = data.isRecommended;
    }
    showToast('已取消推荐', 'success');
  } catch (error) {
    console.error('取消推荐失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

async function handleShadowbanFromDetail(storyId) {
  const reason = await showPrompt('请输入隐藏理由：', {
    theme: 'light',
    placeholder: '例如：包含违规内容，需要临时隐藏'
  });
  if (reason === null || !reason.trim()) return;
  try {
    await adminApi.shadowban(storyId, reason);
    if (storyDetail.value) {
      storyDetail.value.visibility = 'shadowban';
      storyDetail.value.isRecommended = false;
    }
    const story = stories.value.find(s => s.id === storyId);
    if (story) {
      story.isShadowbanned = true;
      story.isRecommended = false;
    }
    showToast('已隐藏该故事', 'success');
  } catch (error) {
    console.error('隐藏失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

async function handleRestoreFromDetail(storyId) {
  try {
    await adminApi.restore(storyId);
    if (storyDetail.value) {
      storyDetail.value.visibility = 'public';
      storyDetail.value.isRecommended = false;
    }
    const story = stories.value.find(s => s.id === storyId);
    if (story) {
      story.isShadowbanned = false;
      story.isRecommended = false;
    }
    showToast('已恢复该故事', 'success');
  } catch (error) {
    console.error('恢复失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// API 8.1 推荐
async function handleRecommendStory(storyId) {
  const reason = await showPrompt('请输入推荐理由：', {
    theme: 'light',
    placeholder: '例如：内容优质、值得优先展示'
  });
  if (reason === null || !reason.trim()) return;
  try {
    const response = await adminApi.recommend(storyId, reason);
    const data = response.data || response;
    const story = stories.value.find(s => s.id === storyId);
    if (story && data.isRecommended !== undefined) {
      story.isRecommended = data.isRecommended;
    }
    showToast('推荐成功', 'success');
  } catch (error) {
    console.error('推荐失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// 取消推荐
async function handleUnrecommendStory(storyId) {
  if (!await showConfirm('确定取消推荐该故事？')) return;
  try {
    const response = await adminApi.unrecommend(storyId);
    const data = response.data || response;
    const story = stories.value.find(s => s.id === storyId);
    if (story && data.isRecommended !== undefined) {
      story.isRecommended = data.isRecommended;
    }
    showToast('已取消推荐', 'success');
  } catch (error) {
    console.error('取消推荐失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// API 8.2 Shadowban
async function handleShadowbanStory(storyId) {
  const reason = await showPrompt('请输入隐藏理由：', {
    theme: 'light',
    placeholder: '例如：包含违规内容，需要临时隐藏'
  });
  if (reason === null || !reason.trim()) return;
  try {
    await adminApi.shadowban(storyId, reason);
    const story = stories.value.find(s => s.id === storyId);
    if (story) {
      story.isShadowbanned = true;
      story.isRecommended = false;
    }
    showToast('已隐藏该故事', 'success');
  } catch (error) {
    console.error('隐藏失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// API 8.3 恢复
async function handleRestoreStory(storyId) {
  try {
    await adminApi.restore(storyId);
    const story = stories.value.find(s => s.id === storyId);
    if (story) {
      story.isShadowbanned = false;
      story.isRecommended = false;
    }
    showToast('已恢复该故事', 'success');
  } catch (error) {
    console.error('恢复失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// ============ 用户管理（API 1.12, 8.4-8.5） ============
const userFilter = ref('normal');
const userTabs = ref([
  { key: 'normal', label: '正常用户', count: 0 },
  { key: 'banned', label: '封禁账号', count: 0 }
]);

const bannedUsers = ref([]);
const normalUsers = ref([]);
const userSearch = ref('');

const filteredNormalUsers = computed(() => {
  if (!userSearch.value) return normalUsers.value;
  return normalUsers.value.filter(u =>
    u.username?.includes(userSearch.value) ||
    u.email?.includes(userSearch.value)
  );
});

async function loadUsers() {
  try {
    // 加载正常用户
    const normalRes = await adminApi.getUsers({ category: 'normal', pageSize: 50 });
    const normalData = normalRes.data || normalRes;
    normalUsers.value = (normalData?.users || []).map(u => ({
      id: u.id,
      name: u.username,
      email: u.email,
      avatar: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
      status: u.status,
      createdAt: u.createdAt,
      storyCount: 0 // 后端暂未返回
    }));

    // 加载封禁用户
    const bannedRes = await adminApi.getUsers({ category: 'deleted', pageSize: 50 });
    const bannedData = bannedRes.data || bannedRes;
    bannedUsers.value = (bannedData?.users || []).map(u => ({
      id: u.id,
      name: u.username,
      email: u.email,
      avatar: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
      banReason: '违规操作', // 后端暂未返回
      bannedAt: u.createdAt
    }));

    // 更新标签计数
    userTabs.value = [
      { key: 'normal', label: '正常用户', count: normalUsers.value.length },
      { key: 'banned', label: '封禁账号', count: bannedUsers.value.length }
    ];
  } catch (error) {
    console.error('加载用户列表失败:', error);
  }
}

// 封禁弹窗
const showBanModal = ref(false);
const selectedUser = ref(null);
const banReason = ref('spam');

function showBanDialog(userId) {
  selectedUser.value = normalUsers.value.find(u => u.id === userId);
  showBanModal.value = true;
}

// API 8.4 封禁用户
async function confirmBan() {
  if (!selectedUser.value) return;
  try {
    await adminApi.banUser(selectedUser.value.id, banReason.value);
    showToast(`已封禁用户: ${selectedUser.value.name}`, 'success');
    showBanModal.value = false;
    // 从正常用户列表移除，添加到封禁列表
    normalUsers.value = normalUsers.value.filter(u => u.id !== selectedUser.value.id);
    bannedUsers.value.push({
      ...selectedUser.value,
      banReason: banReason.value,
      bannedAt: new Date()
    });
    // 同步更新标签计数
    userTabs.value = [
      { key: 'normal', label: '正常用户', count: normalUsers.value.length },
      { key: 'banned', label: '封禁账号', count: bannedUsers.value.length }
    ];
  } catch (error) {
    console.error('封禁失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// API 8.5 解封用户
async function handleUnbanUser(userId) {
  try {
    await adminApi.unbanUser(userId);
    showToast('已解封用户', 'success');
    // 从封禁列表移除，添加到正常用户列表
    const user = bannedUsers.value.find(u => u.id === userId);
    if (user) {
      bannedUsers.value = bannedUsers.value.filter(u => u.id !== userId);
      normalUsers.value.push({
        ...user,
        storyCount: user.storyCount || 0,
        createdAt: user.createdAt || new Date(),
        banReason: undefined,
        bannedAt: undefined
      });
    }
    // 同步更新标签计数
    userTabs.value = [
      { key: 'normal', label: '正常用户', count: normalUsers.value.length },
      { key: 'banned', label: '封禁账号', count: bannedUsers.value.length }
    ];
  } catch (error) {
    console.error('解封失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// ============ 举报处理（API 9.3-9.5） ============
const reportFilter = ref('pending');
const reportFilters = ref([
  { key: 'pending', label: '待处理', count: 0 },
  { key: 'approved', label: '已批准', count: 0 },
  { key: 'rejected', label: '已驳回', count: 0 }
]);

const reports = ref([]);

const filteredReports = computed(() => {
  if (reportFilter.value === 'pending') {
    return reports.value.filter(r => r.status === 'pending');
  }
  if (reportFilter.value === 'approved') {
    return reports.value.filter(r => r.status === 'approved');
  }
  if (reportFilter.value === 'rejected') {
    return reports.value.filter(r => r.status === 'rejected');
  }
  return reports.value;
});

async function loadReports() {
  try {
    // 使用新的API分别获取故事和评论的举报
    const [storyRes, commentRes] = await Promise.all([
      reportApi.getStoryReports({ status: 'pending', page: 1, limit: 50 }),
      reportApi.getCommentReports({ status: 'pending', page: 1, limit: 50 })
    ]);

    const storyData = storyRes.data || storyRes;
    const commentData = commentRes.data || commentRes;
    const allReports = [
      ...(storyData?.reports || []),
      ...(commentData?.reports || [])
    ];

    reports.value = allReports;
    const pending = allReports.filter(r => r.status === 'pending').length;
    const approved = allReports.filter(r => r.status === 'approved').length;
    const rejected = allReports.filter(r => r.status === 'rejected').length;
    reportFilters.value = [
      { key: 'pending', label: '待处理', count: pending },
      { key: 'approved', label: '已批准', count: approved },
      { key: 'rejected', label: '已驳回', count: rejected }
    ];
    // 更新标签 badge
    const reportsTab = tabs.value.find(t => t.key === 'reports');
    if (reportsTab) reportsTab.badge = pending;
  } catch (error) {
    console.error('加载举报列表失败:', error);
  }
}

// API 9.4 驳回举报
async function handleDismissReport(reportId) {
  try {
    await reportApi.handle(reportId, 'reject');
    const report = reports.value.find(r => r.id === reportId);
    if (report) {
      report.status = 'rejected';
      // 更新计数
      const pendingCount = reports.value.filter(r => r.status === 'pending').length;
      const rejectedCount = reports.value.filter(r => r.status === 'rejected').length;
      reportFilters.value = [
        { key: 'pending', label: '待处理', count: pendingCount },
        { key: 'approved', label: '已批准', count: reportFilters.value.find(f => f.key === 'approved').count },
        { key: 'rejected', label: '已驳回', count: rejectedCount }
      ];
      // 更新标签 badge
      const reportsTab = tabs.value.find(t => t.key === 'reports');
      if (reportsTab) reportsTab.badge = pendingCount;
    }
    showToast('已驳回举报', 'success');
  } catch (error) {
    console.error('驳回举报失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// API 9.4 批准举报
async function handleApproveReport(reportId) {
  try {
    await reportApi.handle(reportId, 'approve');
    const report = reports.value.find(r => r.id === reportId);
    if (report) {
      report.status = 'approved';
      // 更新计数
      const pendingCount = reports.value.filter(r => r.status === 'pending').length;
      const approvedCount = reports.value.filter(r => r.status === 'approved').length;
      reportFilters.value = [
        { key: 'pending', label: '待处理', count: pendingCount },
        { key: 'approved', label: '已批准', count: approvedCount },
        { key: 'rejected', label: '已驳回', count: reportFilters.value.find(f => f.key === 'rejected').count }
      ];
      // 更新标签 badge
      const reportsTab = tabs.value.find(t => t.key === 'reports');
      if (reportsTab) reportsTab.badge = pendingCount;
    }
    showToast('举报已批准，内容已处理', 'success');
  } catch (error) {
    console.error('批准举报失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// 恢复举报为待处理
async function handleRestoreReport(reportId) {
  try {
    await reportApi.handle(reportId, 'restore');
    const report = reports.value.find(r => r.id === reportId);
    if (report) {
      report.status = 'pending';
      // 更新计数
      const pendingCount = reports.value.filter(r => r.status === 'pending').length;
      const approvedCount = reports.value.filter(r => r.status === 'approved').length;
      const rejectedCount = reports.value.filter(r => r.status === 'rejected').length;
      reportFilters.value = [
        { key: 'pending', label: '待处理', count: pendingCount },
        { key: 'approved', label: '已批准', count: approvedCount },
        { key: 'rejected', label: '已驳回', count: rejectedCount }
      ];
      // 更新标签 badge
      const reportsTab = tabs.value.find(t => t.key === 'reports');
      if (reportsTab) reportsTab.badge = pendingCount;
    }
    showToast('举报已恢复为待处理', 'success');
  } catch (error) {
    console.error('恢复举报失败:', error);
    showToast(error.message || '操作失败', 'error');
  }
}

// 初始化
onMounted(() => {
  loadStatistics();
  loadStories();
  loadUsers();
  loadReports();
  // 初始页面是统计页，启动定时器
  if (currentTab.value === 'statistics') {
    startStatisticsTimer();
  }
});

// 组件卸载时清理定时器
onUnmounted(() => {
  clearStatisticsTimer();
});

// 退出登录
// ============ 发布公告 ============
const showAnnouncementModal = ref(false);
const announcementForm = ref({ title: '', content: '', type: 'info' });
const announcementSubmitting = ref(false);

async function submitAnnouncement() {
  if (!announcementForm.value.title.trim() || !announcementForm.value.content.trim()) return;
  announcementSubmitting.value = true;
  try {
    await mapApi.createAnnouncement(announcementForm.value);
    showAnnouncementModal.value = false;
    announcementForm.value = { title: '', content: '', type: 'info' };
    showToast('公告发布成功', 'success');
  } catch (error) {
    console.error('发布公告失败:', error);
    showToast('发布公告失败', 'error');
  } finally {
    announcementSubmitting.value = false;
  }
}

function cancelAnnouncement() {
  showAnnouncementModal.value = false;
  announcementForm.value = { title: '', content: '', type: 'info' };
}

function handleLogout() {
  userStore.logout();
  router.push('/');
}
</script>

<style scoped>
.admin-page {
  width: 100%;
  height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部导航 */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: linear-gradient(90deg, #2d8a6e 0%, #3b82f6 50%, #ec4899 100%);
  color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-header h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.admin-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.btn-secondary, .btn-logout {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary:hover, .btn-logout:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* 主容器 */
.admin-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 侧边栏 */
.admin-sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.nav-menu {
  padding: 0 12px;
}

.nav-item {
  width: 100%;
  padding: 14px 16px;
  margin-bottom: 8px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: #666;
  transition: all 0.3s;
  position: relative;
}

.nav-item:hover {
  background: #f5f7fa;
  color: #333;
}

.nav-item.active {
  background: linear-gradient(135deg, #ffdb64 0%, #ffcc00 100%);
  color: #443e3e;
  font-weight: 500;
}

.nav-icon {
  font-size: 20px;
}

.nav-badge {
  position: absolute;
  right: 12px;
  background: #ff4757;
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 主内容区 */
.admin-main {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card.warning .stat-icon {
  background: #fff3cd;
}

.stat-card.success .stat-icon {
  background: #d4edda;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: #e8eaff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-info h3 {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

/* 内容区块 */
.content-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: #f5f7fa;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  background: #e8f5e9;
  color: #2d8a6e;
}

.filter-btn.active {
  background: linear-gradient(135deg, #ffdb64 0%, #ffcc00 100%);
  color: #443e3e;
  font-weight: 500;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: white;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 16px;
  background: linear-gradient(135deg, #ffdb64 0%, #ffcc00 100%);
  color: #443e3e;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

/* 故事网格 */
.stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: stretch;
  gap: 20px;
}

.story-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 340px;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  overflow: hidden;
  background: white;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.story-image {
  position: relative;
  height: 160px;
}

.story-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
  z-index: 2;
  pointer-events: none;
}

.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.badge.recommended {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: white;
}

.badge.shadowbanned {
  background: rgba(71, 85, 105, 0.92);
  color: white;
}

.story-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 18px 16px 14px;
}

.story-card.has-story-badge .story-content {
  padding-top: 52px;
}

.story-card .story-text {
  margin: 0;
  flex: 1 1 auto;
  color: #243045;
  font-size: 14px;
  line-height: 1.65;
  word-break: break-word;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
}

.story-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
}

.story-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
}

.emotion-tag, .location-tag {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #2d8a6e;
  background: #e8f5e9;
  padding: 4px 10px;
  border-radius: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-tag {
  max-width: 100%;
  flex: 1 1 100%;
}

.story-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 0;
}

.story-stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
}

.story-stat-label {
  font-size: 12px;
}

.story-stat-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.story-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 16px 16px;
  border-top: 1px solid #f0f0f0;
}

.story-actions .btn-action:only-child {
  grid-column: 1 / -1;
}

.btn-action {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-action.recommend {
  background: #fff3cd;
  color: #856404;
}

.btn-action.unrecommend {
  background: #ffeaa7;
  color: #6c5ce7;
}

.btn-action.shadowban{
  background: #e8f5e9;
  color: #2d8a6e;
}

.btn-action.restore {
  background: #d4edda;
  color: #155724;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 用户管理 */
.users-list {
  margin-top: 20px;
}

.list-header {
  margin-bottom: 20px;
}

.list-header h3 {
  font-size: 16px;
  margin-bottom: 6px;
}

.list-desc {
  font-size: 13px;
  color: #666;
}

.search-bar {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 300px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.users-table th {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.user-email {
  font-size: 13px;
  color: #999;
}

.btn-ban, .btn-unban {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-ban {
  background: #f8d7da;
  color: #721c24;
}

.btn-unban {
  background: #d4edda;
  color: #155724;
}

/* 举报列表 */
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-card {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  background: #fafafa;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.report-type {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.report-type.story {
  background: #e8f5e9;
  color: #2d8a6e;
}

.report-type.comment {
  background: #fff3cd;
  color: #856404;
}

.report-time {
  font-size: 13px;
  color: #999;
}

.story-preview {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.story-info {
  flex: 1;
}

.story-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.story-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.report-reason {
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

.reporter-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.report-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.report-status {
  font-size: 13px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 12px;
}

.report-status.approved {
  background: #f8d7da;
  color: #721c24;
}

.report-status.rejected {
  background: #e2e3e5;
  color: #383d41;
}

.btn-action.dismiss {
  background: #f0f0f0;
  color: #666;
}

.btn-action.approve {
  background: #f8d7da;
  color: #721c24;
}

.btn-action.restore {
  background: #d1ecf1;
  color: #0c5460;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 32px;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
}

.modal-content h3 {
  margin-bottom: 16px;
}

.modal-content p {
  margin-bottom: 20px;
  color: #666;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.form-group select {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 故事卡片可点击 */
.story-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.story-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
}

/* 故事详情弹窗 */
.story-detail-modal {
  background: white;
  border-radius: 16px;
  max-width: 560px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  padding: 0;
}

.detail-close {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 28px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 10;
  line-height: 1;
  transition: color 0.2s;
}

.detail-close:hover {
  color: #333;
}

/* 加载中 */
.detail-loading {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e0e0e0;
  border-top-color: #d4af37;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 详情内容 */
.detail-body {
  padding: 24px;
}

/* 图片 */
.detail-images {
  margin: -24px -24px 20px;
  position: relative;
}

.detail-images img {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  display: block;
}

.image-nav {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
}

.image-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 0 2px;
}

.image-counter {
  min-width: 40px;
  text-align: center;
}

/* 作者信息 */
.detail-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.detail-author-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.detail-username {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.detail-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.detail-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.badge-sm {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.badge-sm.recommended {
  background: #fff8e1;
  color: #f9a825;
}

.badge-sm.shadowbanned {
  background: #fce4ec;
  color: #c62828;
}

.badge-sm.capsule {
  background: #e8eaf6;
  color: #3949ab;
}

/* 标签 */
.detail-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.detail-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
}

.detail-tag.emotion {
  color: #2d8a6e;
  background: #e8f5e9;
}

.detail-tag.location {
  color: #1565c0;
  background: #e3f2fd;
}

/* 时光胶囊 */
.detail-capsule-info {
  background: linear-gradient(135deg, #e8eaf6 0%, #ede7f6 100%);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.capsule-lock {
  font-size: 14px;
  color: #3949ab;
}

.capsule-lock strong {
  display: block;
  margin-top: 4px;
  font-size: 15px;
}

.capsule-tip {
  font-size: 12px;
  color: #7986cb;
  margin: 6px 0 0;
}

/* 正文 */
.detail-text {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-locked {
  text-align: center;
  color: #999;
  font-style: italic;
}

/* 统计 */
.detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.detail-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-stat .stat-icon {
  font-size: 18px;
}

.detail-stat .stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.detail-stat .stat-label {
  font-size: 12px;
  color: #999;
}

/* 管理操作 */
.detail-actions {
  display: flex;
  gap: 10px;
}

.detail-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-btn.recommend {
  background: #fff8e1;
  color: #f9a825;
}

.detail-btn.recommend:hover {
  background: #ffecb3;
}

.detail-btn.unrecommend {
  background: #e8eaf6;
  color: #5c6bc0;
}

.detail-btn.unrecommend:hover {
  background: #c5cae9;
}

.detail-btn.shadowban {
  background: #fce4ec;
  color: #c62828;
}

.detail-btn.shadowban:hover {
  background: #f8bbd0;
}

.detail-btn.restore {
  background: #e8f5e9;
  color: #2e7d32;
}

.detail-btn.restore:hover {
  background: #c8e6c9;
}

/* --- 发布公告按钮 --- */
.btn-announcement {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(239, 239, 241, 0.15) 0%, rgba(140, 197, 255, 0.15) 100%);
  color: #f5f5f5;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-announcement:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.28) 0%, rgba(118, 75, 162, 0.28) 100%);
  border-color: rgba(102, 126, 234, 0.5);
}

/* --- 发布公告模态框 --- */
.ann-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.ann-modal {
  width: 460px;
  max-width: calc(100vw - 40px);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 64px -16px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.ann-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid #eee;
}

.ann-modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #333;
}

.ann-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #999;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.ann-close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.ann-modal-body {
  padding: 22px;
}

.ann-form-group {
  margin-bottom: 16px;
}

.ann-form-group:last-child {
  margin-bottom: 0;
}

.ann-form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.ann-input,
.ann-textarea,
.ann-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.ann-input:focus,
.ann-textarea:focus,
.ann-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
}

.ann-textarea {
  resize: vertical;
  min-height: 90px;
}

.ann-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid #eee;
}

.ann-btn {
  padding: 9px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.ann-btn-cancel {
  background: #f5f5f5;
  color: #555;
}

.ann-btn-cancel:hover {
  background: #eaeaea;
}

.ann-btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.ann-btn-submit:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.ann-btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模态框过渡动画 */
.ann-modal-fade-enter-active,
.ann-modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.ann-modal-fade-enter-from,
.ann-modal-fade-leave-to {
  opacity: 0;
}
</style>
