import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { vipApi } from '../api/vip';
import { useUserStore } from './user';

export const useVipStore = defineStore('vip', () => {
  const isVip = ref(false);
  const expiresAt = ref(null);
  const loading = ref(false);
  const orders = ref([]);
  const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const emotionCoins = ref(0);
  const lastCheckInAt = ref(null);
  const checkInStreak = ref(0);
  const economy = ref({ earnRules: {}, rechargePackages: [], storeItems: [], vipBenefits: [], vipPackages: [] });
  const ledger = ref([]);
  const inventory = ref([]);

  const polishCount = ref({ used: 0 });
  const polishedStories = ref(new Map());
  const STORY_POLISH_COST = 30;
  const FOOTPRINT_COST = 20;
  const VIP_COST = 300;
  const VIP_PLANS = [
    { key: 'vip_weekly', name: '周卡', cost: 150, days: 7 },
    { key: 'vip_monthly', name: '月卡', cost: 400, days: 30 },
    { key: 'vip_quarterly', name: '季卡', cost: 900, days: 90 },
    { key: 'vip_yearly', name: '年卡', cost: 2000, days: 365 }
  ];

  const savedCommentBg = ref(loadFromStorage('vip_comment_bg', null));
  const savedProfileBg = ref(loadFromStorage('vip_profile_bg', null));
  const savedEmotionStyles = ref(loadFromStorage('vip_emotion_styles', []));

  const isVipActive = computed(() => {
    if (!isVip.value || !expiresAt.value) return false;
    return new Date(expiresAt.value) > new Date();
  });

  const remainingDays = computed(() => {
    if (!expiresAt.value) return 0;
    const diff = new Date(expiresAt.value) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  const checkedInToday = computed(() => {
    if (!lastCheckInAt.value) return false;
    const now = new Date();
    const last = new Date(lastCheckInAt.value);
    return now.getFullYear() === last.getFullYear()
      && now.getMonth() === last.getMonth()
      && now.getDate() === last.getDate();
  });

  const activeInventory = computed(() => inventory.value.filter(item => item.isActive !== false));

  function getInventoryItem(itemKey) {
    return activeInventory.value.find(item => item.itemKey === itemKey) || null;
  }

  function getInventoryQuantity(itemKey) {
    return Number(getInventoryItem(itemKey)?.quantity || 0);
  }

  function hasActiveItem(itemKey) {
    return getInventoryQuantity(itemKey) > 0;
  }

  function syncUserCoins(patch = {}) {
    const userStore = useUserStore();
    if (userStore.user) {
      userStore.updateUser({
        vip: isVip.value ? 1 : 0,
        emotionCoins: emotionCoins.value,
        ...patch
      });
    }
  }

  async function fetchStatus() {
    loading.value = true;
    try {
      const res = await vipApi.getStatus();
      const data = res.data || res;
      isVip.value = data.isVip || false;
      expiresAt.value = data.expiresAt || null;
      emotionCoins.value = data.emotionCoins || 0;
      lastCheckInAt.value = data.lastCheckInAt || null;
      checkInStreak.value = data.checkInStreak || 0;
      if (data.commentBg) {
        savedCommentBg.value = data.commentBg;
        saveToStorage('vip_comment_bg', data.commentBg);
      }
      syncUserCoins();
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

  async function fetchEconomy() {
    loading.value = true;
    try {
      const res = await vipApi.getEconomy();
      const data = res.data || res;
      isVip.value = data.isVip || false;
      expiresAt.value = data.expiresAt || null;
      emotionCoins.value = data.emotionCoins || 0;
      lastCheckInAt.value = data.lastCheckInAt || null;
      checkInStreak.value = data.checkInStreak || 0;
      economy.value = data.economy || economy.value;
      ledger.value = data.ledger || [];
      inventory.value = data.inventory || [];
      if (data.commentBg) {
        savedCommentBg.value = data.commentBg;
        saveToStorage('vip_comment_bg', data.commentBg);
      }
      syncUserCoins();
      return data;
    } catch (err) {
      console.error('[VipStore] fetchEconomy failed:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function activateByCode(code) {
    loading.value = true;
    try {
      const res = await vipApi.activateByCode(code);
      await fetchStatus();
      return { success: true, message: res.message || 'VIP activated successfully.' };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Activation failed. Please try again later.';
      return { success: false, message: msg };
    } finally {
      loading.value = false;
    }
  }

  async function claimDailyCheckIn() {
    try {
      const res = await vipApi.claimDailyCheckIn();
      const data = res.data || res;
      emotionCoins.value = data.balanceAfter ?? emotionCoins.value;
      lastCheckInAt.value = new Date().toISOString();
      checkInStreak.value = data.streak ?? checkInStreak.value;
      await fetchEconomy();
      return { success: true, reward: data.reward || 0, message: res.message || '绛惧埌鎴愬姛' };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err?.message || '绛惧埌澶辫触' };
    }
  }

  async function rechargeCoins(packageKey) {
    try {
      const res = await vipApi.rechargeCoins(packageKey);
      await fetchEconomy();
      return { success: true, message: res.message || 'Recharge successful.' };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err?.message || 'Recharge failed.' };
    }
  }

  async function purchaseItem(itemKey) {
    try {
      const res = await vipApi.purchaseItem(itemKey);
      await fetchEconomy();
      return { success: true, message: res.message || '璐拱鎴愬姛', data: res.data || res };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err?.message || '璐拱澶辫触' };
    }
  }

  async function consumeItem(itemKey) {
    try {
      const res = await vipApi.consumeItem(itemKey);
      await fetchEconomy();
      return { success: true, message: res.message || '使用成功', data: res.data || res };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err?.message || '使用失败' };
    }
  }

  async function purchaseVip(packageKey) {
    try {
      if (!packageKey) {
        return { success: false, message: '请选择要购买的 VIP 套餐' };
      }
      const res = await vipApi.purchaseVip(packageKey);
      await fetchEconomy();
      await fetchStatus();
      return { success: true, message: res.message || 'VIP购买成功', data: res.data || res };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err?.message || '购买VIP失败' };
    }
  }

  async function useFootprint() {
    if (isVipActive.value) {
      return { success: true, isVip: true, cost: 0 };
    }

    if (emotionCoins.value < FOOTPRINT_COST) {
      return {
        success: false,
        type: 'insufficient_coins',
        message: `情绪币不足，使用足迹功能需要 ${FOOTPRINT_COST} 币`
      };
    }

    const purchaseResult = await purchaseItem('footprint_animation');
    if (!purchaseResult.success) {
      return { success: false, type: 'purchase_failed', message: purchaseResult.message };
    }

    const consumeResult = await consumeItem('footprint_animation');
    if (!consumeResult.success) {
      return { success: false, type: 'consume_failed', message: consumeResult.message };
    }

    return { success: true, isVip: false, cost: FOOTPRINT_COST };
  }

  const BUBBLE_DECOR_COST = 100;
  const THEME_SKIN_COST = 500;

  async function useBubbleDecor() {
    if (isVipActive.value) {
      return { success: true, isVip: true, cost: 0 };
    }

    if (hasActiveItem('bubble_decor_7d')) {
      return { success: true, isVip: false, cost: 0 };
    }

    if (emotionCoins.value < BUBBLE_DECOR_COST) {
      return {
        success: false,
        type: 'insufficient_coins',
        message: `情绪币不足，解锁装扮功能需要 ${BUBBLE_DECOR_COST} 币`
      };
    }

    const purchaseResult = await purchaseItem('bubble_decor_7d');
    if (!purchaseResult.success) {
      return { success: false, type: 'purchase_failed', message: purchaseResult.message };
    }

    return { success: true, isVip: false, cost: BUBBLE_DECOR_COST };
  }

  async function useThemeSkin() {
    if (isVipActive.value) {
      return { success: true, isVip: true, cost: 0 };
    }

    if (hasActiveItem('theme_skin')) {
      return { success: true, isVip: false, cost: 0 };
    }

    if (emotionCoins.value < THEME_SKIN_COST) {
      return {
        success: false,
        type: 'insufficient_coins',
        message: `情绪币不足，解锁主题皮肤需要 ${THEME_SKIN_COST} 币`
      };
    }

    const purchaseResult = await purchaseItem('theme_skin');
    if (!purchaseResult.success) {
      return { success: false, type: 'purchase_failed', message: purchaseResult.message };
    }

    return { success: true, isVip: false, cost: THEME_SKIN_COST };
  }

  function canPolish(storyId) {
    const info = polishedStories.value.get(storyId);
    if (info && new Date(info.expiresAt) > new Date()) return false;
    return isVipActive.value || emotionCoins.value >= STORY_POLISH_COST;
  }

  function markStoryPolished(storyId, polishedAt, polishExpiresAt) {
    polishCount.value.used++;
    polishedStories.value.set(String(storyId), {
      polishedAt,
      expiresAt: polishExpiresAt,
    });
  }

  /**
   * 从后端故事列表数据恢复擦亮状态
   * @param {Array} stories - 后端返回的故事列表，每项含 polishedAt
   */
  function restorePolishedStories(stories) {
    if (!stories || !Array.isArray(stories)) return;
    for (const story of stories) {
      if (story.polishedAt) {
        const polishedTime = new Date(story.polishedAt);
        const expiresAt = new Date(polishedTime.getTime() + 24 * 60 * 60 * 1000);
        if (expiresAt > new Date()) {
          polishedStories.value.set(String(story.id), {
            polishedAt: story.polishedAt,
            expiresAt: expiresAt.toISOString(),
          });
        }
      }
    }
  }

  async function polishStory(storyId) {
    if (isStoryPolished(storyId)) {
      return { success: false, type: 'already_polished', message: '故事正在推荐回流中' };
    }

    // 非VIP用户先扣费
    if (!isVipActive.value) {
      if (emotionCoins.value < STORY_POLISH_COST) {
        return {
          success: false,
          type: 'insufficient_coins',
          message: `情绪币不足，擦亮一次需要 ${STORY_POLISH_COST} 币`
        };
      }

      const purchaseResult = await purchaseItem('message_polish');
      if (!purchaseResult.success) {
        return {
          success: false,
          type: 'purchase_failed',
          message: purchaseResult.message || '购买擦亮权益失败，请稍后重试'
        };
      }

      const consumeResult = await consumeItem('message_polish');
      if (!consumeResult.success) {
        return {
          success: false,
          type: 'consume_failed',
          message: consumeResult.message || '擦亮权益已购入，但暂未使用成功，请稍后重试'
        };
      }
    }

    // 调用后端擦亮API
    try {
      const res = await vipApi.polishStory(storyId);
      const { polishedAt, polishExpiresAt } = res.data || {};
      if (polishedAt && polishExpiresAt) {
        markStoryPolished(storyId, polishedAt, polishExpiresAt);
      }
    } catch (err) {
      return {
        success: false,
        type: 'polish_failed',
        message: err.response?.data?.message || '擦亮失败，请稍后重试'
      };
    }

    return { success: true, isVip: isVipActive.value, cost: isVipActive.value ? 0 : STORY_POLISH_COST };
  }

  function isStoryPolished(storyId) {
    const info = polishedStories.value.get(storyId);
    if (!info) return false;
    return new Date(info.expiresAt) > new Date();
  }

  function getPolishExpiresAt(storyId) {
    return polishedStories.value.get(storyId)?.expiresAt || null;
  }

  function getStoryPolishCost() {
    return STORY_POLISH_COST;
  }

  function setCommentBg(bg) {
    savedCommentBg.value = bg;
    saveToStorage('vip_comment_bg', bg);
  }

  async function syncCommentBg(bgConfig) {
    try {
      await vipApi.saveCommentBg(bgConfig);
      return { success: true };
    } catch (err) {
      console.error('[VipStore] syncCommentBg failed:', err);
      return { success: false, message: '同步到服务器失败' };
    }
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
    isVip,
    expiresAt,
    loading,
    orders,
    pagination,
    emotionCoins,
    lastCheckInAt,
    checkInStreak,
    economy,
    ledger,
    inventory,
    polishCount,
    polishedStories,
    savedCommentBg,
    savedProfileBg,
    savedEmotionStyles,
    isVipActive,
    remainingDays,
    checkedInToday,
    activeInventory,
    getInventoryItem,
    getInventoryQuantity,
    hasActiveItem,
    fetchStatus,
    fetchHistory,
    fetchEconomy,
    activateByCode,
    claimDailyCheckIn,
    rechargeCoins,
    purchaseItem,
    consumeItem,
    purchaseVip,
    useFootprint,
    useBubbleDecor,
    useThemeSkin,
    canPolish,
    restorePolishedStories,
    polishStory,
    isStoryPolished,
    getPolishExpiresAt,
    getStoryPolishCost,
    STORY_POLISH_COST,
    FOOTPRINT_COST,
    BUBBLE_DECOR_COST,
    THEME_SKIN_COST,
    VIP_COST,
    VIP_PLANS,
    setCommentBg,
    syncCommentBg,
    setProfileBg,
    setEmotionStyles,
    resetCustomization,
  };
});

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
