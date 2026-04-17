<template>
  <div
    class="amap-container"
    :class="{ 'dark-mode': isDarkMode }"
    ref="mapContainer"
  ></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { fromEmotionTag, getEmotionEmoji } from "../utils/emotion";

const props = defineProps({
  stories: {
    type: Array,
    default: () => [],
  },
  clusters: {
    type: Array,
    default: () => [],
  },
  userLocation: {
    type: Object,
    default: null,
  },
  center: {
    type: Object,
    default: () => ({ latitude: 39.9042, longitude: 116.4074 }),
  },
  zoom: {
    type: Number,
    default: 12,
  },
  theme: {
    type: String,
    default: "light",
  },
  pointPickMode: {
    type: Boolean,
    default: false,
  },
  tempPickedLocation: {
    type: Object,
    default: null,
  },
  paperPlanePosition: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "marker-click",
  "map-move",
  "theme-change",
  "map-click",
  "cluster-click",
  "paper-plane-click",
  "paper-plane-move",
]);

const mapContainer = ref(null);
const DEFAULT_CENTER = Object.freeze({
  latitude: 39.9042,
  longitude: 116.4074,
});
const emotionColors = {
  happy: "#ffd93d",
  sad: "#6bceff",
  neutral: "#c8d6e5",
  excited: "#ff6b9d",
  peaceful: "#a8e6cf",
};
const emotionColorsDark = {
  happy: "#ffd93d",
  sad: "#6bceff",
  neutral: "#b8c5cc",
  excited: "#ff6b9d",
  peaceful: "#9ae6d9",
};

let map = null;
let markers = [];
let clusterMarkers = [];
let userLocationMarker = null;
let tempPickedMarker = null;
let paperPlaneMarker = null;
let paperPlaneTooltipEl = null;
let paperPlaneTooltipTimer = null;
let paperPlaneInitialized = false;
let moveAnimationReady = true; // 改为默认 true，因为插件将通过 URL 同步加载
const isDarkMode = ref(props.theme === "dark");
const isSidebarHidden = ref(false);
const isPublishSidebarOpen = ref(false);

function setMapZoomingState(isZooming) {
  if (!mapContainer.value) {
    return;
  }

  mapContainer.value.classList.toggle("is-zooming", isZooming);
}

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCoordinate(valueOrGetter) {
  if (typeof valueOrGetter === "function") {
    try {
      return toFiniteNumber(valueOrGetter());
    } catch {
      return null;
    }
  }

  return toFiniteNumber(valueOrGetter);
}

function resolveLngLatPoint(point) {
  if (!point || typeof point !== "object") {
    return null;
  }

  const latitude = readCoordinate(point.getLat ?? point.lat);
  const longitude = readCoordinate(point.getLng ?? point.lng);

  if (latitude === null || longitude === null) {
    return null;
  }

  return { lat: latitude, lng: longitude };
}

function resolveCoordinates(source) {
  const candidates = [source, source?.location].filter(
    (item) => item && typeof item === "object",
  );

  for (const item of candidates) {
    const latitude = toFiniteNumber(item.latitude ?? item.lat);
    const longitude = toFiniteNumber(item.longitude ?? item.lng);

    if (latitude !== null && longitude !== null) {
      return {
        latitude,
        longitude,
        lat: latitude,
        lng: longitude,
      };
    }
  }

  return null;
}

function getStoryIdKey(id) {
  return id === undefined || id === null ? null : String(id);
}

function dedupePointIds(pointIds = []) {
  const result = [];
  const seen = new Set();

  pointIds.forEach((id) => {
    const key = getStoryIdKey(id);
    if (key === null || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(id);
  });

  return result;
}

function resolveClusterCount(cluster) {
  const pointIds = dedupePointIds(cluster?.pointIds || []);
  const count = Number(cluster?.count);
  const normalizedCount = Number.isFinite(count) && count > 0 ? count : 0;
  return Math.max(normalizedCount, pointIds.length, 1);
}

function isClusterEntry(entry) {
  return (
    (entry?.type === "cluster" || resolveClusterCount(entry) > 1) &&
    !!resolveCoordinates(entry)
  );
}

function isPointEntry(entry) {
  return !isClusterEntry(entry) && !!resolveCoordinates(entry);
}

function createMarkerStoryFromPoint(point, storyLookup) {
  const storyIdKey = getStoryIdKey(point?.id);
  if (storyIdKey && storyLookup.has(storyIdKey)) {
    return storyLookup.get(storyIdKey);
  }

  const coords = resolveCoordinates(point);
  if (!coords) {
    return null;
  }

  return {
    ...point,
    id: point?.id ?? `cluster-point-${coords.latitude}-${coords.longitude}`,
    content: point?.content || point?.preview || "",
    preview: point?.preview || point?.content || "",
    images: Array.isArray(point?.images) ? point.images : [],
    emotion: point?.emotion || point?.emotionTag || "",
    emotionTag: point?.emotionTag || point?.emotion || "",
    location: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      lat: coords.latitude,
      lng: coords.longitude,
    },
  };
}

function getClusterPointStories(clusterList, storyList = []) {
  const storyLookup = new Map();

  storyList.forEach((story) => {
    const storyIdKey = getStoryIdKey(story?.id);
    if (!storyIdKey || storyLookup.has(storyIdKey)) {
      return;
    }

    storyLookup.set(storyIdKey, story);
  });

  return clusterList
    .filter((entry) => isPointEntry(entry))
    .map((point) => createMarkerStoryFromPoint(point, storyLookup))
    .filter(Boolean);
}

function dedupeStories(stories = []) {
  const result = [];
  const seen = new Set();

  stories.forEach((story) => {
    const storyIdKey = getStoryIdKey(story?.id);
    if (storyIdKey && seen.has(storyIdKey)) {
      return;
    }

    if (storyIdKey) {
      seen.add(storyIdKey);
    }

    result.push(story);
  });

  return result;
}

function addMapControls() {
  if (!map || !window.AMap) return;

  if (window.AMap.Scale) {
    map.addControl(new window.AMap.Scale());
  }

  if (window.AMap.ToolBar) {
    map.addControl(new window.AMap.ToolBar());
  }
}

function updateMapCursor() {
  if (!mapContainer.value) {
    return;
  }

  const cursor = props.pointPickMode ? "crosshair" : "";
  mapContainer.value.style.cursor = cursor;

  if (map?.setDefaultCursor) {
    map.setDefaultCursor(props.pointPickMode ? "crosshair" : "default");
  }
}

