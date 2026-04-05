import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EmotionSelector from '@/components/EmotionSelector.vue';

describe('EmotionSelector.vue', () => {
  it('渲染 4 个情绪按钮', () => {
    const wrapper = mount(EmotionSelector);
    const buttons = wrapper.findAll('.emotion-btn');
    expect(buttons).toHaveLength(4);
  });

  it('显示标题"选择你的情绪"', () => {
    const wrapper = mount(EmotionSelector);
    expect(wrapper.find('h3').text()).toBe('选择你的情绪');
  });

  it('点击情绪按钮触发 update:modelValue', async () => {
    const wrapper = mount(EmotionSelector);
    const buttons = wrapper.findAll('.emotion-btn');

    await buttons[0].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['开心']);
  });

  it('选中状态显示 active class', () => {
    const wrapper = mount(EmotionSelector, {
      props: { modelValue: '开心' },
    });
    const buttons = wrapper.findAll('.emotion-btn');
    expect(buttons[0].classes()).toContain('active');
    expect(buttons[1].classes()).not.toContain('active');
  });

  it('切换选择后 active 跟随', async () => {
    const wrapper = mount(EmotionSelector, {
      props: { modelValue: '开心' },
    });

    const buttons = wrapper.findAll('.emotion-btn');
    await buttons[2].trigger('click');

    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['治愈']);
  });
});
