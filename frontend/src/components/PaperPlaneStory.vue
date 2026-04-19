<template>
  <Teleport to="body">
    <div class="paper-plane-overlay" :class="{ dark: isDark }" @click="handleClose">
      <div class="paper-sheet" @click.stop>
        <div class="paper-texture"></div>
        <span class="tarot-suit suit-top">✦</span>
        <span class="tarot-suit suit-bottom">✦</span>
        <span class="tarot-corner corner-top-right"></span>
        <span class="tarot-corner corner-bottom-left"></span>

        <button
          type="button"
          class="close-btn"
          aria-label="关闭故事详情"
          @click="handleClose"
        >
          <span>×</span>
        </button>

        <div v-if="story.isFeatured || story.isPinned" class="story-badges">
          <span v-if="story.isPinned" class="badge pinned">置顶</span>
          <span v-if="story.isFeatured" class="badge featured">精选</span>
        </div>

        <div class="story-content-wrapper">
          <div class="story-header">
            <div class="user-info">
              <div class="avatar-shell clickable-avatar" @click.stop="handleViewAuthorProfile">
                <img v-if="storyAuthorAvatar" :src="storyAuthorAvatar" :alt="storyAuthorName" class="avatar" />
                <span v-else class="avatar-fallback">{{ getInitial(storyAuthorName) }}</span>
              </div>
              <div class="user-details">
                <span class="vip-name-row" @click.stop="handleViewAuthorProfile" style="cursor:pointer"><span class="username vip-username" :class="{ 'has-vip': storyAuthorVip }">{{ storyAuthorName }}</span><span class="vip-text-badge-sm" v-if="storyAuthorVip">VIP</span></span>
                <span class="time">{{ formatRelativeTime(story.createdAt) }}</span>
              </div>
            </div>
            <span class="emotion-icon">{{ getEmotionEmoji(story.emotionTag || story.emotion) }}</span>
          </div>

          <div class="story-body">
            <div class="story-text-card">
              <p class="story-text" :style="storyFontStyle">{{ story.content }}</p>
            </div>

            <div v-if="story.images && story.images.length > 0" class="story-images">
              <img
                v-for="(image, index) in story.images"
                :key="index"
                :src="image"
                :alt="`故事图片 ${index + 1}`"
                @click="previewImage(index)"
              />
            </div>
          </div>

          <div class="story-footer">
            <div class="location">
              <span class="icon">📍</span>
              <span>{{ story.location?.address || '未知地点' }}</span>
            </div>
          </div>

          <div class="story-actions">
            <button
              type="button"
              class="action-btn like"
              :class="{ liked: isLiked, pending: likePending }"
              :disabled="likePending"
              @click="handleLike"
            >
              <span class="icon">♥</span>
              <span class="action-copy">
                <span class="action-label">共鸣</span>
                <strong class="action-count">{{ likeCount }}</strong>
              </span>
            </button>
            <button
              type="button"
              class="action-btn favorite"
              :class="{ favorited: isFavorited, pending: favoritePending }"
              :disabled="favoritePending"
              @click="handleFavorite"
            >
              <span class="icon">★</span>
              <span class="action-copy">
                <span class="action-label">收藏</span>
                <strong class="action-count">{{ favoriteCount }}</strong>
              </span>
            </button>
            <button type="button" class="action-btn comment" @click="showCommentInput = true">
              <span class="icon">✎</span>
              <span class="action-copy">
                <span class="action-label">评论</span>
                <strong class="action-count">{{ commentCount }}</strong>
              </span>
            </button>
            <button type="button" class="action-btn report" @click="openReportModal">
              <span class="icon">⚑</span>
              <span class="action-copy">
                <span class="action-label">举报</span>
                <strong class="action-count compact">反馈</strong>
              </span>
            </button>
          </div>

          <div class="comments-section">
            <h4 class="comments-title">评论 ({{ commentCount }})</h4>

            <div v-if="showCommentInput" class="comment-input-area">
              <textarea
                v-model="newComment"
                placeholder="写下你的评论..."
                rows="2"
                class="comment-textarea"
                :style="getCommentFontStyle({ fontFamily: commentFontFamily || readDefaultFontFromCookie(), fontEffect: commentFontEffect || readDefaultFontEffectFromCookie() })"
              ></textarea>
              <div class="comment-actions">
                <div class="comment-actions__left">
                  <button type="button" class="btn-comment-bg"
                    :class="{ 'btn-comment-bg--locked': !vipStore.isVipActive }"
                    @click="vipStore.isVipActive ? (showCommentFontPicker = !showCommentFontPicker) : emit('request-vip')">
                    {{ vipStore.isVipActive ? '🔤 个性字体' : '🔒 个性字体' }}
                  </button>
                  <button
                    type="button"
                    class="btn-comment-bg"
                    :class="{ 'btn-comment-bg--locked': !vipStore.isVipActive }"
                    @click="handleCommentBgClick"
                  >
                    {{ vipStore.isVipActive ? '🎨 更改评论背景' : '🔒 更改评论背景' }}
                  </button>
                </div>
                <div class="comment-actions__right">
                  <button type="button" class="btn-cancel" @click="showCommentInput = false">取消</button>
                  <button
                    type="button"
                    class="btn-submit"
                    :disabled="!newComment.trim()"
                    @click="submitComment"
                  >
                    发布
                  </button>
                </div>
              </div>
            </div>

            <div class="comments-list">
              <div v-for="comment in comments" :key="comment.id"
                class="comment-item"
                :class="{ 'is-vip-card': comment.vip, 'has-custom-bg': !!getCommentBgStyle(comment) }"
                :style="getCommentBgStyle(comment)"
              >
                <div class="comment-avatar clickable-avatar" @click.stop="handleViewCommentProfile(comment)">
                  <img v-if="comment.avatar" :src="comment.avatar" :alt="comment.author" />
                  <span v-else>{{ getInitial(comment.author) }}</span>
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="vip-name-row" @click.stop="handleViewCommentProfile(comment)" style="cursor:pointer"><span class="comment-author vip-username" :class="{ 'has-vip': comment.vip }">{{ comment.author }}</span><span class="vip-text-badge-sm" v-if="comment.vip">VIP</span></span>
                    <span class="comment-time">{{ formatRelativeTime(comment.createdAt) }}</span>
                  </div>
                  <p class="comment-text" :style="getCommentFontStyle(comment)">{{ comment.content }}</p>
                </div>
              </div>
              <div v-if="comments.length === 0" class="no-comments">
                还没有评论，来说点什么吧。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body" v-if="showReportModal">
      <div class="report-modal-overlay" :class="{ dark: isDark }" @click.self="closeReportModal">
        <div class="report-modal-content">
          <span class="tarot-suit suit-top report-suit">✦</span>
          <span class="tarot-suit suit-bottom report-suit">✦</span>
          <span class="tarot-corner corner-top-right"></span>
          <span class="tarot-corner corner-bottom-left"></span>

          <div class="report-modal-scroll">
            <header class="report-card-headline">
              <p class="report-kicker">Report</p>
              <h3>举报内容</h3>
              <p class="report-desc">请选择最接近的举报原因，并补充一点说明。</p>
            </header>

            <section class="report-panel">
              <div class="report-panel-head">
                <span class="report-panel-label">第一步</span>
                <strong>选择举报原因</strong>
              </div>
              <div class="report-reasons">
                <label v-for="reason in reportReasons" :key="reason.key" class="reason-option">
                  <input
                    v-model="selectedReportReason"
                    type="radio"
                    :value="reason.key"
                    name="reportReason"
                  >
                  <span>{{ reason.label }}</span>
                </label>
              </div>
              <p class="report-helper">选择越准确，越有助于更快处理。</p>
            </section>

            <section class="report-panel">
              <div class="report-panel-head">
                <span class="report-panel-label">第二步</span>
                <strong>补充说明</strong>
              </div>
              <textarea
                v-model="reportDescription"
                rows="5"
                maxlength="500"
                class="report-textarea"
                placeholder="请详细描述举报原因，不少于 10 个字..."
              ></textarea>
              <div class="report-footnote">
                <span>至少 10 个字，最多 500 个字</span>
                <strong>{{ reportDescription.length }}/500</strong>
              </div>
              <p v-if="reportError" class="report-error">{{ reportError }}</p>
            </section>

            <div class="report-actions">
              <button type="button" class="btn-cancel" @click="closeReportModal">取消</button>
              <button
                type="button"
                class="btn-submit"
                :disabled="!selectedReportReason || reportDescription.trim().length < 10"
                @click="submitReport"
              >
                提交举报
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <FontPicker
      :visible="showCommentFontPicker"
      :is-dark="isDark"
      target-type="comment"
      :selected-font="commentFontFamily"
      :selected-effect="commentFontEffect"
      @select="commentFontFamily = $event"
      @select-effect="commentFontEffect = $event"
      @close="showCommentFontPicker = false"
    />
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { formatRelativeTime } from '../utils/time';
import { getEmotionEmoji } from '../utils/emotion';
import { REPORT_TYPES } from '../utils/report';
import { useUserStore } from '../stores/user';
import { useVipStore } from '../stores/vip';
import { reportApi } from '../api/report';
import { showToast } from '../composables/useToast.js';
import { getFontStyle, injectFontEffectAnimations } from '../composables/useFontEffect';
import FontPicker from './FontPicker.vue';

