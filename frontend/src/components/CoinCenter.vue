<template>
  <Teleport to="body">
    <transition name="publish-modal">
      <div
        v-if="visible"
        class="coin-center-shell"
        @click.self="handleClose"
      >
        <div
          class="coin-center"
          :class="{ dark: isDark }"
          @click.stop
        >
          <!-- Close Button -->
          <button class="coin-center__close" type="button" @click="handleClose">
            <span class="close-icon">×</span>
            <span class="close-text">关闭</span>
          </button>

          <!-- Scroll Content -->
          <div class="coin-center__scroll">
            <!-- Header -->
            <div class="coin-center__header">
              <span class="coin-center__header-icon">🪙</span>
              <h2 class="coin-center__title">情绪币中心</h2>
              <div class="coin-center__balance-pill">
                <span class="coin-center__balance-icon">🪙</span>
                <span class="coin-center__balance-value">{{ vipStore.emotionCoins }}</span>
              </div>
            </div>

            <!-- Wallet Card -->
            <div class="coin-wallet-card" :class="{ dark: isDark }">
              <div class="coin-wallet-card__bg"></div>
              <div class="coin-wallet-card__content">
                <div class="coin-wallet-card__left">
                  <div class="coin-wallet-card__icon">💰</div>
                  <div class="coin-wallet-card__info">
                    <p class="coin-wallet-card__label">当前余额</p>
                    <p class="coin-wallet-card__amount">{{ vipStore.emotionCoins }} <small>币</small></p>
                  </div>
                </div>
                <div class="coin-wallet-card__right">
                  <div class="coin-wallet-card__stat">
                    <span class="coin-wallet-card__stat-label">连续签到</span>
                    <strong>{{ vipStore.checkInStreak }} 天</strong>
                  </div>
                  <div class="coin-wallet-card__stat">
                    <span class="coin-wallet-card__stat-label">今日</span>
                    <strong>{{ vipStore.checkedInToday ? '✓' : '—' }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Daily Check-in -->
            <div class="coin-section">
              <h3 class="coin-section__title">每日签到</h3>
              <button
                class="coin-checkin-btn"
                :class="{ 'coin-checkin-btn--done': vipStore.checkedInToday, dark: isDark }"
                :disabled="vipStore.checkedInToday || checkingIn"
                @click="handleCheckIn"
              >
                <span v-if="vipStore.checkedInToday">✓ 今日已签到</span>
                <span v-else-if="checkingIn">签到中...</span>
                <span v-else>📅 立即签到</span>
              </button>
              <p class="coin-checkin-hint">连续签到奖励递增，每日可得 {{ vipStore.economy?.earnRules?.dailyLogin || '5-10' }} 币</p>
            </div>

            <!-- Earn Rules -->
            <div class="coin-section">
              <h3 class="coin-section__title">获取途径</h3>
              <div class="coin-rule-grid">
                <div class="coin-rule-card" :class="{ dark: isDark }">
                  <span class="coin-rule-card__icon">📅</span>
                  <strong>每日签到</strong>
                  <span>{{ vipStore.economy?.earnRules?.dailyLogin || '5-10币' }}</span>
                </div>
                <div class="coin-rule-card" :class="{ dark: isDark }">
                  <span class="coin-rule-card__icon">💰</span>
                  <strong>RMB充值</strong>
                  <span>6/30/98元三档可选</span>
                </div>
              </div>
            </div>

            <!-- Recharge Packages -->
            <div class="coin-section">
              <h3 class="coin-section__title">自愿充值</h3>
              <div class="coin-package-grid">
                <button
                  v-for="pkg in rechargePackages"
                  :key="pkg.key"
                  class="coin-package-card"
                  :class="{ dark: isDark }"
                  type="button"
                  :disabled="rechargingPackage === pkg.key"
                  @click="handleRecharge(pkg.key)"
                >
                  <span class="coin-package-card__price">{{ pkg.label }}</span>
                  <strong>{{ pkg.coins }} 币</strong>
                  <span class="coin-package-card__hint">{{ rechargingPackage === pkg.key ? '处理中...' : '立即充值' }}</span>
                </button>
              </div>
            </div>

            <!-- Store Items (Spend) -->
            <div class="coin-section">
              <h3 class="coin-section__title">消耗场景</h3>
              <div class="coin-shop-grid">
                <div
                  v-for="item in storeItems"
                  :key="item.key"
                  class="coin-shop-card"
                  :class="{ dark: isDark }"
                >
                  <div class="coin-shop-card__top">
                    <div>
                      <strong>{{ item.name }}</strong>
                      <p>{{ item.description }}</p>
                    </div>
                    <span class="coin-shop-card__cost">
                      {{ isVipFreeItem(item) ? 'VIP免费' : `${item.cost}币` }}
                    </span>
                  </div>
                  <button
                    class="coin-shop-card__btn"
                    type="button"
                    :disabled="purchasingItem === item.key || isPermanentOwned(item)"
                    @click="handlePurchase(item.key)"
                  >
                    {{ purchaseButtonLabel(item) }}
                  </button>
                  <p v-if="itemInventoryHint(item)" class="coin-shop-card__meta">{{ itemInventoryHint(item) }}</p>
                </div>
              </div>
            </div>

            <!-- Inventory -->
            <div class="coin-section">
              <h3 class="coin-section__title">已拥有权益</h3>
              <div v-if="inventoryPreview.length === 0" class="coin-empty" :class="{ dark: isDark }">暂无已领取或已购买权益</div>
              <div v-else class="coin-inventory-list">
                <div v-for="item in inventoryPreview" :key="item.itemKey" class="coin-inventory-item" :class="{ dark: isDark }">
                  <div>
                    <strong>{{ inventoryName(item.itemKey) }}</strong>
                    <p>
                      {{ item.expiresAt ? `有效至 ${formatDate(item.expiresAt)}` : '永久权益 / 可重复消耗道具' }}
                    </p>
                  </div>
                  <span class="coin-inventory-item__qty">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>

            <!-- Coin Ledger -->
            <div class="coin-section">
              <h3 class="coin-section__title">情绪币流水</h3>
              <div v-if="historyLoading" class="coin-empty" :class="{ dark: isDark }">加载中...</div>
              <div v-else-if="vipStore.ledger.length === 0" class="coin-empty" :class="{ dark: isDark }">暂无记录</div>
              <div v-else class="coin-ledger">
                <div v-for="entry in vipStore.ledger.slice(0, 8)" :key="entry.id" class="coin-ledger__item" :class="{ dark: isDark }">
                  <div>
                    <strong>{{ entry.title }}</strong>
                    <p>{{ formatDateTime(entry.createdAt) }}</p>
                  </div>
                  <span :class="['coin-ledger__amount', entry.amount >= 0 ? 'plus' : 'minus']">
                    {{ entry.amount >= 0 ? '+' : '' }}{{ entry.amount }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useVipStore } from '../stores/vip'
import { showToast } from '../composables/useToast'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'request-vip'])

