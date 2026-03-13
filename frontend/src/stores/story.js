import { defineStore } from 'pinia';
import { ref } from 'vue';
import { storyApi } from '../api/story';

/**
 * 故事状态管理
 */
export const useStoryStore = defineStore('story', () => {
  // 我的故事列表
  const myStories = ref([]);

  // 分页信息
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // 加载状态
  const loading = ref(false);

  /**
   * 获取我的故事列表
   */
  async function fetchMyStories(page = 1) {
    loading.value = true;

    try {
      const data = await storyApi.getMyStories({ page, limit: pagination.value.limit });
      myStories.value = data.stories;
      pagination.value = data.pagination;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 发布故事
   */
  async function createStory(storyData) {
    const data = await storyApi.createStory(storyData);
    // 添加到列表头部
    myStories.value.unshift(data);
    return data;
  },

  /**
   * 删除故事
   */
  async function deleteStory(id) {
    await storyApi.deleteStory(id);
    // 从列表中移除
    myStories.value = myStories.value.filter(story => story.id !== id);
  }

  /**
   * 清空列表
   */
  function clear() {
    myStories.value = [];
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    };
  }

  return {
    myStories,
    pagination,
    loading,
    fetchMyStories,
    createStory,
    deleteStory,
    clear
  };
});
