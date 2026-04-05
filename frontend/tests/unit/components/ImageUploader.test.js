import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ImageUploader from '@/components/ImageUploader.vue';

// mock useToast
vi.mock('@/composables/useToast.js', () => ({
  showToast: vi.fn(),
}));

import { showToast } from '@/composables/useToast.js';

describe('ImageUploader.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('默认显示添加图片按钮', () => {
    const wrapper = mount(ImageUploader);
    expect(wrapper.find('.upload-btn').exists()).toBe(true);
  });

  it('显示最大图片数提示', () => {
    const wrapper = mount(ImageUploader, { props: { maxImages: 5 } });
    expect(wrapper.text()).toContain('5');
  });

  it('添加有效图片后更新 v-model', async () => {
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
    const wrapper = mount(ImageUploader);

    // 触发文件选择
    const input = wrapper.find('input[type="file"]');
    const dataTransfer = { files: [file] };
    Object.defineProperty(dataTransfer, 'files', { value: [file] });
    await input.trigger('change');

    // v-model 应该更新为包含该 file 的数组
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0]).toHaveLength(1);
  });

  it('无效文件类型显示警告', async () => {
    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
    const wrapper = mount(ImageUploader);

    const input = wrapper.find('input[type="file"]');
    // 手动设置 files（浏览器环境中 input.files 只读）
    const nativeInput = wrapper.find('input[type="file"]').element;
    Object.defineProperty(nativeInput, 'files', { value: [file], writable: false });
    await input.trigger('change');

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('JPG'),
      'warning'
    );
  });

  it('超过 maxImages 时显示警告', async () => {
    const wrapper = mount(ImageUploader, { props: { maxImages: 1 } });

    // 先添加一张有效图片
    const file1 = new File(['data'], 'a.jpg', { type: 'image/jpeg' });
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file1], writable: false });
    await input.trigger('change');

    // 再添加第二张
    vi.clearAllMocks();
    const file2 = new File(['data'], 'b.jpg', { type: 'image/jpeg' });
    Object.defineProperty(input.element, 'files', { value: [file2], writable: false });
    await input.trigger('change');

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('1'),
      'warning'
    );
  });
});