function initMap() {
  if (!window.AMap || !mapContainer.value) {
    console.error("[AMap] Failed to initialize map instance.");
    return;
  }

  const mapStyle = isDarkMode.value
    ? "amap://styles/dark"
    : "amap://styles/whitesmoke";
  const initialCenter = resolveCoordinates(props.center) || DEFAULT_CENTER;

  map = new window.AMap.Map(mapContainer.value, {
    zoom: Math.max(Number(props.zoom) || 4, 4),
    center: [initialCenter.longitude, initialCenter.latitude],
    mapStyle,
    viewMode: "2D",
    showLabel: true,
    resizeEnable: true,
    expandZoomRange: true,
    zooms: [4, 20],
    dragEnable: true,
    scrollWheel: true,
  });

  // 同步加载所需插件
  window.AMap.plugin(
    ["AMap.Scale", "AMap.ToolBar"],
    () => {
      if (!map) return;
      addMapControls();
      console.log('[AMap] Basic controls loaded.');
    }
  );

  map.on("move", () => {
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

  map.on("moveend", () => {
    if (!map) {
      return;
    }

    const center = map.getCenter();
    emit("map-move", {
      latitude: center.getLat(),
      longitude: center.getLng(),
      zoom: map.getZoom(),
    });

    // 地图移动后像素位置变化，重新检测高缩放聚合
    updateClusterMarkers();
    updateMarkers();
  });

  map.on("zoomstart", () => {
    setMapZoomingState(true);
  });

  map.on("zoomend", () => {
    if (!map) {
      return;
    }

    setMapZoomingState(false);

    const center = map.getCenter();
    emit("map-move", {
      latitude: center.getLat(),
      longitude: center.getLng(),
      zoom: map.getZoom(),
    });

    // 缩放结束后重新渲染标记（高缩放聚合检测依赖当前 zoom）
    updateClusterMarkers();
    updateMarkers();
  });

  map.on("click", (event) => {
    const lngLat = event?.lnglat;
    const pixel = event?.pixel;
    const latitude = toFiniteNumber(lngLat?.getLat?.());
    const longitude = toFiniteNumber(lngLat?.getLng?.());
    const screenX =
      toFiniteNumber(pixel?.getX?.() ?? pixel?.x) ?? window.innerWidth / 2;
    const screenY =
      toFiniteNumber(pixel?.getY?.() ?? pixel?.y) ?? window.innerHeight / 2;

    if (latitude === null || longitude === null) {
      return;
    }

    emit("map-click", {
      latitude,
      longitude,
      lat: latitude,
      lng: longitude,
      screenX,
      screenY,
    });
  });

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

function clearClusterMarkers() {
  if (!map) {
    clusterMarkers = [];
    return;
  }

  clusterMarkers.forEach((marker) => map.remove(marker));
  clusterMarkers = [];
}

/**
 * 安全替换标记：先将新标记添加到地图，再移除旧标记，避免闪烁。
 * @param {Array} oldMarkers - 旧标记数组引用
 * @param {Array} newMarkers - 新标记数组
 * @param {Function} setRef - 用于更新外部数组引用的回调 (newArr) => {}
 */
function swapMarkers(oldMarkers, newMarkers, setRef) {
  // 先把新标记加到地图上
  if (newMarkers.length > 0 && map) {
    map.add(newMarkers);
  }
  // 再移除旧标记（此时地图上已有新标记，不会闪烁）
  if (oldMarkers.length > 0 && map) {
    oldMarkers.forEach((marker) => map.remove(marker));
  }
  // 更新外部引用
  setRef(newMarkers);
}

function swapClusterMarkers(newClusterMarkers) {
  swapMarkers(clusterMarkers, newClusterMarkers, (arr) => { clusterMarkers = arr; });
}

function swapNormalMarkers(newNormalMarkers) {
  swapMarkers(markers, newNormalMarkers, (arr) => { markers = arr; });
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
        imageSize: new window.AMap.Size(30, 40),
      }),
      offset: new window.AMap.Pixel(-15, -38),
      zIndex: 1200,
    });
  }

  const content = document.createElement("div");
  content.className = "user-location-marker";
  content.innerHTML = `
    <div class="user-location-pulse"></div>
    <div class="user-location-dot"></div>
  `;

  return new window.AMap.Marker({
    position: [coords.longitude, coords.latitude],
    content,
    offset: new window.AMap.Pixel(-14, -14),
    zIndex: 1000,
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

// ========== 纸飞机地标 ==========
function createPaperPlaneMarker(coords) {
  if (!coords || !window.AMap) return null;

  const planeSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42" fill="none">
      <!-- 左翼（暗面） -->
      <path d="M18 2 L4 36 L18 26 Z" fill="#FF6B6B" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>
      <!-- 右翼（亮面） -->
      <path d="M18 2 L32 36 L18 26 Z" fill="#FF9E9E" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>
      <!-- 中心折脊（深色，立体感） -->
      <path d="M15 26 L18 2 L21 26 Z" fill="#E05050" opacity="0.6"/>
      <!-- 尾翼左 -->
      <path d="M4 36 L18 26 L18 30 L10 38 Z" fill="#D94444" stroke="#fff" stroke-width="0.6" stroke-linejoin="round"/>
      <!-- 尾翼右 -->
      <path d="M32 36 L18 26 L18 30 L26 38 Z" fill="#FFB0B0" stroke="#fff" stroke-width="0.6" stroke-linejoin="round"/>
      <!-- 折痕线 -->
      <line x1="18" y1="2" x2="18" y2="26" stroke="#fff" stroke-width="0.6" stroke-opacity="0.5"/>
      <line x1="18" y1="8" x2="10" y2="33" stroke="#fff" stroke-width="0.4" stroke-opacity="0.25"/>
      <line x1="18" y1="8" x2="26" y2="33" stroke="#fff" stroke-width="0.4" stroke-opacity="0.25"/>
    </svg>
  `.trim();

  // 视觉中心约在 (18, 20)，offset 使该点对准经纬度坐标
  const cx = 18, cy = 20;

  return new window.AMap.Marker({
    position: [coords.longitude, coords.latitude],
    icon: new window.AMap.Icon({
      size: new window.AMap.Size(36, 42),
      image: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(planeSvg)}`,
      imageSize: new window.AMap.Size(36, 42),
    }),
    offset: new window.AMap.Pixel(-cx, -cy),
    zIndex: 1300,
    cursor: 'pointer',
  });
}

function initPaperPlane(coords) {
  if (paperPlaneInitialized || !map || !window.AMap) return;
  // 稍微偏南一点，避免和用户定位标完全重叠
  const offsetCoords = { latitude: coords.latitude - 0.0008, longitude: coords.longitude };
  paperPlaneMarker = createPaperPlaneMarker(offsetCoords);
  if (paperPlaneMarker) {
    map.add(paperPlaneMarker);
    paperPlaneMarker.on('click', () => {
      const pos = paperPlaneMarker.getPosition();
      emit('paper-plane-click', {
        latitude: pos.getLat(),
        longitude: pos.getLng(),
      });
    });
    paperPlaneInitialized = true;
    // 更新 planePosition 以反映实际位置
    emit('paper-plane-move', { latitude: offsetCoords.latitude, longitude: offsetCoords.longitude });
    showPaperPlaneTooltip();
  }
}

function movePaperPlane(lat, lng, showTip = true) {
  if (!map || !window.AMap || !paperPlaneMarker) {
    if (!paperPlaneInitialized) {
      initPaperPlane({ latitude: lat, longitude: lng });
    }
    return;
  }
  const target = new window.AMap.LngLat(lng, lat);

  manualAnimatePaperPlane(target, showTip);
}

// 纸飞机从屏幕边缘飞入（用于搜索跳转等场景）
function flyPaperPlaneFromEdge(targetLat, targetLng, showTip = true) {
  if (!map || !window.AMap || !paperPlaneMarker) {
    if (!paperPlaneInitialized) {
      initPaperPlane({ latitude: targetLat, longitude: targetLng });
    }
    return;
  }

  const target = new window.AMap.LngLat(targetLng, targetLat);
  const start = paperPlaneMarker.getPosition();
  if (!start) return;

  // 将起点和终点转为屏幕像素坐标
  const startPixel = map.lngLatToContainer(start);
  const targetPixel = map.lngLatToContainer(target);

  // 起点在屏幕外时，找线段与屏幕边框的交点作为飞入起点
  const containerSize = map.getSize();
  const W = containerSize.getWidth();
  const H = containerSize.getHeight();
  const padding = 60; // 屏幕外留一点距离

  let startPxX = startPixel.getX();
  let startPxY = startPixel.getY();
  const endPxX = targetPixel.getX();
  const endPxY = targetPixel.getY();

  // 判断起点是否在屏幕内
  const isInScreen = startPxX >= -padding && startPxX <= W + padding &&
                     startPxY >= -padding && startPxY <= H + padding;

  if (!isInScreen) {
    // 起点→终点方向向量
    const dx = endPxX - startPxX;
    const dy = endPxY - startPxY;

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      // 几乎重叠，直接飞
      manualAnimatePaperPlane(target, showTip);
      return;
    }

    // 找到从屏幕外到屏幕边框的交点
    // 用参数方程 P = start + t * (end - start)，求 t 使得 P 在屏幕边框上
    // 取 t ∈ [0, 1] 范围内的交点（靠近起点的那个）
    let tMin = 1;
    const edges = [
      { val: startPxX, delta: dx, bound: -padding },      // 左边 x = -padding
      { val: startPxX, delta: dx, bound: W + padding },   // 右边 x = W+padding
      { val: startPxY, delta: dy, bound: -padding },       // 上边 y = -padding
      { val: startPxY, delta: dy, bound: H + padding },   // 下边 y = H+padding
    ];

    for (const edge of edges) {
      if (Math.abs(edge.delta) < 0.001) continue;
      const t = (edge.bound - edge.val) / edge.delta;
      if (t > 0.01 && t < tMin) {
        // 验证另一个分量在屏幕范围内
        const crossX = startPxX + t * dx;
        const crossY = startPxY + t * dy;
        if (crossX >= -padding && crossX <= W + padding && crossY >= -padding && crossY <= H + padding) {
          tMin = t;
        }
      }
    }

    // 计算交点像素坐标，转为经纬度作为飞入起点
    const entryPxX = startPxX + tMin * dx;
    const entryPxY = startPxY + tMin * dy;
    const entryLngLat = map.containerToLngLat(new window.AMap.Pixel(entryPxX, entryPxY));

    if (entryLngLat) {
      // 先瞬移到边缘起点
      paperPlaneMarker.setPosition(entryLngLat);
    }
  }

  manualAnimatePaperPlane(target, showTip);
}

