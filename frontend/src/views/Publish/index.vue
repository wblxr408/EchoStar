<template>
  <div class="publish-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <span>←</span>
      </button>
      <h1>发布故事</h1>
      <button class="submit-btn" @click="handleSubmit" :disabled="!isValid">
        发布
      </button>
    </header>

    <div class="publish-form">
      <!-- 内容输入 -->
      <div class="form-section">
        <textarea
          v-model="form.content"
          placeholder="写下此刻的故事..."
          maxlength="500"
        ></textarea>
        <span class="char-count">{{ form.content.length }}/500</span>
      </div>

      <!-- 图片上传 -->
      <ImageUploader v-model="form.images" />

      <!-- 情绪选择 -->
      <EmotionSelector v-model="form.emotion" />

      <!-- 时光胶囊选项 -->
      <div class="form-section">
        <label class="checkbox">
          <input v-model="form.isTimeCapsule" type="checkbox" />
          <span>设为时光胶囊</span>
        </label>

        <div v-if="form.isTimeCapsule" class="time-capsule-config">
          <label>解锁时间</label>
          <input v-model="form.unlockAt" type="datetime-local" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStoryStore } from '../../stores/story';
import { useMapStore } from '../../stores/map';
import ImageUploader from '../../components/ImageUploader.vue';
import EmotionSelector from '../../components/EmotionSelector.vue';

const router = useRouter();
const storyStore = useStoryStore();
const mapStore = useMapStore();

const form = ref({
  content: '',
  images: [],
  emotion: null,
  isTimeCapsule: false,
  unlockAt: ''
});

// 表单是否有效
const isValid = computed(() => {
  return form.value.content.trim().length > 0;
});

// 提交发布
async function handleSubmit() {
  try {
    // 获取当前位置
    if (!mapStore.userLocation) {
      // 如果没有获取到位置,使用地图中心
      mapStore.setUserLocation(
        mapStore.center.latitude,
        mapStore.center.longitude
      );
    }

    // 上传图片 (模拟)
    const imageUrls = [];
    for (const file of form.value.images) {
      // TODO: 实现真实的 OSS 上传
      const imageUrl = URL.createObjectURL(file);
      imageUrls.push(imageUrl);
    }

    await storyStore.createStory({
      content: form.value.content,
      images: imageUrls,
      location: {
        lat: mapStore.userLocation.latitude,
        lng: mapStore.userLocation.longitude,
        address: '当前位置'
      },
      emotion: form.value.emotion,
      isTimeCapsule: form.value.isTimeCapsule,
      unlockAt: form.value.unlockAt
    });

    alert('发布成功！');
    router.back();
  } catch (error) {
    console.error('发布失败:', error);
    alert('发布失败，请重试');
  }
}
</script>

<style scoped>
.publish-page {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn,
.submit-btn {
  padding: 8px 16px;
  font-size: 16px;
  font-weight: 600;
}

.back-btn {
  color: #666;
}

.submit-btn {
  color: #667eea;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-header h1 {
  font-size: 18px;
  font-weight: 600;
}

.publish-form {
  padding: 16px;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
}

textarea:focus {
  border-color: #667eea;
}

.char-count {
  display: block;
  margin-top: 8px;
  text-align: right;
  font-size: 12px;
  color: #999;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  cursor: pointer;
}

.checkbox input {
  width: 20px;
  height: 20px;
}

.time-capsule-config {
  margin-top: 16px;
}

.time-capsule-config label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.time-capsule-config input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}
</style>
