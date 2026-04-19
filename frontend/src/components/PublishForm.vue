<template>
  <div class="publish-form" :class="themeClass">
    <section class="hero-card">
      <div class="hero-kicker">
        <span class="hero-suit">♦</span>
        <span>Story Ritual</span>
      </div>
      <div class="hero-content">
        <div>
          <h2>发布故事</h2>
          <p>把这一刻的情绪、画面与文字一起放进地图里。</p>
        </div>
      </div>
    </section>

    <section class="section-card location-card">
      <div class="section-heading">
        <span class="section-kicker">Place Search</span>
        <h3>选择故事落点</h3>
        <p>已经使用了纸飞机的位置，可以在下方文本框更正并选中你想要的地址<br/>不支持自定义地址哦，手动更改之后必须选择一个候选项~</p>
      </div>

      <div class="location-search">
        <input
          v-model="form.locationQuery"
          type="text"
          placeholder="搜索你想留下故事的地方"
          @keyup.enter="performPoiSearch"
        />
      </div>

      <p v-if="userEditedLocation && !form.selectedLocation" class="search-feedback warning">你修改了地点，请从下方搜索结果中选择一个地址</p>

      <p v-if="searchError" class="search-feedback error">{{ searchError }}</p>
      <p v-else-if="searching" class="search-feedback">正在查找相关地点...</p>
      <p v-else-if="hasSearched && searchResults.length === 0" class="search-feedback">
        没有找到匹配地点，换个关键词试试。
      </p>

      <div v-if="searchResults.length > 0" class="search-results">
        <button
          v-for="poi in searchResults"
          :key="poi.id"
          type="button"
          class="search-result-item"
          :class="{ active: form.selectedLocation?.id === poi.id }"
          @click="selectLocation(poi)"
        >
          <div class="result-main">
            <strong>{{ poi.name }}</strong>
            <span>{{ poi.address }}</span>
          </div>
          <div class="result-meta">
            <span>{{ formatPoiDistrictLabel(poi) }}</span>
          </div>
        </button>
      </div>

      <div v-if="form.selectedLocation" class="selected-location-card">
        <div class="selected-location-copy">
          <span class="selected-kicker">Chosen Place</span>
          <strong>{{ form.selectedLocation.name }}</strong>
          <p>{{ form.selectedLocation.address }}</p>
        </div>
        <button type="button" class="clear-location-btn" @click="form.selectedLocation = null">
          重新选择
        </button>
      </div>
    </section>

    <section class="section-card">
      <div class="section-heading">
        <span class="section-kicker">Story Draft</span>
        <h3>写下此刻</h3>
      </div>
      <div class="text-editor">
        <textarea
          v-model="form.content"
          placeholder="这一刻发生了什么？"
          maxlength="500"
        ></textarea>
        <span class="char-count">{{ form.content.length }}/500</span>
      </div>
    </section>

    <section class="section-card media-card">
      <div class="section-heading">
        <span class="section-kicker">Visual Echo</span>
        <h3>附上画面</h3>
      </div>
      <ImageUploader v-model="form.images" />
    </section>

    <section class="section-card emotion-card">
      <div class="section-heading">
        <span class="section-kicker">Emotion Arcana</span>
        <h3>选择情绪</h3>
      </div>
      <EmotionSelector v-model="form.emotion" />
    </section>

    <section v-if="vipStore.isVipActive" class="section-card font-card">
      <div class="section-heading">
        <span class="section-kicker">Typography</span>
        <h3>个性字体样式</h3>
        <p>为你的故事选择专属字体和文字效果</p>
      </div>
      <div class="font-actions">
        <button type="button" class="font-action-btn" :class="{ 'font-active': form.fontFamily || form.fontEffect }" @click="showFontPicker = true">
          {{ (form.fontFamily || form.fontEffect) ? '🔤 字体样式已设置' : '🔤 字体样式' }}
        </button>
        <button v-if="form.fontFamily || form.fontEffect" type="button" class="font-clear-btn" @click="clearFontAndEffect">
          清除
        </button>
      </div>
    </section>

    <section class="section-card split-card">
      <div class="split-pane">
        <div class="section-heading compact">
          <span class="section-kicker">Time Capsule</span>
          <h3>时光胶囊</h3>
        </div>
        <label class="toggle-row">
          <input v-model="form.isTimeCapsule" type="checkbox" />
          <span>设为时光胶囊</span>
        </label>

        <div v-if="form.isTimeCapsule" class="time-capsule-config">
          <label>解锁时间</label>
          <input v-model="form.unlockAt" type="datetime-local" :min="minUnlockTime" @change="handleUnlockTimeChange" />
          <p v-if="unlockTimeError" class="search-feedback error">{{ unlockTimeError }}</p>
        </div>
      </div>

      <div class="split-pane">
        <div class="section-heading compact">
          <span class="section-kicker">Visibility</span>
          <h3>可见性</h3>
        </div>
        <div class="visibility-options">
          <button
            type="button"
            class="visibility-btn"
            :class="{ active: form.visibility === 'public' }"
            @click="form.visibility = 'public'"
          >
            <span class="visibility-icon">◎</span>
            <span class="visibility-copy">
              <strong>公开可见</strong>
              <small>允许其他人发现这张故事卡</small>
            </span>
          </button>
          <button
            type="button"
            class="visibility-btn"
            :class="{ active: form.visibility === 'shadowban' }"
            @click="form.visibility = 'shadowban'"
          >
            <span class="visibility-icon">◌</span>
            <span class="visibility-copy">
              <strong>仅自己可见</strong>
              <small>把故事暂时保留给自己</small>
            </span>
          </button>
        </div>

        <div v-if="form.visibility === 'public'" class="time-window-section">
          <label class="toggle-row time-window-toggle">
            <input v-model="form.useTimeWindow" type="checkbox" />
            <span>时段限定可见（深夜树洞）</span>
          </label>
          <div v-if="form.useTimeWindow" class="time-window-presets">
            <button
              type="button"
              class="preset-btn"
              :class="{ active: form.visibilityPreset === 'latenight' }"
              @click="setTimeWindowPreset('latenight')"
            >
              🌙 仅深夜可见 (23:00-05:00)
            </button>
            <button
              type="button"
              class="preset-btn"
              :class="{ active: form.visibilityPreset === 'custom' }"
              @click="form.visibilityPreset = 'custom'"
            >
              ⏰ 自定义时段
            </button>
          </div>
          <div v-if="form.useTimeWindow && form.visibilityPreset === 'custom'" class="time-window-inputs">
            <label>
              <span>开始</span>
              <input v-model="form.visibilityStartTime" type="time" />
            </label>
            <label>
              <span>结束</span>
              <input v-model="form.visibilityEndTime" type="time" />
            </label>
          </div>
          <p v-if="form.useTimeWindow" class="time-window-hint">
            仅在所选时段内，他人可在地图和信息流中看到此故事。
          </p>
          <p v-if="timeWindowError" class="time-window-error">
            {{ timeWindowError }}
          </p>
        </div>
      </div>
    </section>

    <footer class="form-footer">
      <button type="button" class="secondary-btn" @click="emit('cancel')">暂时收起</button>
      <button type="button" class="submit-btn" :disabled="!isValid" @click="handleSubmit">
        发布故事
      </button>
    </footer>

    <FontPicker
      :visible="showFontPicker"
      :is-dark="mapTheme === 'dark'"
      target-type="story"
      :selected-font="form.fontFamily"
      :selected-effect="form.fontEffect"
      @select="handleFontSelect"
      @select-effect="handleEffectSelect"
      @close="showFontPicker = false"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import ImageUploader from './ImageUploader.vue';
