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
      <div class="form-section">
        <input
          v-model="form.title"
          type="text"
          placeholder="给故事起个标题吧"
          maxlength="20"
          class="title-input"
          @keydown.enter.prevent
        />
        <span class="char-count char-count--title">{{ form.title.length }}/20</span>
        <textarea
          v-model="form.content"
          placeholder="写下此刻的故事..."
          maxlength="500"
        ></textarea>
        <span class="char-count">{{ form.content.length }}/500</span>
      </div>

      <ImageUploader v-model="form.images" />

      <EmotionSelector v-model="form.emotion" />

      <div class="form-section">
        <label class="checkbox">
          <input v-model="form.isTimeCapsule" type="checkbox" />
          <span>设为时光胶囊</span>
        </label>

        <div v-if="form.isTimeCapsule" class="time-capsule-config">
          <label>解锁时间</label>
          <div class="date-picker-wrapper">
            <input v-model="form.unlockAt" type="datetime-local" />
            <span class="date-picker-icon">📅</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStoryStore } from "../../stores/story";
import { useMapStore } from "../../stores/map";
import ImageUploader from "../../components/ImageUploader.vue";
import EmotionSelector from "../../components/EmotionSelector.vue";
import { uploadImages, validateImage } from "../../utils/upload";
import { showToast } from "../../composables/useToast.js";
import { encodeStoryContent } from "../../utils/storyTitle";

const router = useRouter();
const storyStore = useStoryStore();
const mapStore = useMapStore();

onMounted(() => {
  console.log("Publish 页面已挂载");
  console.log("当前路由:", router.currentRoute.value.path);
  console.log("路由对象:", router);
});

const form = ref({
  title: "",
  content: "",
  images: [],
  emotion: null,
  isTimeCapsule: false,
  unlockAt: "",
});

const isValid = computed(() => {
  return form.value.title.trim().length > 0 && form.value.content.trim().length > 0;
});

function handleBack(event) {
  console.log("=== handleBack 被调用 ===");
  console.log("当前路由:", router.currentRoute.value.path);
  console.log("准备跳转到: /map");

  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log("使用 window.location.href 跳转");
  window.location.href = "/map";
}

async function handleSubmit() {
  try {
    if (!mapStore.userLocation) {
      mapStore.setUserLocation(
        mapStore.center.latitude,
        mapStore.center.longitude,
      );
    }

    let imageUrls = [];
    if (form.value.images && form.value.images.length > 0) {
      for (const file of form.value.images) {
        const validation = validateImage(file);
        if (!validation.valid) {
          showToast(validation.error, "warning");
          return;
        }
      }

      imageUrls = await uploadImages(form.value.images);
    }

    await storyStore.createStory({
      content: encodeStoryContent(form.value.title, form.value.content),
      images: imageUrls,
      location: {
        lat: mapStore.userLocation.latitude,
        lng: mapStore.userLocation.longitude,
        address: "当前位置",
      },
      emotion: form.value.emotion,
      isTimeCapsule: form.value.isTimeCapsule,
      unlockAt: form.value.unlockAt,
    });

    showToast("发布成功！", "success");
    router.push("/map");
  } catch (error) {
    console.error("发布失败:", error);
    showToast("发布失败，请重试", "error");
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

.title-input {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  margin-bottom: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  transition: all 0.3s ease;
}

.title-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.title-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

.char-count--title {
  margin-top: 0;
  margin-bottom: 4px;
  font-size: 11px;
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

.date-picker-wrapper {
  position: relative;
}

.date-picker-wrapper input {
  width: 100%;
  padding: 12px;
  padding-right: 40px;
  border: 2px solid rgba(102, 126, 234, 0.5);
  border-radius: 8px;
  font-size: 16px;
  background: #dce8ff;
  color: #333333;
  transition: all 0.3s ease;
}

.date-picker-wrapper input:focus {
  outline: none;
  border-color: #667eea;
  background: #c5d6ff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.date-picker-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
  user-select: none;
}

.time-capsule-config label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}
</style>

<!-- 非 scoped：隐藏原生黑色日历图标 -->
<style>
.publish-page .date-picker-wrapper input::-webkit-calendar-picker-indicator {
  opacity: 0 !important;
}
</style>
