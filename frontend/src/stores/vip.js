import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { vipApi } from '../api/vip';
import { useUserStore } from './user';

export const useVipStore = defineStore('vip', () => {
  // --- State ---
  const isVip = ref(false);
  const expiresAt = ref(null);
  const loading = ref(false);
  const orders = ref([]);
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Polish (擦亮) state
  const polishCount = ref({ used: 0, total: 3 }); // VIP每月3次
  const polishedStories = ref(new Map()); // storyId -> { polishedAt, expiresAt }

  // Visual customization state (persisted to localStorage)
  const savedCommentBg = ref(loadFromStorage('vip_comment_bg', null));
  const savedProfileBg = ref(loadFromStorage('vip_profile_bg', null));
  const savedEmotionStyles = ref(loadFromStorage('vip_emotion_styles', []));

  // --- Computed ---
  const isVipActive = computed(() => {
    if (!isVip.value) return false;
    if (!expiresAt.value) return false;
    return new Date(expiresAt.value) > new Date();
  });

  const remainingDays = computed(() => {
    if (!expiresAt.value) return 0;
    const diff = new Date(expiresAt.value) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  const polishRemaining = computed(() => {
    return Math.max(0, polishCount.value.total - polishCount.value.used);
  });

  // --- Actions ---
  async function fetchStatus() {
    loading.value = true;
    try {
      const res = await vipApi.getStatus();
      const data = res.data || res;
      isVip.value = data.isVip || false;
      expiresAt.value = data.expiresAt || null;

      // Sync to user store
      const userStore = useUserStore();
      if (userStore.user) {
        userStore.updateUser({ vip: data.isVip ? 1 : 0 });
      }
    } catch (err) {
      console.error('[VipStore] fetchStatus failed:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchHistory(params = {}) {
    try {
      const res = await vipApi.getHistory(params);
      const data = res.data || res;
      orders.value = data.orders || [];
      pagination.value = data.pagination || pagination.value;
    } catch (err) {
      console.error('[VipStore] fetchHistory failed:', err);
    }
  }

  /**
   * 使用激活码激活VIP
   * @param {string} code - 激活码
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async function activateByCode(code) {
    loading.value = true;
    try {
      const res = await vipApi.activateByCode(code);
      // 激活成功后刷新状态
      await fetchStatus();
      return { success: true, message: res.message || 'VIP激活成功' };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '激活失败，请稍后重试';
      return { success: false, message: msg };
    } finally {
      loading.value = false;
    }
  }

  // Polish (擦亮) logic
  function canPolish(storyId) {
    if (!isVipActive.value) return false;
    if (polishRemaining.value <= 0) return false;
    const info = polishedStories.value.get(storyId);
    if (info && new Date(info.expiresAt) > new Date()) return false; // already polished and active
    return true;
  }

  function polishStory(storyId) {
    if (!canPolish(storyId)) return false;
    polishCount.value.used++;
    const now = new Date();
    const exp = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
    polishedStories.value.set(storyId, {
      polishedAt: now.toISOString(),
      expiresAt: exp.toISOString(),
    });
    return true;
  }

  function isStoryPolished(storyId) {
    const info = polishedStories.value.get(storyId);
    if (!info) return false;
    return new Date(info.expiresAt) > new Date();
  }

  function getPolishExpiresAt(storyId) {
    const info = polishedStories.value.get(storyId);
    return info?.expiresAt || null;
  }

  // Visual customization
  function setCommentBg(bg) {
    savedCommentBg.value = bg;
    saveToStorage('vip_comment_bg', bg);
  }

  function setProfileBg(bg) {
    savedProfileBg.value = bg;
    saveToStorage('vip_profile_bg', bg);
  }

  function setEmotionStyles(styles) {
    savedEmotionStyles.value = styles;
    saveToStorage('vip_emotion_styles', styles);
  }

  function resetCustomization() {
    savedCommentBg.value = null;
    savedProfileBg.value = null;
    savedEmotionStyles.value = [];
    localStorage.removeItem('vip_comment_bg');
    localStorage.removeItem('vip_profile_bg');
    localStorage.removeItem('vip_emotion_styles');
  }

  return {
    // State
    isVip,
    expiresAt,
    loading,
    orders,
    pagination,
    polishCount,
    polishedStories,
    savedCommentBg,
    savedProfileBg,
    savedEmotionStyles,
    // Computed
    isVipActive,
    remainingDays,
    polishRemaining,
    // Actions
    fetchStatus,
    fetchHistory,
    activateByCode,
    canPolish,
    polishStory,
    isStoryPolished,
    getPolishExpiresAt,
    setCommentBg,
    setProfileBg,
    setEmotionStyles,
    resetCustomization,
  };
});

// --- Helpers ---
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
