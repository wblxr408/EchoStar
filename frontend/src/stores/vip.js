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

  const polishCount = ref({ used: 0, total: 3 });
  const polishedStories = ref(new Map());

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

  const polishRemaining = computed(() => Math.max(0, polishCount.value.total - polishCount.value.used));

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
      return { success: true, message: res.message || 'VIP激活成功' };
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '激活失败，请稍后重试';
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
      return { success: true, reward: data.reward || 0, message: res.message || '签到成功' };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err?.message || '签到失败' };
    }
  }

  async function rechargeCoins(packageKey) {
    try {
      const res = await vipApi.rechargeCoins(packageKey);
      await fetchEconomy();
      return { success: true, message: res.message || '充值成功' };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err?.message || '充值失败' };
    }
  }

  async function purchaseItem(itemKey) {
    try {
      const res = await vipApi.purchaseItem(itemKey);
      await fetchEconomy();
      return { success: true, message: res.message || '购买成功', data: res.data || res };
    } catch (err) {
      return { success: false, message: err?.response?.data?.message || err?.message || '购买失败' };
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

  function canPolish(storyId) {
    if (!isVipActive.value) return false;
    if (polishRemaining.value <= 0) return false;
    const info = polishedStories.value.get(storyId);
    if (info && new Date(info.expiresAt) > new Date()) return false;
    return true;
  }

  function polishStory(storyId) {
    if (!canPolish(storyId)) return false;
    polishCount.value.used++;
    const now = new Date();
    const exp = new Date(now.getTime() + 24 * 60 * 60 * 1000);
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
    return polishedStories.value.get(storyId)?.expiresAt || null;
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
    polishRemaining,
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
