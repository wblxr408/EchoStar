import { defineStore } from "pinia";
import { ref } from "vue";
import { storyApi } from "../api/story";

export const useStoryStore = defineStore("story", () => {
  const myStories = ref([]);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loading = ref(false);

  async function fetchMyStories(page = 1) {
    loading.value = true;

    try {
      const data = await storyApi.getMyStories({
        page,
        limit: pagination.value.limit,
      });
      myStories.value = data.stories;
      pagination.value = data.pagination;
    } finally {
      loading.value = false;
    }
  }

  async function createStory(storyData) {
    const data = await storyApi.createStory(storyData);
    myStories.value.unshift(data);
    return data;
  }

  async function deleteStory(id) {
    await storyApi.deleteStory(id);
    myStories.value = myStories.value.filter((story) => story.id !== id);
  }

  function clear() {
    myStories.value = [];
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    };
  }

  return {
    myStories,
    pagination,
    loading,
    fetchMyStories,
    createStory,
    deleteStory,
    clear,
  };
});
