<template>
  <div class="story-wall-card" :class="[theme === 'dark' ? 'swc-dark' : 'swc-light']" @click="$emit('select', story)">
    <!-- 图片区域 (上方 2/3) -->
    <div class="swc-image-wrap">
      <img
        v-if="displayImage"
        :src="displayImage"
        alt="故事图片"
        class="swc-image"
        loading="lazy"
      />
      <div v-else class="swc-text-placeholder">
        <p class="swc-text-content">{{ textContent }}</p>
      </div>
    </div>

    <!-- 信息遮罩 (下方 1/3) - 毛玻璃效果 -->
    <div class="swc-info-blur">
      <!-- 模糊层：复制图片作为背景源 -->
      <img
        v-if="displayImage"
        :src="displayImage"
        alt=""
        class="swc-blur-bg"
        aria-hidden="true"
      />
      <div v-else class="swc-blur-placeholder-bg"></div>
    </div>
    <div class="swc-info-overlay">
      <!-- 作者行 -->
      <div class="swc-author-row">
        <div class="swc-avatar">
          <img v-if="story.avatar" :src="story.avatar" alt="头像" />
          <span v-else class="swc-avatar-fallback">{{ initial }}</span>
        </div>
        <div class="swc-author-text">
          <span class="vip-name-row">
            <span
              class="swc-username vip-username"
              :class="{ 'has-vip': story.author?.vip }"
            >
              {{ story.username || story.author?.username || '匿名用户' }}
            </span>
            <span class="vip-text-badge-sm" v-if="story.author?.vip">VIP</span>
          </span>
          <span class="swc-meta">
            {{ formattedTime
            }}<span v-if="locationName"> · {{ locationName }}</span>
          </span>
        </div>
      </div>

      <!-- 内容预览 -->
      <p v-if="story.content" class="swc-content">{{ contentPreview }}</p>

      <!-- 互动数据 -->
      <div class="swc-stats">
        <span>❤️ {{ story.likeCount ?? story.likes ?? 0 }}</span>
        <span>⭐️ {{ story.favoriteCount ?? 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  story: { type: Object, required: true },
  theme: { type: String, default: 'dark' },
});

defineEmits(['select']);

const displayImage = computed(() => {
  const images = props.story.images;
  if (!Array.isArray(images) || images.length === 0) return null;
  return images[0] || null;
});

const initial = computed(() => {
  const name = props.story.username || props.story.author?.username || '?';
  return name.charAt(0).toUpperCase();
});

const formattedTime = computed(() => {
  const created = props.story.createdAt;
  if (!created) return '';
  const now = Date.now();
  const then = new Date(created).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  return new Date(created).toLocaleDateString('zh-CN');
});

const locationName = computed(
  () => props.story.locationName || props.story.location?.address || '',
);

const contentPreview = computed(() => {
  const text = props.story.content || '';
  const maxLen = 40;
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
});

const textContent = computed(() => {
  const text = props.story.content || '';
  // 正方形容器内文本，限制显示更多字符
  const maxLen = 80;
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
});
</script>

<style scoped>
.story-wall-card {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 45px;
  overflow: hidden;
  cursor: pointer;
  transform: scale(0.96);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.story-wall-card:hover {
  transform: scale(1);
}

/* 图片区域 */
.swc-image-wrap {
  position: absolute;
  inset: 0;
  background: #1a1a2e;
}

.swc-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 无图片时的文本占位 */
.swc-text-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.swc-text-content {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

/* 信息遮罩 - 毛玻璃模糊背景层 */
.swc-info-blur {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 38%;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  border-radius: 16px 16px 0 0;
}

.swc-blur-bg {
  width: 100%;
  height: 100%;
  /* 图片自身高度只有38%，需要放大并向下偏移以对齐底部 */
  height: calc(100% / 0.38);
  min-height: 263%;
  transform: translateY(calc(-100% + 38%));
  object-fit: cover;
  filter: blur(8px) brightness(0.55) saturate(1.2);
}

.swc-blur-placeholder-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%);
  filter: blur(8px);
}

/* 信息遮罩内容层 - 叠在模糊层上方 */
.swc-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 38%;
  padding: 8px 10px 10px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 16px 16px 0 0;
}

/* 作者行 */
.swc-author-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.swc-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.swc-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.swc-author-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.vip-name-row {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.swc-username {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vip-username.has-vip {
  background: linear-gradient(
    90deg,
    #b8860b 0%,
    #ffd700 25%,
    #fff 50%,
    #ffd700 75%,
    #b8860b 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: vipGoldFlow 3s linear infinite;
}

@keyframes vipGoldFlow {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
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

.swc-meta {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 内容预览 */
.swc-content {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
  margin: 3px 0 2px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 互动数据 */
.swc-stats {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

/* ===== 浅色模式 ===== */
.story-wall-card.swc-light .swc-image-wrap {
  background: #e8e4df;
}

.story-wall-card.swc-light .swc-blur-bg {
  filter: blur(8px) brightness(1.05) saturate(0.8);
}

.story-wall-card.swc-light .swc-blur-placeholder-bg {
  background: linear-gradient(135deg, rgba(180, 170, 220, 0.5) 0%, rgba(170, 150, 190, 0.5) 100%);
}

.story-wall-card.swc-light .swc-username {
  color: #1a1a2e;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
}

.story-wall-card.swc-light .swc-meta {
  color: rgba(0, 0, 0, 0.5);
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
}

.story-wall-card.swc-light .swc-content {
  color: rgba(0, 0, 0, 0.75);
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
}

.story-wall-card.swc-light .swc-stats {
  color: rgba(0, 0, 0, 0.5);
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
}

.story-wall-card.swc-light .swc-avatar {
  background: rgba(0, 0, 0, 0.1);
}

.story-wall-card.swc-light .swc-avatar-fallback {
  color: #fff;
}
</style>
