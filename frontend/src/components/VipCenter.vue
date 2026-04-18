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
          <!-- Close Button -->
          <button class="vip-center__close" type="button" @click="handleClose">
            <span class="close-icon">×</span>
            <span class="close-text">关闭</span>
          </button>

          <!-- Scroll Content -->
          <div class="vip-center__scroll">
            <!-- Header -->
            <div class="vip-center__header">
              <span class="vip-center__header-icon">👑</span>
              <h2 class="vip-center__title">VIP 会员中心</h2>
              <span v-if="vipStore.isVipActive" class="vip-center__status-badge active">
                生效中 · 剩余{{ vipStore.remainingDays }}天
              </span>
              <span v-else class="vip-center__status-badge inactive">
                未开通
              </span>
            </div>

            <!-- VIP Status Card -->
            <div class="vip-card" :class="{ 'vip-card--active': vipStore.isVipActive, 'dark': isDark }">
              <div class="vip-card__inner">
                <div class="vip-card__left">
                  <div class="vip-card__crown">{{ vipStore.isVipActive ? '👑' : '🔒' }}</div>
                  <div class="vip-card__info">
                    <p class="vip-card__name">
                      {{ vipStore.isVipActive ? 'VIP 会员' : '普通用户' }}
                    </p>
                    <p class="vip-card__desc" v-if="!vipStore.isVipActive">
                      开通VIP，全部高级功能免费不限次使用
                    </p>
                  </div>
                </div>
                <div class="vip-card__right" v-if="vipStore.isVipActive">
                  <div class="vip-card__expiry-info">
                    <span>有效期至 {{ formatDate(vipStore.expiresAt) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- CTA -->
            <div class="vip-cta-area">
              <button
                class="vip-cta-btn"
                :class="{ 'vip-cta-btn--active': vipStore.isVipActive }"
                :disabled="purchasingVip"
                @click="handlePurchaseVip"
              >
                <span>{{ purchasingVip ? '购买中...' : (vipStore.isVipActive ? `续费 ${vipStore.VIP_COST} 币/30天` : `${vipStore.VIP_COST} 币开通 30天VIP`) }}</span>
              </button>
              <p class="vip-cta-hint">
                {{ vipStore.isVipActive ? '续费延长VIP有效期，权益不间断' : `VIP期间全部高级功能免费不限次，当前余额 ${vipStore.emotionCoins} 币` }}
              </p>
            </div>

            <!-- Activation Code Section -->
            <div class="vip-section vip-activate" :class="{ dark: isDark }">
              <h3 class="vip-section__title">激活码兑换</h3>
              <div class="vip-activate__form">
                <input
                  v-model="activationCode"
                  type="text"
                  placeholder="请输入VIP激活码"
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
                  <span v-if="!activating">立即激活</span>
                  <span v-else>激活中...</span>
                </button>
              </div>
              <p v-if="activateMessage" class="vip-activate__msg" :class="{ 'vip-activate__msg--error': !activateSuccess }">
                {{ activateMessage }}
              </p>
            </div>

            <!-- Benefits Grid -->
            <div class="vip-section">
              <h3 class="vip-section__title">核心权益</h3>
              <div class="vip-benefits-grid">
                <div
                  v-for="benefit in benefits"
                  :key="benefit.key"
                  class="vip-benefit"
                  :class="{ dark: isDark }"
                  @click="handleBenefitClick(benefit)"
                >
                  <div class="vip-benefit__icon-wrap">{{ benefit.icon }}</div>
                  <div class="vip-benefit__info">
                    <span class="vip-benefit__name">{{ benefit.name }}</span>
                    <span class="vip-benefit__desc">{{ benefit.desc }}</span>
                  </div>
                  <span v-if="!vipStore.isVipActive" class="vip-benefit__coin">🪙</span>
                </div>
              </div>
            </div>

            <div class="vip-section">
              <div class="vip-section__title-row">
                <h3 class="vip-section__title">功能详细说明</h3>
                <span class="vip-section__hint">VIP全部免费，非VIP可用情绪币单独购买</span>
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
              <div class="vip-section__title-row">
                <h3 class="vip-section__title">专属图标系统</h3>
                <span class="vip-section__hint">{{ themeSkinUnlocked ? '主题已点亮' : 'VIP免费领取 / 非VIP 500币解锁' }}</span>
              </div>
              <div class="vip-icon-grid">
                <button
                  v-for="icon in specialIconCards"
                  :key="icon.key"
                  type="button"
                  class="vip-icon-card"
                  :class="{
                    'vip-icon-card--locked': !themeSkinUnlocked,
                    'vip-icon-card--unlocking': unlockingIconKey === icon.key,
                    dark: isDark,
                  }"
                  @click="handleUnlockThemeIcons(icon.key)"
                >
                  <div class="vip-icon-card__visual" :class="`vip-icon-card__visual--${icon.key}`">
                    <span class="vip-icon-card__emoji">{{ icon.emoji }}</span>
                    <svg v-if="icon.key === 'time_capsule'" class="vip-icon-card__svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                      <rect x="16" y="14" width="32" height="10" rx="5" stroke="currentColor" stroke-width="2.4"/>
                      <path d="M22 24C22 33.5 27 37.5 32 42C37 37.5 42 33.5 42 24" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                      <path d="M22 40C22 31 27 27.5 32 22C37 27.5 42 31 42 40" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                      <rect x="16" y="40" width="32" height="10" rx="5" stroke="currentColor" stroke-width="2.4"/>
                    </svg>
                    <svg v-else class="vip-icon-card__svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                      <path d="M41 16a10 10 0 1 0 9 15.5A12 12 0 1 1 41 16Z" fill="currentColor" opacity="0.72"/>
                      <path d="M29 46c0-7 4-13 10-16-8 1-15 7-18 16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
                      <path d="M24 25c6 8 7 15 6 25" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
                      <path d="M17 33c4 1 7 3 10 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                      <path d="M31 35c5-1 9 0 13 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                    </svg>
                    <span class="vip-icon-card__pulse"></span>
                  </div>
                  <div class="vip-icon-card__body">
                    <strong>{{ icon.title }}</strong>
                    <p>{{ icon.desc }}</p>
                    <span class="vip-icon-card__status">{{ themeSkinUnlocked ? '已解锁 · 点击播放展开动画' : '未解锁 · 点击花费 500 币解锁' }}</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Polish Stats -->
            <div v-if="vipStore.isVipActive" class="vip-section">
              <h3 class="vip-section__title">本月擦亮次数</h3>
              <div class="vip-polish-bar" :class="{ dark: isDark }">
                <div class="vip-polish-bar__fill" :style="{ width: polishPercent + '%' }"></div>
                <div class="vip-polish-bar__labels">
                  <span>已用 {{ vipStore.polishCount.used }} 次</span>
                  <span>剩余 不限 次</span>
                </div>
              </div>
            </div>

            <!-- Order History -->
            <div class="vip-section">
              <h3 class="vip-section__title">VIP 权益记录</h3>
              <div v-if="historyLoading" class="vip-empty">加载中...</div>
              <div v-else-if="vipStore.orders.length === 0" class="vip-empty">暂无记录</div>
              <div v-else class="vip-history-list" :class="{ dark: isDark }">
                <div v-for="order in vipStore.orders" :key="order.id" class="vip-history-item">
                  <div class="vip-history-item__dot" :class="{ active: order.isActive }"></div>
                  <div class="vip-history-item__content">
                    <span class="vip-history-item__title">
                      {{ order.isActive ? 'VIP生效中' : '已过期' }}
                    </span>
                    <span class="vip-history-item__date">
                      {{ formatDate(order.createdAt) }} — {{ formatDate(order.expiresAt) }}
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
import { ref, computed, watch } from 'vue'
import { useVipStore } from '../stores/vip'
import { showToast } from '../composables/useToast'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'open-polish', 'open-comment-settings', 'open-visual', 'open-footprints'])