function manualAnimatePaperPlane(target, showTip = true, onComplete = null) {
  const start = paperPlaneMarker.getPosition();
  const moveDuration = 800;
  const rotateDuration = 300;

  // 计算移动方位角（0=正北/上方，顺时针为正）
  const bearing = Math.atan2(target.getLng() - start.getLng(), target.getLat() - start.getLat()) * (180 / Math.PI);
  // 平滑旋转到目标朝向
  setMarkerRotation(bearing, rotateDuration);

  const animStart = Date.now();

  function step() {
    const elapsed = Date.now() - animStart;

    // 平移进度
    const moveProgress = Math.min(elapsed / moveDuration, 1);
    const easeProgress = 1 - Math.pow(1 - moveProgress, 3);

    const currentLat = start.getLat() + (target.getLat() - start.getLat()) * easeProgress;
    const currentLng = start.getLng() + (target.getLng() - start.getLng()) * easeProgress;

    const currentPos = new window.AMap.LngLat(currentLng, currentLat);
    paperPlaneMarker.setPosition(currentPos);

    // 手动更新 tooltip 位置（基于视觉中心偏移）
    if (showTip && paperPlaneTooltipEl && paperPlaneTooltipEl.style && paperPlaneTooltipEl.style.opacity !== '0' && map) {
      const pixel = map.lngLatToContainer(currentPos);
      paperPlaneTooltipEl.style.left = (pixel.getX() - 55) + 'px';
      paperPlaneTooltipEl.style.top = (pixel.getY() - 40) + 'px';
    }

    if (moveProgress < 1) {
      requestAnimationFrame(step);
    } else {
      // 到达目标，保持当前朝向不回转
      if (showTip) {
        showPaperPlaneTooltip();
      }
      emit('paper-plane-move', { latitude: target.getLat(), longitude: target.getLng() });
      if (onComplete) onComplete();
    }
  }

  // 旋转和平移同时开始
  requestAnimationFrame(step);
}

function getPaperPlaneDom() {
  if (!paperPlaneMarker) return null;
  const container = paperPlaneMarker.dom || paperPlaneMarker.De || paperPlaneMarker.contentDom || paperPlaneMarker.getContentDom?.();
  if (!container) return null;
  // AMap 的外层容器有定位用的 transform，不能旋转
  // 需要找到内部的实际内容元素 (.amap-marker-content 或 img)
  const inner = container.querySelector('.amap-marker-content') || container.querySelector('img');
  return inner || container;
}

function setMarkerRotation(deg, animDuration = 200, onComplete = null) {
  const dom = getPaperPlaneDom();
  console.log('[PaperPlane] setMarkerRotation:', deg, 'dom:', !!dom);

  if (!dom) {
    // fallback: 通过 className 在 map container 中查找
    const container = map?.getContainer?.();
    if (container) {
      const markerEl = container.querySelector('.amap-marker-content img, .amap-icon img');
      if (markerEl) {
        applyRotation(markerEl, deg, animDuration, onComplete);
        return;
      }
    }
    console.warn('[PaperPlane] Cannot find marker DOM for rotation');
    if (onComplete) setTimeout(onComplete, animDuration || 0);
    return;
  }

  applyRotation(dom, deg, animDuration, onComplete);
}

function applyRotation(el, deg, animDuration, onComplete) {
  if (animDuration > 0) {
    el.style.transition = `transform ${animDuration}ms ease-out`;
  } else {
    el.style.transition = 'none';
  }
  el.style.transformOrigin = '50% 47.6%'; // 视觉中心 (18/36, 20/42)

  requestAnimationFrame(() => {
    el.style.transform = `rotate(${deg}deg)`;
  });

  if (onComplete && animDuration > 0) {
    setTimeout(() => {
      el.style.transition = 'none';
      if (onComplete) onComplete();
    }, animDuration);
  }
}

function onPlaneMoving(e) {
  if (!paperPlaneTooltipEl || !paperPlaneTooltipEl.style || paperPlaneTooltipEl.style.opacity === '0') {
    paperPlaneMarker?.off('moving', onPlaneMoving);
    return;
  }
  const pos = paperPlaneMarker?.getPosition();
  if (pos && map) {
    const pixel = map.lngLatToContainer(pos);
    paperPlaneTooltipEl.style.left = (pixel.getX() - 55) + 'px';
    paperPlaneTooltipEl.style.top = (pixel.getY() - 56) + 'px';
  }
}

function showPaperPlaneTooltip() {
  if (paperPlaneTooltipTimer) {
    clearTimeout(paperPlaneTooltipTimer);
    paperPlaneTooltipTimer = null;
  }
  if (!paperPlaneTooltipEl) {
    paperPlaneTooltipEl = document.createElement('div');
    paperPlaneTooltipEl.className = 'paper-plane-tooltip';
    paperPlaneTooltipEl.innerHTML = '<span>点击纸飞机</span><span>查看附近故事</span>';
    paperPlaneTooltipEl.style.pointerEvents = 'none';
    paperPlaneTooltipEl.style.zIndex = '1100';
    document.body.appendChild(paperPlaneTooltipEl);
  }

  const pos = paperPlaneMarker.getPosition();
  if (pos && map) {
    const pixel = map.lngLatToContainer(pos);
    paperPlaneTooltipEl.style.left = (pixel.getX() - 55) + 'px';
    paperPlaneTooltipEl.style.top = (pixel.getY() - 56) + 'px';
  }

  paperPlaneTooltipEl.classList.toggle('dark', isDarkMode.value);
  paperPlaneTooltipEl.style.opacity = '1';
  paperPlaneTooltipEl.style.transition = 'none';

  paperPlaneTooltipTimer = setTimeout(() => {
    if (paperPlaneTooltipEl) {
      paperPlaneTooltipEl.style.transition = 'opacity 1s ease-out';
      paperPlaneTooltipEl.style.opacity = '0';
    }
  }, 1000);
}

