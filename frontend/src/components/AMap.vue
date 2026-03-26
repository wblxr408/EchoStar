<template>
  <div class="amap-container" :class="{ 'dark-mode': isDarkMode }" ref="mapContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { fromEmotionTag, getEmotionEmoji } from '../utils/emotion';

const props = defineProps({
  stories: {
    type: Array,
    default: () => []
  },
  userLocation: {
    type: Object,
    default: null
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
    default: 'light'
  },
  pointPickMode: {
    type: Boolean,
    default: false
  },
  tempPickedLocation: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['marker-click', 'map-move', 'theme-change', 'map-click']);

const mapContainer = ref(null);
const DEFAULT_CENTER = Object.freeze({ latitude: 39.9042, longitude: 116.4074 });
const emotionColors = {
  happy: '#ffd93d',
  sad: '#6bceff',
  neutral: '#c8d6e5',
  excited: '#ff6b9d',
  peaceful: '#a8e6cf'
};
const emotionColorsDark = {
  happy: '#ffd93d',
  sad: '#6bceff',
  neutral: '#b8c5cc',
  excited: '#ff6b9d',
  peaceful: '#9ae6d9'
};

let map = null;
let markers = [];
let userLocationMarker = null;
let tempPickedMarker = null;
const isDarkMode = ref(props.theme === 'dark');
const isSidebarHidden = ref(false);
const isPublishSidebarOpen = ref(false);

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveCoordinates(source) {
  const candidates = [source, source?.location].filter(
    (item) => item && typeof item === 'object'
  );

  for (const item of candidates) {
    const latitude = toFiniteNumber(item.latitude ?? item.lat);
    const longitude = toFiniteNumber(item.longitude ?? item.lng);

    if (latitude !== null && longitude !== null) {
      return {
        latitude,
        longitude,
        lat: latitude,
        lng: longitude
      };
    }
  }

  return null;
}

function addMapControls() {
  if (!map || !window.AMap?.plugin) {
    return;
  }

  window.AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
    if (!map) {
      return;
    }

    if (window.AMap.Scale) {
      map.addControl(new window.AMap.Scale());
    }

    if (window.AMap.ToolBar) {
      map.addControl(new window.AMap.ToolBar());
    }
  });
}

function updateMapCursor() {
  if (!mapContainer.value) {
    return;
  }

  const cursor = props.pointPickMode ? 'crosshair' : '';
  mapContainer.value.style.cursor = cursor;

  if (map?.setDefaultCursor) {
    map.setDefaultCursor(props.pointPickMode ? 'crosshair' : 'default');
  }
}

function initMap() {
  if (!window.AMap || !mapContainer.value) {
    console.error('[AMap] Failed to initialize map instance.');
    return;
  }

  const mapStyle = isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/whitesmoke';
  const initialCenter = resolveCoordinates(props.center) || DEFAULT_CENTER;

  map = new window.AMap.Map(mapContainer.value, {
    zoom: Math.max(Number(props.zoom) || 4, 4),
    center: [initialCenter.longitude, initialCenter.latitude],
    mapStyle,
    viewMode: '2D',
    showLabel: true,
    resizeEnable: true,
    expandZoomRange: true,
    zooms: [4, 20],
    dragEnable: true,
    scrollWheel: true
  });

  map.on('move', () => {
    if (!map) {
      return;
    }

    const center = map.getCenter();
    const zoom = map.getZoom();

    if (zoom <= 4) {
      let lat = center.getLat();
      let lng = center.getLng();

      if (lat > 60) lat = 60;
      if (lat < -60) lat = -60;
      if (lng > 180) lng = 180;
      if (lng < -180) lng = -180;

      if (lat !== center.getLat() || lng !== center.getLng()) {
        map.setCenter([lng, lat]);
      }
    }
  });

  map.on('moveend', () => {
    if (!map) {
      return;
    }

    const center = map.getCenter();
    emit('map-move', {
      latitude: center.getLat(),
      longitude: center.getLng(),
      zoom: map.getZoom()
    });
  });

  map.on('zoomend', () => {
    if (!map) {
      return;
    }

    const center = map.getCenter();
    emit('map-move', {
      latitude: center.getLat(),
      longitude: center.getLng(),
      zoom: map.getZoom()
    });
  });

  map.on('click', (event) => {
    const lngLat = event?.lnglat;
    const pixel = event?.pixel;
    const latitude = toFiniteNumber(lngLat?.getLat?.());
    const longitude = toFiniteNumber(lngLat?.getLng?.());
    const screenX = toFiniteNumber(pixel?.getX?.() ?? pixel?.x) ?? window.innerWidth / 2;
    const screenY = toFiniteNumber(pixel?.getY?.() ?? pixel?.y) ?? window.innerHeight / 2;

    if (latitude === null || longitude === null) {
      return;
    }

    emit('map-click', {
      latitude,
      longitude,
      lat: latitude,
      lng: longitude,
      screenX,
      screenY
    });
  });

  addMapControls();
  updateMapCursor();
}

