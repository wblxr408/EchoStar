import { describe, it, expect } from 'vitest';
import {
  EMOTIONS,
  getEmotionEmoji,
  getEmotionLabel,
  getEmotionColor,
  getEmotionInfo,
  toEmotionTag,
  fromEmotionTag,
} from '@/utils/emotion';

describe('emotion.js', () => {
  describe('EMOTIONS 常量', () => {
    it('包含 4 种核心情绪', () => {
      expect(EMOTIONS).toHaveLength(4);
      const values = EMOTIONS.map(e => e.value);
      expect(values).toEqual(['开心', '难过', '治愈', '打卡']);
    });

    it('每种情绪都有 value, icon, label, color', () => {
      EMOTIONS.forEach(emotion => {
        expect(emotion).toHaveProperty('value');
        expect(emotion).toHaveProperty('icon');
        expect(emotion).toHaveProperty('label');
        expect(emotion).toHaveProperty('color');
      });
    });
  });

  describe('getEmotionEmoji', () => {
    it('通过 tag 名称获取 emoji', () => {
      expect(getEmotionEmoji('开心')).toBe('😊');
      expect(getEmotionEmoji('难过')).toBe('😢');
      expect(getEmotionEmoji('治愈')).toBe('😌');
      expect(getEmotionEmoji('打卡')).toBe('📍');
    });

    it('通过英文 value 获取 emoji', () => {
      expect(getEmotionEmoji('happy')).toBe('😊');
      expect(getEmotionEmoji('sad')).toBe('😢');
      expect(getEmotionEmoji('peaceful')).toBe('😌');
      expect(getEmotionEmoji('excited')).toBe('📍');
      expect(getEmotionEmoji('neutral')).toBe('😐');
    });

    it('未知情绪返回默认 emoji', () => {
      expect(getEmotionEmoji('unknown')).toBe('📍');
      expect(getEmotionEmoji('')).toBe('📍');
      expect(getEmotionEmoji(null)).toBe('📍');
    });
  });

  describe('getEmotionLabel', () => {
    it('返回中文标签', () => {
      expect(getEmotionLabel('happy')).toBe('开心');
      expect(getEmotionLabel('sad')).toBe('难过');
      expect(getEmotionLabel('peaceful')).toBe('治愈');
      expect(getEmotionLabel('excited')).toBe('打卡');
      expect(getEmotionLabel('neutral')).toBe('平静');
    });

    it('未知情绪返回"未知"', () => {
      expect(getEmotionLabel('')).toBe('未知');
      expect(getEmotionLabel(null)).toBe('未知');
    });
  });

  describe('getEmotionColor', () => {
    it('返回对应颜色', () => {
      expect(getEmotionColor('happy')).toBe('#ffd700');
      expect(getEmotionColor('sad')).toBe('#6b7280');
      expect(getEmotionColor('peaceful')).toBe('#10b981');
    });

    it('未知情绪返回默认颜色', () => {
      expect(getEmotionColor('unknown')).toBe('#9ca3af');
    });
  });

  describe('getEmotionInfo', () => {
    it('返回完整情绪信息对象', () => {
      const info = getEmotionInfo('happy');
      expect(info).toEqual({ value: 'happy', icon: '😊', label: '开心', color: '#ffd700' });
    });

    it('未知情绪返回 null', () => {
      expect(getEmotionInfo('unknown')).toBeNull();
      expect(getEmotionInfo(null)).toBeNull();
    });
  });

  describe('toEmotionTag', () => {
    it('英文 emotion 转中文 tag', () => {
      expect(toEmotionTag('happy')).toBe('开心');
      expect(toEmotionTag('sad')).toBe('难过');
      expect(toEmotionTag('excited')).toBe('打卡');
      expect(toEmotionTag('peaceful')).toBe('治愈');
    });

    it('已经是中文则原样返回', () => {
      expect(toEmotionTag('开心')).toBe('开心');
    });
  });

  describe('fromEmotionTag', () => {
    it('中文 tag 转英文 emotion', () => {
      expect(fromEmotionTag('开心')).toBe('happy');
      expect(fromEmotionTag('难过')).toBe('sad');
      expect(fromEmotionTag('治愈')).toBe('peaceful');
      expect(fromEmotionTag('打卡')).toBe('excited');
    });

    it('已经是英文则原样返回', () => {
      expect(fromEmotionTag('happy')).toBe('happy');
    });
  });

  describe('双向转换一致性', () => {
    it('tag → emotion → tag 保持一致', () => {
      const tags = ['开心', '难过', '治愈', '打卡'];
      tags.forEach(tag => {
        expect(toEmotionTag(fromEmotionTag(tag))).toBe(tag);
      });
    });
  });
});
