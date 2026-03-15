<template>
  <div class="story-card" :class="emotionClass">
    <div class="story-header">
      <div class="user-info">
        <img :src="story.avatar" :alt="story.username" class="avatar" />
        <div class="user-details">
          <span class="username">{{ story.username }}</span>
          <span class="time">{{ formatRelativeTime(story.createdAt) }}</span>
        </div>
      </div>
      <span class="emotion-icon">{{ getEmotionEmoji(story.emotion) }}</span>
    </div>

    <div class="story-content">
      <p>{{ story.content }}</p>
    </div>

    <div v-if="story.images && story.images.length > 0" class="story-images">
      <img
        v-for="(image, index) in story.images"
        :key="index"
        :src="image"
        :alt="`图片 ${index + 1}`"
        @click="previewImage(index)"
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
import TimeCapsule from './TimeCapsule.vue';

const props = defineProps({
  story: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['preview-image']);

// 情绪对应的 class
const emotionClass = computed(() => {
  const emotionMap = {
    happy: 'emotion-happy',
    sad: 'emotion-sad',
    neutral: 'emotion-neutral',
    excited: 'emotion-excited',
    peaceful: 'emotion-peaceful'
  };
  return emotionMap[props.story.emotion] || '';
});

// 获取情绪 emoji
function getEmotionEmoji(emotion) {
  const emojis = {
    happy: '😊',
    sad: '😢',
    neutral: '😐',
    excited: '🤩',
    peaceful: '😌'
  };
  return emojis[emotion] || '📍';
}

// 预览图片
function previewImage(index) {
  emit('preview-image', { index, images: props.story.images });
}
</script>

<style scoped>
.story-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.story-card:hover {
  transform: translateY(-2px);
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
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #2d3436;
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

/* 情绪主题色 */
.story-card.emotion-happy {
  border-left: 4px solid #ffd93d;
}

.story-card.emotion-sad {
  border-left: 4px solid #6bceff;
}

.story-card.emotion-neutral {
  border-left: 4px solid #c8d6e5;
}

.story-card.emotion-excited {
  border-left: 4px solid #ff6b9d;
}

.story-card.emotion-peaceful {
  border-left: 4px solid #a8e6cf;
}
</style>