import EmotionSelector from './EmotionSelector.vue';
import FontPicker from './FontPicker.vue';
import { searchPoisWithContext } from '../utils/poiSearch';
import { useVipStore } from '../stores/vip';
import { injectFontEffectAnimations } from '../composables/useFontEffect';

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  planePosition: {
    type: Object,
    default: null
  },
  mapCenter: {
    type: Object,
    default: null
  },
  userLocation: {
    type: Object,
    default: null
  },
  mapTheme: {
    type: String,
    default: 'light'
  },
  prefillQuery: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['submit', 'cancel']);

const vipStore = useVipStore();

injectFontEffectAnimations();

const showFontPicker = ref(false);

const DEFAULT_FORM = () => ({
  content: '',
  images: [],
  emotion: null,
  isTimeCapsule: false,
  unlockAt: '',
  visibility: 'public',
  locationQuery: '',
  selectedLocation: null,
  useTimeWindow: false,
  visibilityPreset: null,
  visibilityStartTime: '',
  visibilityEndTime: '',
  fontFamily: '',
  fontEffect: ''
});

const form = ref(DEFAULT_FORM());
const searchResults = ref([]);
const searching = ref(false);
const searchError = ref('');
const hasSearched = ref(false);
const timeWindowError = ref('');
const unlockTimeError = ref('');
const themeClass = computed(() => `theme-${props.mapTheme === 'dark' ? 'dark' : 'light'}`);
const userEditedLocation = ref(false);
const originalPrefill = ref('');