const vipStore = useVipStore()
const historyLoading = ref(false)
const unlockingIconKey = ref('')
const purchasingVip = ref(false)
const purchasingItem = ref('')

// 激活码相关
const activationCode = ref('')
const activating = ref(false)
const activateMessage = ref('')
const activateSuccess = ref(false)

const benefits = [
  { key: 'footprint', icon: '🗺️', name: '我的足迹', desc: vipStore.isVipActive ? 'VIP免费不限次' : '20币/次', action: 'open-footprints' },
  { key: 'polish', icon: '✨', name: '擦亮故事', desc: vipStore.isVipActive ? 'VIP免费不限次' : '30币/次', action: 'open-polish' },
  { key: 'comment', icon: '💬', name: '评论装扮', desc: vipStore.isVipActive ? 'VIP免费使用' : '100币/7天', action: 'open-comment-settings' },
]

const privilegeDetails = [
  {
    key: 'footprints',
    icon: '🐾',
    title: '我的足迹动画',
    desc: '非VIP 20 币/次，VIP 免费。至少拥有 2 个已发布故事即可回放轨迹。',
  },
  {
    key: 'polish',
    icon: '✨',
    title: '擦亮故事',
    desc: '非VIP 30 币/次，VIP 免费。故事重新进入推荐列表。',
  },
  {
    key: 'comment',
    icon: '💬',
    title: '气泡装饰与评论装扮',
    desc: '非VIP 100 币/7天，VIP 免费。解锁评论背景样式自定义。',
  },
]

