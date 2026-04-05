import { describe, it, expect } from 'vitest';
import { validateImageFile, createPreviewURL, revokePreviewURL } from '@/utils/image';

describe('image.js', () => {
  describe('validateImageFile', () => {
    const createFile = (type, size) => new File(['x'.repeat(size)], 'test.jpg', { type });

    it('JPG 文件通过验证', () => {
      const file = createFile('image/jpeg', 1024);
      expect(validateImageFile(file)).toEqual({ valid: true });
    });

    it('PNG 文件通过验证', () => {
      const file = createFile('image/png', 1024);
      expect(validateImageFile(file)).toEqual({ valid: true });
    });

    it('WebP 文件通过验证', () => {
      const file = createFile('image/webp', 1024);
      expect(validateImageFile(file)).toEqual({ valid: true });
    });

    it('非图片类型被拒绝', () => {
      const file = createFile('application/pdf', 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JPG');
    });

    it('GIF 类型被拒绝', () => {
      const file = createFile('image/gif', 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
    });

    it('超过大小限制被拒绝', () => {
      const file = createFile('image/jpeg', 11 * 1024 * 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('恰好等于限制大小通过', () => {
      const file = createFile('image/jpeg', 10 * 1024 * 1024);
      expect(validateImageFile(file)).toEqual({ valid: true });
    });

    it('自定义 maxSize 参数', () => {
      const file = createFile('image/jpeg', 2 * 1024 * 1024);
      // 默认 10MB 通过
      expect(validateImageFile(file).valid).toBe(true);
      // 1MB 限制不通过
      const result = validateImageFile(file, 1 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('1MB');
    });
  });

  describe('createPreviewURL / revokePreviewURL', () => {
    it('createPreviewURL 返回 blob: URL', () => {
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      const url = createPreviewURL(blob);
      expect(url).toMatch(/^blob:/);
    });

    it('revokePreviewURL 不抛异常', () => {
      expect(() => revokePreviewURL('blob:invalid')).not.toThrow();
    });
  });
});
