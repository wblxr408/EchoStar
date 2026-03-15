<template>
  <div class="amap-container" ref="mapContainer">
    <!-- 地图主题切换按钮 -->
    <button class="theme-toggle-btn" @click="toggleTheme" :title="isDarkMode ? '切换到浅色' : '切换到深色'">
      <span>{{ isDarkMode ? '☀️' : '🌙' }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useMapStore } from '../stores/map';

const props = defineProps({
  stories: {
    type: Array,
    default: () => []
  },
  center: {
    type: Object,
    default: () => ({ latitude: 39.9042, longitude: 116.4074 })
  },
  zoom: {
    type: Number,
    default: 12
  },
  theme: {
    type: String,
    default: 'light' // 'light' or 'dark'
  }
});

const emit = defineEmits(['marker-click', 'map-move', 'theme-change']);

const mapContainer = ref(null);
let map = null;
let markers = [];
const isDarkMode = ref(props.theme === 'dark');

const mapStore = useMapStore();

// 情绪颜色映射(浅色模式)
const emotionColors = {
  happy: '#ffd93d',
  sad: '#6bceff',
  neutral: '#c8d6e5',
  excited: '#ff6b9d',
  peaceful: '#a8e6cf'
};

// 情绪颜色映射(深色模式)
const emotionColorsDark = {
  happy: '#ffd93d',
  sad: '#6bceff',
  neutral: '#b8c5cc',
  excited: '#ff6b9d',
  peaceful: '#9ae6d9'
};

// 初始化地图
function initMap() {
  if (!window.AMap) {
    console.error('高德地图 API 未加载');
    return;
  }

  const mapStyle = isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/whitesmoke';

  map = new AMap.Map(mapContainer.value, {
    zoom: props.zoom,
    center: [props.center.longitude, props.center.latitude],
    mapStyle: mapStyle, // 治愈系风格
    viewMode: '2D',
    showLabel: true
  });

  // 地图移动事件
  map.on('moveend', () => {
    const center = map.getCenter();
    emit('map-move', {
      latitude: center.getLat(),
      longitude: center.getLng(),
      zoom: map.getZoom()
    });
    mapStore.updateCenter(center.getLat(), center.getLng());
  });

  map.on('zoomend', () => {
    mapStore.updateZoom(map.getZoom());
  });

  // 添加控件
  map.addControl(new AMap.Scale());
  map.addControl(new AMap.ToolBar());
}

// 清除所有标记
function clearMarkers() {
  markers.forEach(marker => map.remove(marker));
  markers = [];
}

// 创建自定义标记
function createMarker(story) {
  const content = document.createElement('div');
  content.className = 'custom-marker';

  // 根据情绪设置颜色
  const colors = isDarkMode.value ? emotionColorsDark : emotionColors;
  const color = colors[story.emotion] || '#667eea';

  // 时光胶囊样式
  const isLocked = story.isTimeCapsule && !story.isUnlocked;

  content.innerHTML = `
    <div class="marker-wrapper" style="background: ${color}; ${isLocked ? 'opacity: 0.6;' : ''}">
      <div class="marker-star">⭐</div>
      <div class="marker-emotion">${isLocked ? '🔒' : getEmotionEmoji(story.emotion)}</div>
    </div>
  `;

  const marker = new AMap.Marker({
    position: [story.location.lng, story.location.lat],
    content: content,
    offset: new AMap.Pixel(-25, -25),
    title: story.content.substring(0, 50) + '...',
    zIndex: story.isTimeCapsule ? 10 : 100
  });

  // 点击事件
  marker.on('click', () => {
    emit('marker-click', story);
  });

  return marker;
}

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

// 更新标记
function updateMarkers() {
  clearMarkers();

  props.stories.forEach(story => {
    const marker = createMarker(story);
    markers.push(marker);
  });

  if (markers.length > 0) {
    map.add(markers);
  }
}

// 加载高德地图脚本
function loadAMapScript() {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve();
      return;
    }

    const key = import.meta.env.VITE_AMAP_KEY || 'test_key';
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

onMounted(async () => {
  try {
    await loadAMapScript();
    initMap();
  } catch (error) {
    console.error('加载高德地图失败:', error);
  }
});

onUnmounted(() => {
  if (map) {
    map.destroy();
  }
});

// 切换地图主题
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;

  if (map) {
    const newStyle = isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/whitesmoke';
    map.setMapStyle(newStyle);
    emit('theme-change', isDarkMode.value ? 'dark' : 'light');

    // 重新创建标记以更新颜色
    updateMarkers();
  }
}

// 监听 props 变化
watch(() => props.stories, updateMarkers, { deep: true });

watch(() => props.center, (newCenter) => {
  if (map) {
    map.setCenter([newCenter.longitude, newCenter.latitude]);
  }
}, { deep: true });

watch(() => props.zoom, (newZoom) => {
  if (map) {
    map.setZoom(newZoom);
  }
});

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  isDarkMode.value = newTheme === 'dark';
  if (map) {
    const newStyle = isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/whitesmoke';
    map.setMapStyle(newStyle);
    updateMarkers();
  }
});
</script>

<style scoped>
.amap-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.theme-toggle-btn {
  position: fixed;
  top: 20px;
  right: 392px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e0e0e0;
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.theme-toggle-btn span {
  font-size: 20px;
  position: relative;
  top: -5%;
}

.theme-toggle-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.theme-toggle-btn:active {
  transform: scale(0.95);
}

:deep(.custom-marker) {
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

:deep(.custom-marker:hover) {
  transform: scale(1.3);
}

:deep(.custom-marker:active) {
  transform: scale(1.1);
}

:deep(.marker-wrapper) {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 3px solid white;
  overflow: hidden;
}

:deep(.marker-star) {
  position: absolute;
  font-size: 24px;
  animation: twinkle 2s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

:deep(.marker-emotion) {
  position: absolute;
  font-size: 20px;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes twinkle {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  25% {
    transform: scale(1.1) rotate(5deg);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
    opacity: 1;
  }
  75% {
    transform: scale(1.1) rotate(-5deg);
    opacity: 0.9;
  }
}

:deep(.amap-controls) {
  background: white !important;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