injectFontEffectAnimations();

const userStore = useUserStore();
const vipStore = useVipStore();

const props = defineProps({
  story: {
    type: Object,
    required: true
  },
  startPosition: {
    type: Object,
    default: () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  },
  directOpen: {
    type: Boolean,
    default: true
  },
  likePending: {
    type: Boolean,
    default: false
  },
  favoritePending: {
    type: Boolean,
    default: false
  },
  isDark: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'preview-image', 'like', 'favorite', 'comment', 'submit-comment', 'submitComment', 'report', 'view-user-profile', 'open-comment-bg', 'request-vip']);

const storyFontStyle = computed(() => {
  const ff = props.story?.fontFamily || '';
  const fe = props.story?.fontEffect || '';
  if (!ff && !fe) return {};
  return getFontStyle(ff, fe);
});

const isLiked = ref(false);
const likeCount = ref(0);
const isFavorited = ref(false);
const favoriteCount = ref(0);
const commentCount = ref(0);
const showCommentInput = ref(false);
const newComment = ref('');
const comments = ref([]);

const showCommentFontPicker = ref(false);
const commentFontFamily = ref('');
const commentFontEffect = ref('');

function readDefaultFontFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)vip_default_font=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function readDefaultFontEffectFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)vip_default_font_effect=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function getCommentFontStyle(comment) {
  const ff = comment?.fontFamily || '';
  const fe = comment?.fontEffect || '';
  if (!ff && !fe) return {};
  return getFontStyle(ff, fe);
}

const showReportModal = ref(false);
const selectedReportReason = ref('');
const reportDescription = ref('');
const reportError = ref('');

