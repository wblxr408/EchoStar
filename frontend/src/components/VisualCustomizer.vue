<template>
  <transition name="vc-fade">
    <div v-if="visible" class="visual-customizer" :class="{ 'visual-customizer--dark': isDark }" @click.stop>
      <!-- Header -->
      <div class="vc-header">
        <div class="vc-header__left">
          <span class="vc-header__icon">🎨</span>
          <span class="vc-header__title">视觉个性化</span>
          <span v-if="vipStore.isVipActive" class="vc-vip-badge">VIP</span>
        </div>
        <button class="vc-close" @click="handleClose" aria-label="关闭"><span>✕</span></button>
      </div>

      <!-- Basic emotions (free) -->
      <section class="vc-section">
        <h3 class="vc-section__title">基础标签</h3>
        <div class="vc-emotion-grid">
          <button
            v-for="e in basicEmotions"
            :key="e.value"
            class="vc-emotion-item"
            :class="{ 'vc-emotion-item--selected': isEmotionSelected(e.value) }"
            @click="toggleEmotion(e.value)"
          >
            <span class="vc-emotion-icon">{{ e.icon }}</span>
            <span class="vc-emotion-label">{{ e.label }}</span>
          </button>
        </div>
      </section>

      <!-- VIP emotions -->
      <section class="vc-section vc-section--vip">
        <div class="vc-section__header">
          <h3 class="vc-section__title">
            <span>✨</span><span>VIP 专属标签</span>
            <span v-if="hasVisualAccess" class="vc-vip-tag">VIP</span>
          </h3>
          <span v-if="!hasVisualAccess" class="vc-lock-hint">🔒 解锁后可用</span>
        </div>
        <div v-if="!hasVisualAccess" class="vc-purchase-gate">
          <p class="vc-purchase-gate__desc">VIP 专属标签，非 VIP 可花费 {{ VISUAL_COST }} 币解锁 7 天</p>
          <button class="vc-purchase-gate__btn" :disabled="purchasingVisual" @click="handlePurchaseVisual">
            <span v-if="purchasingVisual">购买中...</span>
            <span v-else>🪙 {{ VISUAL_COST }} 币解锁 7 天</span>
          </button>
          <p v-if="visualPurchaseError" class="vc-purchase-gate__error">{{ visualPurchaseError }}</p>
        </div>
        <div v-else class="vc-emotion-grid">
          <button
            v-for="e in vipEmotions"
            :key="e.value"
            class="vc-emotion-item vc-emotion-item--vip"
            :class="{ 'vc-emotion-item--selected': isEmotionSelected(e.value) }"
            @click="toggleEmotion(e.value)"
          >
            <span class="vc-emotion-icon">{{ e.icon }}</span>
            <span class="vc-emotion-label">{{ e.label }}</span>
          </button>
        </div>
      </section>

      <!-- Selected preview -->
      <div v-if="selectedEmotions.length > 0" class="vc-preview">
        <h4 class="vc-preview__title">已选标签预览</h4>
        <div class="vc-preview__tags">
          <span v-for="val in selectedEmotions" :key="val" class="vc-preview__tag" :style="getEmotionTagStyle(val)">
            {{ getEmotionIcon(val) }} {{ val }}
          </span>
        </div>
      </div>

      <!-- Save -->
      <div class="vc-actions">
        <button class="vc-action-btn vc-action-btn--secondary" @click="resetCustomization">重置</button>
        <button class="vc-action-btn vc-action-btn--primary" @click="saveCustomization">保存</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVipStore } from '../stores/vip'
import { EMOTIONS } from '../utils/emotion'
import { showToast } from '../composables/useToast'

defineProps({
  visible: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'request-vip', 'saved'])

const vipStore = useVipStore()

const VISUAL_COST = 100
const purchasingVisual = ref(false)
const visualPurchaseError = ref('')

const hasVisualAccess = computed(() => {
  if (vipStore.isVipActive) return true
  return vipStore.hasActiveItem('bubble_decor_7d')
})

async function handlePurchaseVisual() {
  if (purchasingVisual.value) return
  purchasingVisual.value = true
  visualPurchaseError.value = ''
  const result = await vipStore.useBubbleDecor()
  if (!result.success) {
    visualPurchaseError.value = result.message
  }
  purchasingVisual.value = false
}

const basicEmotions = EMOTIONS

const vipEmotions = [
  { value: '感动', icon: '🥹', label: '感动', color: '#ff9a9e' },
  { value: '惊喜', icon: '🤩', label: '惊喜', color: '#ffd700' },
  { value: '思念', icon: '🥺', label: '思念', color: '#a18cd1' },
  { value: '感恩', icon: '🙏', label: '感恩', color: '#84fab0' },
  { value: '骄傲', icon: '😤', label: '骄傲', color: '#fbc2eb' },
  { value: '释然', icon: '😮‍💨', label: '释然', color: '#a1c4fd' },
  { value: '期待', icon: '🤞', label: '期待', color: '#ffecd2' },
  { value: '浪漫', icon: '💗', label: '浪漫', color: '#f78cad' },
]

const selectedEmotions = ref([...(vipStore.savedEmotionStyles || [])])

function isEmotionSelected(value) {
  return selectedEmotions.value.includes(value)
}

function toggleEmotion(value) {
  const idx = selectedEmotions.value.indexOf(value)
  if (idx >= 0) {
    selectedEmotions.value.splice(idx, 1)
  } else {
    selectedEmotions.value.push(value)
  }
}