const specialIconCards = [
  {
    key: 'time_capsule',
    emoji: '⏳',
    title: '时光胶囊',
    desc: '未解锁时以沙漏胶囊图标呈现，强调等待与悬念。',
  },
  {
    key: 'night_treehole',
    emoji: '🌙',
    title: '深夜树洞',
    desc: '未解锁时以月夜树洞图标呈现，强化夜间私语氛围。',
  },
]

const storeItems = computed(() => vipStore.economy?.storeItems || [])
const footprintTicketCount = computed(() => vipStore.getInventoryQuantity('footprint_animation'))
const themeSkinUnlocked = computed(() => vipStore.hasActiveItem('theme_skin'))

const polishPercent = computed(() => {
  const used = vipStore.polishCount.used || 0
  // VIP擦亮不限次，进度条只做视觉展示
  return Math.min(100, used * 10)
})

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

function handleBenefitClick(benefit) {
  emit(benefit.action)
}

async function handlePurchaseVip() {
  if (purchasingVip.value) return
  purchasingVip.value = true
  const result = await vipStore.purchaseVip()
  showToast(result.message, result.success ? 'success' : 'error')
  purchasingVip.value = false
}

function isPermanentOwned(item) {
  return item?.type === 'permanent' && vipStore.hasActiveItem(item.key)
}

function triggerUnlockAnimation(iconKey) {
  unlockingIconKey.value = iconKey
  setTimeout(() => {
    if (unlockingIconKey.value === iconKey) {
      unlockingIconKey.value = ''
    }
  }, 680)
}

async function handleUnlockThemeIcons(iconKey) {
  if (themeSkinUnlocked.value) {
    triggerUnlockAnimation(iconKey)
    return
  }

  if (purchasingItem.value === 'theme_skin') return
  purchasingItem.value = 'theme_skin'
  const result = await vipStore.useThemeSkin()
  if (result.success) {
    triggerUnlockAnimation(iconKey)
  }
  showToast(result.message || (result.success ? '主题皮肤已解锁' : '解锁失败'), result.success ? 'success' : 'error')
  purchasingItem.value = ''
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

  const result = await vipStore.activateByCode(code)
  activateMessage.value = result.message
  activateSuccess.value = result.success

  if (result.success) {
    activationCode.value = ''
  }

  activating.value = false
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
</script>

<style scoped>
/* ===== Shell ===== */
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

/* ===== Modal Container ===== */
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

/* ===== Close Button ===== */
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
  color: #ffffff;
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
  transform: translateY(-1px);
  font-size: 22px;
}

.close-text {
  font-size: 13px;
  letter-spacing: 0.08em;
}

/* ===== Scroll Area ===== */
.vip-center__scroll {
  position: relative;
  z-index: 1;
  max-height: min(90vh, 860px);
  overflow-y: auto;
  padding: 36px 40px 32px;
}

/* ===== Header ===== */
.vip-center__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.vip-center__header-icon { font-size: 28px; }