function handleFontSelect(family) {
  form.value.fontFamily = family;
}

function handleEffectSelect(effect) {
  form.value.fontEffect = effect;
}

function clearFontAndEffect() {
  form.value.fontFamily = '';
  form.value.fontEffect = '';
}

const TIME_PRESETS = {
  latenight: { start: '23:00', end: '05:00' }
};
const POI_SEARCH_RADIUS_METERS = 50000;

function setTimeWindowPreset(preset) {
  form.value.visibilityPreset = preset;
  const p = TIME_PRESETS[preset];
  if (p) {
    form.value.visibilityStartTime = p.start;
    form.value.visibilityEndTime = p.end;
  }
  validateTimeWindow();
}

// 验证时间段
function validateTimeWindow() {
  if (!form.value.useTimeWindow || !form.value.visibilityStartTime || !form.value.visibilityEndTime) {
    timeWindowError.value = '';
    return;
  }

  const start = form.value.visibilityStartTime;
  const end = form.value.visibilityEndTime;

  // 开始和结束时间不能相同
  if (start === end) {
    timeWindowError.value = '开始时间与结束时间不能相同';
    return;
  }

  // 转换为分钟数进行比较
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // 跨天判断：只有当开始时间在晚上(18:00以后)且结束时间在早上(06:00以前)时，才认为是有效的跨天时间段
  const isLateNightStart = startMinutes >= 18 * 60; // 18:00 = 1080分钟
  const isEarlyMorningEnd = endMinutes <= 6 * 60;    // 06:00 = 360分钟

  if (isLateNightStart && isEarlyMorningEnd) {
    // 有效的跨天时间段（如 23:00-05:00）
    timeWindowError.value = '';
  } else if (startMinutes < endMinutes) {
    // 同一天内，结束时间必须大于开始时间（如 08:00-12:00）
    timeWindowError.value = '';
  } else {
    // 无效：开始时间必须在结束时间之前
    timeWindowError.value = '开始时间必须在结束时间之前';
  }
}

let placeSearchInstance = null;
let geocoderInstance = null;
let geocoderPromise = null;
let searchTimer = null;
let activeSearchToken = 0;
let suppressLocationQueryWatch = false;

const isValid = computed(() => {
  if (form.value.content.trim().length === 0) return false;
  if (!form.value.emotion) return false;
  if (form.value.isTimeCapsule && !form.value.unlockAt) return false;

  // 如果用户修改了地点输入，必须从搜索结果中选中一项
  if (userEditedLocation.value && !form.value.selectedLocation) return false;

  // 检查时间段验证
  if (form.value.visibility === 'public' && form.value.useTimeWindow) {
    if (!form.value.visibilityStartTime || !form.value.visibilityEndTime) return false;
    if (timeWindowError.value) return false;
  }

  return true;
});

const currentTime = ref(Date.now());
let nowTimer = null;

function formatDatetimeLocal(ts) {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const minUnlockTime = computed(() => formatDatetimeLocal(currentTime.value));

function handleUnlockTimeChange() {
  unlockTimeError.value = '';
  if (!form.value.unlockAt) return;
  const selected = new Date(form.value.unlockAt);
  const now = new Date();
  if (selected <= now) {
    unlockTimeError.value = '解锁时间不能早于当前时间，已自动调整';
    form.value.unlockAt = formatDatetimeLocal(now.getTime() + 60 * 1000);
  }
}

// 每10秒更新一次当前时间，确保 min 属性实时生效
watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      currentTime.value = Date.now();
      nowTimer = setInterval(() => { currentTime.value = Date.now(); }, 10000);
    } else if (nowTimer) {
      clearInterval(nowTimer);
      nowTimer = null;
    }
  },
  { immediate: true }
);

const userPresetLocation = computed(() => {
  return normalizePresetLocation(props.userLocation, '当前地理位置');
});

const poiSearchAnchor = computed(() => {
  return normalizePresetLocation(props.planePosition, '纸飞机位置')
    || normalizePresetLocation(props.mapCenter, '地图中心')
    || normalizePresetLocation(props.userLocation, '当前地理位置');
});

watch(
  () => props.visible,
  (isVisible, wasVisible) => {
    if (isVisible) {
      ensurePlaceSearch().catch(() => {});
      return;
    }

    if (wasVisible) {
      window.setTimeout(resetForm, 260);
    }
  }
);