const reportReasons = REPORT_TYPES;
const storyAuthorName = computed(() => {
  const authorObject = props.story?.author && typeof props.story.author === 'object'
    ? props.story.author
    : null;

  return [
    props.story?.username,
    authorObject?.username,
    typeof props.story?.author === 'string' ? props.story.author : '',
    '匿名用户'
  ].find((value) => typeof value === 'string' && value.trim()) || '匿名用户';
});

const storyAuthorAvatar = computed(() => {
  const authorObject = props.story?.author && typeof props.story.author === 'object'
    ? props.story.author
    : null;

  return authorObject?.avatar || props.story?.avatar || '';
});

const storyAuthorId = computed(() => {
  const authorObject = props.story?.author && typeof props.story.author === 'object'
    ? props.story.author
    : null;
  return authorObject?.id ?? props.story?.authorId ?? props.story?.userId ?? null;
});

const storyAuthorVip = computed(() => {
  const authorObject = props.story?.author && typeof props.story.author === 'object'
    ? props.story.author
    : null;
  return Boolean(authorObject?.vip || props.story?.vip);
});

function resolveLikeCount(story) {
  if (Array.isArray(story?.likes)) {
    return story.likes.length;
  }

  const nextCount = Number(story?.likeCount ?? story?.likes ?? 0);
  return Number.isFinite(nextCount) ? nextCount : 0;
}

function resolveFavoriteCount(story) {
  const nextCount = Number(story?.favoriteCount ?? 0);
  return Number.isFinite(nextCount) ? nextCount : 0;
}

function resolveCommentCount(story, nextComments) {
  const nextCount = Number(story?.commentCount);
  if (Number.isFinite(nextCount)) {
    return nextCount;
  }
  return nextComments.length;
}

watch(
  () => props.story,
  (story) => {
    const nextComments = Array.isArray(story?.comments) ? story.comments : [];
    isLiked.value = Boolean(story?.isLiked);
    likeCount.value = resolveLikeCount(story);
    isFavorited.value = Boolean(story?.isFavorited);
    favoriteCount.value = resolveFavoriteCount(story);
    comments.value = nextComments;
    commentCount.value = resolveCommentCount(story, nextComments);
  },
  { immediate: true, deep: true }
);

watch(
  () => props.story?.id,
  () => {
    showCommentInput.value = false;
    newComment.value = '';
    closeReportModal();
  },
  { immediate: true }
);

function getInitial(name) {
  return String(name || '匿').trim().slice(0, 1).toUpperCase() || '匿';
}

/**
 * 根据评论者的 commentBg 配置计算背景样式
 * 支持纯色和渐变两种模式
 */
function getCommentBgStyle(comment) {
  let bg = comment?.commentBg;
  // 兜底：如果是当前用户自己的评论，且服务端未返回 commentBg（可能数据库尚未同步），
  // 则使用本地 vipStore 的设置
  if ((!bg || typeof bg !== 'object') && userStore.isLoggedIn && comment?.userId && String(comment.userId) === String(userStore.user?.id)) {
    const fallbackBg = vipStore.savedCommentBg;
    if (fallbackBg && typeof fallbackBg === 'object') {
      bg = fallbackBg;
    }
  }
  if (!bg || typeof bg !== 'object') return null;

  if (bg.useGradient && bg.gradientColor) {
    const angle = bg.gradientDirection || 135;
    return {
      background: `linear-gradient(${angle}deg, ${bg.color}, ${bg.gradientColor})`,
    };
  }

  if (bg.color) {
    return { background: bg.color };
  }

  return null;
}

function previewImage(index) {
  emit('preview-image', { index, images: props.story.images });
}

function handleClose() {
  emit('close');
}

function handleLike() {
  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast('请先登录后再点赞', 'warning');
    return;
  }

  if (props.likePending) {
    return;
  }

  emit('like', { storyId: props.story.id });
}

function handleFavorite() {
  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast('请先登录后再收藏', 'warning');
    return;
  }

  if (props.favoritePending) {
    return;
  }

  emit('favorite', { storyId: props.story.id });
}

function submitComment() {
  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast('请先登录后再评论', 'warning');
    return;
  }

  const content = newComment.value.trim();
  if (!content) {
    return;
  }

  const fontFamily = commentFontFamily.value || readDefaultFontFromCookie();
  const fontEffect = commentFontEffect.value || readDefaultFontEffectFromCookie();
  const payload = { storyId: props.story.id, content, fontFamily, fontEffect };
  emit('submit-comment', payload);
  emit('submitComment', payload);

  newComment.value = '';
  commentFontFamily.value = '';
  commentFontEffect.value = '';
  showCommentInput.value = false;
}

function handleCommentBgClick() {
  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast('请先登录后再使用', 'warning');
    return;
  }
  if (vipStore.isVipActive) {
    emit('open-comment-bg');
  } else {
    emit('open-vip-center');
  }
}

function openReportModal() {
  reportError.value = '';
  showReportModal.value = true;
}

function handleViewAuthorProfile() {
  if (!storyAuthorId.value) return;
  emit('view-user-profile', { id: storyAuthorId.value, username: storyAuthorName.value, avatar: storyAuthorAvatar.value, vip: storyAuthorVip.value });
}

function handleViewCommentProfile(comment) {
  if (!comment.userId) return;
  emit('view-user-profile', { id: comment.userId, username: comment.author, avatar: comment.avatar, vip: comment.vip });
}

function closeReportModal() {
  showReportModal.value = false;
  selectedReportReason.value = '';
  reportDescription.value = '';
  reportError.value = '';
}

