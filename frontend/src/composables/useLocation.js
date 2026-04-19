import { ref, computed, onMounted, onUnmounted } from 'vue';

/**
 * 位置信息接口
 */
interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

/**
 * 位置状态
 */
interface LocationState {
  location: Location | null;
  loading: boolean;
  error: string | null;
  watching: boolean;
}

/**
 * 地理位置选项
 */
interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: LocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

/**
 * 地理位置 Composable
 */
export function useLocation(options: LocationOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  
  // 状态
  const location = ref<Location | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const watching = ref(false);
  
  // 计算属性
  const hasLocation = computed(() => location.value !== null);
  const coordinates = computed(() => {
    if (!location.value) return null;
    return {
      lat: location.value.latitude,
      lng: location.value.longitude
    };
  });
  
  // 监听器 ID
  let watchId: number | null = null;
  
  /**
   * 获取当前位置
   */
  async function getCurrentLocation(): Promise<Location | null> {
    if (!navigator.geolocation) {
      error.value = '浏览器不支持地理位置功能';
      return null;
    }
    
    loading.value = true;
    error.value = null;
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          location.value = newLocation;
          loading.value = false;
          resolve(newLocation);
        },
        (err) => {
          loading.value = false;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              error.value = '用户拒绝了地理位置请求';
              break;
            case err.POSITION_UNAVAILABLE:
              error.value = '位置信息不可用';
              break;
            case err.TIMEOUT:
              error.value = '请求超时';
              break;
            default:
              error.value = '获取位置失败';
          }
          resolve(null);
        },
        opts
      );
    });
  }
  
  /**
   * 开始持续监听位置变化
   */
  function startWatching(): void {
    if (!navigator.geolocation || watching.value) return;
    
    watching.value = true;
    error.value = null;
    
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        location.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      },
      (err) => {
        watching.value = false;
        watchId = null;
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            error.value = '用户拒绝了地理位置请求';
            break;
          case err.POSITION_UNAVAILABLE:
            error.value = '位置信息不可用';
            break;
          case err.TIMEOUT:
            error.value = '请求超时';
            break;
          default:
            error.value = '获取位置失败';
        }
      },
      { ...opts, enableHighAccuracy: true }
    );
  }
  
  /**
   * 停止监听位置变化
   */
  function stopWatching(): void {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    watching.value = false;
  }
  
  /**
   * 清除位置信息
   */
  function clearLocation(): void {
    location.value = null;
    error.value = null;
  }
  
  /**
   * 计算两点之间的距离（单位：米）
   */
  function calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }
  
  /**
   * 计算与当前位置的距离
   */
  function distanceFromCurrent(lat: number, lon: number): number | null {
    if (!location.value) return null;
    return calculateDistance(
      location.value.latitude,
      location.value.longitude,
      lat,
      lon
    );
  }
  
  // 组件卸载时停止监听
  onUnmounted(() => {
    stopWatching();
  });
  
  return {
    // 状态
    location,
    loading,
    error,
    watching,
    
    // 计算属性
    hasLocation,
    coordinates,
    
    // 方法
    getCurrentLocation,
    startWatching,
    stopWatching,
    clearLocation,
    calculateDistance,
    distanceFromCurrent
  };
}

// 导出类型
export type { Location, LocationOptions };