function clearMarkers() {
  if (!map) {
    markers = [];
    return;
  }

  markers.forEach((marker) => map.remove(marker));
  markers = [];
}

function clearUserLocationMarker() {
  if (userLocationMarker && map) {
    map.remove(userLocationMarker);
    userLocationMarker = null;
  }
}

function clearTempPickedMarker() {
  if (tempPickedMarker && map) {
    map.remove(tempPickedMarker);
    tempPickedMarker = null;
  }
}

function createUserLocationMarker(location) {
  const coords = resolveCoordinates(location);

  if (!coords || !window.AMap) {
    return null;
  }

  if (window.AMap.Icon) {
    const dropletSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40" fill="none">
        <path d="M15 38C15 38 25 27.2 25 17.8C25 10.7 20.5 6 15 6C9.5 6 5 10.7 5 17.8C5 27.2 15 38 15 38Z" fill="#2E86FF"/>
        <circle cx="15" cy="17" r="4.6" fill="#FFFFFF" fill-opacity="0.96"/>
      </svg>
    `.trim();

    return new window.AMap.Marker({
      position: [coords.longitude, coords.latitude],
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(30, 40),
        image: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(dropletSvg)}`,
        imageSize: new window.AMap.Size(30, 40)
      }),
      offset: new window.AMap.Pixel(-15, -38),
      zIndex: 1200
    });
  }

  const content = document.createElement('div');
  content.className = 'user-location-marker';
  content.innerHTML = `
    <div class="user-location-pulse"></div>
    <div class="user-location-dot"></div>
  `;

  return new window.AMap.Marker({
    position: [coords.longitude, coords.latitude],
    content,
    offset: new window.AMap.Pixel(-14, -14),
    zIndex: 1000
  });
}

function updateUserLocationMarker(location = props.userLocation) {
  if (!map || !window.AMap) {
    return;
  }

  const coords = resolveCoordinates(location);

  if (!coords) {
    clearUserLocationMarker();
    return;
  }

  if (!userLocationMarker) {
    userLocationMarker = createUserLocationMarker(coords);
    if (userLocationMarker) {
      map.add(userLocationMarker);
    }
    return;
  }

  userLocationMarker.setPosition([coords.longitude, coords.latitude]);
}

function createTempPickedMarker(location) {
  const coords = resolveCoordinates(location);

  if (!coords || !window.AMap) {
    return null;
  }

  if (window.AMap.Icon) {
    const dropletSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40" fill="none">
        <path d="M15 38C15 38 25 27.2 25 17.8C25 10.7 20.5 6 15 6C9.5 6 5 10.7 5 17.8C5 27.2 15 38 15 38Z" fill="#E34C43"/>
        <circle cx="15" cy="17" r="4.6" fill="#FFF4F2" fill-opacity="0.96"/>
      </svg>
    `.trim();

    return new window.AMap.Marker({
      position: [coords.longitude, coords.latitude],
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(30, 40),
        image: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(dropletSvg)}`,
        imageSize: new window.AMap.Size(30, 40)
      }),
      offset: new window.AMap.Pixel(-15, -38),
      zIndex: 1200
    });
  }

  const content = document.createElement('div');
  content.className = 'temp-picked-marker';
  content.innerHTML = `
    <div class="temp-picked-flag">
      <span class="temp-picked-flag-icon">⚑</span>
    </div>
    <div class="temp-picked-pole"></div>
  `;

  return new window.AMap.Marker({
    position: [coords.longitude, coords.latitude],
    content,
    offset: new window.AMap.Pixel(-16, -42),
    zIndex: 1200
  });
}