const vipStore = useVipStore()
const historyLoading = ref(false)
const checkingIn = ref(false)
const rechargingPackage = ref('')
const purchasingItem = ref('')

const rechargePackages = computed(() => vipStore.economy?.rechargePackages || [])
const storeItems = computed(() => vipStore.economy?.storeItems || [])
const inventoryPreview = computed(() => vipStore.activeInventory || [])
const footprintTicketCount = computed(() => vipStore.getInventoryQuantity('footprint_animation'))

watch(() => props.visible, async (val) => {
  if (val) {
    await vipStore.fetchStatus()
    await vipStore.fetchEconomy()
    historyLoading.value = true
    await vipStore.fetchHistory({ page: 1, limit: 20 })
    historyLoading.value = false
  }
})

function handleClose() {
  emit('close')
}

async function handleCheckIn() {
  if (vipStore.checkedInToday || checkingIn.value) return
  checkingIn.value = true
  const result = await vipStore.claimDailyCheckIn()
  showToast(result.message, result.success ? 'success' : 'error')
  checkingIn.value = false
}

async function handleRecharge(packageKey) {
  if (!packageKey) return
  rechargingPackage.value = packageKey
  const result = await vipStore.rechargeCoins(packageKey)
  showToast(result.message, result.success ? 'success' : 'error')
  rechargingPackage.value = ''
}

