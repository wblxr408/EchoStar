import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeTime,
  formatDateTime,
  formatShortTime,
  isTimeCapsuleUnlocked,
  getTimeCapsuleCountdown,
} from '@/utils/time';

describe('time.js', () => {
  describe('formatRelativeTime', () => {
    it('返回"刚刚"（< 60秒）', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('刚刚');
      expect(formatRelativeTime(new Date(now.getTime() - 30000))).toBe('刚刚');
    });

    it('返回"N分钟前"（1-59分钟）', () => {
      const now = new Date();
      expect(formatRelativeTime(new Date(now.getTime() - 60 * 1000))).toBe('1分钟前');
      expect(formatRelativeTime(new Date(now.getTime() - 5 * 60 * 1000))).toBe('5分钟前');
      expect(formatRelativeTime(new Date(now.getTime() - 59 * 60 * 1000))).toBe('59分钟前');
    });

    it('返回"N小时前"（1-23小时）', () => {
      const now = new Date();
      expect(formatRelativeTime(new Date(now.getTime() - 60 * 60 * 1000))).toBe('1小时前');
      expect(formatRelativeTime(new Date(now.getTime() - 12 * 60 * 60 * 1000))).toBe('12小时前');
    });

    it('返回"N天前"（1-29天）', () => {
      const now = new Date();
      expect(formatRelativeTime(new Date(now.getTime() - 24 * 60 * 60 * 1000))).toBe('1天前');
      expect(formatRelativeTime(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))).toBe('7天前');
    });

    it('返回"N个月前"（1-11个月）', () => {
      const now = new Date();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      expect(formatRelativeTime(new Date(now.getTime() - thirtyDays))).toBe('1个月前');
      expect(formatRelativeTime(new Date(now.getTime() - 6 * thirtyDays))).toBe('6个月前');
    });

    it('返回"N年前"（>= 12个月）', () => {
      const now = new Date();
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      expect(formatRelativeTime(new Date(now.getTime() - oneYear))).toBe('1年前');
      expect(formatRelativeTime(new Date(now.getTime() - 2 * oneYear))).toBe('2年前');
    });

    it('支持 Date 对象和字符串参数', () => {
      const now = new Date();
      expect(formatRelativeTime(now.toISOString())).toBe('刚刚');
    });
  });

  describe('formatDateTime', () => {
    it('默认格式 YYYY-MM-DD HH:mm:ss', () => {
      const result = formatDateTime('2026-04-06T10:30:45');
      expect(result).toBe('2026-04-06 10:30:45');
    });

    it('自定义格式 YYYY/MM/DD', () => {
      expect(formatDateTime('2026-01-05T08:09:10', 'YYYY/MM/DD')).toBe('2026/01/05');
    });

    it('补零处理', () => {
      expect(formatDateTime('2026-03-01T01:02:03')).toBe('2026-03-01 01:02:03');
    });

    it('支持 Date 对象参数', () => {
      const d = new Date(2026, 11, 25, 14, 5, 9);
      expect(formatDateTime(d)).toBe('2026-12-25 14:05:09');
    });
  });

  describe('formatShortTime', () => {
    it('返回 M/D H:MM 格式', () => {
      expect(formatShortTime('2026-04-06T08:05:00')).toBe('4/6 8:05');
    });

    it('分钟补零', () => {
      expect(formatShortTime('2026-01-01T23:09:00')).toBe('1/1 23:09');
    });

    it('空值返回空字符串', () => {
      expect(formatShortTime(null)).toBe('');
      expect(formatShortTime('')).toBe('');
      expect(formatShortTime(undefined)).toBe('');
    });
  });

  describe('isTimeCapsuleUnlocked', () => {
    it('过去时间已解锁', () => {
      expect(isTimeCapsuleUnlocked('2020-01-01T00:00:00')).toBe(true);
    });

    it('未来时间未解锁', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      expect(isTimeCapsuleUnlocked(future)).toBe(false);
    });

    it('当前时间点已解锁', () => {
      expect(isTimeCapsuleUnlocked(new Date().toISOString())).toBe(true);
    });
  });

  describe('getTimeCapsuleCountdown', () => {
    it('已解锁返回"已解锁"', () => {
      expect(getTimeCapsuleCountdown('2020-01-01')).toBe('已解锁');
    });

    it('剩余天数+小时', () => {
      const future = new Date(Date.now() + 3 * 86400000 + 5 * 3600000);
      const result = getTimeCapsuleCountdown(future.toISOString());
      expect(result).toMatch(/天.*解锁/);
    });

    it('仅剩余小时', () => {
      const future = new Date(Date.now() + 5 * 3600000);
      const result = getTimeCapsuleCountdown(future.toISOString());
      expect(result).toBe('5小时后解锁');
    });

    it('仅剩余分钟', () => {
      const future = new Date(Date.now() + 30 * 60000);
      const result = getTimeCapsuleCountdown(future.toISOString());
      expect(result).toBe('30分钟后解锁');
    });
  });
});