.vip-center__title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.02em;
  margin: 0;
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

/* ===== VIP Card ===== */
.vip-card {
  padding: 24px 28px;
  border-radius: 24px;
  margin-bottom: 24px;
  background:
    linear-gradient(135deg,
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
  background:
    linear-gradient(135deg,
      rgba(255, 240, 180, 1) 0%,
      rgba(255, 225, 140, 1) 25%,
      rgba(255, 215, 100, 1) 50%,
      rgba(255, 220, 120, 1) 75%,
      rgba(255, 235, 170, 1) 100%
    );
  background-size: 200% 200%;
  animation: vipBgGoldFlow 6s ease-in-out infinite;
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
    linear-gradient(135deg,
      rgba(255, 235, 160, 0.92) 0%,
      rgba(255, 220, 120, 0.95) 25%,
      rgba(255, 210, 90, 0.98) 50%,
      rgba(255, 215, 110, 0.95) 75%,
      rgba(255, 230, 150, 0.92) 100%
    );
  background-size: 200% 200%;
  animation: vipBgGoldFlow 6s ease-in-out infinite;
  border-color: rgba(255, 215, 0, 0.45);
  box-shadow:
    0 4px 20px -4px rgba(255, 200, 80, 0.45),
    0 0 30px -8px rgba(255, 215, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
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

.vip-card__crown { font-size: 42px; }

.vip-card__name {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 800;
}

.vip-card__desc {
  margin: 0;
  font-size: 13px;
  opacity: 0.65;
  line-height: 1.5;
}

.vip-card__expiry-info {
  text-align: right;
  font-size: 13px;
  opacity: 0.75;
}

/* ===== Section ===== */
.vip-section {
  margin-bottom: 24px;
}

.vip-activate {
  background: rgba(255, 255, 255, 0.38);
  border-radius: 20px;
  padding: 22px 24px;
  border: 1px solid rgba(184, 135, 46, 0.14);
}

.vip-activate.dark {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(141, 176, 235, 0.1);
}

.vip-section__title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0 0 14px;
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

/* ===== Activation Code Form ===== */
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

.vip-activate__btn:active:not(:disabled) {
  transform: translateY(0);
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

/* ===== Benefits Grid ===== */
.vip-benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.vip-benefit {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(184, 135, 46, 0.1);
  cursor: pointer;
  transition: all 0.22s ease;
  position: relative;
}

.vip-benefit.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.vip-benefit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(184, 135, 46, 0.18);
}

.vip-benefit--locked { opacity: 0.45; cursor: default; }
.vip-benefit--locked:hover { transform: none; box-shadow: none; }

.vip-benefit__icon-wrap {
  font-size: 26px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 215, 0, 0.1);
  flex-shrink: 0;
}

.vip-benefit__info {
  flex: 1;
  min-width: 0;
}

.vip-benefit__name {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}

.vip-benefit__desc {
  display: block;
  font-size: 11px;
  opacity: 0.55;
  line-height: 1.4;
}

.vip-benefit__lock {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 13px;
  opacity: 0.35;
}

/* ===== Perk List ===== */
.vip-perk-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.vip-perk-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(184, 135, 46, 0.1);
  background: rgba(255, 255, 255, 0.55);
  display: flex;
  gap: 12px;
  align-items: flex-start;
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

/* ===== Icon Grid ===== */
.vip-icon-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.vip-icon-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(184, 135, 46, 0.1);
  background: rgba(255, 255, 255, 0.55);
  text-align: left;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.vip-icon-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 28px -22px rgba(122, 84, 17, 0.45);
}

.vip-icon-card.dark {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.09);
}

.vip-icon-card--locked { opacity: 0.82; }

.vip-icon-card__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  border-radius: 18px;
  margin-bottom: 12px;
  overflow: hidden;
  color: #7c5312;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.55), transparent 55%),
    linear-gradient(135deg, rgba(255, 243, 214, 0.9), rgba(239, 217, 170, 0.9));
}

.vip-icon-card.dark .vip-icon-card__visual {
  color: #c6dbff;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.14), transparent 55%),
    linear-gradient(135deg, rgba(23, 35, 62, 0.96), rgba(31, 48, 84, 0.96));
}