async function handlePurchase(itemKey) {
  if (!itemKey) return
  purchasingItem.value = itemKey
  const result = await vipStore.purchaseItem(itemKey)
  showToast(result.message, result.success ? 'success' : 'error')
  purchasingItem.value = ''
}

function isVipFreeItem(item) {
  return !!(vipStore.isVipActive && item?.vipFree)
}

function isPermanentOwned(item) {
  return item?.type === 'permanent' && vipStore.hasActiveItem(item.key)
}

function purchaseButtonLabel(item) {
  if (purchasingItem.value === item.key) return '处理中...'
  if (item.key === 'theme_skin' && isPermanentOwned(item)) return '已拥有'
  if (item.key === 'footprint_animation') {
    return footprintTicketCount.value > 0
      ? `补充次数（现有 ${footprintTicketCount.value}）`
      : (isVipFreeItem(item) ? '免费领取' : '购买 1 次')
  }
  return isVipFreeItem(item) ? '立即领取' : '立即购买'
}

function itemInventoryHint(item) {
  const qty = vipStore.getInventoryQuantity(item.key)
  if (item.key === 'footprint_animation' && qty > 0) return `剩余足迹次数 x${qty}`
  if (item.key === 'theme_skin' && isPermanentOwned(item)) return '主题皮肤已解锁，可点亮专属图标'
  if (item.type === 'timed' && qty > 0) return `当前生效中 x${qty}`
  if (item.type === 'consumable' && qty > 0) return `背包库存 x${qty}`
  return ''
}

function inventoryName(itemKey) {
  const item = storeItems.value.find(entry => entry.key === itemKey)
  return item?.name || itemKey
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return '--'
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--'
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return '--'
  }
}
</script>

<style scoped>
/* ===== Shell ===== */
.coin-center-shell {
  position: fixed;
  inset: 0;
  z-index: 340;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 24px;
  background:
    radial-gradient(circle at top right, rgba(255, 200, 60, 0.1) 0%, transparent 35%),
    rgba(8, 11, 19, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* ===== Modal Container ===== */
.coin-center {
  position: relative;
  width: min(980px, calc(100vw - 48px));
  max-height: min(90vh, 860px);
  border-radius: 36px;
  overflow: hidden;
  border: 1px solid rgba(196, 142, 48, 0.38);
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.98) 0%,
    rgba(240, 223, 191, 0.98) 52%,
    rgba(229, 206, 166, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(7, 11, 22, 0.5),
    0 0 0 1px rgba(255, 248, 232, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
  color: #4d2f14;
}

.coin-center::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 28px;
  border: 1px solid rgba(199, 151, 60, 0.22);
  pointer-events: none;
}

.coin-center.dark {
  border-color: rgba(141, 176, 235, 0.24);
  background: linear-gradient(
    160deg,
    rgba(15, 22, 40, 0.98) 0%,
    rgba(22, 34, 58, 0.98) 52%,
    rgba(29, 46, 78, 0.98) 100%
  );
  box-shadow:
    0 40px 80px -32px rgba(3, 6, 15, 0.64),
    0 0 0 1px rgba(182, 208, 255, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  color: #edf3ff;
}

.coin-center.dark::before {
  border-color: rgba(141, 176, 235, 0.14);
}

/* ===== Close Button ===== */
.coin-center__close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  min-width: 88px;
  height: 46px;
  padding: 0 14px;
  border: 1px solid rgba(184, 135, 46, 0.35);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  color: #ffffff;
  background: rgba(43, 25, 3, 0.35);
}

.coin-center__close:hover {
  transform: translateY(-1px);
  background: rgba(107, 77, 45, 0.85);
  border-color: rgba(184, 135, 46, 0.5);
  color: #ffffff;
}

.coin-center.dark .coin-center__close {
  background: rgba(10, 17, 33, 0.82);
  border-color: rgba(198, 219, 255, 0.22);
  color: #eef4ff;
}

.coin-center.dark .coin-center__close:hover {
  background: rgba(18, 30, 58, 0.94);
  border-color: rgba(198, 219, 255, 0.42);
}

.close-icon {
  line-height: 1;
  transform: translateY(-1px);
  font-size: 22px;
}

.close-text {
  font-size: 13px;
  letter-spacing: 0.08em;
}

/* ===== Scroll Area ===== */
.coin-center__scroll {
  position: relative;
  z-index: 1;
  max-height: min(90vh, 860px);
  overflow-y: auto;
  padding: 36px 40px 32px;
}

/* ===== Header ===== */
.coin-center__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.coin-center__header-icon { font-size: 28px; }

.coin-center__title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.02em;
  margin: 0;
}

.coin-center__balance-pill {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.22), rgba(245, 166, 35, 0.28));
  color: #7a5200;
  font-weight: 800;
}