// 监听时间变化进行验证
watch(
  [() => form.value.visibilityStartTime, () => form.value.visibilityEndTime],
  () => {
    validateTimeWindow();
  }
);

// 预填充地点查询文字（不自动选中，用户必须手动确认）
watch(
  () => props.prefillQuery,
  (query) => {
    if (!query || !props.visible) return;
    searchResults.value = [];
    searchError.value = '';
    hasSearched.value = false;
    form.value.selectedLocation = null;
    userEditedLocation.value = false;
    originalPrefill.value = query;
    setLocationQuerySilently(query);
    activeSearchToken += 1;
  }
);

watch(
  () => form.value.locationQuery,
  (query) => {
    if (suppressLocationQueryWatch) {
      suppressLocationQueryWatch = false;
      return;
    }

    if (!props.visible) {
      return;
    }

    // 检测用户是否手动修改了地点
    const currentQuery = query.trim();
    if (originalPrefill.value && currentQuery !== originalPrefill.value.trim()) {
      userEditedLocation.value = true;
    } else if (!currentQuery && originalPrefill.value) {
      userEditedLocation.value = true;
    } else if (currentQuery === originalPrefill.value.trim() && originalPrefill.value) {
      userEditedLocation.value = false;
    }

    // 用户修改后清空已选项（强制重新选择）
    if (userEditedLocation.value && form.value.selectedLocation) {
      form.value.selectedLocation = null;
    }

    clearSearchTimer();

    if (!currentQuery) {
      searchResults.value = [];
      searchError.value = '';
      hasSearched.value = false;
      activeSearchToken += 1;
      return;
    }

    searchTimer = window.setTimeout(() => {
      performPoiSearch();
    }, 320);
  }
);

watch(
  () => form.value.visibility,
  (visibility) => {
    if (visibility === 'public') {
      return;
    }

    form.value.useTimeWindow = false;
    form.value.visibilityPreset = null;
    form.value.visibilityStartTime = '';
    form.value.visibilityEndTime = '';
  }
);

watch(
  () => form.value.useTimeWindow,
  (enabled) => {
    if (enabled) {
      return;
    }

    form.value.visibilityPreset = null;
    form.value.visibilityStartTime = '';
    form.value.visibilityEndTime = '';
  }
);

onBeforeUnmount(() => {
  clearSearchTimer();
  activeSearchToken += 1;
  if (nowTimer) {
    clearInterval(nowTimer);
    nowTimer = null;
  }
});

function resetForm() {
  clearSearchTimer();
  activeSearchToken += 1;
  searchResults.value = [];
  searching.value = false;
  searchError.value = '';
  hasSearched.value = false;
  userEditedLocation.value = false;
  originalPrefill.value = '';
  unlockTimeError.value = '';
  form.value = DEFAULT_FORM();
}

function clearSearchTimer() {
  if (searchTimer) {
    window.clearTimeout(searchTimer);
    searchTimer = null;
  }
}

