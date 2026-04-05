import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import StoryCard from '@/components/StoryCard.vue';

// mock TimeCapsule 子组件
vi.mock('@/components/TimeCapsule.vue', () => ({
  default: { template: '<div class="mock-timecapsule" />', props: ['unlockAt', 'createdAt'] },
}));

describe('StoryCard.vue', () => {
  const baseStory = {
    id: 1,
    content: '测试故事内容',
    emotionTag: '开心',
    createdAt: new Date().toISOString(),
    images: [],
    location: { address: '北京天安门' },
    author: { username: '测试用户', avatar: 'http://a.jpg' },
  };

  it('渲染故事内容', () => {
    const wrapper = mount(StoryCard, { props: { story: baseStory } });
    expect(wrapper.text()).toContain('测试故事内容');
    expect(wrapper.text()).toContain('北京天安门');
  });

  it('显示作者信息', () => {
    const wrapper = mount(StoryCard, { props: { story: baseStory } });
    expect(wrapper.text()).toContain('测试用户');
    expect(wrapper.find('img.avatar').attributes('src')).toBe('http://a.jpg');
  });

  it('作者名为空时显示匿名用户', () => {
    const story = { ...baseStory, author: null, user: null, username: '' };
    const wrapper = mount(StoryCard, { props: { story } });
    expect(wrapper.text()).toContain('匿名用户');
  });

  it('无头像时显示 fallback', () => {
    const story = { ...baseStory, author: { username: 'A' } };
    const wrapper = mount(StoryCard, { props: { story } });
    expect(wrapper.find('.avatar-fallback').exists()).toBe(true);
  });

  it('显示情绪 emoji', () => {
    const wrapper = mount(StoryCard, { props: { story: baseStory } });
    expect(wrapper.find('.emotion-icon').text()).toBe('😊');
  });

  it('根据情绪设置 CSS class', () => {
    const wrapper = mount(StoryCard, { props: { story: baseStory } });
    expect(wrapper.find('.story-card').classes()).toContain('emotion-happy');
  });

  it('点击卡片触发 select-story 事件', async () => {
    const wrapper = mount(StoryCard, { props: { story: baseStory } });
    await wrapper.find('.story-card').trigger('click');
    expect(wrapper.emitted('select-story')).toBeTruthy();
    expect(wrapper.emitted('select-story')[0][0]).toEqual(baseStory);
  });

  it('渲染图片列表', () => {
    const story = { ...baseStory, images: ['a.jpg', 'b.jpg'] };
    const wrapper = mount(StoryCard, { props: { story } });
    const imgs = wrapper.findAll('.story-images img');
    expect(imgs).toHaveLength(2);
  });

  it('点击图片触发 preview-image 事件', async () => {
    const story = { ...baseStory, images: ['a.jpg'] };
    const wrapper = mount(StoryCard, { props: { story } });
    await wrapper.find('.story-images img').trigger('click');
    expect(wrapper.emitted('preview-image')).toBeTruthy();
    expect(wrapper.emitted('preview-image')[0][0]).toEqual({ index: 0, images: ['a.jpg'] });
  });

  it('无地址时显示"未知地点"', () => {
    const story = { ...baseStory, location: null };
    const wrapper = mount(StoryCard, { props: { story } });
    expect(wrapper.text()).toContain('未知地点');
  });

  it('显示相对时间', () => {
    const story = { ...baseStory, createdAt: new Date().toISOString() };
    const wrapper = mount(StoryCard, { props: { story } });
    expect(wrapper.text()).toContain('刚刚');
  });

  it('时光胶囊模式下渲染 TimeCapsule 组件', () => {
    const story = { ...baseStory, isTimeCapsule: true, unlockAt: '2030-01-01' };
    const wrapper = mount(StoryCard, { props: { story } });
    expect(wrapper.find('.mock-timecapsule').exists()).toBe(true);
  });
});