function clearPaperPlaneTooltip() {
  if (paperPlaneTooltipTimer) {
    clearTimeout(paperPlaneTooltipTimer);
    paperPlaneTooltipTimer = null;
  }
  if (paperPlaneTooltipEl) {
    if (paperPlaneTooltipEl.parentNode) {
      paperPlaneTooltipEl.parentNode.removeChild(paperPlaneTooltipEl);
    }
    paperPlaneTooltipEl = null;
  }
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
        imageSize: new window.AMap.Size(30, 40),
      }),
      offset: new window.AMap.Pixel(-15, -38),
      zIndex: 1200,
    });
  }

  const content = document.createElement("div");
  content.className = "temp-picked-marker";
  content.innerHTML = `
    <div class="temp-picked-flag">
      <span class="temp-picked-flag-icon">锟?/span>
    </div>
    <div class="temp-picked-pole"></div>
  `;

  return new window.AMap.Marker({
    position: [coords.longitude, coords.latitude],
    content,
    offset: new window.AMap.Pixel(-16, -42),
    zIndex: 1200,
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

// hex 转 rgb 工具函数（用于动态 box-shadow）
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0,0,0";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

function createMarker(story) {
  if (!map || !window.AMap) {
    return null;
  }

  const coords = resolveCoordinates(story);

  if (!coords) {
    console.warn("[AMap] Skip story with invalid coordinates:", story);
    return null;
  }

  const content = document.createElement("div");
  content.className = "custom-marker";

  const colors = isDarkMode.value ? emotionColorsDark : emotionColors;
  const emotion = fromEmotionTag(story.emotionTag) || story.emotion;
  const color = colors[emotion] || "#667eea";
  const isLocked = story.isTimeCapsule && !story.isUnlocked;
  const isDark = isDarkMode.value;

  // 双层设计：外圈发光底座 + 内核情绪色块 + 呼吸动画
  const glowOpacity = isDark ? "0.4" : "0.2";
  // hover 阴影：日间深色扩散 / 夜间冰蓝辉光
  const hoverShadowColor = isDark
    ? `rgba(143, 180, 255, 0.35)`
    : `rgba(0, 0, 0, 0.25)`;
  const darkClass = isDark ? " marker-dark" : "";
  const lockStyle = isLocked ? "opacity: 0.55;" : "";

  content.innerHTML = `
    <div class="marker-wrapper${darkClass}"
         style="--marker-color: ${color};
                --marker-glow-rgb: ${hexToRgb(color)};
                --glow-opacity: ${glowOpacity};
                --hover-shadow: ${hoverShadowColor};
                background: ${color};
                ${lockStyle}">
      <div class="marker-glow"></div>
      <div class="marker-pulse"></div>
      <div class="marker-emotion">${isLocked ? "\uD83D\uDD12" : getEmotionEmoji(story.emotionTag || story.emotion)}</div>
    </div>
  `;

  // 大量标记点性能优化：content-visibility auto
  if (markers.length > 50) {
    content.style.contentVisibility = "auto";
  }

  const marker = new window.AMap.Marker({
    position: [coords.longitude, coords.latitude],
    content,
    offset: new window.AMap.Pixel(
      -STORY_MARKER_SIZE / 2,
      -STORY_MARKER_SIZE / 2,
    ),
    title: (story.content || story.preview || "").substring(0, 50) + "...",
    zIndex: story.isTimeCapsule ? 10 : 100,
  });

  marker.on("click", () => {
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
      console.warn(
        "[AMap] Failed to resolve marker screen position:",
        error,
        story,
      );
    }

    emit("marker-click", {
      story,
      screenX,
      screenY,
    });
  });

  return marker;
}

function calculateClusterRadius(count) {
  const R_MIN = 25;
  const R_MAX = 80;
  const DECAY = 8;

  return R_MIN + (R_MAX - R_MIN) * (count / (count + DECAY));
}

const STORY_MARKER_SIZE = 50;
const FORCED_STORY_CLUSTER_OVERLAP_RATIO = 0.25;
const CLUSTER_RENDER_ZOOM_THRESHOLD = 16;
const CLUSTER_CLUSTER_OVERLAP_THRESHOLD = 0.3;

function createStoryPixelState(story) {
  if (!map) {
    return null;
  }

  const storyIdKey = getStoryIdKey(story?.id);
  const coords = resolveCoordinates(story);
  if (!storyIdKey || !coords) {
    return null;
  }

  let pixel;
  try {
    pixel = map.lngLatToContainer([coords.longitude, coords.latitude]);
  } catch (e) {
    return null;
  }

  const px = pixel?.getX?.();
  const py = pixel?.getY?.();
  if (!Number.isFinite(px) || !Number.isFinite(py)) {
    return null;
  }

  const half = STORY_MARKER_SIZE / 2;

  return {
    story,
    storyIdKey,
    px,
    py,
    left: px - half,
    right: px + half,
    top: py - half,
    bottom: py + half,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

function getStoryMarkerOverlapRatio(a, b) {
  const overlapWidth = Math.max(
    0,
    Math.min(a.right, b.right) - Math.max(a.left, b.left),
  );
  const overlapHeight = Math.max(
    0,
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
  );
  if (overlapWidth <= 0 || overlapHeight <= 0) {
    return 0;
  }

  return (
    (overlapWidth * overlapHeight) / (STORY_MARKER_SIZE * STORY_MARKER_SIZE)
  );
}

function createLowZoomRenderableEntity(entry, storyLookup) {
  if (isClusterEntry(entry)) {
    const coords = resolveCoordinates(entry);
    if (!coords) {
      return null;
    }

    return {
      kind: "cluster",
      latitude: coords.latitude,
      longitude: coords.longitude,
      count: resolveClusterCount(entry),
      pointIds: dedupePointIds(entry?.pointIds || []),
    };
  }

  if (!isPointEntry(entry)) {
    return null;
  }

  const story = createMarkerStoryFromPoint(entry, storyLookup);
  if (!story) {
    return null;
  }

  return {
    kind: "point",
    latitude: story.location.latitude,
    longitude: story.location.longitude,
    count: 1,
    pointIds: story?.id === undefined || story?.id === null ? [] : [story.id],
    story,
  };
}

function createLowZoomEntityState(entity) {
  if (!map) {
    return null;
  }

  let pixel;
  try {
    pixel = map.lngLatToContainer([entity.longitude, entity.latitude]);
  } catch {
    return null;
  }

  const px = pixel?.getX?.();
  const py = pixel?.getY?.();
  if (!Number.isFinite(px) || !Number.isFinite(py)) {
    return null;
  }

  const halfSize =
    entity.kind === "cluster"
      ? calculateClusterRadius(entity.count)
      : STORY_MARKER_SIZE / 2;

  return {
    entity,
    px,
    py,
    left: px - halfSize,
    right: px + halfSize,
    top: py - halfSize,
    bottom: py + halfSize,
    area: Math.pow(halfSize * 2, 2),
  };
}

function getLowZoomEntityOverlapRatio(a, b) {
  const overlapWidth = Math.max(
    0,
    Math.min(a.right, b.right) - Math.max(a.left, b.left),
  );
  const overlapHeight = Math.max(
    0,
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
  );
  if (overlapWidth <= 0 || overlapHeight <= 0) {
    return 0;
  }

  const overlapArea = overlapWidth * overlapHeight;
  const baseArea = Math.min(a.area, b.area);
  if (!Number.isFinite(baseArea) || baseArea <= 0) {
    return 0;
  }

  return overlapArea / baseArea;
}

function getLowZoomEntityOverlapThreshold(a, b) {
  if (a.entity.kind === "cluster" && b.entity.kind === "cluster") {
    return CLUSTER_CLUSTER_OVERLAP_THRESHOLD;
  }

  return FORCED_STORY_CLUSTER_OVERLAP_RATIO;
}

function resolveMergedLowZoomCount(entities) {
  const explicitPointIds = dedupePointIds(
    entities.flatMap((entity) => entity.pointIds || []),
  );

  const opaqueCount = entities.reduce((sum, entity) => {
    const hasExplicitPointIds =
      Array.isArray(entity.pointIds) && entity.pointIds.length > 0;
    return sum + (hasExplicitPointIds ? 0 : entity.count);
  }, 0);

  return {
    count: Math.max(opaqueCount + explicitPointIds.length, 1),
    pointIds: explicitPointIds,
  };
}

function buildLowZoomRenderableData(clusterList, storyList = []) {
  if (!map) {
    return { clusters: [], points: [] };
  }

  const storyLookup = new Map();
  storyList.forEach((story) => {
    const storyIdKey = getStoryIdKey(story?.id);
    if (!storyIdKey || storyLookup.has(storyIdKey)) {
      return;
    }

    storyLookup.set(storyIdKey, story);
  });

  const entities = clusterList
    .map((entry) => createLowZoomRenderableEntity(entry, storyLookup))
    .filter(Boolean);

  if (entities.length === 0) {
    return { clusters: [], points: [] };
  }

  const items = entities.map(createLowZoomEntityState).filter(Boolean);

  if (items.length === 0) {
    return { clusters: [], points: [] };
  }

  const parent = items.map((_, index) => index);
  const find = (index) => {
    if (parent[index] !== index) {
      parent[index] = find(parent[index]);
    }
    return parent[index];
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent[rootB] = rootA;
    }
  };

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (
        getLowZoomEntityOverlapRatio(items[i], items[j]) >=
        getLowZoomEntityOverlapThreshold(items[i], items[j])
      ) {
        union(i, j);
      }
    }
  }

  const grouped = new Map();
  items.forEach((item, index) => {
    const root = find(index);
    if (!grouped.has(root)) {
      grouped.set(root, []);
    }

    grouped.get(root).push(item.entity);
  });

  const clusters = [];
  const points = [];

  grouped.forEach((group) => {
    const totalWeight = group.reduce((sum, entity) => sum + entity.count, 0);
    if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
      return;
    }

    const { count, pointIds } = resolveMergedLowZoomCount(group);
    if (
      count <= 1 &&
      group.length === 1 &&
      group[0].kind === "point" &&
      group[0].story
    ) {
      points.push(group[0].story);
      return;
    }

    const latitude =
      group.reduce((sum, entity) => sum + entity.latitude * entity.count, 0) /
      totalWeight;
    const longitude =
      group.reduce((sum, entity) => sum + entity.longitude * entity.count, 0) /
      totalWeight;

    clusters.push({
      type: "cluster",
      latitude,
      longitude,
      count,
      pointIds,
    });
  });

  return {
    clusters,
    points: dedupeStories(points),
  };
}