.coin-center.dark .coin-center__balance-pill {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(245, 166, 35, 0.14));
  color: #ffd700;
}

.coin-center__balance-icon { font-size: 18px; }
.coin-center__balance-value { font-size: 20px; }

/* ===== Wallet Card ===== */
.coin-wallet-card {
  position: relative;
  padding: 28px;
  border-radius: 24px;
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid rgba(196, 142, 48, 0.38);
  box-shadow: 0 4px 20px -4px rgba(255, 200, 80, 0.3);
}

.coin-wallet-card__bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg,
      rgba(255, 248, 220, 1) 0%,
      rgba(255, 236, 170, 1) 25%,
      rgba(255, 225, 120, 1) 50%,
      rgba(255, 235, 155, 1) 75%,
      rgba(255, 245, 200, 1) 100%
    );
  background-size: 200% 200%;
  animation: coinBgFlow 6s ease-in-out infinite;
}

.coin-wallet-card.dark {
  border-color: rgba(141, 176, 235, 0.16);
  box-shadow: 0 4px 20px -4px rgba(141, 176, 235, 0.15);
}

.coin-wallet-card.dark .coin-wallet-card__bg {
  background: linear-gradient(135deg, rgba(20, 28, 52, 0.95), rgba(32, 44, 76, 0.95));
}

.coin-wallet-card__content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.coin-wallet-card__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.coin-wallet-card__icon { font-size: 42px; }

.coin-wallet-card__label {
  margin: 0 0 4px;
  font-size: 13px;
  opacity: 0.6;
}

.coin-wallet-card__amount {
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1;
}

.coin-wallet-card__amount small {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.5;
  margin-left: 4px;
}

.coin-wallet-card__right {
  display: flex;
  gap: 20px;
}

.coin-wallet-card__stat {
  text-align: center;
}

.coin-wallet-card__stat-label {
  display: block;
  font-size: 11px;
  opacity: 0.5;
  margin-bottom: 4px;
}

.coin-wallet-card__stat strong {
  font-size: 16px;
}

/* ===== Section ===== */
.coin-section {
  margin-bottom: 24px;
}

.coin-section__title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0 0 14px;
  opacity: 0.72;
}

/* ===== Check-in ===== */
.coin-checkin-btn {
  width: 100%;
  min-height: 52px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.22s ease;
  box-shadow: 0 8px 18px -10px rgba(255, 215, 0, 0.55);
}

.coin-checkin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px -10px rgba(255, 215, 0, 0.6);
}