async function submitReport() {
  if (!userStore.isLoggedIn || userStore.isGuest) {
    showToast('请先登录后再举报', 'warning');
    return;
  }

  if (!selectedReportReason.value) {
    reportError.value = '请选择举报原因';
    return;
  }

  const description = reportDescription.value.trim();
  if (description.length < 10) {
    reportError.value = '请详细描述举报原因，不少于 10 个字';
    return;
  }

  reportError.value = '';

  try {
    await reportApi.create('story', props.story.id, `${selectedReportReason.value}: ${description}`);
    closeReportModal();
    showToast('举报已提交，我们会尽快处理', 'success');
  } catch (error) {
    console.error('举报失败:', error);
    showToast(error.message || '举报失败，请重试', 'error');
  }
}
</script>

<style scoped>
.paper-plane-overlay {
  --story-detail-surface: linear-gradient(160deg, rgba(250, 239, 217, 0.98) 0%, rgba(240, 223, 191, 0.98) 54%, rgba(229, 201, 150, 0.98) 100%);
  --story-detail-border: rgba(196, 142, 48, 0.42);
  --story-detail-frame: rgba(188, 141, 52, 0.34);
  --story-detail-pattern: rgba(151, 101, 34, 0.16);
  --story-detail-panel: rgba(255, 250, 241, 0.68);
  --story-detail-panel-strong: rgba(255, 252, 246, 0.84);
  --story-detail-text: #3c2910;
  --story-detail-muted: rgba(72, 48, 17, 0.7);
  --story-detail-accent: #8b561d;
  --story-detail-accent-soft: rgba(159, 105, 34, 0.14);
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  background:
    radial-gradient(circle at top, rgba(255, 226, 170, 0.26) 0%, transparent 30%),
    rgba(10, 13, 22, 0.62);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  z-index: 10000;
}

.paper-sheet {
  position: relative;
  width: min(500px, calc(100vw - 40px));
  max-height: calc(100vh - 56px);
  border-radius: 34px;
  border: 1px solid var(--story-detail-border);
  background: var(--story-detail-surface);
  box-shadow:
    0 40px 88px -36px rgba(4, 8, 18, 0.72),
    0 0 0 1px rgba(255, 255, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  color: var(--story-detail-text);
  overflow: hidden;
}

.paper-sheet::before,
.paper-sheet::after,
.report-modal-content::before,
.report-modal-content::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.paper-sheet::before,
.report-modal-content::before {
  inset: 14px;
  border-radius: 26px;
  border: 1px solid var(--story-detail-frame);
  background:
    radial-gradient(circle at center, rgba(255, 255, 255, 0.16) 0 18%, transparent 18.5%),
    radial-gradient(circle at center, transparent 0 40%, var(--story-detail-pattern) 40.5%, transparent 41.5%),
    linear-gradient(0deg, transparent calc(50% - 1px), var(--story-detail-pattern) 50%, transparent calc(50% + 1px)),
    linear-gradient(90deg, transparent calc(50% - 1px), var(--story-detail-pattern) 50%, transparent calc(50% + 1px));
  opacity: 0.72;
}

.paper-sheet::after,
.report-modal-content::after {
  inset: 26px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top center, rgba(255, 255, 255, 0.24) 0%, transparent 24%),
    repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0 6px, rgba(255, 255, 255, 0) 6px 12px);
  mix-blend-mode: soft-light;
}

.paper-texture {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.18) 0%, transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
  opacity: 0.8;
  pointer-events: none;
}

.tarot-suit {
  position: absolute;
  z-index: 1;
  font-size: 28px;
  font-weight: 700;
  color: var(--story-detail-accent);
  opacity: 0.88;
}

.tarot-suit.suit-top {
  top: 22px;
  left: 26px;
}

.tarot-suit.suit-bottom {
  right: 26px;
  bottom: 22px;
  transform: rotate(180deg);
}

.tarot-corner {
  position: absolute;
  width: 38px;
  height: 38px;
  z-index: 1;
  border: 1px solid var(--story-detail-frame);
  opacity: 0.74;
}

.tarot-corner.corner-top-right {
  top: 22px;
  right: 26px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 16px;
}

.tarot-corner.corner-bottom-left {
  left: 26px;
  bottom: 22px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 16px;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(53, 34, 13, 0.84);
  color: #fff8ee;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.close-btn:hover {
  transform: translateY(-2px);
  background: rgba(76, 49, 17, 0.96);
  border-color: rgba(255, 255, 255, 0.4);
}

.close-btn span {
  font-size: 24px;
  line-height: 1;
}

.story-badges {
  position: absolute;
  top: 22px;
  left: 64px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  z-index: 2;
}

.badge {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.badge.pinned {
  background: rgba(27, 36, 58, 0.7);
  color: #eef4ff;
}

.badge.featured {
  background: rgba(120, 72, 19, 0.78);
  color: #fff5e7;
}

.story-content-wrapper {
  position: relative;
  z-index: 1;
  max-height: calc(100vh - 56px);
  padding: 30px 28px 28px;
  overflow-y: auto;
}

.story-header,
.story-footer,
.comments-section {
  position: relative;
  border-radius: 24px;
  border: 1px solid var(--story-detail-frame);
  background: var(--story-detail-panel);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: 18px 0 16px;
  padding: 16px 18px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.avatar-shell,
.comment-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.52) 0%, var(--story-detail-accent-soft) 100%);
  border: 1px solid rgba(255, 255, 255, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--story-detail-accent);
  flex-shrink: 0;
}

.avatar,
.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback,
.comment-avatar span {
  font-size: 20px;
  line-height: 1;
}

.clickable-avatar {
  cursor: pointer;
  transition: opacity 0.2s;
}
.clickable-avatar:hover {
  opacity: 0.75;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  align-items: flex-start;
}

