import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useStoryStore } from '@/stores/story';

vi.mock('@/api/story', () => ({
  storyApi: {
    getMyStories: vi.fn(),
    createStory: vi.fn(),
    deleteStory: vi.fn(),
  },
}));

import { storyApi } from '@/api/story';

describe('stores/story.js', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('初始状态', () => {
    const store = useStoryStore();
    expect(store.myStories).toEqual([]);
    expect(store.pagination).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
    expect(store.loading).toBe(false);
  });

  describe('fetchMyStories', () => {
    it('获取故事列表并更新分页', async () => {
      storyApi.getMyStories.mockResolvedValue({
        stories: [{ id: 1 }, { id: 2 }],
        pagination: { page: 1, limit: 10, total: 20, totalPages: 2 },
      });

      const store = useStoryStore();
      await store.fetchMyStories(1);

      expect(store.myStories).toHaveLength(2);
      expect(store.pagination.total).toBe(20);
      expect(store.loading).toBe(false);
    });

    it('请求期间 loading 为 true', async () => {
      let loadingDuringRequest = false;
      storyApi.getMyStories.mockImplementation(async () => {
        const store = useStoryStore();
        loadingDuringRequest = store.loading;
        return { stories: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      });

      const store = useStoryStore();
      await store.fetchMyStories();
      expect(loadingDuringRequest).toBe(true);
    });

    it('请求失败后 loading 仍恢复 false', async () => {
      storyApi.getMyStories.mockRejectedValue(new Error('网络错误'));
      const store = useStoryStore();
      await expect(store.fetchMyStories()).rejects.toThrow();
      expect(store.loading).toBe(false);
    });
  });

  describe('createStory', () => {
    it('创建故事后添加到列表头部', async () => {
      const newStory = { id: 99, content: 'new' };
      storyApi.createStory.mockResolvedValue(newStory);

      const store = useStoryStore();
      store.myStories = [{ id: 1 }, { id: 2 }];
      const result = await store.createStory({ content: 'new' });

      expect(store.myStories[0]).toEqual(newStory);
      expect(store.myStories).toHaveLength(3);
      expect(result).toEqual(newStory);
    });
  });

  describe('deleteStory', () => {
    it('删除故事后从列表移除', async () => {
      storyApi.deleteStory.mockResolvedValue();

      const store = useStoryStore();
      store.myStories = [{ id: 1 }, { id: 2 }, { id: 3 }];
      await store.deleteStory(2);

      expect(store.myStories).toEqual([{ id: 1 }, { id: 3 }]);
    });
  });

  describe('clear', () => {
    it('清空列表和分页状态', () => {
      const store = useStoryStore();
      store.myStories = [{ id: 1 }];
      store.pagination = { page: 3, limit: 5, total: 15, totalPages: 3 };

      store.clear();

      expect(store.myStories).toEqual([]);
      expect(store.pagination).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
    });
  });
});
