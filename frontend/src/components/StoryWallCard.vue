<template>
  <div
    class="story-wall-card"
    :class="[theme === 'dark' ? 'swc-dark' : 'swc-light', displayImage ? 'swc-has-image' : 'swc-no-image']"
    @click="$emit('select', story)"
  >
    <div class="swc-image-wrap">
      <img
        v-if="displayImage"
        :src="displayImage"
        alt="故事图片"
        class="swc-image"
        loading="lazy"
      />
      <div v-else class="swc-text-placeholder">
        <p class="swc-text-content" :style="wallFontStyle">{{ textContent }}</p>
      </div>
    </div>

    <div class="swc-info-blur">
      <img
        v-if="displayImage"
        :src="displayImage"
        alt=""
        class="swc-blur-bg"
        aria-hidden="true"
      />
      <div v-else class="swc-blur-placeholder-bg"></div>
    </div>

    <div class="swc-info-overlay" :class="{ 'is-text-only-card': !displayImage }">
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

      <p v-if="decoded.title" class="swc-content" :style="wallFontStyle">{{ contentPreview }}</p>

      <div class="swc-stats">
        <span>❤️ {{ story.likeCount ?? story.likes ?? 0 }}</span>
        <span>⭐️ {{ story.favoriteCount ?? 0 }}</span>
        <template v-if="story.recommendation?.reasonTags?.length">
          <span
            v-for="tag in story.recommendation.reasonTags.slice(0, 2)"
            :key="tag.code"
            class="swc-tag"
            :class="'swc-tag--' + (tag.tone || 'default')"
          >{{ tag.label }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getFontStyle, injectFontEffectAnimations } from '../composables/useFontEffect';
import { decodeStoryContent } from '../utils/storyTitle';

injectFontEffectAnimations();

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

const decoded = computed(() => decodeStoryContent(props.story.content || ''));

const contentPreview = computed(() => {
  const text = decoded.value.title || '';
  const maxLen = 40;
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
});

const wallFontStyle = computed(() => {
  const ff = props.story?.fontFamily || '';
  const fe = props.story?.fontEffect || '';
  if (!ff && !fe) return {};
  return getFontStyle(ff, fe);
});

const textContent = computed(() => {
  const text = decoded.value.body || '';
  const maxLen = 80;
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
});
</script>

<style scoped>
.story-wall-card {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transform: scale(0.96);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.story-wall-card:hover {
  transform: scale(1);
}

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

.swc-text-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(145deg, #10243f 0%, #19385f 46%, #254a74 100%);
}

.swc-text-content {
  font-size: 17px;
  line-height: 1.72;
  color: rgba(255, 255, 255, 0.92);
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

.story-wall-card.swc-no-image .swc-text-placeholder {
  align-items: flex-start;
  justify-content: flex-start;
  padding: 18px 16px calc(38% + 18px) 16px;
}

.story-wall-card.swc-no-image .swc-text-content {
  width: 100%;
  max-height: 100%;
  text-align: left;
  -webkit-line-clamp: 7;
}

.swc-info-blur {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 38%;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  border-radius: 12px 12px 0 0;
}

.swc-blur-bg {
  width: 100%;
  height: 100%;
  height: calc(100% / 0.38);
  min-height: 263%;
  transform: translateY(calc(-100% + 38%));
  object-fit: cover;
  filter: blur(8px) brightness(0.55) saturate(1.2);
}

.swc-blur-placeholder-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, rgba(16, 36, 63, 0.72) 0%, rgba(25, 56, 95, 0.68) 46%, rgba(37, 74, 116, 0.72) 100%);
  filter: blur(8px);
}

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
  border-radius: 12px 12px 0 0;
}

.swc-info-overlay.is-text-only-card {
  padding: 10px 12px 12px;
}

.swc-author-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.swc-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  font-size: 13px;
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
  font-size: 14px;
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
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  line-height: 15px;
  margin-top: 1px;
}

.swc-meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swc-content {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  margin: 3px 0 2px;
  line-height: 1.52;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swc-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.swc-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 5px;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.swc-tag--blue {
  background: rgba(59, 130, 246, 0.18);
  color: #60a5fa;
}

.swc-tag--amber {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}

.swc-tag--green {
  background: rgba(34, 197, 94, 0.18);
  color: #4ade80;
}

.swc-tag--pink {
  background: rgba(236, 72, 153, 0.18);
  color: #f472b6;
}

.swc-tag--red {
  background: rgba(239, 68, 68, 0.18);
  color: #f87171;
}

.swc-tag--gold {
  background: rgba(234, 179, 8, 0.18);
  color: #facc15;
}

.swc-tag--default {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.story-wall-card.swc-has-image .swc-content {
  font-size: 16px;
}

.story-wall-card.swc-no-image .swc-avatar {
  width: 36px;
  height: 36px;
  font-size: 15px;
}

.story-wall-card.swc-no-image .swc-username {
  font-size: 15px;
}

.story-wall-card.swc-no-image .swc-meta {
  font-size: 13px;
}

.story-wall-card.swc-no-image .swc-stats {
  font-size: 13px;
}

.story-wall-card.swc-light .swc-image-wrap {
  background: #e8e4df;
}

.story-wall-card.swc-light .swc-blur-bg {
  filter: blur(8px) brightness(1.05) saturate(0.8);
}

.story-wall-card.swc-light .swc-blur-placeholder-bg {
  background: linear-gradient(145deg, rgba(191, 176, 157, 0.72) 0%, rgba(183, 165, 141, 0.7) 52%, rgba(171, 151, 126, 0.74) 100%);
}

.story-wall-card.swc-light.swc-no-image .swc-text-placeholder {
  background: linear-gradient(145deg, #d3c4b3 0%, #c9b69d 48%, #bca487 100%);
}

.story-wall-card.swc-light .swc-username {
  color: #1a1a2e;
  text-shadow: none;
}

.story-wall-card.swc-light .swc-meta {
  color: rgba(0, 0, 0, 0.5);
  text-shadow: none;
}

.story-wall-card.swc-light .swc-content {
  color: rgba(0, 0, 0, 0.75);
  text-shadow: none;
}

.story-wall-card.swc-light .swc-stats {
  color: rgba(0, 0, 0, 0.5);
  text-shadow: none;
}

.story-wall-card.swc-light .swc-avatar {
  background: rgba(0, 0, 0, 0.1);
}

.story-wall-card.swc-light .swc-avatar-fallback {
  color: #fff;
}
</style>
