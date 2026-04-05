import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance } from '@/utils/geo';

describe('geo.js', () => {
  describe('calculateDistance (Haversine)', () => {
    it('同一点距离为 0', () => {
      expect(calculateDistance(39.9042, 116.4074, 39.9042, 116.4074)).toBe(0);
    });

    it('北京天安门到上海人民广场约 1068km', () => {
      // 天安门: 39.9042, 116.4074
      // 人民广场: 31.2304, 121.4737
      const dist = calculateDistance(39.9042, 116.4074, 31.2304, 121.4737);
      // 实际约 1068km，允许 10km 误差
      expect(dist).toBeGreaterThan(1058000);
      expect(dist).toBeLessThan(1078000);
    });

    it('短距离精度（~1km）', () => {
      // 两个相距约 1km 的点
      const dist = calculateDistance(39.9042, 116.4074, 39.8952, 116.4074);
      // 纬度差 0.009° ≈ 1km
      expect(dist).toBeGreaterThan(800);
      expect(dist).toBeLessThan(1200);
    });

    it('跨半球计算（悉尼到伦敦）', () => {
      // 悉尼: -33.8688, 151.2093
      // 伦敦: 51.5074, -0.1278
      const dist = calculateDistance(-33.8688, 151.2093, 51.5074, -0.1278);
      expect(dist).toBeGreaterThan(16900000); // ~16990 km
    });

    it('返回值为米，单位正确', () => {
      // 1度纬度 ≈ 111km
      const dist = calculateDistance(0, 0, 1, 0);
      expect(dist).toBeGreaterThan(110000);
      expect(dist).toBeLessThan(112000);
    });
  });

  describe('formatDistance', () => {
    it('不足 1km 显示米', () => {
      expect(formatDistance(0)).toBe('0m');
      expect(formatDistance(500)).toBe('500m');
      expect(formatDistance(999)).toBe('999m');
    });

    it('1km 以上显示公里', () => {
      expect(formatDistance(1000)).toBe('1.0km');
      expect(formatDistance(1500)).toBe('1.5km');
      expect(formatDistance(12345)).toBe('12.3km');
    });

    it('边界值', () => {
      expect(formatDistance(999.49)).toBe('999m');
      expect(formatDistance(1000)).toBe('1.0km');
    });
  });
});