function updateTempPickedMarker(location = props.tempPickedLocation) {
  if (!map || !window.AMap) {
    return;
  }

  const coords = resolveCoordinates(location);
  if (!coords) {
    clearTempPickedMarker();
    return;
  }

  if (!tempPickedMarker) {
    tempPickedMarker = createTempPickedMarker(coords);
    if (tempPickedMarker) {
      map.add(tempPickedMarker);
    }
    return;
  }

  tempPickedMarker.setPosition([coords.longitude, coords.latitude]);
}

function createMarker(story) {
  if (!map || !window.AMap) {
    return null;
  }

  const coords = resolveCoordinates(story);

  if (!coords) {
    console.warn('[AMap] Skip story with invalid coordinates:', story);
    return null;
  }

  const content = document.createElement('div');
  content.className = 'custom-marker';

  const colors = isDarkMode.value ? emotionColorsDark : emotionColors;
  const emotion = fromEmotionTag(story.emotionTag) || story.emotion;
  const color = colors[emotion] || '#667eea';
  const isLocked = story.isTimeCapsule && !story.isUnlocked;

  content.innerHTML = `
    <div class="marker-wrapper" style="background: ${color}; ${isLocked ? 'opacity: 0.6;' : ''}">
      <div class="marker-star">*</div>
      <div class="marker-emotion">${isLocked ? 'LOCK' : getEmotionEmoji(story.emotionTag || story.emotion)}</div>
    </div>
  `;

  const marker = new window.AMap.Marker({
    position: [coords.longitude, coords.latitude],
    content,
    offset: new window.AMap.Pixel(-25, -25),
    title: (story.content || story.preview || '').substring(0, 50) + '...',
    zIndex: story.isTimeCapsule ? 10 : 100
  });

  marker.on('click', () => {
    let screenX = window.innerWidth / 2;
    let screenY = window.innerHeight / 2;

    try {
      const pixel = map.lngLatToContainer([coords.longitude, coords.latitude]);
      const nextX = pixel?.getX?.();
      const nextY = pixel?.getY?.();

      if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
        screenX = nextX;
        screenY = nextY;
      }
    } catch (error) {
      console.warn('[AMap] Failed to resolve marker screen position:', error, story);
    }

    emit('marker-click', {
      story,
      screenX,
      screenY
    });
  });

  return marker;
}

function updateMarkers() {
  if (!map || !window.AMap) {
    return;
  }

  clearMarkers();

  const storyList = Array.isArray(props.stories) ? props.stories : [];
  storyList.forEach((story) => {
    const marker = createMarker(story);
    if (marker) {
      markers.push(marker);
    }
  });

  if (markers.length > 0) {
    map.add(markers);
  }
}

function addNewStoryMarker(story) {
  if (!map || !window.AMap) {
    return;
  }

  const marker = createMarker(story);

  if (!marker) {
    return;
  }

  const coords = resolveCoordinates(story);
  markers.push(marker);
  map.add(marker);

  if (coords) {
    map.panTo([coords.longitude, coords.latitude]);
  }
}

defineExpose({
  addNewStoryMarker
});

