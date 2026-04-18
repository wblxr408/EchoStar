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
  const economy = ref({ earnRules: {}, rechargePackages: [], storeItems: [], vipBenefits: [] });
  const ledger = ref([]);
  const inventory = ref([]);

  const polishCount = ref({ used: 0 });
  const polishedStories = ref(new Map());
  const STORY_POLISH_COST = 30;
  const FOOTPRINT_COST = 20;
  const VIP_COST = 300;

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

  async function purchaseVip() {
    try {
      const res = await vipApi.purchaseVip();
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

  function canPolish(storyId) {
    const info = polishedStories.value.get(storyId);
    if (info && new Date(info.expiresAt) > new Date()) return false;
    return isVipActive.value || emotionCoins.value >= STORY_POLISH_COST;
  }

  function markStoryPolished(storyId) {
    polishCount.value.used++;
    const now = new Date();
    const exp = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    polishedStories.value.set(storyId, {
      polishedAt: now.toISOString(),
      expiresAt: exp.toISOString(),
    });
  }

  async function polishStory(storyId) {
    if (isStoryPolished(storyId)) {
      return { success: false, type: 'already_polished', message: '\u6545\u4e8b\u6b63\u5728\u63a8\u8350\u56de\u6d41\u4e2d' };
    }

    if (isVipActive.value) {
      markStoryPolished(storyId);
      return { success: true, isVip: true, cost: 0 };
    }

    if (emotionCoins.value < STORY_POLISH_COST) {
      return {
        success: false,
        type: 'insufficient_coins',
        message: `\u60c5\u7eea\u5e01\u4e0d\u8db3\uff0c\u64e6\u4eae\u4e00\u6b21\u9700\u8981 ${STORY_POLISH_COST} \u5e01`
      };
    }

    const purchaseResult = await purchaseItem('message_polish');
    if (!purchaseResult.success) {
      return {
        success: false,
        type: 'purchase_failed',
        message: purchaseResult.message || '\u8d2d\u4e70\u64e6\u4eae\u6743\u76ca\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5'
      };
    }

    const consumeResult = await consumeItem('message_polish');
    if (!consumeResult.success) {
      return {
        success: false,
        type: 'consume_failed',
        message: consumeResult.message || '\u64e6\u4eae\u6743\u76ca\u5df2\u8d2d\u5165\uff0c\u4f46\u6682\u672a\u4f7f\u7528\u6210\u529f\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5'
      };
    }

    markStoryPolished(storyId);
    return { success: true, isVip: false, cost: STORY_POLISH_COST };
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
    canPolish,
    polishStory,
    isStoryPolished,
    getPolishExpiresAt,
    getStoryPolishCost,
    STORY_POLISH_COST,
    FOOTPRINT_COST,
    VIP_COST,
    setCommentBg,
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
