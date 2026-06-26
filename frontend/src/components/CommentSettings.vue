<template>
  <Teleport to="body">
    <transition name="cs-fade">
      <div
        v-if="visible"
        class="comment-settings-shell"
        :class="{ 'comment-settings-shell--high': highZIndex }"
      >
        <div class="comment-settings" :class="{ 'comment-settings--dark': isDark }" @click.stop>
      <!-- Header -->
      <div class="cs-header">
        <div class="cs-header__left">
          <span class="cs-header__icon">🎨</span>
          <span class="cs-header__title">评论装扮</span>
          <span v-if="vipStore.isVipActive" class="cs-vip-badge">VIP</span>
        </div>
        <button class="cs-close" @click="handleClose" aria-label="关闭">
          <span>✕</span>
        </button>
      </div>

      <!-- Purchase Gate (non-VIP, no active bubble decor) -->
      <div v-if="!canUseBubbleDecor" class="cs-vip-gate">
        <span class="cs-vip-gate__icon">🎨</span>
        <p class="cs-vip-gate__title">评论背景装扮</p>
        <p class="cs-vip-gate__desc">自定义你的评论背景样式，让其他用户看到你独特的评论风格</p>
        <p class="cs-vip-gate__desc">VIP 用户免费使用；非 VIP 可花费 {{ BUBBLE_DECOR_COST }} 币解锁 7 天</p>
        <button class="cs-vip-gate__btn" :disabled="purchasing" @click="handlePurchaseBubbleDecor">
          <span v-if="purchasing">购买中...</span>
          <span v-else>🪙 {{ BUBBLE_DECOR_COST }} 币解锁 7 天</span>
        </button>
        <p v-if="purchaseError" class="cs-vip-gate__error">{{ purchaseError }}</p>
      </div>

      <!-- Settings Content -->
      <template v-else>
        <div class="cs-body">
          <!-- Gradient Toggle -->
          <section class="cs-section">
            <h3 class="cs-section__title">
              <span>✨</span>
              <span>渐变模式</span>
            </h3>
            <p class="cs-section__desc">开启后可设置双色渐变效果</p>
            <label class="cs-toggle-wrap" @click="useGradient = !useGradient">
              <span class="cs-toggle-track" :class="{ 'cs-toggle-track--on': useGradient }">
                <span class="cs-toggle-thumb"></span>
              </span>
              <span class="cs-toggle-label">{{ useGradient ? '已开启' : '已关闭' }}</span>
            </label>
          </section>

          <!-- Color Pickers -->
          <section class="cs-section cs-section--color">
            <h3 class="cs-section__title">
              <span>🎨</span>
              <span>{{ useGradient ? '渐变色设置' : '纯色设置' }}</span>
            </h3>

            <!-- Primary Color -->
            <div class="cs-color-row">
              <label class="cs-color-label">{{ useGradient ? '起始色' : '背景色' }}</label>
              <div class="cs-color-picker-group">
                <input
                  type="color"
                  v-model="primaryColor"
                  class="cs-color-input-native"
                  :title="'选择颜色'"
                />
                <div class="cs-color-swatch-large" :style="{ background: primaryColor }">
                  <span class="cs-color-hex">{{ primaryColor.toUpperCase() }}</span>
                </div>
              </div>
            </div>

            <!-- Secondary Color (gradient only) -->
            <div v-if="useGradient" class="cs-color-row">
              <label class="cs-color-label">结束色</label>
              <div class="cs-color-picker-group">
                <input
                  type="color"
                  v-model="secondaryColor"
                  class="cs-color-input-native"
                  title="选择渐变结束色"
                />
                <div class="cs-color-swatch-large" :style="{ background: secondaryColor }">
                  <span class="cs-color-hex">{{ secondaryColor.toUpperCase() }}</span>
                </div>
              </div>
            </div>

            <!-- Preset Colors (quick pick) -->
            <div class="cs-presets">
              <span class="cs-presets-label">快捷选色</span>
              <!-- Gradient mode: target switcher -->
              <div v-if="useGradient" class="cs-preset-tabs">
                <button
                  class="cs-preset-tab"
                  :class="{ 'cs-preset-tab--active': presetTarget === 'primary' }"
                  @click="presetTarget = 'primary'"
                >起始色</button>
                <button
                  class="cs-preset-tab"
                  :class="{ 'cs-preset-tab--active': presetTarget === 'secondary' }"
                  @click="presetTarget = 'secondary'"
                >结束色</button>
              </div>
              <div class="cs-presets-grid">
                <button
                  v-for="(c, i) in presetColors"
                  :key="i"
                  class="cs-preset-btn"
                  :class="{ 'cs-preset-btn--active': isPresetActive(c) }"
                  :style="{ background: c }"
                  @click="applyPreset(c)"
                  :title="c"
                ></button>
              </div>
            </div>

            <!-- Gradient Direction (gradient only) -->
            <div v-if="useGradient" class="cs-gradient-dir">
              <span class="cs-presets-label">渐变方向</span>
              <div class="cs-dir-grid">
                <button
                  v-for="dir in gradientDirections"
                  :key="dir.value"
                  class="cs-dir-btn"
                  :class="{ 'cs-dir-btn--active': gradientDirection === dir.value }"
                  @click="gradientDirection = dir.value"
                  :title="dir.label"
                >
                  <span class="cs-dir-arrow" :style="{ transform: dir.rotate }">→</span>
                </button>
              </div>
            </div>
          </section>

          <!-- Preview -->
          <section class="cs-section cs-section--preview">
            <h3 class="cs-section__title">
              <span>👁</span>
              <span>效果预览</span>
            </h3>
            <div class="cs-preview-area" :style="previewStyle">
              <div class="cs-preview-comment">
                <div class="cs-preview-avatar">😊</div>
                <div class="cs-preview-bubble">
                  <span class="cs-preview-name">{{ vipStore.isVipActive ? 'VIP用户' : '我的评论' }}</span>
                  <span class="cs-preview-text">这就是其他用户看到我评论时显示的背景效果</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Actions -->
        <div class="cs-actions">
          <button class="cs-action-btn cs-action-btn--secondary" @click="resetSettings">重置</button>
          <button class="cs-action-btn cs-action-btn--primary" :disabled="saving" @click="saveSettings">
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </template>
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
  highZIndex: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'request-vip', 'saved'])