function setLocationQuerySilently(value) {
  suppressLocationQueryWatch = true;
  form.value.locationQuery = value;
}

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickFirstString(...values) {
  for (const value of values.flat()) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function buildDistrictLabel(source) {
  if (!source || typeof source !== 'object') {
    return '';
  }

  const city = pickFirstString(source.city);
  const district = pickFirstString(source.district);
  const province = pickFirstString(source.province);

  if (city && district) {
    return district.includes(city) ? district : `${city} ${district}`;
  }

  return district || city || province || '';
}

function buildLocationAddress(source, latitude, longitude) {
  const districtLabel = buildDistrictLabel(source);
  const rawAddress = pickFirstString(
    source?.address,
    source?.formattedAddress,
    source?.name
  );

  if (rawAddress) {
    if (districtLabel && !rawAddress.includes(districtLabel)) {
      return `${districtLabel} ${rawAddress}`;
    }

    return rawAddress;
  }

  return districtLabel || formatCoordinateAddress(latitude, longitude);
}

function normalizePresetLocation(source, name) {
  if (!source || typeof source !== 'object') {
    return null;
  }

  const latitude = toFiniteNumber(source.latitude ?? source.lat);
  const longitude = toFiniteNumber(source.longitude ?? source.lng);
  if (latitude === null || longitude === null) {
    return null;
  }

  const district = buildDistrictLabel(source);
  const displayName = String(
    source.name
      || source.address
      || source.formattedAddress
      || district
      || name
  ).trim() || name;

  return {
    id: `${displayName}-${longitude}-${latitude}`,
    name: displayName,
    address: buildLocationAddress(source, latitude, longitude),
    latitude,
    longitude,
    city: String(source.city || '').trim(),
    district,
    adcode: String(source.adcode || '').trim(),
    province: String(source.province || '').trim(),
    type: String(source.type || '').trim()
  };
}

function formatCoordinateAddress(latitude, longitude) {
  return `经度 ${longitude.toFixed(6)}，纬度 ${latitude.toFixed(6)}`;
}

function formatPoiDistrictLabel(poi) {
  if (!poi || typeof poi !== 'object') {
    return '已解析位置';
  }

  return buildDistrictLabel(poi) || '已解析位置';
}

function normalizePoi(poi) {
  if (!poi || typeof poi !== 'object') {
    return null;
  }

  const latitude = toFiniteNumber(poi.location?.lat ?? poi.location?.getLat?.());
  const longitude = toFiniteNumber(poi.location?.lng ?? poi.location?.getLng?.());
  if (latitude === null || longitude === null) {
    return null;
  }

  const city = String(poi.cityname || poi.pname || '').trim();
  const district = [poi.cityname, poi.adname].filter(Boolean).join(' ');
  const province = String(poi.pname || '').trim();
  const address = buildLocationAddress({
    city,
    district,
    province,
    address: String(poi.address || '').trim()
  }, latitude, longitude);

  return {
    id: poi.id || `${longitude}-${latitude}-${poi.name || 'poi'}`,
    name: poi.name || '未命名地点',
    address: address || poi.name || '未知地点',
    latitude,
    longitude,
    city,
    district,
    adcode: String(poi.adcode || '').trim(),
    province,
    type: poi.type || '',
    distance: toFiniteNumber(poi.distance)
  };
}

function ensurePlaceSearch() {
  if (placeSearchInstance) {
    return Promise.resolve(placeSearchInstance);
  }

  if (!window.AMap?.plugin) {
    return Promise.reject(new Error('AMap is not ready.'));
  }

  return new Promise((resolve, reject) => {
    window.AMap.plugin(['AMap.PlaceSearch'], () => {
      if (!window.AMap?.PlaceSearch) {
        reject(new Error('AMap PlaceSearch is unavailable.'));
        return;
      }

      placeSearchInstance = new window.AMap.PlaceSearch({
        pageSize: 10,
        pageIndex: 1,
        extensions: 'all'
      });

      resolve(placeSearchInstance);
    });
  });
}

function ensureGeocoder() {
  if (geocoderInstance) {
    return Promise.resolve(geocoderInstance);
  }

  if (geocoderPromise) {
    return geocoderPromise;
  }

  if (!window.AMap?.plugin) {
    return Promise.reject(new Error('AMap is not ready.'));
  }

  geocoderPromise = new Promise((resolve, reject) => {
    window.AMap.plugin(['AMap.Geocoder'], () => {
      if (!window.AMap?.Geocoder) {
        geocoderPromise = null;
        reject(new Error('AMap Geocoder is unavailable.'));
        return;
      }

      geocoderInstance = new window.AMap.Geocoder({ extensions: 'all' });
      resolve(geocoderInstance);
    });
  });

  return geocoderPromise;
}

async function resolveNearestLocationFromCoords(sourceLocation) {
  const fallbackLocation = sourceLocation ? { ...sourceLocation } : null;
  if (!fallbackLocation) {
    return null;
  }

  try {
    const geocoder = await ensureGeocoder();
    const result = await new Promise((resolve) => {
      geocoder.getAddress(
        [fallbackLocation.longitude, fallbackLocation.latitude],
        (status, geocodeResult) => resolve(status === 'complete' ? geocodeResult : null)
      );
    });

    const regeocode = result?.regeocode || {};
    const nearestPoi = Array.isArray(regeocode.pois)
      ? regeocode.pois.map(normalizePoi).filter(Boolean)[0]
      : null;

    if (nearestPoi) {
      return nearestPoi;
    }

    return normalizePresetLocation({
      ...fallbackLocation,
      name: regeocode.formattedAddress || fallbackLocation.name,
      address: regeocode.formattedAddress || fallbackLocation.address,
      city: pickFirstString(regeocode.addressComponent?.city, fallbackLocation.city),
      district: pickFirstString(
        [regeocode.addressComponent?.city, regeocode.addressComponent?.district].filter(Boolean).join(' '),
        fallbackLocation.district
      ),
      adcode: pickFirstString(regeocode.addressComponent?.adcode, fallbackLocation.adcode),
      province: pickFirstString(regeocode.addressComponent?.province, fallbackLocation.province)
    }, fallbackLocation.name || '已选地点');
  } catch (error) {
    return normalizePresetLocation(fallbackLocation, fallbackLocation.name || '已选地点');
  }
}

async function performPoiSearch() {
  const keyword = form.value.locationQuery.trim();
  if (!keyword) {
    searchResults.value = [];
    searchError.value = '';
    hasSearched.value = false;
    return;
  }

  const currentToken = ++activeSearchToken;
  searching.value = true;
  searchError.value = '';
  hasSearched.value = true;

  try {
    await ensurePlaceSearch();
    const { pois, errorMessage } = await searchPoisWithContext({
      createPlaceSearch: (options = {}) => new window.AMap.PlaceSearch({
        pageSize: 10,
        pageIndex: 1,
        extensions: 'all',
        ...options
      }),
      keyword,
      anchor: poiSearchAnchor.value,
      locality: poiSearchAnchor.value,
      radius: POI_SEARCH_RADIUS_METERS,
      normalizePoi
    });

    if (currentToken !== activeSearchToken) {
      return;
    }

    searching.value = false;
    searchResults.value = pois;
    searchError.value = errorMessage;
  } catch (error) {
    if (currentToken !== activeSearchToken) {
      return;
    }

    searching.value = false;
    searchResults.value = [];
    searchError.value = '地点服务尚未就绪，请确认高德地图脚本加载成功。';
    console.error('[PublishForm] Failed to search POI:', error);
  }
}

function selectLocation(location) {
  form.value.selectedLocation = { ...location };
  setLocationQuerySilently(location.name);
  searchResults.value = [];
  searchError.value = '';
  hasSearched.value = false;
  activeSearchToken += 1;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function handleSubmit() {
  if (!isValid.value) {
    return;
  }

  let location;

  if (userEditedLocation.value && form.value.selectedLocation) {
    // 用户修改了输入并选择了搜索结果
    location = { ...form.value.selectedLocation };
    // 如果选中位置距离纸飞机超过 500m，使用搜索结果的经纬度；否则用纸飞机经纬度
    if (props.planePosition) {
      const dist = haversineDistance(
        props.planePosition.latitude, props.planePosition.longitude,
        location.latitude, location.longitude
      );
      if (dist <= 500) {
        location.latitude = props.planePosition.latitude;
        location.longitude = props.planePosition.longitude;
      }
    }
  } else if (!userEditedLocation.value && props.planePosition) {
    // 用户未修改输入，使用纸飞机位置 + 解析出的地名
    location = {
      id: `plane-${props.planePosition.longitude}-${props.planePosition.latitude}`,
      name: form.value.locationQuery.trim() || '纸飞机位置',
      address: form.value.locationQuery.trim() || '纸飞机位置',
      latitude: props.planePosition.latitude,
      longitude: props.planePosition.longitude,
    };
  } else {
    return;
  }

  const payload = {
    content: form.value.content,
    images: form.value.images,
    emotion: form.value.emotion,
    isTimeCapsule: form.value.isTimeCapsule,
    unlockAt: form.value.unlockAt,
    visibility: form.value.visibility,
    location,
    fontFamily: form.value.fontFamily || undefined,
    fontEffect: form.value.fontEffect || undefined
  };

  // 只在选择了公开可见且启用了时间窗口时才传递时间参数
  if (
    form.value.visibility === 'public'
    && form.value.useTimeWindow
    && form.value.visibilityStartTime
    && form.value.visibilityEndTime
  ) {
    payload.useTimeWindow = 1;
    payload.visibilityStartTime = form.value.visibilityStartTime;
    payload.visibilityEndTime = form.value.visibilityEndTime;
  } else if (form.value.visibility === 'public' && !form.value.useTimeWindow) {
    payload.useTimeWindow = 0;
  }

  emit('submit', payload);
}
</script>

<style scoped>
.publish-form {
  --panel-bg: linear-gradient(160deg, rgba(250, 239, 217, 0.96) 0%, rgba(240, 223, 191, 0.98) 56%, rgba(229, 206, 166, 0.98) 100%);
  --panel-border: rgba(184, 135, 46, 0.46);
  --panel-strong: #4d2f14;
  --panel-muted: rgba(77, 47, 20, 0.74);
  --panel-soft: rgba(91, 58, 25, 0.1);
  --panel-soft-strong: rgba(125, 84, 37, 0.18);
  --panel-input: rgba(255, 250, 240, 0.78);
  --panel-shadow: rgba(71, 43, 17, 0.18);
  --accent: #b36e2d;
  --accent-strong: #8e4d15;
  --accent-soft: rgba(179, 110, 45, 0.14);
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: var(--panel-strong);
}

.publish-form.theme-dark {
  --panel-bg: linear-gradient(160deg, rgba(20, 27, 48, 0.98) 0%, rgba(28, 40, 68, 0.98) 58%, rgba(36, 53, 88, 0.98) 100%);
  --panel-border: rgba(144, 177, 236, 0.24);
  --panel-strong: #edf3ff;
  --panel-muted: rgba(228, 238, 255, 0.78);
  --panel-soft: rgba(131, 164, 224, 0.12);
  --panel-soft-strong: rgba(131, 164, 224, 0.2);
  --panel-input: rgba(14, 20, 37, 0.78);
  --panel-shadow: rgba(7, 12, 26, 0.32);
  --accent: #8fb4ff;
  --accent-strong: #c6dbff;
  --accent-soft: rgba(143, 180, 255, 0.14);
}

.hero-card,
.section-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  box-shadow:
    0 20px 40px -24px var(--panel-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.hero-card::before,
.section-card::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 22px;
  border: 1px solid rgba(199, 151, 60, 0.18);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.08) 0%, transparent 24%),
    linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.03) 48%, transparent 100%);
  pointer-events: none;
}

