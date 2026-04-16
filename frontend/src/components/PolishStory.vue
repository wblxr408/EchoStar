<template>
  <!-- Polish button — shown in story list / story detail -->
  <button
    class="polish-btn"
    :class="{
      'polish-btn--active': isPolished,
      'polish-btn--disabled': !canPolish && !isPolished,
      'polish-btn--vip': vipStore.isVipActive,
    }"
    :title="tooltipText"
    @click.stop="handlePolish"
  >
    <span class="polish-btn__icon">{{ isPolished ? '✨' : '💎' }}</span>
    <span class="polish-btn__label">{{ label }}</span>
    <span v-if="vipStore.isVipActive && !isPolished" class="polish-btn__count">
      {{ vipStore.polishRemaining }}/{{ vipStore.polishCount.total }}
    </span>
  </button>

  <!-- Success toast overlay -->
  <transition name="polish-toast">
    <div v-if="showToast" class="polish-toast" @click.stop>
      <div class="polish-toast__icon">✨</div>
      <div class="polish-toast__body">
        <p class="polish-toast__title">故事已擦亮</p>
        <p class="polish-toast__desc">已重新进入推荐列表</p>
        <div class="polish-toast__timer">
          <span class="polish-toast__timer-icon">⏳</span>
          <span>剩余 {{ countdownText }}</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useVipStore } from '../stores/vip'

const props = defineProps({
  storyId: { type: [String, Number], required: true },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['polished', 'error'])

const vipStore = useVipStore()
const showToast = ref(false)
let toastTimer = null
let countdownTimer = null
const countdownSeconds = ref(0)

const isPolished = computed(() => vipStore.isStoryPolished(props.storyId))
const canPolish = computed(() => vipStore.canPolish(props.storyId))

const label = computed(() => {
  if (isPolished.value) return '已擦亮'
  if (!vipStore.isVipActive) return 'VIP擦亮'
  if (vipStore.polishRemaining <= 0) return '次数已用'
  return '擦亮'
})

const tooltipText = computed(() => {
  if (isPolished.value) return '故事正在推荐回流中'
  if (!vipStore.isVipActive) return '开通VIP即可擦亮故事'
  if (vipStore.polishRemaining <= 0) return '本月擦亮次数已用完'
  return `擦亮故事，使其重新进入推荐（剩余${vipStore.polishRemaining}次）`
})

const countdownText = computed(() => {
  const h = Math.floor(countdownSeconds.value / 3600)
  const m = Math.floor((countdownSeconds.value % 3600) / 60)
  const s = countdownSeconds.value % 60
  return `${h}时${String(m).padStart(2, '0')}分${String(s).padStart(2, '0')}秒`
})

function handlePolish() {
  if (props.disabled || isPolished.value) return

  if (!vipStore.isVipActive) {
    emit('error', { type: 'not_vip', message: '开通VIP即可使用擦亮功能' })
    return
  }

  if (!canPolish.value) {
    emit('error', { type: 'no_quota', message: '本月擦亮次数已用完' })
    return
  }

  const success = vipStore.polishStory(props.storyId)
  if (success) {
    showToast.value = true
    startCountdown()
    emit('polished', { storyId: props.storyId })

    toastTimer = setTimeout(() => {
      showToast.value = false
    }, 4000)
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

.polish-btn__count {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 2px;
}

@keyframes polish-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 0 12px rgba(255, 215, 0, 0.4); }
}

/* --- Toast --- */
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

/* Toast transitions */
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
