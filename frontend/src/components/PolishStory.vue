<template>
  <button
    class="polish-btn"
    :class="{
      'polish-btn--active': isPolished,
      'polish-btn--disabled': (!canPolish && !isPolished) || polishing,
      'polish-btn--vip': vipStore.isVipActive,
    }"
    :title="tooltipText"
    type="button"
    @click.stop="handlePolish"
  >
    <span class="polish-btn__icon">{{ isPolished ? '*' : '+' }}</span>
    <span class="polish-btn__label">{{ label }}</span>
  </button>

  <transition name="polish-toast">
    <div v-if="showToast" class="polish-toast" @click.stop>
      <div class="polish-toast__icon">*</div>
      <div class="polish-toast__body">
        <p class="polish-toast__title">{{ TEXT.title }}</p>
        <p class="polish-toast__desc">{{ toastDesc }}</p>
        <div class="polish-toast__timer">
          <span class="polish-toast__timer-icon">T</span>
          <span>{{ TEXT.remaining }} {{ countdownText }}</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { useVipStore } from '../stores/vip'

const props = defineProps({
  storyId: { type: [String, Number], required: true },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['polished', 'error'])

const vipStore = useVipStore()
const showToast = ref(false)
const polishing = ref(false)
const toastDesc = ref('\u5df2\u91cd\u65b0\u8fdb\u5165\u63a8\u8350\u5217\u8868')
const countdownSeconds = ref(0)
let toastTimer = null
let countdownTimer = null

const TEXT = {
  title: '\u6545\u4e8b\u5df2\u64e6\u4eae',
  remaining: '\u5269\u4f59',
  boosted: '\u5df2\u64e6\u4eae',
  working: '\u5904\u7406\u4e2d',
  freeBoost: '\u514d\u8d39\u64e6\u4eae',
  coinSuffix: '\u5e01\u64e6\u4eae',
  alreadyBoosted: '\u6545\u4e8b\u6b63\u5728\u63a8\u8350\u56de\u6d41\u4e2d',
  processing: '\u6b63\u5728\u5904\u7406\u64e6\u4eae\u8bf7\u6c42',
  vipHint: 'VIP \u7528\u6237\u53ef\u514d\u8d39\u4e0d\u9650\u6b21\u64e6\u4eae\u6545\u4e8b',
  needCoins: '\u60c5\u7eea\u5e01\u4e0d\u8db3\uff0c\u64e6\u4eae\u4e00\u6b21\u9700\u8981',
  spendCoins: '\u6d88\u8017',
  spendCoinsSuffix: '\u60c5\u7eea\u5e01\u64e6\u4eae\u6545\u4e8b\uff0c\u4f7f\u5176\u91cd\u65b0\u8fdb\u5165\u63a8\u8350',
  boostFailed: '\u64e6\u4eae\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  vipBoosted: 'VIP \u514d\u8d39\u64e6\u4eae\u6210\u529f\uff0c\u5df2\u91cd\u65b0\u8fdb\u5165\u63a8\u8350\u5217\u8868',
  paidBoostedPrefix: '\u5df2\u6d88\u8017',
  paidBoostedSuffix: '\u5e01\uff0c\u91cd\u65b0\u8fdb\u5165\u63a8\u8350\u5217\u8868',
}

const isPolished = computed(() => vipStore.isStoryPolished(props.storyId))
const canPolish = computed(() => vipStore.canPolish(props.storyId))
const storyPolishCost = computed(() => vipStore.getStoryPolishCost())

const label = computed(() => {
  if (isPolished.value) return TEXT.boosted
  if (polishing.value) return TEXT.working
  if (vipStore.isVipActive) return TEXT.freeBoost
  return `${storyPolishCost.value}${TEXT.coinSuffix}`
})

const tooltipText = computed(() => {
  if (isPolished.value) return TEXT.alreadyBoosted
  if (polishing.value) return TEXT.processing
  if (vipStore.isVipActive) return TEXT.vipHint
  if (!canPolish.value) return `${TEXT.needCoins} ${storyPolishCost.value} \u5e01`
  return `${TEXT.spendCoins} ${storyPolishCost.value} ${TEXT.spendCoinsSuffix}`
})

const countdownText = computed(() => {
  const h = Math.floor(countdownSeconds.value / 3600)
  const m = Math.floor((countdownSeconds.value % 3600) / 60)
  const s = countdownSeconds.value % 60
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
})

async function handlePolish() {
  if (props.disabled || isPolished.value || polishing.value) return

  polishing.value = true

  try {
    const result = await vipStore.polishStory(props.storyId)

    if (!result?.success) {
      emit('error', {
        type: result?.type || 'polish_failed',
        message: result?.message || TEXT.boostFailed
      })
      return
    }

    toastDesc.value = result.isVip
      ? TEXT.vipBoosted
      : `${TEXT.paidBoostedPrefix} ${result.cost} ${TEXT.paidBoostedSuffix}`

    showToast.value = true
    startCountdown()
    emit('polished', { storyId: props.storyId, cost: result.cost, isVip: result.isVip })

    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      showToast.value = false
    }, 4000)
  } finally {
    polishing.value = false
  }
}

function startCountdown() {
  const expiresAt = vipStore.getPolishExpiresAt(props.storyId)
  if (!expiresAt) return

  const update = () => {
    const diff = Math.max(0, (new Date(expiresAt) - new Date()) / 1000)
    countdownSeconds.value = Math.floor(diff)
    if (diff <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  update()
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(update, 1000)
}

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.polish-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid rgba(184, 135, 46, 0.3);
  border-radius: 999px;
  background: rgba(255, 215, 0, 0.08);
  color: #8e6c1a;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
  white-space: nowrap;
  user-select: none;
}

.polish-btn:hover:not(.polish-btn--disabled) {
  background: rgba(255, 215, 0, 0.18);
  border-color: rgba(184, 135, 46, 0.5);
  transform: translateY(-1px);
}

.polish-btn--active {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 180, 0, 0.12));
  border-color: rgba(255, 215, 0, 0.5);
  color: #b8860b;
  cursor: default;
  animation: polish-glow 2s ease-in-out infinite;
}

.polish-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.polish-btn__icon {
  font-size: 13px;
  line-height: 1;
}

.polish-btn__label {
  line-height: 1;
}

@keyframes polish-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 0 12px rgba(255, 215, 0, 0.4); }
}

.polish-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(255, 250, 230, 0.97), rgba(255, 243, 200, 0.97));
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 215, 0, 0.35);
  border-radius: 20px;
  box-shadow: 0 16px 40px -16px rgba(184, 135, 46, 0.25);
  pointer-events: none;
}

.polish-toast__icon {
  font-size: 28px;
  animation: polish-sparkle 1s ease-in-out infinite;
}

.polish-toast__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #6b4e0a;
}

.polish-toast__desc {
  margin: 2px 0 0;
  font-size: 12px;
  color: rgba(107, 78, 10, 0.7);
}

.polish-toast__timer {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 11px;
  color: #b8860b;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.polish-toast__timer-icon {
  font-size: 13px;
}

@keyframes polish-sparkle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.polish-toast-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.polish-toast-leave-active {
  transition: all 0.25s ease;
}

.polish-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-16px) scale(0.92);
}

.polish-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px) scale(0.96);
}
</style>