function buildForcedStoryClusters(stories, excludedStoryIdKeys = new Set()) {
  if (!map || !stories.length) {
    return { clusters: [], absorbedIds: new Set() };
  }

  const items = stories
    .map(createStoryPixelState)
    .filter((item) => item && !excludedStoryIdKeys.has(item.storyIdKey));

  if (items.length <= 1) {
    return { clusters: [], absorbedIds: new Set() };
  }

  const parent = items.map((_, index) => index);
  const find = (index) => {
    if (parent[index] !== index) {
      parent[index] = find(parent[index]);
    }
    return parent[index];
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent[rootB] = rootA;
    }
  };

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (
        getStoryMarkerOverlapRatio(items[i], items[j]) >=
        FORCED_STORY_CLUSTER_OVERLAP_RATIO
      ) {
        union(i, j);
      }
    }
  }

  const grouped = new Map();
  items.forEach((item, index) => {
    const root = find(index);
    if (!grouped.has(root)) {
      grouped.set(root, []);
    }
    grouped.get(root).push(item);
  });

  const clusters = [];
  const absorbedIds = new Set();

  grouped.forEach((group) => {
    if (group.length < 2) {
      return;
    }

    let latitude = 0;
    let longitude = 0;
    const pointIds = dedupePointIds(group.map((item) => item.story.id));

    group.forEach((item) => {
      latitude += item.latitude;
      longitude += item.longitude;
      absorbedIds.add(item.storyIdKey);
    });

    clusters.push({
      type: "cluster",
      latitude: latitude / group.length,
      longitude: longitude / group.length,
      count: pointIds.length || group.length,
      pointIds,
    });
  });

  return { clusters, absorbedIds };
}

function createPixelClusterState(cluster) {
  if (!map) {
    return null;
  }

  const coords = resolveCoordinates(cluster);
  if (!coords) return null;

  let pixel;
  try {
    pixel = map.lngLatToContainer([coords.longitude, coords.latitude]);
  } catch (e) {
    return null;
  }

  if (!pixel) return null;

  const px = pixel.getX?.();
  const py = pixel.getY?.();

  if (!Number.isFinite(px) || !Number.isFinite(py)) {
    return null;
  }

  const pointIds = dedupePointIds(cluster?.pointIds || []);
  const count = resolveClusterCount(cluster);

  return {
    cluster: {
      type: "cluster",
      latitude: coords.latitude,
      longitude: coords.longitude,
      count,
      pointIds,
    },
    pointIdKeys: new Set(pointIds.map(getStoryIdKey).filter(Boolean)),
    px,
    py,
    radius: calculateClusterRadius(count),
    latitude: coords.latitude,
    longitude: coords.longitude,
    count,
  };
}

function isOverlapping(m1, m2, threshold) {
  const dx = m1.px - m2.px;
  const dy = m1.py - m2.py;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= m1.radius + m2.radius) return false;
  if (dist <= 0) return true;
  const overlap = m1.radius + m2.radius - dist;
  const minDiameter = 2 * Math.min(m1.radius, m2.radius);
  return overlap / minDiameter > threshold;
}

