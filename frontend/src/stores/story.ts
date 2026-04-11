import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Story, StoryState, CreateStoryData, Pagination } from '../types/story';

/**
 * 故事状态管理
 */
export const useStoryStore = defineStore('story', () => {
  // 状态
  const myStories = ref<Story[]>([]);
  const isLoading = ref(false);
  const pagination = ref<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // 当前故事
  const currentStory = ref<Story | null>(null);

  // 计算属性
  const hasStories = computed(() => myStories.value.length > 0);
  const currentPageStories = computed(() => myStories.value);

  /**
   * 设置我的故事
   */
  function setMyStories(stories: Story[]): void {
    myStories.value = stories;
  }

  /**
   * 添加故事
   */
  function addStory(story: Story): void {
    myStories.value.unshift(story);
    pagination.value.total++;
  }

  /**
   * 更新故事
   */
  function updateStory(updatedStory: Story): void {
    const index = myStories.value.findIndex(s => s.id === updatedStory.id);
    if (index !== -1) {
      myStories.value[index] = updatedStory;
    }
  }

  /**
   * 删除故事
   */
  function removeStory(storyId: string | number): void {
    myStories.value = myStories.value.filter(s => s.id !== storyId);
    pagination.value.total--;
  }

  /**
   * 设置加载状态
   */
  function setLoading(loading: boolean): void {
    isLoading.value = loading;
  }

  /**
   * 设置分页信息
   */
  function setPagination(pag: Pagination): void {
    pagination.value = pag;
  }

  /**
   * 当前页面变化
   */
  function changePage(page: number): void {
    pagination.value.page = page;
  }

  /**
   * 设置当前故事
   */
  function setCurrentStory(story: Story | null): void {
    currentStory.value = story;
  }

  return {
    // 状态
    myStories,
    isLoading,
    pagination,
    currentStory,
    // 计算属性
    hasStories,
    currentPageStories,
    // 方法
    setMyStories,
    addStory,
    updateStory,
    removeStory,
    setLoading,
    setPagination,
    changePage,
    setCurrentStory
  };
});