.vip-icon-card__visual:hover .vip-icon-card__pulse,
.vip-icon-card:hover .vip-icon-card__pulse {
  animation: vipIconPulse 1.8s ease-in-out infinite;
}

.vip-icon-card__visual--time_capsule {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.65), transparent 52%),
    linear-gradient(135deg, rgba(255, 246, 224, 0.96), rgba(239, 220, 178, 0.96));
}

.vip-icon-card__visual--night_treehole {
  background:
    radial-gradient(circle at 28% 24%, rgba(255, 255, 255, 0.18), transparent 18%),
    linear-gradient(160deg, rgba(30, 42, 84, 0.96), rgba(16, 24, 50, 0.98));
}

.vip-icon-card__emoji {
  position: absolute;
  top: 12px;
  left: 12px;
  font-size: 18px;
  opacity: 0.9;
}

.vip-icon-card__svg {
  width: 68px;
  height: 68px;
  position: relative;
  z-index: 1;
}

.vip-icon-card__pulse {
  position: absolute;
  inset: 26px;
  border-radius: 22px;
  border: 1px solid currentColor;
  opacity: 0.16;
  pointer-events: none;
}

.vip-icon-card__body strong { display: block; font-size: 14px; }

.vip-icon-card__body p {
  margin: 6px 0;
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.62;
}

.vip-icon-card__status {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  font-size: 11px;
  font-weight: 700;
  color: #8e6c1a;
}

.vip-icon-card.dark .vip-icon-card__status {
  color: #9fc0ff;
}

.vip-icon-card--unlocking .vip-icon-card__svg {
  animation: vipIconUnlock 0.68s cubic-bezier(0.22, 1, 0.36, 1);
}

.vip-icon-card--unlocking .vip-icon-card__pulse {
  animation: vipIconBurst 0.68s ease-out;
}

/* ===== Polish Bar ===== */
.vip-polish-bar {
  position: relative;
  height: 32px;
  background: rgba(184, 135, 46, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.vip-polish-bar.dark {
  background: rgba(141, 176, 235, 0.07);
}

.vip-polish-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #f5a623);
  border-radius: 16px;
  transition: width 0.6s ease;
}

.vip-polish-bar__labels {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
}

/* ===== History List ===== */
.vip-empty {
  text-align: center;
  padding: 24px;
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

.vip-history-item__content { flex: 1; min-width: 0; }

.vip-history-item__title {
  display: block;
  font-size: 13px;
  font-weight: 600;
}

.vip-history-item__date {
  display: block;
  font-size: 11px;
  opacity: 0.5;
  margin-top: 2px;
}

/* ===== CTA Area ===== */
.vip-cta-area {
  text-align: center;
  padding: 8px 0 24px;
}

.vip-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 200px;
  height: 50px;
  padding: 0 36px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 14px 28px -8px rgba(255, 215, 0, 0.35);
  transition: all 0.22s ease;
}

.vip-cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px -8px rgba(255, 215, 0, 0.45);
}

.vip-cta-btn--active {
  background: linear-gradient(135deg, #b8860b, #8e6c1a);
  color: #fef3c7;
}

.vip-cta-hint {
  margin: 10px 0 0;
  font-size: 12px;
  opacity: 0.45;
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .vip-benefits-grid,
  .vip-perk-list,
  .vip-icon-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .vip-center__scroll {
    padding: 32px 20px 24px;
  }

  .vip-card__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .vip-benefits-grid,
  .vip-perk-list,
  .vip-icon-grid {
    grid-template-columns: 1fr;
  }

  .vip-activate__form {
    flex-direction: column;
    align-items: stretch;
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

@keyframes vipBgGoldFlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes vipIconPulse {
  0%, 100% { transform: scale(1); opacity: 0.14; }
  50% { transform: scale(1.06); opacity: 0.28; }
}

@keyframes vipIconUnlock {
  0% { transform: scale(0.92); opacity: 0.72; }
  55% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes vipIconBurst {
  0% { transform: scale(0.82); opacity: 0.36; }
  100% { transform: scale(1.22); opacity: 0; }
}
</style>