function mergeOverlappingClusters(clusterList) {
  if (!map || clusterList.length <= 1) return clusterList;

  let items = clusterList.map(createPixelClusterState).filter(Boolean);

  if (items.length <= 1) return items.map((i) => i.cluster);

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (isOverlapping(items[i], items[j], 0.2)) {
          const pointIds = dedupePointIds([
            ...(items[i].cluster.pointIds || []),
            ...(items[j].cluster.pointIds || []),
          ]);
          const weightTotal = items[i].count + items[j].count;
          const total = Math.max(weightTotal, pointIds.length, 1);
          const newLat =
            (items[i].latitude * items[i].count +
              items[j].latitude * items[j].count) /
            weightTotal;
          const newLng =
            (items[i].longitude * items[i].count +
              items[j].longitude * items[j].count) /
            weightTotal;
          const mergedCluster = {
            type: "cluster",
            latitude: newLat,
            longitude: newLng,
            count: total,
            pointIds,
          };
          items[i] = {
            cluster: mergedCluster,
            pointIdKeys: new Set(pointIds.map(getStoryIdKey).filter(Boolean)),
            px:
              (items[i].px * items[i].count + items[j].px * items[j].count) /
              weightTotal,
            py:
              (items[i].py * items[i].count + items[j].py * items[j].count) /
              weightTotal,
            radius: calculateClusterRadius(total),
            latitude: newLat,
            longitude: newLng,
            count: total,
          };
          items.splice(j, 1);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  return items.map((item) => item.cluster);
}

function createClusterMarker(cluster) {
  if (!map || !window.AMap) {
    return null;
  }

  const coords =
    resolveCoordinates(cluster) ||
    resolveCoordinates({
      latitude: cluster.latitude ?? cluster.location?.lat,
      longitude: cluster.longitude ?? cluster.location?.lng,
    });

  if (!coords) {
    console.warn(
      "[AMap] createClusterMarker: invalid coords for cluster:",
      cluster,
    );
    return null;
  }

  const count = resolveClusterCount(cluster);
  const radius = calculateClusterRadius(count);
  const size = Math.round(radius * 2);

  const content = document.createElement("div");
  content.className = "cluster-marker";
  content.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  `;

  const img = document.createElement("img");
  img.src = "/images/star.png";
  img.alt = count;
  img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 4px 8px rgba(218, 165, 32, 0.5));
  `;
  content.appendChild(img);

  const countSpan = document.createElement("span");
  countSpan.className = "cluster-count";
  countSpan.textContent = count;
  countSpan.style.cssText = `
    position: absolute;
    color: #4a3000;
    font-weight: 700;
    font-size: ${Math.round(size * 0.2)}px;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  `;
  content.appendChild(countSpan);

  content.addEventListener("mouseenter", () => {
    content.style.transform = "scale(1.15)";
    img.style.filter = "drop-shadow(0 6px 16px rgba(218, 165, 32, 0.7))";
  });
  content.addEventListener("mouseleave", () => {
    content.style.transform = "scale(1)";
    img.style.filter = "drop-shadow(0 4px 8px rgba(218, 165, 32, 0.5))";
  });

  const marker = new window.AMap.Marker({
    position: [coords.longitude, coords.latitude],
    content,
    offset: new window.AMap.Pixel(-radius, -radius),
    zIndex: cluster.showPopover ? 110 : 50,
  });

  marker.on("click", () => {
    emit("cluster-click", {
      cluster,
      latitude: coords.latitude,
      longitude: coords.longitude,
      count,
      showPopover: !!cluster.showPopover,
    });
  });

  return marker;
}

let absorbedStoryIds = new Set();

function updateClusterMarkers() {
  if (!map || !window.AMap) {
    return;
  }

  const newClusterMarkers = [];
  absorbedStoryIds = new Set();

  {
    const currentZoom = Number(props.zoom);
    if (
      Number.isFinite(currentZoom) &&
      currentZoom >= CLUSTER_RENDER_ZOOM_THRESHOLD
    ) {
      // 高缩放时不渲染服务端聚合，但必须清除旧聚合标记避免残留闪烁
      swapClusterMarkers([]);
      return;
    }

    const clusterEntries = Array.isArray(props.clusters) ? props.clusters : [];
    const lowZoomRenderData = buildLowZoomRenderableData(
      clusterEntries,
      props.stories,
    );
    const mergedClusters = lowZoomRenderData.clusters;

    mergedClusters.forEach((cluster) => {
      const marker = createClusterMarker(cluster);
      if (marker) {
        newClusterMarkers.push(marker);
      }
    });

    // 先建后删：先加新标记，再通过swap移除旧标记
    swapClusterMarkers(newClusterMarkers);
    return;
  }

  const clusterList = Array.isArray(props.clusters) ? props.clusters : [];
  const storyList = Array.isArray(props.stories) ? props.stories : [];
  const clusterPointStories = getClusterPointStories(clusterList, storyList);
  const renderableStories = [];
  const renderedStoryIds = new Set();

  [...storyList, ...clusterPointStories].forEach((story) => {
    const storyIdKey = getStoryIdKey(story?.id);
    if (storyIdKey && renderedStoryIds.has(storyIdKey)) {
      return;
    }

    if (storyIdKey) {
      renderedStoryIds.add(storyIdKey);
    }

    renderableStories.push(story);
  });

  const clusteredStoryIdKeys = new Set();
  clusterList.forEach((cluster) => {
    if (isClusterEntry(cluster) && cluster.pointIds) {
      dedupePointIds(cluster.pointIds).forEach((id) => {
        const key = getStoryIdKey(id);
        if (key) {
          clusteredStoryIdKeys.add(key);
        }
      });
    }
  });

  const forcedStoryClustersResult = buildForcedStoryClusters(
    renderableStories,
    clusteredStoryIdKeys,
  );
  const validClusters = clusterList.filter((cluster) =>
    isClusterEntry(cluster),
  );

  let merged = mergeOverlappingClusters([
    ...validClusters,
    ...forcedStoryClustersResult.clusters,
  ]);

  // Absorb single markers that visually fall into a cluster bubble.
  merged = absorbNearbyStories(merged, renderableStories);

  forcedStoryClustersResult.absorbedIds.forEach((id) => {
    absorbedStoryIds.add(id);
  });

  merged.forEach((cluster) => {
    const marker = createClusterMarker(cluster);
    if (marker) {
      newClusterMarkers.push(marker);
    }
  });

  // 先建后删
  swapClusterMarkers(newClusterMarkers);
}

function absorbNearbyStories(clusters, stories) {
  if (!map || !clusters.length || !stories.length) return clusters;

  const clusteredStoryIdKeys = new Set();
  clusters.forEach((cluster) => {
    dedupePointIds(cluster?.pointIds || []).forEach((id) => {
      const key = getStoryIdKey(id);
      if (key) {
        clusteredStoryIdKeys.add(key);
      }
    });
  });

  const pixelClusters = clusters.map(createPixelClusterState).filter(Boolean);

  stories.forEach((story) => {
    const storyIdKey = getStoryIdKey(story?.id);
    if (
      (storyIdKey && clusteredStoryIdKeys.has(storyIdKey)) ||
      (storyIdKey && absorbedStoryIds.has(storyIdKey))
    ) {
      return;
    }

    const coords = resolveCoordinates(story);
    if (!coords) return;

    let pixel;
    try {
      pixel = map.lngLatToContainer([coords.longitude, coords.latitude]);
    } catch (e) {
      return;
    }
    if (!pixel) return;
    const spx = pixel.getX?.();
    const spy = pixel.getY?.();
    if (!Number.isFinite(spx) || !Number.isFinite(spy)) return;

    for (const pc of pixelClusters) {
      if (storyIdKey && pc.pointIdKeys.has(storyIdKey)) {
        break;
      }

      const dx = spx - pc.px;
      const dy = spy - pc.py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= pc.radius) {
        const previousCount = pc.count;
        const hadExactPointIds =
          Array.isArray(pc.cluster.pointIds) && pc.cluster.pointIds.length > 0;

        if (storyIdKey) {
          absorbedStoryIds.add(storyIdKey);
        }

        if (storyIdKey && hadExactPointIds) {
          const pointIds = dedupePointIds([
            ...(pc.cluster.pointIds || []),
            story.id,
          ]);
          pc.pointIdKeys = new Set(pointIds.map(getStoryIdKey).filter(Boolean));
          pc.cluster.pointIds = pointIds;
          pc.count = Math.max(previousCount, pointIds.length);
        } else if (!storyIdKey && hadExactPointIds) {
          pc.count = previousCount + 1;
        }

        pc.cluster.count = pc.count;

        if (pc.count !== previousCount) {
          pc.radius = calculateClusterRadius(pc.count);
          const total = pc.count;
          pc.latitude = (pc.latitude * previousCount + coords.latitude) / total;
          pc.longitude =
            (pc.longitude * previousCount + coords.longitude) / total;
          pc.cluster.latitude = pc.latitude;
          pc.cluster.longitude = pc.longitude;
        }
        break;
      }
    }
  });

  return pixelClusters.map((pc) => pc.cluster);
}

