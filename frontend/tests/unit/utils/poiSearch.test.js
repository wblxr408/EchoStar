import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchPoisWithContext } from '@/utils/poiSearch';

/**
 * 创建 mock 的 AMap PlaceSearch
 * 支持 search 和 searchNearBy 两种搜索模式
 */
function createMockPlaceSearch(overrides = {}) {
  return vi.fn((opts) => ({
    pageSize: opts.pageSize,
    pageIndex: opts.pageIndex,
    city: opts.city || '',
    citylimit: opts.citylimit || false,
    type: opts.type || '',
    search(keyword, callback) {
      const results = overrides.searchResults || {};
      const key = `${keyword}_${opts.city}_${opts.type}`;
      const result = results[key] || results[keyword] || overrides.defaultResult;
      callback('complete', result || { poiList: { pois: [] } });
    },
    searchNearBy(keyword, center, radius, callback) {
      const results = overrides.nearbyResults || {};
      const key = `${keyword}_${opts.type}_${radius}`;
      const result = results[key] || overrides.defaultResult;
      callback('complete', result || { poiList: { pois: [] } });
    }
  }));
}

/**
 * 标准化 POI 数据（模拟 normalizePoi 回调）
 */
const normalizePoi = (poi) => ({
  id: poi.id,
  name: poi.name,
  address: poi.address || '',
  type: poi.type || '',
  latitude: poi.location?.lat || poi.latitude || poi.lat,
  longitude: poi.location?.lng || poi.longitude || poi.lng,
  distance: poi.distance || null,
  city: poi.cityname || poi.city || '',
  district: poi.adname || poi.district || '',
});

// ========== normalizeText / 关键词解析 ==========

describe('poiSearch — 关键词解析', () => {
  it('通用本地意图词（如"附近餐厅"）应按距离排序', async () => {
    const createPlaceSearch = createMockPlaceSearch({
      nearbyResults: {
        '_餐饮服务_15000': {
          poiList: { pois: [
            { id: '1', name: '张三火锅店', type: '餐饮服务', location: { lng: 116.401, lat: 39.901 }, distance: 8000 },
            { id: '2', name: '老北京餐厅', type: '餐饮服务', location: { lng: 116.400, lat: 39.900 }, distance: 200 },
          ]}
        },
        '__15000': {
          poiList: { pois: [
            { id: '3', name: '巷子美食', type: '餐饮服务', location: { lng: 116.399, lat: 39.899 }, distance: 500 },
          ]}
        }
      }
    });

    const { pois } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '附近餐厅',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi
    });

    // 通用本地意图：按距离排序
    expect(pois.length).toBeGreaterThan(0);
    const distances = pois.map(p => p.distance).filter(d => d != null);
    if (distances.length > 1) {
      for (let i = 1; i < distances.length; i++) {
        expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
      }
    }
  });

  it('精确名称搜索（如"星巴克"）应按匹配度排序', async () => {
    const createPlaceSearch = createMockPlaceSearch({
      nearbyResults: {
        '___50000': {
          poiList: { pois: [
            { id: '1', name: '星巴克臻选店', type: '餐饮服务', location: { lng: 116.401, lat: 39.901 }, distance: 3000 },
            { id: '2', name: '星巴克咖啡', type: '餐饮服务', location: { lng: 116.400, lat: 39.900 }, distance: 5000 },
          ]}
        }
      },
      searchResults: {
        '星巴克': {
          poiList: { pois: [
            { id: '3', name: '星巴克', type: '餐饮服务', location: { lng: 116.402, lat: 39.902 }, distance: 1000 },
          ]}
        }
      }
    });

    const { pois } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '星巴克',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi
    });

    expect(pois.length).toBeGreaterThanOrEqual(1);
    // 精确匹配 "星巴克" 应排在前缀匹配 "星巴克臻选店" / "星巴克咖啡" 前面
    const exactIdx = pois.findIndex(p => p.name === '星巴克');
    const prefixIdx = pois.findIndex(p => p.name === '星巴克臻选店' || p.name === '星巴克咖啡');
    if (exactIdx >= 0 && prefixIdx >= 0) {
      expect(exactIdx).toBeLessThan(prefixIdx);
    }
  });

  it('无结果时返回空数组', async () => {
    const createPlaceSearch = createMockPlaceSearch({
      defaultResult: { poiList: { pois: [] } }
    });

    const { pois } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '不存在的地点xyz123',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi
    });

    expect(pois).toEqual([]);
  });
});