.coin-checkin-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.coin-checkin-btn--done {
  background: linear-gradient(135deg, #b8860b, #8e6c1a);
  color: #fef3c7;
}

.coin-checkin-btn--done.dark {
  background: linear-gradient(135deg, rgba(30, 46, 78, 0.8), rgba(22, 34, 58, 0.8));
  border: 1px solid rgba(141, 176, 235, 0.2);
  color: #9fc0ff;
}

.coin-checkin-hint {
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.45;
  text-align: center;
}

/* ===== Rule Grid ===== */
.coin-rule-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.coin-rule-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(184, 135, 46, 0.1);
  background: rgba(255, 255, 255, 0.55);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.coin-rule-card.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.coin-rule-card__icon { font-size: 22px; }

/* ===== Package Grid ===== */
.coin-package-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.coin-package-card {
  padding: 18px 16px;
  border-radius: 16px;
  border: 1px solid rgba(184, 135, 46, 0.1);
  background: rgba(255, 255, 255, 0.55);
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}

.coin-package-card:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px -8px rgba(184, 135, 46, 0.15);
}

.coin-package-card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.coin-package-card.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.coin-package-card__price {
  display: block;
  font-size: 12px;
  opacity: 0.58;
  margin-bottom: 6px;
}

.coin-package-card__hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #8e6c1a;
}

.coin-center.dark .coin-package-card__hint {
  color: #9fc0ff;
}

/* ===== Shop Grid ===== */
.coin-shop-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.coin-shop-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(184, 135, 46, 0.1);
  background: rgba(255, 255, 255, 0.55);
}

.coin-shop-card.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.coin-shop-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.coin-shop-card__top p {
  margin: 6px 0 0;
  font-size: 12px;
  opacity: 0.6;
  line-height: 1.5;
}

.coin-shop-card__cost {
  white-space: nowrap;
  font-size: 12px;
  font-weight: 700;
  color: #8e6c1a;
}

.coin-center.dark .coin-shop-card__cost {
  color: #9fc0ff;
}

.coin-shop-card__btn {
  width: 100%;
  min-height: 40px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  font-weight: 700;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px -4px rgba(255, 215, 0, 0.3);
}

.coin-shop-card__btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.coin-shop-card__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.coin-shop-card__meta {
  margin: 10px 0 0;
  font-size: 11px;
  opacity: 0.58;
}

/* ===== Inventory ===== */
.coin-inventory-list,
.coin-ledger {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.coin-inventory-item,
.coin-ledger__item {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(184, 135, 46, 0.1);
  background: rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.coin-inventory-item.dark,
.coin-ledger__item.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.coin-inventory-item p,
.coin-ledger__item p {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.58;
}

.coin-inventory-item__qty,
.coin-ledger__amount {
  font-weight: 800;
}

.coin-ledger__amount.plus { color: #2d7a2d; }
.coin-ledger__amount.minus { color: #c44; }

.coin-center.dark .coin-ledger__amount.plus { color: #4ade80; }
.coin-center.dark .coin-ledger__amount.minus { color: #f87171; }

/* ===== Empty State ===== */
.coin-empty {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  opacity: 0.4;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.02);
}

.coin-empty.dark {
  background: rgba(255, 255, 255, 0.03);
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .coin-rule-grid,
  .coin-package-grid,
  .coin-shop-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .coin-center__scroll {
    padding: 32px 20px 24px;
  }

  .coin-wallet-card__content {
    flex-direction: column;
    align-items: flex-start;
  }

  .coin-rule-grid,
  .coin-package-grid,
  .coin-shop-grid {
    grid-template-columns: 1fr;
  }
}

/* ===== Transition ===== */
.publish-modal-enter-active {
  transition: opacity 0.18s ease;
}

.publish-modal-leave-active {
  transition: opacity 0.14s ease;
}

.publish-modal-enter-from,
.publish-modal-leave-to {
  opacity: 0;
}

@keyframes coinBgFlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
</style>