function updateMarkers() {
  if (!map || !window.AMap) {
    return;
  }

  // 使用新数组收集标记，最后通过 swap 先建后删
  const newMarkers = [];

  // 高缩放聚合星列表（独立于 clusterMarkers，用于高缩放时极近点的二次聚合）
  const highZoomClusterMarkers = [];

  {
    const currentZoom = Number(props.zoom);
    const clusterEntries = Array.isArray(props.clusters) ? props.clusters : [];
    const storyEntries = Array.isArray(props.stories) ? props.stories : [];
    const renderableStories =
      Number.isFinite(currentZoom) &&
      currentZoom < CLUSTER_RENDER_ZOOM_THRESHOLD
        ? buildLowZoomRenderableData(clusterEntries, storyEntries).points
        : dedupeStories(storyEntries);

    // 高缩放（zoom >= CLUSTER_RENDER_ZOOM_THRESHOLD）时，
    // 对极近故事点做像素重叠检测，重叠组重新聚合成星
    if (
      Number.isFinite(currentZoom) &&
      currentZoom >= CLUSTER_RENDER_ZOOM_THRESHOLD &&
      renderableStories.length > 1 &&
      map
    ) {
      const pixelItems = renderableStories
        .map(createStoryPixelState)
        .filter(Boolean);

      if (pixelItems.length > 1) {
        // Union-Find 分组
        const parent = pixelItems.map((_, i) => i);
        const find = (i) => {
          if (parent[i] !== i) parent[i] = find(parent[i]);
          return parent[i];
        };
        const union = (a, b) => {
          const ra = find(a), rb = find(b);
          if (ra !== rb) parent[rb] = ra;
        };

        for (let i = 0; i < pixelItems.length; i++) {
          for (let j = i + 1; j < pixelItems.length; j++) {
            if (
              getStoryMarkerOverlapRatio(pixelItems[i], pixelItems[j]) >=
              FORCED_STORY_CLUSTER_OVERLAP_RATIO
            ) {
              union(i, j);
            }
          }
        }

        // 分组：孤立点渲染为 dot，重叠组渲染为高缩放聚合星
        const grouped = new Map();
        pixelItems.forEach((item, idx) => {
          const root = find(idx);
          if (!grouped.has(root)) grouped.set(root, []);
          grouped.get(root).push(item);
        });

        const isolatedStories = [];

        for (const group of grouped.values()) {
          if (group.length === 1) {
            // 孤立点：正常渲染为 dot
            isolatedStories.push(group[0].story);
          } else {
            // 重叠组：创建高缩放聚合星（带 showPopover 标记）
            const pointIds = dedupePointIds(group.map((item) => item.story.id));
            let lat = 0, lng = 0;
            group.forEach((item) => {
              lat += item.latitude;
              lng += item.longitude;
            });
            const highZoomCluster = {
              type: "cluster",
              latitude: lat / group.length,
              longitude: lng / group.length,
              count: pointIds.length || group.length,
              pointIds,
              showPopover: true, // 标记：点击时展示列表，不放大地图
            };
            const clusterMarker = createClusterMarker(highZoomCluster);
            if (clusterMarker) {
              highZoomClusterMarkers.push(clusterMarker);
            }
          }
        }

        // 渲染孤立 dot
        isolatedStories.forEach((story) => {
          const marker = createMarker(story);
          if (marker) {
            newMarkers.push(marker);
          }
        });

        // 渲染高缩放聚合星
        if (highZoomClusterMarkers.length > 0) {
          newMarkers.push(...highZoomClusterMarkers);
        }

        // 先建后删
        swapNormalMarkers(newMarkers);
        return;
      }
    }

    renderableStories.forEach((story) => {
      const marker = createMarker(story);
      if (marker) {
        newMarkers.push(marker);
      }
    });

    // 先建后删
    swapNormalMarkers(newMarkers);
    return;
  }

  const clusterList = Array.isArray(props.clusters) ? props.clusters : [];
  const clusteredStoryIds = new Set();
  clusterList.forEach((cluster) => {
    if (isClusterEntry(cluster) && cluster.pointIds) {
      dedupePointIds(cluster.pointIds).forEach((id) => {
        const key = getStoryIdKey(id);
        if (key) {
          clusteredStoryIds.add(key);
        }
      });
    }
  });

  const storyList = Array.isArray(props.stories) ? props.stories : [];
  const clusterPointStories = getClusterPointStories(clusterList, storyList);
  const renderableStories = [];
  const renderedStoryIds = new Set();

  [...storyList, ...clusterPointStories].forEach((story) => {
    const storyIdKey = getStoryIdKey(story?.id);
    if (storyIdKey && renderedStoryIds.has(storyIdKey)) {
      return;
    }

    if (storyIdKey) {
      renderedStoryIds.add(storyIdKey);
    }

    renderableStories.push(story);
  });

  renderableStories.forEach((story) => {
    const storyIdKey = getStoryIdKey(story?.id);
    if (
      (storyIdKey && clusteredStoryIds.has(storyIdKey)) ||
      (storyIdKey && absorbedStoryIds.has(storyIdKey))
    ) {
      return;
    }
    const marker = createMarker(story);
    if (marker) {
      newMarkers.push(marker);
    }
  });

  // 先建后删
  swapNormalMarkers(newMarkers);
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
  addNewStoryMarker,
  flyPaperPlaneFromEdge,
  getMap: () => map,
  getBounds: () => {
    console.log("[AMap] getBounds called, map:", !!map);
    if (!map) {
      console.log("[AMap] getBounds: no map");
      return null;
    }
    try {
      const bounds = map.getBounds();
      console.log("[AMap] getBounds result:", bounds);
      if (!bounds) {
        console.log("[AMap] getBounds: no bounds");
        return null;
      }
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      if (!ne || !sw) {
        console.warn("[AMap] getBounds: invalid bounds points", bounds);
        return null;
      }

      // Some AMap builds expose lat/lng as methods, others as plain values.
      const getLat = (obj) =>
        typeof obj.lat === "function" ? obj.lat() : obj.lat;
      const getLng = (obj) =>
        typeof obj.lng === "function" ? obj.lng() : obj.lng;

      const result = {
        northEast: { lat: getLat(ne), lng: getLng(ne) },
        southWest: { lat: getLat(sw), lng: getLng(sw) },
      };
      console.log("[AMap] getBounds returning:", result);
      return result;
    } catch (e) {
      console.error("[AMap] getBounds error:", e);
      return null;
    }
  },
});

// 移除传统的script加载方式，只使用官方AMapLoader

onMounted(() => {
  // 设置安全代码配置
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE;
  if (securityJsCode) {
    window._AMapSecurityConfig = {
      ...(window._AMapSecurityConfig || {}),
      securityJsCode,
    };
  }
  // 只使用官方AMapLoader，避免混用多种加载方式
  AMapLoader.load({
    key: import.meta.env.VITE_AMAP_KEY,
    version: "2.0",
    plugins: ["AMap.Scale", "AMap.ToolBar", "AMap.moveAnimation"],
  })
    .then(async (AMap) => {
      window.AMap = AMap;
      console.log('[AMapLoader] AMap loaded successfully, checking plugins...');
      console.log('[AMapLoader] Available plugins:', Object.keys(AMap));
      console.log('[AMapLoader] moveAnimation available:', typeof AMap.moveAnimation);
      
      initMap();
      updateClusterMarkers();
      updateMarkers();
      updateUserLocationMarker();
      updateTempPickedMarker();

      // Init paper plane at user location
      const userCoords = resolveCoordinates(props.userLocation);
      if (userCoords) {
        initPaperPlane(userCoords);
      }

      window.addEventListener("sidebar-toggle", handleSidebarToggle);
      window.addEventListener(
        "publish-sidebar-toggle",
        handlePublishSidebarToggle,
      );
    })
    .catch((e) => {
      console.error("[AMapLoader] Failed to load AMap:", e);
      console.error("[AMapLoader] Error details:", {
        message: e.message,
        stack: e.stack,
        envKey: import.meta.env.VITE_AMAP_KEY ? 'exists' : 'missing',
        keyLength: import.meta.env.VITE_AMAP_KEY?.length
      });
    });
});

onUnmounted(() => {
  clearPaperPlaneTooltip();
  if (paperPlaneMarker && map) {
    map.remove(paperPlaneMarker);
    paperPlaneMarker = null;
  }
  clearUserLocationMarker();
  clearTempPickedMarker();
  clearClusterMarkers();
  clearMarkers();

  if (map) {
    map.destroy();
    map = null;
  }

  window.removeEventListener("sidebar-toggle", handleSidebarToggle);
  window.removeEventListener(
    "publish-sidebar-toggle",
    handlePublishSidebarToggle,
  );
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
    const newStyle = isDarkMode.value
      ? "amap://styles/dark"
      : "amap://styles/whitesmoke";
    map.setMapStyle(newStyle);
    emit("theme-change", isDarkMode.value ? "dark" : "light");
    updateMarkers();
  }
}

watch(
  () => props.stories,
  () => {
    updateClusterMarkers();
    updateMarkers();
  },
  { deep: true, flush: "post" },
);

watch(
  () => props.clusters,
  () => {
    updateClusterMarkers();
    updateMarkers();
  },
  { deep: true, flush: "post" },
);

watch(
  () => props.userLocation,
  (newLocation) => {
    updateUserLocationMarker(newLocation);
    // Init paper plane on first user location
    if (!paperPlaneInitialized) {
      const coords = resolveCoordinates(newLocation);
      if (coords) initPaperPlane(coords);
    }
  },
  { deep: true },
);