function loadAMapScript() {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[data-amap-script="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const key = import.meta.env.VITE_AMAP_KEY || 'test_key';
    const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE;

    if (securityJsCode) {
      window._AMapSecurityConfig = {
        ...(window._AMapSecurityConfig || {}),
        securityJsCode
      };
    }

    const script = document.createElement('script');
    script.dataset.amapScript = 'true';
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Scale,AMap.ToolBar`;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

onMounted(async () => {
  try {
    await loadAMapScript();
    initMap();
    updateMarkers();
    updateUserLocationMarker();
    updateTempPickedMarker();

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('publish-sidebar-toggle', handlePublishSidebarToggle);
  } catch (error) {
    console.error('[AMap] Failed to initialize map resources:', error);
  }
});

onUnmounted(() => {
  clearUserLocationMarker();
  clearTempPickedMarker();
  clearMarkers();

  if (map) {
    map.destroy();
    map = null;
  }

  window.removeEventListener('sidebar-toggle', handleSidebarToggle);
  window.removeEventListener('publish-sidebar-toggle', handlePublishSidebarToggle);
});

function handleSidebarToggle(event) {
  isSidebarHidden.value = !event.detail?.isOpen;
}

function handlePublishSidebarToggle(event) {
  isPublishSidebarOpen.value = !!event.detail?.isOpen;
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;

  if (map) {
    const newStyle = isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/whitesmoke';
    map.setMapStyle(newStyle);
    emit('theme-change', isDarkMode.value ? 'dark' : 'light');
    updateMarkers();
  }
}

watch(() => props.stories, updateMarkers, { deep: true });

watch(() => props.userLocation, (newLocation) => {
  updateUserLocationMarker(newLocation);
}, { deep: true });

watch(() => props.center, (newCenter) => {
  if (!map) {
    return;
  }

  const coords = resolveCoordinates(newCenter);
  if (!coords) {
    console.warn('[AMap] Skip invalid map center:', newCenter);
    return;
  }

  const currentCenter = map.getCenter?.();
  const sameCenter = currentCenter
    && Math.abs(currentCenter.getLat() - coords.latitude) < 0.000001
    && Math.abs(currentCenter.getLng() - coords.longitude) < 0.000001;

  if (!sameCenter) {
    map.setCenter([coords.longitude, coords.latitude]);
  }
}, { deep: true });

watch(() => props.zoom, (newZoom) => {
  const zoom = Number(newZoom);

  if (map && Number.isFinite(zoom)) {
    map.setZoom(zoom);
  }
});

watch(() => props.theme, (newTheme) => {
  isDarkMode.value = newTheme === 'dark';
  if (map) {
    const newStyle = isDarkMode.value ? 'amap://styles/dark' : 'amap://styles/whitesmoke';
    map.setMapStyle(newStyle);
    updateMarkers();
  }
});

watch(() => props.pointPickMode, () => {
  updateMapCursor();
});

watch(() => props.tempPickedLocation, (newLocation) => {
  updateTempPickedMarker(newLocation);
}, { deep: true });
</script>

<style scoped>
.amap-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #d0d0d0;
}

.amap-container :deep(.amap-maps) {
  width: 100% !important;
  height: 100% !important;
}

.amap-container :deep(.amap-layer) {
  background: #d0d0d0;
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

:deep(.user-location-marker) {
  position: relative;
  width: 26px;
  height: 36px;
}

:deep(.user-location-pulse) {
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 18px;
  height: 18px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: rgba(46, 134, 255, 0.22);
  animation: user-location-pulse 2s ease-out infinite;
}

:deep(.user-location-dot) {
  position: absolute;
  left: 50%;
  top: 0;
  width: 26px;
  height: 36px;
  transform: translateX(-50%);
  clip-path: path('M13 36C13 36 22 26.6 22 18.8C22 12.7 18 8.5 13 8.5C8 8.5 4 12.7 4 18.8C4 26.6 13 36 13 36Z');
  background: #2e86ff;
  box-shadow: 0 10px 18px -12px rgba(46, 134, 255, 0.72);
}

:deep(.user-location-dot::after) {
  content: '';
  position: absolute;
  left: 50%;
  top: 11px;
  width: 9px;
  height: 9px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
}

:deep(.temp-picked-marker) {
  width: 26px;
  height: 36px;
}

:deep(.temp-picked-flag) {
  position: relative;
  width: 26px;
  height: 36px;
  clip-path: path('M13 36C13 36 22 26.6 22 18.8C22 12.7 18 8.5 13 8.5C8 8.5 4 12.7 4 18.8C4 26.6 13 36 13 36Z');
  background: #e34c43;
  box-shadow: 0 10px 18px -12px rgba(227, 76, 67, 0.72);
}

:deep(.temp-picked-flag-icon) {
  position: absolute;
  left: 50%;
  top: 11px;
  width: 9px;
  height: 9px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: rgba(255, 244, 242, 0.96);
  font-size: 0;
}

:deep(.temp-picked-pole) {
  display: none;
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

/* 夜间模式：标记点如夜空星辰 */
:deep(.amap-container.dark-mode .marker-wrapper) {
  box-shadow: 0 0 12px currentColor, 0 0 24px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.5);
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

@keyframes user-location-pulse {
  0% {
    transform: scale(0.7);
    opacity: 0.9;
  }
  70% {
    transform: scale(1.8);
    opacity: 0;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

:deep(.amap-controls) {
  background: white !important;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
