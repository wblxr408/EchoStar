<template>
  <Teleport to="body">
    <transition name="publish-modal">
      <div
        v-if="visible"
        class="vip-center-shell"
        @click.self="handleClose"
      >
        <div
          class="vip-center"
          :class="{ dark: isDark }"
          @click.stop
        >
          <button class="vip-center__close" type="button" @click="handleClose">
            <span class="close-icon">×</span>
            <span class="close-text">关闭</span>
          </button>

          <div class="vip-center__scroll">
            <div class="vip-center__header">
              <span class="vip-center__header-icon">👑</span>
              <h2 class="vip-center__title">VIP 中心</h2>
              <span v-if="vipStore.isVipActive" class="vip-center__status-badge active">
                生效中 · 剩余 {{ vipStore.remainingDays }} 天
              </span>
              <span v-else class="vip-center__status-badge inactive">
                当前未开通
              </span>
            </div>

            <div class="vip-card" :class="{ 'vip-card--active': vipStore.isVipActive, dark: isDark }">
              <div class="vip-card__inner">
                <div class="vip-card__left">
                  <div class="vip-card__crown">{{ vipStore.isVipActive ? '✨' : '🔓' }}</div>
                  <div class="vip-card__info">
                    <p class="vip-card__name">
                      {{ vipStore.isVipActive ? 'VIP 会员已开通' : '开通 VIP，解锁全部高级功能' }}
                    </p>
                    <p class="vip-card__desc">
                      {{ vipStore.isVipActive ? '续费会在当前有效期基础上顺延，权益不会中断。' : '所有套餐均使用情绪币支付，可直接在下方选择档位开通。' }}
                    </p>
                  </div>
                </div>
                <div class="vip-card__right" v-if="vipStore.isVipActive">
                  <div class="vip-card__expiry-info">
                    到期时间 {{ formatDate(vipStore.expiresAt) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="vip-balance-strip" :class="{ dark: isDark }">
              <div>
                <p class="vip-balance-strip__label">剩余情绪币</p>
                <strong class="vip-balance-strip__value">{{ vipStore.emotionCoins || 0 }}</strong>
              </div>
              <p class="vip-balance-strip__hint">与“我的信息”页使用同一份账户余额</p>
            </div>

            <div class="vip-section">
              <div class="vip-section__title-row">
                <h3 class="vip-section__title">选择套餐</h3>
                <span class="vip-section__hint">续费后将自动顺延到当前会员到期时间之后。</span>
              </div>
              <div class="vip-package-grid">
                <div
                  v-for="pkg in vipPackages"
                  :key="pkg.key"
                  class="vip-package-card"
                  :class="{ dark: isDark }"
                >
                  <div class="vip-package-card__head">
                    <strong class="vip-package-card__name">{{ pkg.days }} 天（{{ pkg.name }}）</strong>
                    <span class="vip-package-card__price">{{ pkg.cost }} 币</span>
                  </div>
                  <p class="vip-package-card__meta">
                    开通后立即生效，按所选档位增加会员时长。
                  </p>
                  <button
                    class="vip-package-card__button"
                    :disabled="Boolean(purchasingVipKey)"
                    @click="handlePurchaseVip(pkg.key)"
                  >
                    {{ purchasingVipKey === pkg.key ? '处理中...' : (vipStore.isVipActive ? `续费 ${pkg.days} 天` : `开通 ${pkg.days} 天`) }}
                  </button>
                </div>
              </div>
            </div>

            <div class="vip-section">
              <div class="vip-section__title-row">
                <h3 class="vip-section__title">VIP 功能详细说明</h3>
                <span class="vip-section__hint">开通后即可使用或领取</span>
              </div>
              <div class="vip-perk-list">
                <div v-for="perk in privilegeDetails" :key="perk.key" class="vip-perk-card" :class="{ dark: isDark }">
                  <span class="vip-perk-card__icon">{{ perk.icon }}</span>
                  <div>
                    <strong>{{ perk.title }}</strong>
                    <p>{{ perk.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="vip-section">
              <h3 class="vip-section__title">功能入口</h3>
              <div class="vip-benefits-grid">
                <div
                  v-for="benefit in benefits"
                  :key="benefit.key"
                  class="vip-benefit"
                  :class="{ 'vip-benefit--locked': !vipStore.isVipActive, dark: isDark }"
                  @click="handleBenefitClick(benefit)"
                >
                  <div class="vip-benefit__icon-wrap">{{ benefit.icon }}</div>
                  <div class="vip-benefit__info">
                    <span class="vip-benefit__name">{{ benefit.name }}</span>
                    <span class="vip-benefit__desc">{{ benefit.desc }}</span>
                  </div>
                  <span v-if="!vipStore.isVipActive" class="vip-benefit__lock">未开通</span>
                </div>
              </div>
            </div>

            <div class="vip-section vip-activate" :class="{ dark: isDark }">
              <h3 class="vip-section__title">激活码兑换</h3>
              <div class="vip-activate__form">
                <input
                  v-model="activationCode"
                  type="text"
                  placeholder="输入激活码"
                  class="vip-activate__input"
                  :class="{ dark: isDark }"
                  :disabled="activating"
                  @keyup.enter="handleActivate"
                />
                <button
                  class="vip-activate__btn"
                  :class="{ 'vip-activate__btn--loading': activating }"
                  :disabled="activating || !activationCode.trim()"
                  @click="handleActivate"
                >
                  <span v-if="!activating">立即兑换</span>
                  <span v-else>兑换中...</span>
                </button>
              </div>
              <p v-if="activateMessage" class="vip-activate__msg" :class="{ 'vip-activate__msg--error': !activateSuccess }">
                {{ activateMessage }}
              </p>
            </div>

            <div class="vip-section">
              <h3 class="vip-section__title">VIP 订单记录</h3>
              <div v-if="historyLoading" class="vip-empty">加载中...</div>
              <div v-else-if="vipStore.orders.length === 0" class="vip-empty">暂无会员订单记录</div>
              <div v-else class="vip-history-list" :class="{ dark: isDark }">
                <div v-for="order in vipStore.orders" :key="order.id" class="vip-history-item">
                  <div class="vip-history-item__dot active"></div>
                  <div class="vip-history-item__content">
                    <span class="vip-history-item__title">VIP 开通</span>
                    <span class="vip-history-item__date">
                      {{ formatDate(order.createdAt) }} 至 {{ formatDate(order.expiresAt) }}
                    </span>
                  </div>
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

const emit = defineEmits(['close', 'open-polish', 'open-comment-settings', 'open-visual', 'open-footprints'])

const vipStore = useVipStore()
const historyLoading = ref(false)
const purchasingVipKey = ref('')

const activationCode = ref('')
const activating = ref(false)
const activateMessage = ref('')
const activateSuccess = ref(false)

const benefits = [
  { key: 'footprint', icon: '🗺️', name: '我的足迹', desc: 'VIP 免费不限次', action: 'open-footprints' },
  { key: 'polish', icon: '✨', name: '擦亮故事', desc: 'VIP 免费不限次', action: 'open-polish' },
  { key: 'comment', icon: '💬', name: '评论装扮', desc: '气泡装饰免费使用', action: 'open-comment-settings' },
]

const privilegeDetails = [
  {
    key: 'footprints',
    icon: '🗺️',
    title: '我的足迹特权',
    desc: '普通用户每次使用需要 20 币，VIP 可直接使用，不限次数。',
  },
  {
    key: 'polish',
    icon: '✨',
    title: '擦亮故事特权',
    desc: '普通用户每次使用需要 30 币，VIP 可免费擦亮故事并提升曝光。',
  },
  {
    key: 'comment',
    icon: '💬',
    title: '评论装扮特权',
    desc: 'VIP 可免费使用评论气泡装饰，展示更明显的身份与氛围。',
  },
  {
    key: 'theme',
    icon: '🎨',
    title: '专属主题',
    desc: '享受独特的主题与氛围',
  },
  {
    key: 'font',
    icon: '✍️',
    title: '专属字体',
    desc: '解锁更具个性的专属字体展示效果',
  },
]

const vipPackages = computed(() => (
  vipStore.economy?.vipPackages?.length
    ? vipStore.economy.vipPackages
    : vipStore.VIP_PLANS
))

watch(() => props.visible, async (visible) => {
  if (!visible) return

  historyLoading.value = true
  try {
    await vipStore.fetchEconomy()
    await vipStore.fetchHistory({ page: 1, limit: 20 })
  } finally {
    historyLoading.value = false
  }
})

function handleClose() {
  emit('close')
}

function handleBenefitClick(benefit) {
  if (!vipStore.isVipActive) {
    showToast('开通 VIP 后即可使用该功能')
    return
  }
  emit(benefit.action)
}

async function handlePurchaseVip(packageKey) {
  if (purchasingVipKey.value) return

  purchasingVipKey.value = packageKey
  try {
    const result = await vipStore.purchaseVip(packageKey)
    if (result.success) {
      await vipStore.fetchHistory({ page: 1, limit: 20 })
    }
    showToast(result.message, result.success ? 'success' : 'error')
  } finally {
    purchasingVipKey.value = ''
  }
}

async function handleActivate() {
  const code = activationCode.value.trim()
  if (!code) {
    activateMessage.value = '请输入激活码'
    activateSuccess.value = false
    return
  }

  activating.value = true
  activateMessage.value = ''

  try {
    const result = await vipStore.activateByCode(code)
    activateMessage.value = result.message
    activateSuccess.value = result.success

    if (result.success) {
      activationCode.value = ''
      await vipStore.fetchEconomy()
      await vipStore.fetchHistory({ page: 1, limit: 20 })
    }
  } finally {
    activating.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '--'

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return '--'
  }
}
</script>

<style scoped>
.vip-center-shell {
  position: fixed;
  inset: 0;
  z-index: 340;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 24px;
  background:
    radial-gradient(circle at top, rgba(255, 229, 176, 0.16) 0%, transparent 30%),
    rgba(8, 11, 19, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.vip-center {
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

.vip-center::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 28px;
  border: 1px solid rgba(199, 151, 60, 0.22);
  pointer-events: none;
}

.vip-center.dark {
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

.vip-center.dark::before {
  border-color: rgba(141, 176, 235, 0.14);
}

.vip-center__close {
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

.vip-center__close:hover {
  transform: translateY(-1px);
  background: rgba(107, 77, 45, 0.85);
  border-color: rgba(184, 135, 46, 0.5);
}

.vip-center.dark .vip-center__close {
  background: rgba(10, 17, 33, 0.82);
  border-color: rgba(198, 219, 255, 0.22);
  color: #eef4ff;
}

.vip-center.dark .vip-center__close:hover {
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

.vip-center__scroll {
  position: relative;
  z-index: 1;
  max-height: min(90vh, 860px);
  overflow-y: auto;
  padding: 36px 40px 32px;
}

.vip-center__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.vip-center__header-icon {
  font-size: 28px;
}

.vip-center__title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.vip-center__status-badge {
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.vip-center__status-badge.active {
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.25);
}

.vip-center__status-badge.inactive {
  background: rgba(184, 135, 46, 0.12);
  color: #8e6c1a;
  border: 1px dashed rgba(184, 135, 46, 0.25);
}

.vip-card {
  padding: 24px 28px;
  border-radius: 24px;
  margin-bottom: 18px;
  background:
    linear-gradient(
      135deg,
      rgba(255, 252, 235, 1) 0%,
      rgba(255, 240, 190, 1) 20%,
      rgba(255, 225, 150, 1) 40%,
      rgba(255, 218, 120, 1) 50%,
      rgba(255, 225, 150, 1) 60%,
      rgba(255, 240, 190, 1) 80%,
      rgba(255, 250, 225, 1) 100%
    );
  background-size: 200% 200%;
  animation: vipBgGoldFlow 6s ease-in-out infinite;
  border: 1px solid rgba(196, 142, 48, 0.38);
  box-shadow: 0 4px 20px -4px rgba(255, 200, 80, 0.3);
}

.vip-card--active {
  border-color: rgba(255, 215, 0, 0.45);
  box-shadow:
    0 4px 20px -4px rgba(255, 200, 80, 0.45),
    0 0 30px -8px rgba(255, 215, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.vip-card.dark {
  background: linear-gradient(135deg, rgba(20, 28, 52, 0.9), rgba(32, 44, 76, 0.9));
  border-color: rgba(141, 176, 235, 0.16);
}

.vip-card.dark.vip-card--active {
  background:
    linear-gradient(
      135deg,
      rgba(255, 235, 160, 0.92) 0%,
      rgba(255, 220, 120, 0.95) 25%,
      rgba(255, 210, 90, 0.98) 50%,
      rgba(255, 215, 110, 0.95) 75%,
      rgba(255, 230, 150, 0.92) 100%
    );
}

.vip-card__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.vip-card__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vip-card__crown {
  font-size: 42px;
}

.vip-card__name {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 800;
}

.vip-card__desc {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
  line-height: 1.5;
}

.vip-card__expiry-info {
  text-align: right;
  font-size: 13px;
  opacity: 0.8;
}

.vip-balance-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  margin-bottom: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(184, 135, 46, 0.14);
}

.vip-balance-strip.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(141, 176, 235, 0.1);
}

.vip-balance-strip__label {
  margin: 0 0 4px;
  font-size: 12px;
  opacity: 0.6;
}

.vip-balance-strip__value {
  font-size: 28px;
  line-height: 1;
}

.vip-balance-strip__hint {
  margin: 0;
  font-size: 12px;
  opacity: 0.55;
  text-align: right;
}

.vip-section {
  margin-bottom: 24px;
}

.vip-section__title {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  opacity: 0.72;
}

.vip-section__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.vip-section__title-row .vip-section__title {
  margin-bottom: 0;
}

.vip-section__hint {
  font-size: 11px;
  opacity: 0.5;
  white-space: nowrap;
}

.vip-package-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.vip-package-card {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid rgba(184, 135, 46, 0.14);
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 10px 24px -20px rgba(122, 84, 17, 0.55);
}

.vip-package-card.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.vip-package-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.vip-package-card__name {
  font-size: 16px;
}

.vip-package-card__price {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 78px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 215, 0, 0.14);
  color: #8e6c1a;
  font-size: 13px;
  font-weight: 700;
}

.vip-package-card.dark .vip-package-card__price {
  color: #cfe0ff;
  background: rgba(141, 176, 235, 0.16);
}

.vip-package-card__meta {
  margin: 0 0 16px;
  min-height: 38px;
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.66;
}

.vip-package-card__button {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  box-shadow: 0 10px 20px -12px rgba(255, 215, 0, 0.55);
}

.vip-package-card__button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px -12px rgba(255, 215, 0, 0.65);
}

.vip-package-card__button:disabled {
  opacity: 0.56;
  cursor: not-allowed;
}

.vip-benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.vip-benefit {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(184, 135, 46, 0.1);
  cursor: pointer;
  transition: all 0.22s ease;
}

.vip-benefit.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.vip-benefit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(184, 135, 46, 0.18);
}

.vip-benefit--locked {
  opacity: 0.45;
  cursor: default;
}

.vip-benefit--locked:hover {
  transform: none;
  box-shadow: none;
}

.vip-benefit__icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 215, 0, 0.1);
  font-size: 26px;
  flex-shrink: 0;
}

.vip-benefit__info {
  flex: 1;
  min-width: 0;
}

.vip-benefit__name {
  display: block;
  margin-bottom: 2px;
  font-size: 14px;
  font-weight: 700;
}

.vip-benefit__desc {
  display: block;
  font-size: 11px;
  line-height: 1.4;
  opacity: 0.55;
}

.vip-benefit__lock {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 12px;
  opacity: 0.35;
}

.vip-perk-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.vip-perk-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(184, 135, 46, 0.1);
  background: rgba(255, 255, 255, 0.55);
}

.vip-perk-card.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.vip-perk-card__icon {
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

.vip-perk-card p {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.62;
}

.vip-empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  opacity: 0.4;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.02);
}

.vip-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vip-history-list.dark .vip-empty {
  background: rgba(255, 255, 255, 0.03);
}

.vip-history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.45);
  transition: background 0.15s ease;
}