const vipStore = useVipStore()

const BUBBLE_DECOR_COST = 100
const purchasing = ref(false)
const purchaseError = ref('')
const saving = ref(false)

const canUseBubbleDecor = computed(() => {
  if (vipStore.isVipActive) return true
  return vipStore.hasActiveItem('bubble_decor_7d')
})

async function handlePurchaseBubbleDecor() {
  if (purchasing.value) return
  purchasing.value = true
  purchaseError.value = ''
  const result = await vipStore.useBubbleDecor()
  if (!result.success) {
    purchaseError.value = result.message
  }
  purchasing.value = false
}

const useGradient = ref(false)
const primaryColor = ref('#fff8e7')
const secondaryColor = ref('#fcb69f')
const gradientDirection = ref(135)
const presetTarget = ref('primary')

const presetColors = [
  '#fff8e7', '#ffecd2', '#fce4ec', '#fef2f2',
  '#f0f9ff', '#e0f2fe', '#f0fdf4', '#ecfdf5',
  '#faf5ff', '#fdf4ff', '#fce7f3', '#ffe4e6',
  '#1a1a2e', '#16213e', '#0f3460', '#1b1b2f',
]

const gradientDirections = [
  { value: 135, label: '左上到右下', rotate: 'rotate(45deg)' },
  { value: 180, label: '上到下', rotate: 'rotate(90deg)' },
  { value: 90, label: '左到右', rotate: 'rotate(0deg)' },
  { value: 225, label: '右上到左下', rotate: 'rotate(-45deg)' },
]

function isPresetActive(color) {
  if (useGradient.value) {
    if (presetTarget.value === 'primary') {
      return primaryColor.value.toLowerCase() === color.toLowerCase()
    }
    return secondaryColor.value.toLowerCase() === color.toLowerCase()
  }
  return primaryColor.value.toLowerCase() === color.toLowerCase()
}

function applyPreset(color) {
  if (useGradient.value && presetTarget.value === 'secondary') {
    secondaryColor.value = color
  } else {
    primaryColor.value = color
  }
}

watch(() => props.visible, (val) => {
  if (val && vipStore.savedCommentBg) {
    initFromSaved(vipStore.savedCommentBg)
  }
})

function initFromSaved(saved) {
  if (!saved) return
  useGradient.value = !!saved.useGradient
  primaryColor.value = saved.color || '#fff8e7'
  secondaryColor.value = saved.gradientColor || '#fcb69f'
  gradientDirection.value = saved.gradientDirection || 135
}

