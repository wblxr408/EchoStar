<template>
  <div class="map-page">
    <div class="map-container">
      <AMap
        :stories="mapStore.stories"
        :center="mapStore.center"
        :zoom="mapStore.zoom"
        :theme="mapTheme"
        @marker-click="handleMarkerClick"
        @map-move="handleMapMove"
        @theme-change="handleThemeChange"
      />
    </div>

    <!-- 故事列表侧边栏 -->
    <div class="story-sidebar" :class="{ 'show-sidebar': showSidebar }">
      <div class="sidebar-header">
        <h3>附近的故事</h3>
        <button class="close-btn" @click="showSidebar = false">×</button>
      </div>

      <div class="sidebar-content">
        <div v-if="loading" class="loading">加载中...</div>

        <div v-else-if="stories.length === 0" class="empty">
          <p>附近还没有故事</p>
          <p class="hint">点击发布按钮,留下你的第一个故事吧</p>
        </div>

        <div v-else class="story-list">
          <StoryCard
            v-for="story in stories"
            :key="story.id"
            :story="story"
            @preview-image="handlePreviewImage"
          />
        </div>
      </div>
    </div>

    <!-- 侧边栏切换按钮 -->
    <button class="toggle-sidebar-btn" @click="showSidebar = !showSidebar">
      <span>{{ showSidebar ? '→' : '←' }}</span>
    </button>

    <!-- 发布按钮 -->
    <button class="publish-btn" @click="$router.push('/publish')">
      <span>+</span>
    </button>

    <!-- 随机漫步按钮 -->
    <button class="random-walk-btn" @click="handleRandomWalk" :disabled="randomWalking">
      <span>🎲</span>
    </button>

    <!-- 选中故事的弹窗 -->
    <div v-if="selectedStory" class="story-modal" @click="closeStoryModal">
      <div class="modal-content" @click.stop>
        <button class="close-modal-btn" @click="closeStoryModal">×</button>
        <StoryCard :story="selectedStory" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useMapStore } from '../../stores/map';
import { mapApi } from '../../api/map';
import AMap from '../../components/AMap.vue';
import StoryCard from '../../components/StoryCard.vue';

const mapStore = useMapStore();

const showSidebar = ref(true);
const loading = ref(false);
const randomWalking = ref(false);
const selectedStory = ref(null);
const mapTheme = ref(localStorage.getItem('mapTheme') || 'light');

// 故事列表
const stories = computed(() => mapStore.stories);

// 加载附近故事
async function loadStories() {
  loading.value = true;
  try {
    const { data } = await mapApi.exploreStories(
      mapStore.center.latitude,
      mapStore.center.longitude,
      5000 // 5km 范围
    );
    mapStore.updateStories(data.stories || []);
  } catch (error) {
    console.error('加载故事失败:', error);
  } finally {
    loading.value = false;
  }
}

// 标记点击事件
function handleMarkerClick(story) {
  selectedStory.value = story;
}

// 关闭故事弹窗
function closeStoryModal() {
  selectedStory.value = null;
}

// 地图移动事件
function handleMapMove(event) {
  mapStore.updateCenter(event.latitude, event.longitude);
  mapStore.updateZoom(event.zoom);

  // 防抖加载
  clearTimeout(loadTimer);
  loadTimer = setTimeout(loadStories, 500);
}

let loadTimer = null;

// 随机漫步
async function handleRandomWalk() {
  randomWalking.value = true;
  try {
    const story = await mapApi.randomWalk();
    if (story) {
      mapStore.updateCenter(story.location.lat, story.location.lng);
      selectedStory.value = story;
    }
  } catch (error) {
    console.error('随机漫步失败:', error);
    alert('随机漫步失败,请重试');
  } finally {
    randomWalking.value = false;
  }
}

// 预览图片
function handlePreviewImage({ index, images }) {
  // TODO: 实现图片预览器
  console.log('预览图片:', index, images);
}

// 切换地图主题
function handleThemeChange(theme) {
  mapTheme.value = theme;
  localStorage.setItem('mapTheme', theme);
}

// 获取用户位置
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapStore.setUserLocation(latitude, longitude);
        mapStore.updateCenter(latitude, longitude);
      },
      (error) => {
        console.error('获取位置失败:', error);
      }
    );
  }
}

onMounted(() => {
  getUserLocation();
  loadStories();
});
</script>

<style scoped>
.map-page {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.story-sidebar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 380px;
  background: white;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.story-sidebar.show-sidebar {
  transform: translateX(0);
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f0f0f0;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: #e0e0e0;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty .hint {
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.8;
}

.story-list {
  padding-bottom: 80px;
}

.toggle-sidebar-btn {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 64px;
  background: white;
  border: 1px solid #e0e0e0;
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 18px;
  cursor: pointer;
  z-index: 101;
  transition: all 0.2s ease;
}

.toggle-sidebar-btn:hover {
  background: #f8f9fa;
  width: 40px;
}

.toggle-sidebar-btn.show-sidebar {
  right: 380px;
}

.publish-btn {
  position: fixed;
  bottom: 32px;
  right: 392px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.publish-btn span {
  font-size: 28px;
  position: relative;
  top: -5%;
}

.publish-btn:hover {
  transform: scale(1.1);
}

.publish-btn.show-sidebar {
  right: 408px;
}

.random-walk-btn {
  position: fixed;
  bottom: 32px;
  left: 32px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  font-size: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  z-index: 100;
}

.random-walk-btn:hover {
  transform: scale(1.1);
}

.random-walk-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.story-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  animation: fadeInUp 0.3s ease;
}

.close-modal-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f0f0f0;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.close-modal-btn:hover {
  background: #e0e0e0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