.username {
  font-size: 16px;
  font-weight: 700;
  color: var(--story-detail-text);
}

.vip-name-row {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.vip-username.has-vip {
  background: linear-gradient(90deg, #b8860b 0%, #ffd700 25%, #fff 50%, #ffd700 75%, #b8860b 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: vipGoldFlow 3s linear infinite;
}

.vip-text-badge-sm {
  display: inline-block;
  padding: 0 4px;
  border-radius: 3px;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #5d4037;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  line-height: 14px;
  margin-top: 1px;
}

@keyframes vipGoldFlow {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.time {
  font-size: 13px;
  color: var(--story-detail-muted);
}

.emotion-icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  border: 1px solid var(--story-detail-frame);
  background: var(--story-detail-panel-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.story-body {
  margin-bottom: 16px;
}

.story-text-card {
  margin-bottom: 16px;
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid var(--story-detail-frame);
  background: var(--story-detail-panel);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.story-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.9;
  color: var(--story-detail-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.story-images {
  display: grid;
  gap: 10px;
  align-items: start;
}

.story-images:has(:nth-child(1)):not(:has(:nth-child(2))) {
  grid-template-columns: 1fr;
}

.story-images:has(:nth-child(2)):not(:has(:nth-child(3))) {
  grid-template-columns: repeat(2, 1fr);
}

.story-images:has(:nth-child(3)) {
  grid-template-columns: repeat(3, 1fr);
}

.story-images img {
  width: 100%;
  aspect-ratio: 1;
  display: block;
  box-sizing: border-box;
  object-fit: contain;
  object-position: center;
  padding: 10px;
  background: linear-gradient(145deg, rgba(255, 252, 246, 0.96) 0%, rgba(236, 216, 180, 0.74) 100%);
  border-radius: 18px;
  border: 1px solid var(--story-detail-frame);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 16px 26px -22px rgba(0, 0, 0, 0.28);
}

.story-images:has(:nth-child(1)):not(:has(:nth-child(2))) img {
  aspect-ratio: auto;
  max-height: min(52vh, 420px);
}

.story-images img:hover {
  transform: translateY(-2px);
  border-color: var(--story-detail-accent);
  box-shadow: 0 18px 30px -24px rgba(0, 0, 0, 0.42);
}

.story-footer {
  padding: 14px 18px;
}

.location {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--story-detail-muted);
}

.location .icon {
  font-size: 16px;
}

.story-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.action-btn {
  min-height: 82px;
  padding: 14px 16px;
  border-radius: 22px;
  border: 1px solid var(--story-detail-frame);
  background: var(--story-detail-panel);
  color: var(--story-detail-text);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  border-color: var(--story-detail-accent);
  box-shadow: 0 18px 28px -24px rgba(0, 0, 0, 0.4);
}

.action-btn:disabled,
.action-btn.pending {
  opacity: 0.72;
  cursor: progress;
  transform: none;
  box-shadow: none;
}

.action-btn.liked {
  border-color: var(--story-detail-accent);
  background: var(--story-detail-panel-strong);
  box-shadow:
    0 0 0 2px var(--story-detail-accent-soft),
    0 20px 30px -24px rgba(0, 0, 0, 0.42);
}

.action-btn.favorited {
  border-color: var(--story-detail-accent);
  background: var(--story-detail-panel-strong);
  box-shadow:
    0 0 0 2px var(--story-detail-accent-soft),
    0 20px 30px -24px rgba(0, 0, 0, 0.42);
}

.action-btn.report:hover {
  background: rgba(177, 80, 43, 0.1);
}

.action-btn .icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid var(--story-detail-frame);
  background: var(--story-detail-panel-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--story-detail-accent);
  flex-shrink: 0;
}

.action-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
  text-align: left;
}

.action-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--story-detail-muted);
}

.action-count {
  font-size: 22px;
  line-height: 1;
  color: var(--story-detail-text);
}

.action-count.compact {
  font-size: 14px;
  line-height: 1.3;
  color: var(--story-detail-muted);
}

.comments-section {
  margin-top: 20px;
  padding: 20px 18px 18px;
}

.comments-title {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 700;
  color: var(--story-detail-text);
}

.comment-input-area {
  margin-bottom: 16px;
}

.inline-font-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.font-action-btn {
  padding: 4px 12px;
  border-radius: 10px;
  border: 1px solid var(--story-detail-frame);
  background: var(--story-detail-panel-strong);
  color: var(--story-detail-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.font-action-btn:hover {
  border-color: var(--story-detail-accent);
  color: var(--story-detail-accent);
}

.font-action-btn.font-active {
  border-color: var(--story-detail-accent);
  background: var(--story-detail-accent-soft);
  color: var(--story-detail-accent);
}

.font-clear-btn {
  padding: 4px 10px;
  border-radius: 10px;
  border: 1px solid var(--story-detail-frame);
  background: transparent;
  color: var(--story-detail-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.font-clear-btn:hover {
  border-color: rgba(179, 52, 43, 0.4);
  color: #b3342b;
}

.comment-textarea,
.report-textarea {
  width: 100%;
  min-height: 110px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--story-detail-frame);
  background: var(--story-detail-panel-strong);
  color: var(--story-detail-text);
  font-size: 14px;
  line-height: 1.7;
  resize: vertical;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.comment-textarea {
  min-height: 96px;
}

.comment-textarea:focus,
.report-textarea:focus {
  border-color: var(--story-detail-accent);
  box-shadow: 0 0 0 3px var(--story-detail-accent-soft);
}

.comment-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.comment-actions__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-actions__right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.btn-comment-bg {
  height: 36px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(184, 135, 46, 0.25);
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px -6px rgba(255, 215, 0, 0.4);
}

.btn-comment-bg:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px -6px rgba(255, 215, 0, 0.5);
}

.btn-comment-bg--locked {
  background: rgba(184, 135, 46, 0.08);
  border-color: var(--story-detail-frame);
  color: var(--story-detail-muted);
  box-shadow: none;
  cursor: pointer;
}

.btn-comment-bg--locked:hover {
  background: rgba(184, 135, 46, 0.15);
  transform: translateY(-1px);
}

.btn-cancel,
.btn-submit {
  min-width: 112px;
  height: 42px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel {
  border-color: var(--story-detail-frame);
  background: transparent;
  color: var(--story-detail-muted);
}

.btn-submit {
  background: linear-gradient(135deg, rgba(108, 67, 20, 0.96) 0%, rgba(144, 92, 28, 0.96) 100%);
  color: #fff7ea;
  box-shadow: 0 20px 30px -24px rgba(77, 45, 11, 0.7);
}

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comments-list {
  display: grid;
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

.comment-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
  padding: 14px;
  border-radius: 20px;
  background: var(--story-detail-panel-strong);
  box-shadow: inset 0 0 0 1px var(--story-detail-frame);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.comment-item.has-custom-bg {
  box-shadow: none;
  overflow: hidden;
}

.comment-avatar {
  width: 42px;
  height: 42px;
  font-size: 14px;
}

.comment-content {
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.comment-author {
  font-size: 14px;
  font-weight: 700;
  color: var(--story-detail-text);
}

.comment-time {
  font-size: 12px;
  color: var(--story-detail-muted);
}

.comment-text {
  margin: 0;
  font-size: 14px;
  color: var(--story-detail-text);
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-comments {
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--story-detail-panel-strong);
  font-size: 14px;
  line-height: 1.7;
  color: var(--story-detail-muted);
  text-align: center;
}

.report-modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background:
    radial-gradient(circle at top, rgba(255, 229, 176, 0.16) 0%, transparent 30%),
    rgba(8, 11, 19, 0.58);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 11000;
}

.report-modal-content {
  position: relative;
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  padding: 30px 30px 22px;
  border-radius: 30px;
  border: 1px solid var(--story-detail-border);
  background: var(--story-detail-surface);
  box-shadow:
    0 40px 88px -36px rgba(4, 8, 18, 0.72),
    0 0 0 1px rgba(255, 255, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  color: var(--story-detail-text);
  overflow: hidden;
  isolation: isolate;
}

.report-suit {
  z-index: 2;
}

.report-modal-scroll {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 16px;
  max-height: calc(100vh - 108px);
  padding: 36px 4px 8px;
  overflow-y: auto;
}

.report-card-headline,
.report-panel {
  position: relative;
  border-radius: 24px;
  border: 1px solid var(--story-detail-frame);
  background: linear-gradient(180deg, rgba(255, 252, 246, 0.9) 0%, rgba(255, 248, 237, 0.72) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.44),
    0 18px 30px -26px rgba(66, 42, 15, 0.28);
}

.report-card-headline {
  padding: 24px 22px 20px;
  text-align: center;
}

.report-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--story-detail-accent);
}

.report-card-headline h3 {
  margin: 0;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: clamp(26px, 4vw, 34px);
  line-height: 1.1;
}

.report-desc {
  margin: 12px auto 0;
  max-width: 30em;
  font-size: 14px;
  line-height: 1.7;
  color: var(--story-detail-muted);
}

.report-panel {
  padding: 18px;
}

.report-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.report-panel-head strong {
  font-size: 14px;
  font-weight: 700;
  color: var(--story-detail-text);
}

.report-panel-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--story-detail-accent);
}

.report-helper {
  margin: 0;
}

.report-helper {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--story-detail-muted);
}

.report-reasons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.reason-option {
  position: relative;
}

.reason-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.reason-option span {
  display: block;
  min-height: 64px;
  padding: 15px 16px;
  border-radius: 18px;
  border: 1px solid rgba(153, 107, 36, 0.28);
  background: linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(245, 234, 213, 0.92) 100%);
  color: var(--story-detail-text);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  cursor: pointer;
  box-shadow:
    0 16px 26px -24px rgba(76, 49, 17, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.52);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease;
}

.reason-option span:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 86, 29, 0.5);
  box-shadow:
    0 22px 32px -24px rgba(76, 49, 17, 0.5),
    0 0 0 1px rgba(255, 247, 231, 0.56);
}