function getEmotionIcon(value) {
  const basic = basicEmotions.find(e => e.value === value)
  if (basic) return basic.icon
  const vip = vipEmotions.find(e => e.value === value)
  if (vip) return vip.icon
  return '🎭'
}

function getEmotionTagStyle(value) {
  const basic = basicEmotions.find(e => e.value === value)
  if (basic) return { borderColor: basic.color, color: basic.color }
  const vip = vipEmotions.find(e => e.value === value)
  if (vip) return { borderColor: vip.color, color: vip.color }
  return {}
}

function handleClose() { emit('close') }

function resetCustomization() {
  selectedEmotions.value = []
  vipStore.setEmotionStyles([])
  showToast('已重置个性化设置')
}

function saveCustomization() {
  vipStore.setEmotionStyles([...selectedEmotions.value])
  emit('saved', {
    emotions: [...selectedEmotions.value],
  })
  showToast('个性化设置已保存')
  handleClose()
}
</script>

<style scoped>
.visual-customizer {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1100;
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(160deg, rgba(255, 250, 235, 0.97), rgba(255, 243, 210, 0.98));
  backdrop-filter: blur(24px) saturate(1.4);
  border-radius: 28px;
  border: 1px solid rgba(184, 135, 46, 0.25);
  box-shadow: 0 24px 48px -20px rgba(120, 80, 10, 0.15);
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #4d2f14;
}

.visual-customizer--dark {
  background: linear-gradient(160deg, rgba(24, 28, 50, 0.98), rgba(32, 40, 68, 0.98));
  border-color: rgba(143, 180, 255, 0.2);
  color: #edf3ff;
}

/* --- Header --- */
.vc-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.vc-header__left { display: flex; align-items: center; gap: 8px; }
.vc-header__icon { font-size: 20px; }
.vc-header__title { font-size: 17px; font-weight: 700; }

.vc-vip-badge {
  padding: 2px 8px; border-radius: 999px;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a; font-size: 10px; font-weight: 800;
}

.vc-close {
  width: 32px; height: 32px; border-radius: 10px;
  border: none; background: rgba(184, 135, 46, 0.1);
  color: inherit; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.22s ease;
}
.vc-close:hover { background: rgba(184, 135, 46, 0.2); }

/* --- Sections --- */
.vc-section {
  margin-bottom: 16px; padding: 14px; border-radius: 14px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(184, 135, 46, 0.08);
}

.visual-customizer--dark .vc-section {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.08);
}

.vc-section--vip {
  border-color: rgba(255, 215, 0, 0.2);
  background: rgba(255, 215, 0, 0.04);
}

.vc-section__header {
  display: flex; align-items: center; justify-content: space-between;
}

.vc-section__title {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 700; margin: 0 0 10px;
}

.vc-vip-tag {
  padding: 1px 6px; border-radius: 999px;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a; font-size: 9px; font-weight: 800;
}

.vc-lock-hint { font-size: 11px; opacity: 0.5; }

/* Purchase gate */
.vc-purchase-gate {
  text-align: center;
  padding: 12px 0;
}

.vc-purchase-gate__desc {
  font-size: 12px;
  opacity: 0.6;
  margin: 0 0 10px;
}

.vc-purchase-gate__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vc-purchase-gate__btn:hover:not(:disabled) { transform: translateY(-1px); }
.vc-purchase-gate__btn:disabled { opacity: 0.55; cursor: not-allowed; }

.vc-purchase-gate__error {
  margin-top: 8px;
  font-size: 11px;
  color: #c44;
  opacity: 0.8;
}

/* Emotion grid */
.vc-emotion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}

.vc-emotion-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 6px; border-radius: 12px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer; transition: all 0.2s ease;
  position: relative;
}

.vc-emotion-item:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

.vc-emotion-item--selected {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.vc-emotion-item--vip {
  background: rgba(255, 215, 0, 0.06);
}

.vc-emotion-icon { font-size: 22px; }
.vc-emotion-label { font-size: 11px; font-weight: 600; }

/* Preview */
.vc-preview {
  padding: 14px; border-radius: 14px;
  background: rgba(255, 255, 255, 0.4);
}

.vc-preview__title {
  font-size: 13px; font-weight: 700; margin: 0 0 8px;
}

.vc-preview__tags { display: flex; flex-wrap: wrap; gap: 6px; }

.vc-preview__tag {
  padding: 4px 10px; border-radius: 999px;
  border: 1.5px solid; font-size: 12px; font-weight: 600;
  background: rgba(255, 255, 255, 0.5);
}

/* --- Actions --- */
.vc-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }

.vc-action-btn {
  padding: 8px 20px; border-radius: 999px; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
}
.vc-action-btn--secondary { background: rgba(184, 135, 46, 0.1); color: inherit; }
.vc-action-btn--primary { background: linear-gradient(135deg, #ffd700, #f5a623); color: #3d2e0a; }
.vc-action-btn:hover { transform: translateY(-1px); }

/* --- Transition --- */
.vc-fade-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.vc-fade-leave-active { transition: all 0.22s ease; }
.vc-fade-enter-from { opacity: 0; transform: translateX(20px) scale(0.96); }
.vc-fade-leave-to { opacity: 0; transform: translateX(12px) scale(0.98); }
</style>