// ========== 城市约束 ==========

describe('poiSearch — 城市约束', () => {
  it('提供 locality 时应发起本地搜索', async () => {
    const createPlaceSearch = createMockPlaceSearch({
      searchResults: {
        // local keyword search: keyword='咖啡馆', city='北京', type='餐饮服务'
        '咖啡馆_北京_餐饮服务': {
          poiList: { pois: [
            { id: '1', name: '北京咖啡馆', type: '餐饮服务', location: { lng: 116.4, lat: 39.9 }, cityname: '北京', adname: '朝阳区' },
          ]}
        },
        // local category search: keyword='', city='北京', type='餐饮服务'
        '_北京_餐饮服务': {
          poiList: { pois: [] }
        },
      },
      nearbyResults: {
        // nearby keyword search: keyword='咖啡馆', type='餐饮服务', radius=15000
        '咖啡馆_餐饮服务_15000': {
          poiList: { pois: [] }
        },
        // nearby category search: keyword='', type='餐饮服务', radius=15000
        '_餐饮服务_15000': {
          poiList: { pois: [] }
        },
      }
    });

    const { pois } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '咖啡馆',
      anchor: { longitude: 116.4, latitude: 39.9 },
      locality: { city: '北京', district: '朝阳区', adcode: '110105' },
      normalizePoi
    });

    expect(pois.length).toBeGreaterThanOrEqual(1);
    expect(pois[0].name).toBe('北京咖啡馆');
  });

  it('无 locality 时不发起本地搜索', async () => {
    let localSearchCalled = false;
    const createPlaceSearch = vi.fn((opts) => ({
      search(keyword, callback) {
        if (opts.city) localSearchCalled = true;
        callback('complete', { poiList: { pois: [] } });
      },
      searchNearBy(keyword, center, radius, callback) {
        callback('complete', { poiList: { pois: [] } });
      }
    }));

    await searchPoisWithContext({
      createPlaceSearch,
      keyword: '测试',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi
    });

    expect(localSearchCalled).toBe(false);
  });
});

// ========== 去重 ==========

describe('poiSearch — 去重', () => {
  it('nearby 和 global 中相同 POI 应去重', async () => {
    const duplicatePoi = { id: '1', name: '测试地点', type: '餐饮服务', location: { lng: 116.4, lat: 39.9 }, distance: 500 };
    const createPlaceSearch = createMockPlaceSearch({
      nearbyResults: {
        '___50000': {
          poiList: { pois: [duplicatePoi] }
        }
      },
      searchResults: {
        '测试地点': {
          poiList: { pois: [duplicatePoi] }
        }
      }
    });

    const { pois } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '测试地点',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi
    });

    const count = pois.filter(p => p.id === '1').length;
    expect(count).toBe(1);
  });
});

// ========== 错误处理 ==========

