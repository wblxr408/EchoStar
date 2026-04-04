<template>
  <Teleport to="body">
    <div class="paper-plane-overlay" @click="handleClose">
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
              <div class="avatar-shell">
                <img v-if="storyAuthorAvatar" :src="storyAuthorAvatar" :alt="storyAuthorName" class="avatar" />
                <span v-else class="avatar-fallback">{{ getInitial(storyAuthorName) }}</span>
              </div>
              <div class="user-details">
                <span class="username">{{ storyAuthorName }}</span>
                <span class="time">{{ formatRelativeTime(story.createdAt) }}</span>
              </div>
            </div>
            <span class="emotion-icon">{{ getEmotionEmoji(story.emotionTag || story.emotion) }}</span>
          </div>

          <div class="story-body">
            <div class="story-text-card">
              <p class="story-text">{{ story.content }}</p>
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
              ></textarea>
              <div class="comment-actions">
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

            <div class="comments-list">
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <div class="comment-avatar">
                  <img v-if="comment.avatar" :src="comment.avatar" :alt="comment.author" />
                  <span v-else>{{ getInitial(comment.author) }}</span>
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.author }}</span>
                    <span class="comment-time">{{ formatRelativeTime(comment.createdAt) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
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
      <div class="report-modal-overlay" @click.self="closeReportModal">
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
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { formatRelativeTime } from '../utils/time';
import { getEmotionEmoji } from '../utils/emotion';
import { REPORT_TYPES } from '../utils/report';
import { useUserStore } from '../stores/user';
import { reportApi } from '../api/report';
import { showToast } from '../composables/useToast.js';

const userStore = useUserStore();

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
  }
});

const emit = defineEmits(['close', 'preview-image', 'like', 'favorite', 'comment', 'submit-comment', 'submitComment', 'report']);

const isLiked = ref(false);
const likeCount = ref(0);
const isFavorited = ref(false);
const favoriteCount = ref(0);
const commentCount = ref(0);
const showCommentInput = ref(false);
const newComment = ref('');
const comments = ref([]);

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

  const payload = { storyId: props.story.id, content };
  emit('submit-comment', payload);
  emit('submitComment', payload);

  newComment.value = '';
  showCommentInput.value = false;
}

function openReportModal() {
  reportError.value = '';
  showReportModal.value = true;
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

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.username {
  font-size: 16px;
  font-weight: 700;
  color: var(--story-detail-text);
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
  font-family: 'Georgia', 'Times New Roman', serif;
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

.comment-actions,
.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
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
  border: 1px solid var(--story-detail-frame);
  background: var(--story-detail-panel-strong);
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
</style>
