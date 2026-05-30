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
          <button class="coin-center__close" type="button" @click="handleClose">
            <span class="close-icon">×</span>
            <span class="close-text">关闭</span>
          </button>

          <div class="coin-center__scroll">
            <div class="coin-center__header">
              <span class="coin-center__header-icon">🪙</span>
              <h2 class="coin-center__title">情绪币中心</h2>
            </div>

            <div class="coin-wallet-card" :class="{ dark: isDark }">
              <div class="coin-wallet-card__bg"></div>
              <div class="coin-wallet-card__content">
                <div class="coin-wallet-card__left">
                  <div class="coin-wallet-card__icon">💰</div>
                  <div class="coin-wallet-card__info">
                    <p class="coin-wallet-card__label">当前账户余额</p>
                    <p class="coin-wallet-card__amount">{{ vipStore.emotionCoins }} <small>币</small></p>
                  </div>
                </div>
                <div class="coin-wallet-card__right">
                  <div class="coin-wallet-card__stat">
                    <span class="coin-wallet-card__stat-label">连续签到</span>
                    <strong>{{ vipStore.checkInStreak }} 天</strong>
                  </div>
                </div>
              </div>
            </div>

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
              <p class="coin-checkin-hint">每日签到概率获得30-10000币，快来试试吧。</p>
            </div>

            <div class="coin-section">
              <div class="coin-section__title-row">
                <h3 class="coin-section__title">用途说明</h3>
                <span class="coin-section__hint">情绪币可直接用于站内核心权益</span>
              </div>
              <div class="coin-usage-list">
                <div class="coin-usage-card" :class="{ dark: isDark }">
                  <span class="coin-usage-card__icon">👑</span>
                  <div>
                    <strong>购买 VIP 时长</strong>
                    <p>可用于开通或续费周卡、月卡、季卡、年卡等会员时长。</p>
                  </div>
                </div>
                <div class="coin-usage-card" :class="{ dark: isDark }">
                  <span class="coin-usage-card__icon">✨</span>
                  <div>
                    <strong>购买高级功能</strong>
                    <p>可购买足迹、擦亮等高级功能，快速解锁更多互动体验。</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="coin-section">
              <h3 class="coin-section__title">获取方式</h3>
              <div class="coin-rule-grid">
                <div class="coin-rule-card" :class="{ dark: isDark }">
                  <span class="coin-rule-card__icon">📅</span>
                  <strong>每日签到</strong>
                  <span>概率获得 30-10000 币</span>
                </div>
                <div class="coin-rule-card" :class="{ dark: isDark }">
                  <span class="coin-rule-card__icon">💳</span>
                  <strong>RMB 充值</strong>
                  <span>6 / 30 / 98 元档位可选</span>
                </div>
              </div>
            </div>

            <div class="coin-section">
              <h3 class="coin-section__title">充值套餐</h3>
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
                  <span class="coin-package-card__hint">
                    {{ rechargingPackage === pkg.key ? '处理中...' : '立即充值' }}
                  </span>
                </button>
              </div>
            </div>

            <div class="coin-section">
              <h3 class="coin-section__title">情绪币流水</h3>
              <div v-if="historyLoading" class="coin-empty" :class="{ dark: isDark }">加载中...</div>
              <div v-else-if="vipStore.ledger.length === 0" class="coin-empty" :class="{ dark: isDark }">暂无流水记录</div>
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
import { computed, ref, watch } from 'vue'
import { showToast } from '../composables/useToast'
import { useVipStore } from '../stores/vip'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'request-vip'])

const vipStore = useVipStore()
const historyLoading = ref(false)
const checkingIn = ref(false)
const rechargingPackage = ref('')

const rechargePackages = computed(() => vipStore.economy?.rechargePackages || [])

watch(() => props.visible, async (visible) => {
  if (!visible) return

  historyLoading.value = true
  try {
    // ✅ fetchEconomy 已包含所有数据（VIP状态、情绪币、签到信息等）
    // 🔧 移除重复调用，只调用一次 fetchEconomy
    await vipStore.fetchEconomy()
  } finally {
    historyLoading.value = false
  }
})

function handleClose() {
  emit('close')
}

async function handleCheckIn() {
  if (vipStore.checkedInToday || checkingIn.value) return

  checkingIn.value = true
  try {
    const result = await vipStore.claimDailyCheckIn()
    showToast(result.message, result.success ? 'success' : 'error')
  } finally {
    checkingIn.value = false
  }
}

async function handleRecharge(packageKey) {
  if (!packageKey) return

  rechargingPackage.value = packageKey
  try {
    const result = await vipStore.rechargeCoins(packageKey)
    showToast(result.message, result.success ? 'success' : 'error')
  } finally {
    rechargingPackage.value = ''
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
  font-size: 22px;
}

.close-text {
  font-size: 13px;
  letter-spacing: 0.08em;
}

.coin-center__scroll {
  position: relative;
  z-index: 1;
  max-height: min(90vh, 860px);
  overflow-y: auto;
  padding: 36px 40px 32px;
}

.coin-center__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.coin-center__header-icon {
  font-size: 28px;
}

.coin-center__title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

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
    linear-gradient(
      135deg,
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

.coin-wallet-card__icon {
  font-size: 42px;
}

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
  margin-left: 4px;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.5;
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
  margin-bottom: 4px;
  font-size: 11px;
  opacity: 0.5;
}

.coin-wallet-card__stat strong {
  font-size: 16px;
}

.coin-section {
  margin-bottom: 24px;
}

.coin-section__title {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  opacity: 0.72;
}

.coin-section__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.coin-section__title-row .coin-section__title {
  margin-bottom: 0;
}

.coin-section__hint {
  font-size: 11px;
  opacity: 0.5;
  white-space: nowrap;
}

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
  opacity: 0.5;
  text-align: center;
}

.coin-usage-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.coin-usage-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(184, 135, 46, 0.1);
  background: rgba(255, 255, 255, 0.55);
}

.coin-usage-card.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.coin-usage-card__icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 215, 0, 0.1);
  font-size: 18px;
  flex-shrink: 0;
}

.coin-usage-card p {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.62;
}

.coin-rule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.coin-rule-card__icon {
  font-size: 22px;
}

.coin-package-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.coin-package-card {
  padding: 18px 16px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  color: #3d2e0a;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px -6px rgba(255, 215, 0, 0.45);
}

.coin-package-card:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -8px rgba(255, 215, 0, 0.55);
}

.coin-package-card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.coin-package-card.dark {
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
}

.coin-package-card__price {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  opacity: 0.7;
}

.coin-package-card__hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #6b4a0a;
}

.coin-center.dark .coin-package-card__hint {
  color: #6b4a0a;
}

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

.coin-ledger {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

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

.coin-ledger__item.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.coin-ledger__item p {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.58;
}

.coin-ledger__amount {
  font-weight: 800;
}

.coin-ledger__amount.plus {
  color: #2d7a2d;
}

.coin-ledger__amount.minus {
  color: #c44;
}

.coin-center.dark .coin-ledger__amount.plus {
  color: #4ade80;
}

.coin-center.dark .coin-ledger__amount.minus {
  color: #f87171;
}

@media (max-width: 900px) {
  .coin-usage-list,
  .coin-rule-grid,
  .coin-package-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .coin-center__scroll {
    padding: 32px 20px 24px;
  }

  .coin-wallet-card__content,
  .coin-section__title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .coin-usage-list,
  .coin-rule-grid,
  .coin-package-grid {
    grid-template-columns: 1fr;
  }
}

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
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}
</style>