watch(
  () => props.paperPlanePosition,
  (newPos) => {
    if (!newPos) return;
    const coords = resolveCoordinates(newPos);
    if (!coords) return;
    // 如果纸飞机已存在且位置接近，跳过移动
    if (paperPlaneMarker && paperPlaneInitialized) {
      const current = paperPlaneMarker.getPosition();
      if (current) {
        const dLat = Math.abs(current.getLat() - coords.latitude);
        const dLng = Math.abs(current.getLng() - coords.longitude);
        if (dLat < 0.00005 && dLng < 0.00005) return;
      }
    }
    movePaperPlane(coords.latitude, coords.longitude);
  },
  { deep: true },
);

watch(isDarkMode, (dark) => {
  if (paperPlaneTooltipEl) {
    paperPlaneTooltipEl.classList.toggle('dark', dark);
  }
});

watch(
  () => props.center,
  (newCenter) => {
    if (!map) {
      return;
    }

    const coords = resolveCoordinates(newCenter);
    if (!coords) {
      console.warn("[AMap] Skip invalid map center:", newCenter);
      return;
    }

    const currentCenter = map.getCenter?.();
    const sameCenter =
      currentCenter &&
      Math.abs(currentCenter.getLat() - coords.latitude) < 0.000001 &&
      Math.abs(currentCenter.getLng() - coords.longitude) < 0.000001;

    if (!sameCenter) {
      map.setCenter([coords.longitude, coords.latitude]);
    }
  },
  { deep: true },
);

watch(
  () => props.zoom,
  (newZoom) => {
    const zoom = Number(newZoom);

    if (map && Number.isFinite(zoom)) {
      map.setZoom(zoom);
      // 缩放变化时重新渲染标记（高缩放聚合检测依赖当前 zoom）
      updateClusterMarkers();
      updateMarkers();
    }
  },
);

watch(
  () => props.theme,
  (newTheme) => {
    isDarkMode.value = newTheme === "dark";
    if (map) {
      const newStyle = isDarkMode.value
        ? "amap://styles/dark"
        : "amap://styles/whitesmoke";
      map.setMapStyle(newStyle);
      updateMarkers();
    }
  },
);

watch(
  () => props.pointPickMode,
  () => {
    updateMapCursor();
  },
);

watch(
  () => props.tempPickedLocation,
  (newLocation) => {
    updateTempPickedMarker(newLocation);
  },
  { deep: true },
);
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

/* 禁止选中地图上的所有标记图标 */
:deep(.amap-marker),
:deep(.amap-marker-content),
:deep(.amap-icon),
:deep(.amap-maps-marker) {
  user-select: none;
  -webkit-user-select: none;
}

/* 禁止选中地图上的所有标记图标 */
:deep(.amap-marker),
:deep(.amap-marker-content),
:deep(.amap-icon),
:deep(.amap-maps-marker) {
  user-select: none;
  -webkit-user-select: none;
}

:deep(.custom-marker) {
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition-property: transform, filter, box-shadow;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}

/* 日间 hover：深色阴影扩散 */
:deep(.custom-marker:hover) {
  transform: scale(1.08);
}
:deep(.custom-marker:hover .marker-glow) {
  box-shadow:
    0 0 16px 5px rgba(var(--marker-glow-rgb), calc(var(--glow-opacity) * 2)),
    0 4px 12px var(--hover-shadow);
}

/* 夜间 hover：冰蓝辉光叠加 */
:deep(.amap-container.dark-mode .custom-marker:hover .marker-glow) {
  box-shadow:
    0 0 20px 6px rgba(143, 180, 255, 0.35),
    0 0 32px 8px rgba(143, 180, 255, 0.15),
    0 4px 12px var(--hover-shadow);
}

:deep(.custom-marker:active) {
  transform: scale(0.95);
}

:deep(.custom-marker:focus-visible .marker-wrapper) {
  outline: 2px solid #667eea;
  outline-offset: 2px;
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
  clip-path: path(
    "M13 36C13 36 22 26.6 22 18.8C22 12.7 18 8.5 13 8.5C8 8.5 4 12.7 4 18.8C4 26.6 13 36 13 36Z"
  );
  background: #2e86ff;
  box-shadow: 0 10px 18px -12px rgba(46, 134, 255, 0.72);
}

:deep(.user-location-dot::after) {
  content: "";
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
  clip-path: path(
    "M13 36C13 36 22 26.6 22 18.8C22 12.7 18 8.5 13 8.5C8 8.5 4 12.7 4 18.8C4 26.6 13 36 13 36Z"
  );
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
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
  overflow: visible;
  transform-origin: center;
}

/* 外圈发光底座 — 使用 CSS 变量动态颜色 */
:deep(.marker-glow) {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(100% + 12px);
  height: calc(100% + 12px);
  border-radius: 50%;
  pointer-events: none;
  z-index: -1;
  box-shadow: 0 0 10px 3px rgba(var(--marker-glow-rgb), var(--glow-opacity));
  transition-property: box-shadow, opacity, transform;
  transition-duration: 0.2s;
  transition-timing-function: ease;
  transform: translate(-50%, -50%);
  will-change: opacity, box-shadow, transform;
}

/* 呼吸动画层：日间金色脉动 / 夜间冰蓝闪烁 */
:deep(.marker-pulse) {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  border-radius: 50%;
  pointer-events: none;
  z-index: -1;
  transform: translate(-50%, -50%);
  animation: marker-breathe 3s ease-in-out infinite;
  will-change: opacity, box-shadow, transform;
}

/* 日间呼吸动画：opacity + scale 模拟金色微光 */
@keyframes marker-breathe {
  0% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(0.98);
    box-shadow: 0 0 4px rgba(215, 154, 67, 0.15);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.02);
    box-shadow: 0 0 12px rgba(215, 154, 67, 0.35);
  }
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(0.98);
    box-shadow: 0 0 4px rgba(215, 154, 67, 0.15);
  }
}

/* 夜间呼吸动画：叠加冰蓝辉光 text-shadow 效果（用 box-shadow 模拟）*/
:deep(.amap-container.dark-mode .marker-pulse) {
  animation-name: marker-breathe-dark;
}
@keyframes marker-breathe-dark {
  0% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(0.98);
    box-shadow: 0 0 6px rgba(143, 180, 255, 0.12);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.02);
    box-shadow:
      0 0 16px rgba(143, 180, 255, 0.35),
      0 0 28px rgba(143, 180, 255, 0.12);
  }
  100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(0.98);
    box-shadow: 0 0 6px rgba(143, 180, 255, 0.12);
  }
}

/* prefers-reduced-motion：关闭所有动画 */
@media (prefers-reduced-motion: reduce) {
  :deep(.marker-pulse) {
    animation: none !important;
    opacity: 0.7;
    transform: translate(-50%, -50%);
  }
  /* 禁止选中地图上的所有标记图标 */
:deep(.amap-marker),
:deep(.amap-marker-content),
:deep(.amap-icon),
:deep(.amap-maps-marker) {
  user-select: none;
  -webkit-user-select: none;
}

:deep(.custom-marker) {
    transition-duration: 0s !important;
  }
  :deep(.marker-glow) {
    transition-duration: 0s !important;
  }
}

/* 暗色模式：冰蓝辉光 — 外圈发光增强 + 边框冰蓝色 */
:deep(.amap-container.dark-mode .marker-wrapper.marker-dark) {
  box-shadow:
    0 0 12px rgba(143, 180, 255, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.5);
  border-color: rgba(143, 180, 255, 0.4);
}

:deep(.amap-container.is-zooming .custom-marker) {
  transition-duration: 0s !important;
}

:deep(.amap-container.is-zooming .marker-glow) {
  opacity: 0;
  box-shadow: none;
  transform: none;
}

:deep(.amap-container.is-zooming .marker-pulse) {
  opacity: 0;
  animation: none !important;
  box-shadow: none;
  transform: none;
}

:deep(.marker-emotion) {
  position: absolute;
  font-size: 20px;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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