.publish-form.theme-dark .hero-card::before,
.publish-form.theme-dark .section-card::before {
  border-color: rgba(141, 176, 235, 0.14);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.06) 0%, transparent 24%),
    linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.03) 48%, transparent 100%);
}

.hero-card {
  padding: 24px;
}

.hero-kicker,
.section-kicker,
.selected-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

.hero-suit {
  font-size: 16px;
}

.hero-content {
  position: relative;
  z-index: 1;
  margin-top: 18px;
}

.hero-content h2,
.section-heading h3 {
  margin: 0;
  color: var(--panel-strong);
}

.hero-content h2 {
  font-size: 34px;
}

.hero-content p,
.section-heading p,
.selected-location-copy p,
.result-main span,
.result-meta,
.visibility-copy small,
.search-feedback {
  margin: 0;
  color: var(--panel-muted);
}

.result-main strong,
.selected-location-copy strong,
.visibility-copy strong {
  display: block;
  color: var(--panel-strong);
}

.section-card {
  padding: 22px;
}

.section-heading {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.section-heading.compact {
  margin-bottom: 12px;
}

.location-search {
  position: relative;
  z-index: 1;
  margin-bottom: 12px;
}

.location-search input,
.text-editor textarea,
.time-capsule-config input {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 18px;
  background: var(--panel-input);
  color: var(--panel-strong);
  transition: border-color 0.24s ease, box-shadow 0.24s ease, transform 0.24s ease;
}

.location-search input,
.time-capsule-config input {
  min-height: 52px;
  padding: 0 16px;
  font-size: 15px;
}

.location-search input:focus,
.text-editor textarea:focus,
.time-capsule-config input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.search-btn,
.visibility-btn,
.secondary-btn,
.submit-btn,
.clear-location-btn {
  border: none;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease, opacity 0.22s ease;
}

.secondary-btn:disabled,
.submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.search-feedback {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  font-size: 14px;
}

.search-feedback.error {
  color: #b33c2f;
}

.search-feedback.warning {
  color: #b8860b;
}

.theme-dark .search-feedback.error {
  color: #ffb0aa;
}

.theme-dark .search-feedback.warning {
  color: #ffd27a;
}

.search-results {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.search-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: var(--panel-soft);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
}

.search-result-item.active,
.search-result-item:hover {
  transform: translateY(-1px);
  border-color: var(--panel-border);
  background: var(--panel-soft-strong);
}

.result-main,
.selected-location-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-main {
  min-width: 0;
}

.result-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  font-size: 12px;
  text-align: right;
}

