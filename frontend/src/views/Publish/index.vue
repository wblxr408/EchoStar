<template>
  <div class="publish-page">
    <header class="page-header">
      <button class="back-btn" @click="handleBack">
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStoryStore } from '../../stores/story';
import { useMapStore } from '../../stores/map';
import ImageUploader from '../../components/ImageUploader.vue';
import EmotionSelector from '../../components/EmotionSelector.vue';
import { uploadImages, validateImage } from '../../utils/upload';

const router = useRouter();
const storyStore = useStoryStore();
const mapStore = useMapStore();

// 调试：监听路由变化
onMounted(() => {
  console.log('Publish 页面已挂载');
  console.log('当前路由:', router.currentRoute.value.path);
  console.log('路由对象:', router);
});

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

// 返回上一页
function handleBack(event) {
  console.log('=== handleBack 被调用 ===');
  console.log('当前路由:', router.currentRoute.value.path);
  console.log('准备跳转到: /map');

  // 阻止事件冒泡
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // 使用 window.location 强制跳转
  console.log('使用 window.location.href 跳转');
  window.location.href = '/map';
}

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

    // 上传图片到 OSS
    let imageUrls = [];
    if (form.value.images && form.value.images.length > 0) {
      // 验证并上传图片
      for (const file of form.value.images) {
        const validation = validateImage(file);
        if (!validation.valid) {
          alert(validation.error);
          return;
        }
      }
      
      // 上传所有图片
      imageUrls = await uploadImages(form.value.images);
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
    router.push('/map');
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
  background: linear-gradient(135deg, #2a2a4a 0%, #1a1a3a 100%);
  overflow-y: auto;
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.back-btn,
.submit-btn {
  min-height: 44px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 600;
  background: transparent;
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.back-btn span {
  line-height: 1;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: #ffffff !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 255, 255, 0.1);
}

.submit-btn {
  color: #ffffff;
}

.submit-btn:hover {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.page-header h1 {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.publish-form {
  padding: 80px 16px 16px 16px;
}

.form-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.form-section:hover {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  transition: all 0.3s ease;
}

textarea:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.char-count {
  display: block;
  margin-top: 8px;
  text-align: right;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #ffffff;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.checkbox:hover {
  opacity: 0.8;
}

.checkbox input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.time-capsule-config {
  margin-top: 16px;
}

.time-capsule-config label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.time-capsule-config input {
  width: 100%;
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  transition: all 0.3s ease;
}

.time-capsule-config input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.time-capsule-config input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}
</style>
