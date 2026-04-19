<template>
  <div class="story-card" :class="[emotionClass, { 'is-vip-card': storyAuthorVip }]" @click="handleSelect">
    <div class="story-header">
      <div class="user-info">
        <div class="avatar-shell">
          <img v-if="storyAuthorAvatar" :src="storyAuthorAvatar" :alt="storyAuthorName" class="avatar" />
          <span v-else class="avatar-fallback">{{ getInitial(storyAuthorName) }}</span>
        </div>
        <div class="user-details">
          <span class="vip-name-row"><span class="username vip-username" :class="{ 'has-vip': storyAuthorVip }">{{ storyAuthorName }}</span><span class="vip-text-badge-sm" v-if="storyAuthorVip">VIP</span></span>
          <span class="time">{{ formatRelativeTime(story.createdAt) }}</span>
        </div>
      </div>
      <span class="emotion-icon">{{ getEmotionEmoji(story.emotionTag || story.emotion) }}</span>
    </div>

    <div class="story-content">
      <p :style="storyFontStyle">{{ story.content }}</p>
    </div>

    <div v-if="story.images && story.images.length > 0" class="story-images">
      <img
        v-for="(image, index) in story.images"
        :key="index"
        :src="image"
        :alt="`故事图片 ${index + 1}`"
        @click.stop="previewImage(index)"
      />
    </div>

    <div class="story-footer">
      <div class="location">
        <span class="icon">📍</span>
        <span>{{ story.location?.address || '未知地点' }}</span>
      </div>

      <TimeCapsule
        v-if="story.isTimeCapsule"
        :unlock-at="story.unlockAt"
        :created-at="story.createdAt"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatRelativeTime } from '../utils/time';
import { getEmotionEmoji, fromEmotionTag } from '../utils/emotion';
import { getFontStyle, injectFontEffectAnimations } from '../composables/useFontEffect';
import TimeCapsule from './TimeCapsule.vue';

injectFontEffectAnimations();

const props = defineProps({
  story: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['preview-image', 'select-story']);

const emotionClass = computed(() => {
  const emotion = fromEmotionTag(props.story.emotionTag) || props.story.emotion;
  const emotionMap = {
    happy: 'emotion-happy',
    sad: 'emotion-sad',
    neutral: 'emotion-neutral',
    excited: 'emotion-excited',
    peaceful: 'emotion-peaceful'
  };
  return emotionMap[emotion] || '';
});

const storyAuthorName = computed(() => {
  const authorObject = props.story?.author && typeof props.story.author === 'object'
    ? props.story.author
    : null;
  const userObject = props.story?.user && typeof props.story.user === 'object'
    ? props.story.user
    : null;

  return [
    authorObject?.username,
    userObject?.username,
    typeof props.story?.author === 'string' ? props.story.author : '',
    props.story?.username,
    '\u533f\u540d\u7528\u6237'
  ].find((value) => typeof value === 'string' && value.trim()) || '\u533f\u540d\u7528\u6237';
});

const storyAuthorAvatar = computed(() => {
  const authorObject = props.story?.author && typeof props.story.author === 'object'
    ? props.story.author
    : null;
  const userObject = props.story?.user && typeof props.story.user === 'object'
    ? props.story.user
    : null;

  return authorObject?.avatar
    || authorObject?.avatarUrl
    || userObject?.avatar
    || userObject?.avatarUrl
    || props.story?.avatar
    || props.story?.avatarUrl
    || '';
});

const storyAuthorVip = computed(() => {
  const authorObject = props.story?.author && typeof props.story.author === 'object'
    ? props.story.author
    : null;
  const userObject = props.story?.user && typeof props.story.user === 'object'
    ? props.story.user
    : null;
  return Boolean(authorObject?.vip || userObject?.vip || props.story?.vip);
});

const storyFontStyle = computed(() => {
  const ff = props.story?.fontFamily || '';
  const fe = props.story?.fontEffect || '';
  if (!ff && !fe) return {};
  return getFontStyle(ff, fe);
});

function getInitial(name) {
  return String(name || '\u533f').trim().slice(0, 1).toUpperCase() || '\u533f';
}

function previewImage(index) {
  emit('preview-image', { index, images: props.story.images });
}

function handleSelect() {
  emit('select-story', props.story);
}
</script>

<style scoped>
.story-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  cursor: pointer;
  transform: scale(0.96);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.story-card:hover {
  transform: translateY(-2px) scale(1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.avatar-shell {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.72) 0%, rgba(139, 86, 29, 0.18) 100%);
  color: #8b561d;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  line-height: 1;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  align-items: flex-start;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #2d3436;
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
  font-size: 12px;
  color: #999;
}

.emotion-icon {
  font-size: 24px;
}

.story-content {
  margin-bottom: 16px;
}

.story-content p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #2d3436;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.story-images {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
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
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.story-images img:hover {
  opacity: 0.9;
}

.story-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.location .icon {
  font-size: 16px;
}

.story-card.emotion-happy {
  border-left: 12px solid #ffd93d;
}

.story-card.emotion-sad {
  border-left: 12px solid #6bceff;
}

.story-card.emotion-neutral {
  border-left: 12px solid #c8d6e5;
}

.story-card.emotion-excited {
  border-left: 12px solid #ff6b9d;
}

.story-card.emotion-peaceful {
  border-left: 12px solid #a8e6cf;
}
</style>