.selected-location-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 22px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.18) 0%, transparent 100%),
    var(--panel-soft);
  border: 1px solid var(--panel-border);
}

.clear-location-btn {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: var(--panel-strong);
  font-weight: 600;
}

.text-editor {
  position: relative;
  z-index: 1;
}

.text-editor textarea {
  min-height: 170px;
  resize: vertical;
  padding: 18px;
  font-size: 16px;
  line-height: 1.75;
}

.text-editor textarea::placeholder,
.location-search input::placeholder {
  color: color-mix(in srgb, var(--panel-muted) 76%, transparent);
}

.char-count {
  display: block;
  margin-top: 8px;
  text-align: right;
  font-size: 12px;
  color: var(--panel-muted);
}

.split-card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.split-pane {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.toggle-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 18px;
  background: var(--panel-soft);
  color: var(--panel-strong);
  font-weight: 600;
}

.toggle-row input {
  width: 18px;
  height: 18px;
}

.time-capsule-config {
  margin-top: 14px;
}

.time-capsule-config label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--panel-muted);
}

.theme-dark .time-capsule-config input[type="datetime-local"] {
  background: #dce8ff;
  color: #333333;
}

.visibility-options {
  display: grid;
  gap: 12px;
}

.visibility-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 20px;
  background: var(--panel-soft);
  color: var(--panel-strong);
  text-align: left;
}

