import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 地图状态管理
 */
export const useMapStore = defineStore('map', () => {
  const COORD_EPSILON = 0.000001;

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
    const nextLat = Number(lat);
    const nextLng = Number(lng);

    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return;
    }

    const sameCenter = Math.abs(center.value.latitude - nextLat) < COORD_EPSILON
      && Math.abs(center.value.longitude - nextLng) < COORD_EPSILON;

    if (sameCenter) {
      return;
    }

    center.value = { latitude: nextLat, longitude: nextLng };
  }

  /**
   * 更新缩放级别
   */
  function updateZoom(level) {
    const nextZoom = Number(level);

    if (!Number.isFinite(nextZoom) || zoom.value === nextZoom) {
      return;
    }

    zoom.value = nextZoom;
  }

  /**
   * 设置用户位置
   */
  function setUserLocation(lat, lng) {
    const nextLat = Number(lat);
    const nextLng = Number(lng);

    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return;
    }

    const current = userLocation.value;
    const sameLocation = current
      && Math.abs(current.latitude - nextLat) < COORD_EPSILON
      && Math.abs(current.longitude - nextLng) < COORD_EPSILON;

    if (sameLocation) {
      return;
    }

    userLocation.value = { latitude: nextLat, longitude: nextLng };
  }

  /**
   * 更新故事列表
   */
  function updateStories(newStories) {
    stories.value = Array.isArray(newStories) ? newStories : [];
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