.reason-option input:focus-visible + span {
  border-color: var(--story-detail-accent);
  box-shadow: 0 0 0 3px var(--story-detail-accent-soft);
}

.reason-option input:checked + span {
  border-color: var(--story-detail-accent);
  background: linear-gradient(180deg, rgba(255, 248, 236, 1) 0%, rgba(244, 221, 179, 0.96) 100%);
  transform: translateY(-2px);
  box-shadow:
    0 0 0 3px rgba(159, 105, 34, 0.18),
    0 24px 36px -26px rgba(76, 49, 17, 0.52);
}

.report-footnote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--story-detail-muted);
}

.report-footnote strong {
  font-size: 13px;
  color: var(--story-detail-accent);
}

.report-error {
  margin: 12px 0 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(179, 52, 43, 0.08);
  font-size: 13px;
  color: #b3342b;
}

.report-actions .btn-cancel,
.report-actions .btn-submit {
  flex: 1;
  min-height: 50px;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.report-actions .btn-cancel {
  border-color: rgba(153, 107, 36, 0.24);
  background: linear-gradient(180deg, rgba(255, 252, 246, 0.96) 0%, rgba(247, 238, 221, 0.92) 100%);
  color: #5b3a13;
  box-shadow:
    0 16px 26px -24px rgba(76, 49, 17, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.report-actions .btn-submit {
  background: linear-gradient(135deg, rgba(118, 72, 20, 0.98) 0%, rgba(168, 108, 31, 0.98) 100%);
  box-shadow:
    0 22px 34px -24px rgba(77, 45, 11, 0.82),
    0 0 0 1px rgba(255, 235, 201, 0.18);
}

.report-actions .btn-cancel:hover,
.report-actions .btn-submit:hover {
  transform: translateY(-2px);
}

.report-actions .btn-cancel:hover {
  border-color: rgba(139, 86, 29, 0.4);
  background: linear-gradient(180deg, rgba(255, 253, 249, 0.98) 0%, rgba(245, 231, 205, 0.94) 100%);
}

.report-actions .btn-submit:hover {
  box-shadow:
    0 28px 38px -24px rgba(77, 45, 11, 0.88),
    0 0 0 1px rgba(255, 235, 201, 0.22);
}

@media (max-width: 640px) {
  .paper-plane-overlay {
    padding: 16px;
  }

  .paper-sheet {
    width: min(100%, calc(100vw - 20px));
    border-radius: 28px;
  }

  .story-content-wrapper,
  .report-modal-content {
    padding: 24px 20px 22px;
  }

  .report-modal-scroll {
    max-height: calc(100vh - 88px);
    padding-top: 34px;
    padding-right: 2px;
  }

  .report-card-headline,
  .report-panel {
    border-radius: 20px;
  }

  .report-card-headline {
    padding: 22px 18px 18px;
  }

  .report-panel {
    padding: 16px;
  }

  .report-panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .story-badges {
    left: 22px;
    top: 72px;
  }

  .story-header {
    margin-top: 56px;
    padding: 14px;
  }

  .story-actions {
    gap: 10px;
  }

  .action-btn {
    min-height: 74px;
    padding: 12px;
    gap: 10px;
  }

  .action-btn .icon {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }

  .action-count {
    font-size: 19px;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ===== 深色模式 ===== */
.paper-plane-overlay.dark {
  --story-detail-surface: linear-gradient(160deg, rgba(28, 34, 56, 0.98) 0%, rgba(22, 28, 48, 0.98) 54%, rgba(18, 22, 38, 0.98) 100%);
  --story-detail-border: rgba(80, 100, 140, 0.35);
  --story-detail-frame: rgba(90, 115, 160, 0.25);
  --story-detail-pattern: rgba(120, 145, 190, 0.1);
  --story-detail-panel: rgba(35, 45, 70, 0.6);
  --story-detail-panel-strong: rgba(40, 52, 80, 0.75);
  --story-detail-text: #d8e2f0;
  --story-detail-muted: rgba(180, 195, 220, 0.65);
  --story-detail-accent: #7b9ce0;
  --story-detail-accent-soft: rgba(123, 156, 224, 0.12);
  background:
    radial-gradient(circle at top, rgba(60, 80, 140, 0.2) 0%, transparent 30%),
    rgba(4, 6, 14, 0.78);
}

.paper-plane-overlay.dark .paper-sheet {
  box-shadow:
    0 40px 88px -36px rgba(2, 4, 10, 0.88),
    0 0 0 1px rgba(100, 130, 180, 0.1),
    inset 0 1px 0 rgba(120, 150, 200, 0.1);
}

.paper-plane-overlay.dark .paper-texture {
  background:
    radial-gradient(circle at top, rgba(100, 140, 220, 0.08) 0%, transparent 26%),
    linear-gradient(180deg, rgba(100, 140, 220, 0.04) 0%, transparent 100%);
  opacity: 0.6;
}

.paper-plane-overlay.dark .close-btn {
  background: rgba(20, 28, 50, 0.9);
  border-color: rgba(100, 130, 180, 0.2);
  color: #c8d8f0;
}

.paper-plane-overlay.dark .close-btn:hover {
  background: rgba(30, 40, 65, 0.96);
  border-color: rgba(120, 150, 200, 0.35);
}

.paper-plane-overlay.dark .paper-sheet::before,
.paper-plane-overlay.dark .report-modal-content::before {
  border-color: var(--story-detail-frame);
  background:
    radial-gradient(circle at center, rgba(100, 140, 220, 0.08) 0 18%, transparent 18.5%),
    radial-gradient(circle at center, transparent 0 40%, var(--story-detail-pattern) 40.5%, transparent 41.5%),
    linear-gradient(0deg, transparent calc(50% - 1px), var(--story-detail-pattern) 50%, transparent calc(50% + 1px)),
    linear-gradient(90deg, transparent calc(50% - 1px), var(--story-detail-pattern) 50%, transparent calc(50% + 1px));
}

.paper-plane-overlay.dark .paper-sheet::after,
.paper-plane-overlay.dark .report-modal-content::after {
  background:
    radial-gradient(circle at top center, rgba(100, 140, 220, 0.1) 0%, transparent 24%),
    repeating-linear-gradient(135deg, rgba(100, 140, 220, 0.02) 0 6px, rgba(100, 140, 220, 0) 6px 12px);
}

.paper-plane-overlay.dark .avatar-shell,
.paper-plane-overlay.dark .comment-avatar {
  background: linear-gradient(145deg, rgba(60, 80, 120, 0.4) 0%, var(--story-detail-accent-soft) 100%);
  border-color: rgba(100, 130, 180, 0.15);
}

.paper-plane-overlay.dark .story-images img {
  background: linear-gradient(145deg, rgba(25, 35, 55, 0.9) 0%, rgba(18, 25, 42, 0.7) 100%);
}

.paper-plane-overlay.dark .story-images img:hover {
  border-color: var(--story-detail-accent);
  box-shadow: 0 18px 30px -24px rgba(0, 0, 0, 0.6);
}

.paper-plane-overlay.dark .btn-cancel {
  border-color: rgba(80, 100, 140, 0.25);
}

.paper-plane-overlay.dark .btn-comment-bg {
  background: linear-gradient(135deg, #ffd700, #f5a623);
  border-color: rgba(255, 215, 0, 0.2);
  color: #3d2e0a;
}

.paper-plane-overlay.dark .btn-comment-bg--locked {
  background: rgba(143, 180, 255, 0.06);
  border-color: rgba(143, 180, 255, 0.15);
  color: rgba(180, 200, 255, 0.6);
  box-shadow: none;
}

.paper-plane-overlay.dark .btn-comment-bg--locked:hover {
  background: rgba(143, 180, 255, 0.12);
}

.paper-plane-overlay.dark .btn-submit {
  background: linear-gradient(135deg, rgba(55, 75, 120, 0.96) 0%, rgba(70, 95, 145, 0.96) 100%);
  box-shadow: 0 20px 30px -24px rgba(10, 15, 30, 0.7);
}

.paper-plane-overlay.dark .action-btn:hover {
  box-shadow: 0 18px 28px -24px rgba(0, 0, 0, 0.6);
}

.paper-plane-overlay.dark .action-btn.liked,
.paper-plane-overlay.dark .action-btn.favorited {
  box-shadow:
    0 0 0 2px var(--story-detail-accent-soft),
    0 20px 30px -24px rgba(0, 0, 0, 0.6);
}

.paper-plane-overlay.dark .emotion-icon {
  background: var(--story-detail-panel-strong);
}

/* 深色 - 举报弹窗 */
.report-modal-overlay.dark {
  background:
    radial-gradient(circle at top, rgba(50, 70, 130, 0.12) 0%, transparent 30%),
    rgba(4, 6, 14, 0.7);
}

.report-modal-overlay.dark .report-modal-content {
  box-shadow:
    0 40px 88px -36px rgba(2, 4, 10, 0.88),
    0 0 0 1px rgba(100, 130, 180, 0.1),
    inset 0 1px 0 rgba(120, 150, 200, 0.1);
}

.report-modal-overlay.dark .report-card-headline,
.report-modal-overlay.dark .report-panel {
  background: linear-gradient(180deg, rgba(30, 40, 65, 0.9) 0%, rgba(25, 34, 56, 0.72) 100%);
  box-shadow:
    inset 0 1px 0 rgba(100, 140, 200, 0.15),
    0 18px 30px -26px rgba(4, 8, 18, 0.5);
}

.report-modal-overlay.dark .reason-option span {
  background: linear-gradient(180deg, rgba(30, 40, 65, 0.98) 0%, rgba(25, 34, 56, 0.92) 100%);
  border-color: rgba(80, 100, 140, 0.25);
  color: var(--story-detail-text);
  box-shadow:
    0 16px 26px -24px rgba(4, 8, 18, 0.6),
    inset 0 1px 0 rgba(100, 140, 200, 0.1);
}

.report-modal-overlay.dark .reason-option span:hover {
  border-color: rgba(123, 156, 224, 0.4);
  box-shadow:
    0 22px 32px -24px rgba(4, 8, 18, 0.7),
    0 0 0 1px rgba(100, 140, 200, 0.12);
}

.report-modal-overlay.dark .reason-option input:checked + span {
  border-color: var(--story-detail-accent);
  background: linear-gradient(180deg, rgba(35, 48, 78, 1) 0%, rgba(28, 38, 62, 0.96) 100%);
  box-shadow:
    0 0 0 3px var(--story-detail-accent-soft),
    0 24px 36px -26px rgba(4, 8, 18, 0.7);
}

.report-modal-overlay.dark .report-actions .btn-cancel {
  border-color: rgba(80, 100, 140, 0.2);
  background: linear-gradient(180deg, rgba(30, 40, 65, 0.96) 0%, rgba(25, 34, 56, 0.92) 100%);
  color: #a0b4d0;
  box-shadow:
    0 16px 26px -24px rgba(4, 8, 18, 0.5),
    inset 0 1px 0 rgba(100, 140, 200, 0.1);
}

.report-modal-overlay.dark .report-actions .btn-cancel:hover {
  border-color: rgba(123, 156, 224, 0.35);
  background: linear-gradient(180deg, rgba(35, 48, 78, 0.98) 0%, rgba(28, 38, 62, 0.94) 100%);
}

.report-modal-overlay.dark .report-actions .btn-submit {
  background: linear-gradient(135deg, rgba(50, 68, 110, 0.98) 0%, rgba(65, 88, 135, 0.98) 100%);
  box-shadow:
    0 22px 34px -24px rgba(4, 8, 18, 0.88),
    0 0 0 1px rgba(100, 140, 200, 0.1);
}

.report-modal-overlay.dark .report-actions .btn-submit:hover {
  box-shadow:
    0 28px 38px -24px rgba(4, 8, 18, 0.92),
    0 0 0 1px rgba(100, 140, 200, 0.15);
}

.report-modal-overlay.dark .report-error {
  background: rgba(179, 52, 43, 0.12);
  color: #e88;
}

.report-modal-overlay.dark .comment-textarea,
.report-modal-overlay.dark .report-textarea {
  background: var(--story-detail-panel-strong);
}
</style>