describe('poiSearch — 错误处理', () => {
  it('createPlaceSearch 非函数时返回空结果', async () => {
    const { pois, errorMessage } = await searchPoisWithContext({
      createPlaceSearch: null,
      keyword: '测试',
      normalizePoi
    });

    expect(pois).toEqual([]);
    expect(errorMessage).toBe('');
  });

  it('搜索返回错误状态时设置 errorMessage', async () => {
    const createPlaceSearch = vi.fn(() => ({
      search(keyword, callback) {
        callback('error', { info: 'INVALID_USER_KEY' });
      },
      searchNearBy(keyword, center, radius, callback) {
        callback('error', { info: 'INVALID_USER_KEY' });
      }
    }));

    const { pois, errorMessage } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '附近餐厅',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi
    });

    expect(pois).toEqual([]);
    expect(errorMessage).toContain('暂时失败');
  });

  it('no_data 状态不算错误', async () => {
    const createPlaceSearch = vi.fn(() => ({
      search(keyword, callback) {
        callback('no_data', { poiList: { pois: [] } });
      },
      searchNearBy(keyword, center, radius, callback) {
        callback('no_data', { poiList: { pois: [] } });
      }
    }));

    const { pois, errorMessage } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '测试',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi
    });

    expect(pois).toEqual([]);
    expect(errorMessage).toBe('');
  });
});

// ========== 距离评分 ==========

describe('poiSearch — 距离评分', () => {
  it('通用本地意图下近距离 POI 排在前面', async () => {
    const createPlaceSearch = createMockPlaceSearch({
      nearbyResults: {
        '_科教文化服务_15000': {
          poiList: { pois: [
            { id: '1', name: '大学A', type: '科教文化服务', location: { lng: 116.400, lat: 39.900 }, distance: 20000 },
            { id: '2', name: '大学B', type: '科教文化服务', location: { lng: 116.401, lat: 39.901 }, distance: 500 },
            { id: '3', name: '大学C', type: '科教文化服务', location: { lng: 116.402, lat: 39.902 }, distance: 10000 },
          ]}
        },
        '__15000': {
          poiList: { pois: [] }
        }
      }
    });

    const { pois } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '附近大学',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi
    });

    expect(pois).toHaveLength(3);
    // 距离升序
    const distances = pois.map(p => p.distance);
    expect(distances[0]).toBe(500);
    expect(distances[1]).toBe(10000);
    expect(distances[2]).toBe(20000);
  });
});

// ========== normalizePoi 过滤 ==========

describe('poiSearch — normalizePoi 过滤', () => {
  it('normalizePoi 返回 null 的 POI 应被过滤', async () => {
    const createPlaceSearch = createMockPlaceSearch({
      nearbyResults: {
        // nearby keyword search: keyword='测试', type='', radius=50000
        '测试__50000': {
          poiList: { pois: [
            { id: '1', name: '有效地点', type: '餐饮服务', location: { lng: 116.4, lat: 39.9 } },
            { id: '2', name: null },  // normalizePoi 返回 null
          ]}
        }
      }
    });

    const normalizePoiFilter = (poi) => poi.name ? normalizePoi(poi) : null;

    const { pois } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '测试',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi: normalizePoiFilter
    });

    expect(pois).toHaveLength(1);
    expect(pois[0].name).toBe('有效地点');
  });
});

// ========== POI 去重字段清理 ==========

describe('poiSearch — 输出字段清理', () => {
  it('输出不应包含内部排序字段', async () => {
    const createPlaceSearch = createMockPlaceSearch({
      nearbyResults: {
        // nearby keyword search: keyword='测试', type='', radius=50000
        '测试__50000': {
          poiList: { pois: [
            { id: '1', name: '测试', type: '餐饮服务', location: { lng: 116.4, lat: 39.9 }, distance: 500 },
          ]}
        }
      }
    });

    const { pois } = await searchPoisWithContext({
      createPlaceSearch,
      keyword: '测试',
      anchor: { longitude: 116.4, latitude: 39.9 },
      normalizePoi
    });

    expect(pois).toHaveLength(1);
    expect(pois[0]._poiRank).toBeUndefined();
    expect(pois[0]._poiSource).toBeUndefined();
    expect(pois[0]._poiDistance).toBeUndefined();
    expect(pois[0]._poiMatchScore).toBeUndefined();
    expect(pois[0]._poiNameStrength).toBeUndefined();
  });
});