.vip-history-item:hover {
  background: rgba(255, 255, 255, 0.65);
}

.vip-history-list.dark .vip-history-item {
  background: rgba(255, 255, 255, 0.04);
}

.vip-history-list.dark .vip-history-item:hover {
  background: rgba(255, 255, 255, 0.07);
}

.vip-history-item__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #b0b7c4;
  flex-shrink: 0;
}

.vip-history-item__dot.active {
  background: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.vip-history-item__content {
  flex: 1;
  min-width: 0;
}

.vip-history-item__title {
  display: block;
  font-size: 13px;
  font-weight: 600;
}

.vip-history-item__date {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.5;
}

.vip-activate {
  padding: 22px 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.38);
  border: 1px solid rgba(184, 135, 46, 0.14);
}

.vip-activate.dark {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(141, 176, 235, 0.1);
}

.vip-activate__form {
  display: flex;
  gap: 10px;
  align-items: center;
}

.vip-activate__input {
  flex: 1;
  height: 44px;
  padding: 0 18px;
  border: 1px solid rgba(184, 135, 46, 0.28);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  color: #4d2f14;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.vip-activate__input::placeholder {
  color: rgba(139, 98, 50, 0.4);
}

.vip-activate__input:focus {
  border-color: rgba(196, 142, 48, 0.6);
  box-shadow: 0 0 0 3px rgba(196, 142, 48, 0.1);
  background: rgba(255, 255, 255, 0.9);
}

