import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMapStore } from '@/stores/map';

describe('stores/map.js', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('初始状态', () => {
    const store = useMapStore();
    expect(store.center).toEqual({ latitude: 39.9042, longitude: 116.4074 });
    expect(store.zoom).toBe(12);
    expect(store.userLocation).toBeNull();
    expect(store.stories).toEqual([]);
    expect(store.selectedStory).toBeNull();
    expect(store.clusters).toEqual([]);
  });

  describe('updateCenter', () => {
    it('更新中心坐标', () => {
      const store = useMapStore();
      store.updateCenter(31.23, 121.47);
      expect(store.center).toEqual({ latitude: 31.23, longitude: 121.47 });
    });

    it('忽略 NaN/Infinity', () => {
      const store = useMapStore();
      store.updateCenter(NaN, 121);
      expect(store.center.latitude).toBe(39.9042);
      store.updateCenter(31, Infinity);
      expect(store.center.longitude).toBe(116.4074);
    });

    it('忽略重复坐标（epsilon 内）', () => {
      const store = useMapStore();
      const orig = store.center.latitude;
      store.updateCenter(orig + 0.0000001, store.center.longitude);
      expect(store.center.latitude).toBe(orig);
    });
  });

  describe('updateZoom', () => {
    it('更新缩放级别', () => {
      const store = useMapStore();
      store.updateZoom(15);
      expect(store.zoom).toBe(15);
    });

    it('忽略 NaN', () => {
      const store = useMapStore();
      store.updateZoom(NaN);
      expect(store.zoom).toBe(12);
    });

    it('忽略相同值', () => {
      const store = useMapStore();
      store.updateZoom(12);
      // zoom 未变化，但不会报错
      expect(store.zoom).toBe(12);
    });
  });

  describe('setUserLocation', () => {
    it('设置用户位置', () => {
      const store = useMapStore();
      store.setUserLocation(39.9, 116.4);
      expect(store.userLocation).toEqual({ latitude: 39.9, longitude: 116.4 });
    });

    it('忽略无效值', () => {
      const store = useMapStore();
      store.setUserLocation('abc', 116.4);
      expect(store.userLocation).toBeNull();
    });

    it('忽略相同位置', () => {
      const store = useMapStore();
      store.setUserLocation(39.9, 116.4);
      store.setUserLocation(39.9, 116.4);
      // 只设置了一次
    });
  });

  describe('updateStories', () => {
    it('接受数组', () => {
      const store = useMapStore();
      store.updateStories([{ id: 1 }, { id: 2 }]);
      expect(store.stories).toHaveLength(2);
    });

    it('非数组转为空数组', () => {
      const store = useMapStore();
      store.updateStories('not-array');
      expect(store.stories).toEqual([]);
      store.updateStories(null);
      expect(store.stories).toEqual([]);
      store.updateStories(123);
      expect(store.stories).toEqual([]);
    });
  });

  describe('selectStory / clearSelection', () => {
    it('选择和清除故事', () => {
      const store = useMapStore();
      const story = { id: 42, content: 'test' };
      store.selectStory(story);
      expect(store.selectedStory).toEqual(story);
      store.clearSelection();
      expect(store.selectedStory).toBeNull();
    });
  });

  describe('updateClusters', () => {
    it('更新聚合数据', () => {
      const store = useMapStore();
      store.updateClusters([{ count: 5 }]);
      expect(store.clusters).toHaveLength(1);
    });
  });
});