const previewStyle = computed(() => {
  if (useGradient.value) {
    return {
      background: `linear-gradient(${gradientDirection.value}deg, ${primaryColor.value}, ${secondaryColor.value})`,
    }
  }
  return {
    background: primaryColor.value,
  }
})

function handleClose() { emit('close') }

function resetSettings() {
  useGradient.value = false
  primaryColor.value = '#fff8e7'
  secondaryColor.value = '#fcb69f'
  gradientDirection.value = 135
  vipStore.setCommentBg(null)
  showToast('设置已重置')
}

async function saveSettings() {
  saving.value = true
  try {
    if (!vipStore.isVipActive) {
      showToast('开通 VIP 后即可自定义评论背景', 'warning')
      return
    }

    const bgConfig = {
      type: useGradient.value ? 'gradient' : 'solid',
      color: primaryColor.value,
      gradientColor: secondaryColor.value,
      useGradient: useGradient.value,
      gradientDirection: gradientDirection.value,
    }

    await vipStore.syncCommentBg(bgConfig)
    vipStore.setCommentBg(bgConfig)

    emit('saved', bgConfig)
    showToast('评论背景已保存，其他用户将看到你的专属背景样式')
    handleClose()
  } catch (err) {
    showToast('保存失败，请稍后重试', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.comment-settings-shell {
  position: fixed;
  inset: 0;
  z-index: 1102;
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  pointer-events: none;
}

.comment-settings-shell--high {
  z-index: 12000;
}

.comment-settings {
  width: min(420px, calc(100vw - 32px));
  pointer-events: auto;
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

.comment-settings--dark {
  background: linear-gradient(160deg, rgba(24, 28, 50, 0.98), rgba(32, 40, 68, 0.98));
  border-color: rgba(143, 180, 255, 0.2);
  color: #edf3ff;
}

.cs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.cs-header__left { display: flex; align-items: center; gap: 8px; }
.cs-header__icon { font-size: 20px; }
.cs-header__title { font-size: 17px; font-weight: 700; }

.cs-vip-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.cs-close {
  width: 32px; height: 32px; border-radius: 10px;
  border: none; background: rgba(184, 135, 46, 0.1);
  color: inherit; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.22s ease;
}
.cs-close:hover { background: rgba(184, 135, 46, 0.2); }

.cs-vip-gate {
  text-align: center;
  padding: 36px 16px;
  opacity: 0.85;
}

.cs-vip-gate__icon { font-size: 44px; display: block; margin-bottom: 12px; }

.cs-vip-gate__title { font-size: 17px; font-weight: 700; margin: 0 0 8px; }

.cs-vip-gate__desc { font-size: 13px; opacity: 0.55; margin: 0 0 6px; line-height: 1.6; }

.cs-vip-gate__btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 11px 26px; border-radius: 999px; border: none;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a; font-size: 14px; font-weight: 700; cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 14px;
}
.cs-vip-gate__btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px -6px rgba(255, 215, 0, 0.45); }
.cs-vip-gate__btn:disabled { opacity: 0.65; cursor: not-allowed; }

.cs-vip-gate__error {
  margin-top: 8px;
  font-size: 12px;
  color: #c44;
  opacity: 0.85;
}

.cs-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cs-section {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(184, 135, 46, 0.09);
}

.comment-settings--dark .cs-section {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(143, 180, 255, 0.08);
}

.cs-section--color {
  background: rgba(255, 215, 0, 0.04);
  border-color: rgba(255, 215, 0, 0.15);
}

.comment-settings--dark .cs-section--color {
  background: rgba(255, 215, 0, 0.03);
  border-color: rgba(255, 215, 0, 0.1);
}

.cs-section--preview {
  padding: 16px;
  background: transparent;
  border: none;
}

.cs-section__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 700; margin: 0 0 6px;
}

.cs-section__desc {
  font-size: 12px; opacity: 0.5; margin: 0 0 14px;
}

.cs-toggle-wrap {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; user-select: none;
}

.cs-toggle-track {
  position: relative;
  width: 48px; height: 26px;
  border-radius: 13px;
  background: rgba(184, 135, 46, 0.2);
  transition: all 0.28s ease;
  border: 1px solid rgba(184, 135, 46, 0.15);
}

.cs-toggle-track--on {
  background: linear-gradient(135deg, #ffd700, #f5a623);
  border-color: rgba(255, 215, 0, 0.4);
}

.cs-toggle-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cs-toggle-track--on .cs-toggle-thumb {
  left: 24px;
}

.cs-toggle-label {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.7;
}

.cs-color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
}

.cs-color-label {
  font-size: 13px;
  font-weight: 600;
  min-width: 52px;
  opacity: 0.75;
}

.cs-color-picker-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cs-color-input-native {
  -webkit-appearance: none;
  appearance: none;
  width: 40px; height: 40px;
  border: none; border-radius: 10px;
  cursor: pointer; background: transparent;
  padding: 0;
}

.cs-color-input-native::-webkit-color-swatch-wrapper {
  padding: 0;
}

.cs-color-input-native::-webkit-color-swatch {
  border: 2px solid rgba(184, 135, 46, 0.2);
  border-radius: 10px;
}

.cs-color-input-native::-moz-color-swatch {
  border: 2px solid rgba(184, 135, 46, 0.2);
  border-radius: 10px;
}

.cs-color-swatch-large {
  min-width: 90px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid rgba(184, 135, 46, 0.18);
  padding: 0 10px;
  transition: border-color 0.2s ease;
}

.cs-color-hex {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}

.cs-presets {
  margin-top: 14px;
}

.cs-presets-label {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.5;
  display: block;
  margin-bottom: 8px;
}

.cs-preset-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.cs-preset-tab {
  flex: 1;
  height: 28px;
  border-radius: 8px;
  border: 1.5px solid rgba(184, 135, 46, 0.15);
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-preset-tab:hover {
  background: rgba(255, 215, 0, 0.08);
}

.cs-preset-tab--active {
  border-color: rgba(255, 215, 0, 0.45);
  background: rgba(255, 215, 0, 0.12);
  color: #b8860b;
}

.cs-presets-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.cs-preset-btn {
  aspect-ratio: 1;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.cs-preset-btn:hover {
  transform: scale(1.12);
  z-index: 1;
}

.cs-preset-btn--active {
  border-color: #ffd700;
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.25), 0 2px 8px rgba(255, 215, 0, 0.3);
  transform: scale(1.08);
}

.cs-gradient-dir {
  margin-top: 14px;
}

.cs-dir-grid {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.cs-dir-btn {
  flex: 1;
  height: 36px;
  border-radius: 9px;
  border: 1.5px solid rgba(184, 135, 46, 0.15);
  background: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 14px;
  color: inherit;
}

.cs-dir-btn:hover { background: rgba(255, 255, 255, 0.5); }

.cs-dir-btn--active {
  border-color: rgba(255, 215, 0, 0.45);
  background: rgba(255, 215, 0, 0.12);
  color: #b8860b;
}

.cs-dir-arrow {
  font-weight: 900;
  font-size: 16px;
  display: block;
  transition: transform 0.2s ease;
}

.cs-preview-area {
  border-radius: 16px; padding: 16px; min-height: 72px;
  overflow: hidden;
  transition: background 0.35s ease;
}

.cs-preview-comment {
  display: flex; gap: 12px; align-items: flex-start;
}

.cs-preview-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.cs-preview-bubble {
  padding: 10px 14px; border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
  flex: 1;
  min-width: 0;
}

.cs-preview-name { font-size: 12px; font-weight: 800; display: block; margin-bottom: 3px; opacity: 0.85; }

.cs-preview-text { font-size: 13px; opacity: 0.75; line-height: 1.6; word-break: break-word; }

.cs-actions {
  display: flex; gap: 10px; justify-content: flex-end;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid rgba(184, 135, 46, 0.08);
}

.cs-action-btn {
  padding: 9px 22px; border-radius: 999px; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.22s ease;
}

.cs-action-btn--secondary {
  background: rgba(184, 135, 46, 0.1); color: inherit;
}

.cs-action-btn--primary {
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  min-width: 88px;
}

.cs-action-btn:hover:not(:disabled) { transform: translateY(-1px); }
.cs-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.cs-fade-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.cs-fade-leave-active { transition: all 0.22s ease; }
.cs-fade-enter-from { opacity: 0; transform: translateX(20px) scale(0.96); }
.cs-fade-leave-to { opacity: 0; transform: translateX(12px) scale(0.98); }

@media (max-width: 480px) {
  .comment-settings-shell {
    padding: 8px;
    align-items: flex-start;
  }
  .comment-settings {
    width: auto;
    max-width: none;
    max-height: calc(100vh - 16px);
    padding: 18px;
    border-radius: 22px;
  }
  .cs-presets-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}
</style>
