import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 地图状态管理
 */
export const useMapStore = defineStore('map', () => {
  // 当前地图中心点
  const center = ref({
    latitude: 39.9042, // 北京天安门
    longitude: 116.4074
  });

  // 当前缩放级别
  const zoom = ref(12);

  // 当前用户位置
  const userLocation = ref(null);

  // 地图范围内的故事列表
  const stories = ref([]);

  // 选中的故事
  const selectedStory = ref(null);

  // 聚合点数据
  const clusters = ref([]);

  /**
   * 更新地图中心
   */
  function updateCenter(lat, lng) {
    center.value = { latitude: lat, longitude: lng };
  }

  /**
   * 更新缩放级别
   */
  function updateZoom(level) {
    zoom.value = level;
  }

  /**
   * 设置用户位置
   */
  function setUserLocation(lat, lng) {
    userLocation.value = { latitude: lat, longitude: lng };
  }

  /**
   * 更新故事列表
   */
  function updateStories(newStories) {
    stories.value = newStories;
  }

  /**
   * 选择故事
   */
  function selectStory(story) {
    selectedStory.value = story;
  }

  /**
   * 清除选中
   */
  function clearSelection() {
    selectedStory.value = null;
  }

  /**
   * 更新聚合数据
   */
  function updateClusters(newClusters) {
    clusters.value = newClusters;
  }

  return {
    center,
    zoom,
    userLocation,
    stories,
    selectedStory,
    clusters,
    updateCenter,
    updateZoom,
    setUserLocation,
    updateStories,
    selectStory,
    clearSelection,
    updateClusters
  };
});