.vip-activate__input.dark {
  background: rgba(15, 22, 40, 0.6);
  border-color: rgba(141, 176, 235, 0.2);
  color: #edf3ff;
}

.vip-activate__input.dark::placeholder {
  color: rgba(180, 200, 230, 0.35);
}

.vip-activate__input.dark:focus {
  border-color: rgba(141, 176, 235, 0.5);
  box-shadow: 0 0 0 3px rgba(141, 176, 235, 0.08);
  background: rgba(15, 22, 40, 0.8);
}

.vip-activate__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.vip-activate__btn {
  flex-shrink: 0;
  height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px -4px rgba(255, 215, 0, 0.3);
}

.vip-activate__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px -4px rgba(255, 215, 0, 0.4);
}

.vip-activate__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.vip-activate__btn--loading {
  background: linear-gradient(135deg, #c9a227, #b8942b);
  color: rgba(61, 46, 10, 0.7);
}

.vip-activate__msg {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #2d7a2d;
}

.vip-activate__msg--error {
  color: #c44;
}

@media (max-width: 900px) {
  .vip-package-grid,
  .vip-benefits-grid,
  .vip-perk-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .vip-center__scroll {
    padding: 32px 20px 24px;
  }

  .vip-card__inner,
  .vip-balance-strip,
  .vip-section__title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .vip-package-grid,
  .vip-benefits-grid,
  .vip-perk-list {
    grid-template-columns: 1fr;
  }

  .vip-activate__form {
    flex-direction: column;
    align-items: stretch;
  }

  .vip-package-card__head {
    flex-direction: column;
    align-items: flex-start;
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

@keyframes vipBgGoldFlow {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}
</style>