.visibility-btn.active {
  background: var(--panel-soft-strong);
  box-shadow: 0 12px 22px -18px var(--accent);
}

.visibility-icon {
  flex: 0 0 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  color: var(--accent-strong);
  font-size: 20px;
}

.visibility-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-bottom: 4px;
}

.secondary-btn,
.submit-btn {
  min-height: 52px;
  padding: 0 22px;
  border-radius: 18px;
  font-size: 15px;
  font-weight: 700;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.18);
  color: var(--panel-strong);
}

.time-window-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--panel-border);
}

.time-window-toggle {
  display: inline-flex;
}

.time-window-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preset-btn {
  padding: 10px 14px;
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  background: var(--panel-soft);
  color: var(--panel-strong);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preset-btn:hover {
  border-color: var(--accent);
  background: var(--panel-soft-strong);
}

.preset-btn.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: 0 12px 22px -18px var(--accent);
}

.time-window-inputs {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  align-items: center;
}

.time-window-inputs label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--panel-muted);
}

.time-window-inputs input[type="time"] {
  min-height: 46px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: var(--panel-input);
  color: var(--panel-strong);
  font-size: 14px;
}

.time-window-inputs input[type="time"]:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.time-window-inputs input[type="time"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
}

.time-window-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--panel-muted);
}

.time-window-error {
  margin-top: 8px;
  font-size: 12px;
  color: #ff4757;
}

.submit-btn {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
  color: #fffdf8;
  box-shadow: 0 18px 28px -18px var(--accent);
}

.visibility-btn:hover,
.secondary-btn:hover,
.submit-btn:hover,
.clear-location-btn:hover {
  transform: translateY(-1px);
}

.media-card :deep(.image-uploader),
.emotion-card :deep(.emotion-selector) {
  padding: 0;
}

.emotion-card :deep(h3) {
  display: none;
}

.emotion-card :deep(.emotions) {
  grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
}

.emotion-card :deep(.emotion-btn) {
  border-radius: 18px;
  border-color: transparent;
  background: var(--panel-soft);
}

.emotion-card :deep(.emotion-btn:hover),
.emotion-card :deep(.emotion-btn.active) {
  border-color: var(--panel-border);
  background: var(--panel-soft-strong);
}

.emotion-card :deep(.emotion-label) {
  color: var(--panel-muted);
}

.emotion-card :deep(.emotion-btn.active .emotion-label) {
  color: var(--panel-strong);
}

.font-card .section-heading p {
  margin: 0;
  color: var(--panel-muted);
  font-size: 12px;
}

.font-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.font-action-btn {
  padding: 10px 16px;
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  background: var(--panel-soft);
  color: var(--panel-strong);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.font-action-btn:hover {
  border-color: var(--accent);
  background: var(--panel-soft-strong);
}

.font-action-btn.font-active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.font-clear-btn {
  padding: 10px 14px;
  border: 1px solid rgba(200, 100, 100, 0.3);
  border-radius: 14px;
  background: rgba(200, 100, 100, 0.08);
  color: var(--panel-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.font-clear-btn:hover {
  background: rgba(200, 100, 100, 0.18);
}

.media-card :deep(.upload-area) {
  padding: 0;
}

.media-card :deep(.upload-btn) {
  border-radius: 20px;
  background: var(--panel-soft);
}

.media-card :deep(.upload-tip) {
  margin-bottom: 0;
  color: var(--panel-muted);
}

@media (max-width: 900px) {
  .hero-content,
  .split-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-card,
  .section-card {
    border-radius: 24px;
  }

  .hero-card,
  .section-card {
    padding: 18px;
  }

  .hero-content h2 {
    font-size: 28px;
  }

  .location-search {
    grid-template-columns: 1fr;
  }

  .selected-location-card,
  .form-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .search-result-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-meta {
    align-items: flex-start;
    text-align: left;
  }
}
</style>
