import { defineStore } from "pinia";
import { ref } from "vue";

export const useMapStore = defineStore("map", () => {
  const COORD_EPSILON = 0.000001;

  const center = ref({
    latitude: 39.9042,
    longitude: 116.4074,
  });
  const zoom = ref(12);
  const userLocation = ref(null);
  const stories = ref([]);
  const selectedStory = ref(null);
  const clusters = ref([]);

  function updateCenter(lat, lng) {
    const nextLat = Number(lat);
    const nextLng = Number(lng);

    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return;
    }

    const sameCenter =
      Math.abs(center.value.latitude - nextLat) < COORD_EPSILON &&
      Math.abs(center.value.longitude - nextLng) < COORD_EPSILON;

    if (sameCenter) {
      return;
    }

    center.value = { latitude: nextLat, longitude: nextLng };
  }

  function updateZoom(level) {
    const nextZoom = Number(level);

    if (!Number.isFinite(nextZoom) || zoom.value === nextZoom) {
      return;
    }

    zoom.value = nextZoom;
  }

  function setUserLocation(lat, lng) {
    const nextLat = Number(lat);
    const nextLng = Number(lng);

    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return;
    }

    const current = userLocation.value;
    const sameLocation =
      current &&
      Math.abs(current.latitude - nextLat) < COORD_EPSILON &&
      Math.abs(current.longitude - nextLng) < COORD_EPSILON;

    if (sameLocation) {
      return;
    }

    userLocation.value = { latitude: nextLat, longitude: nextLng };
  }

  function updateStories(newStories) {
    stories.value = Array.isArray(newStories) ? newStories : [];
  }

  function selectStory(story) {
    selectedStory.value = story;
  }

  function clearSelection() {
    selectedStory.value = null;
  }

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
    updateClusters,
  };
});
