<template>
  <Teleport to="body">
    <transition name="font-picker-slide">
      <div
        v-if="visible"
        class="effect-picker-panel"
        :class="{ dark: isDark }"
        @click.stop
      >
        <div class="fp-header">
          <h3 class="fp-title">✨ 字体特效</h3>
          <button class="fp-close" @click="$emit('close')">×</button>
        </div>
        <p class="fp-hint">{{ hintText }}</p>

        <div class="effect-section">
          <h4 class="effect-section-title">纯色</h4>
          <div class="effect-grid">
            <button
              v-for="color in SOLID_COLORS"
              :key="color.key"
              class="effect-chip"
              :class="{ active: currentEffect === color.key, dark: isDark }"
              :style="{ '--chip-color': color.value }"
              @click="handleApply(color.key)"
            >
              <span class="effect-dot" :style="{ background: color.value }"></span>
              {{ color.label }}
            </button>
          </div>
        </div>

        <div class="effect-section">
          <h4 class="effect-section-title">流光动画</h4>
          <div class="effect-grid">
            <button
              v-for="effect in FLOW_EFFECTS"
              :key="effect.key"
              class="effect-chip"
              :class="[
                { active: currentEffect === effect.key, dark: isDark },
                `preview-${effect.key}`
              ]"
              @click="handleApply(effect.key)"
            >
              {{ effect.label }}
            </button>
          </div>
        </div>

        <button v-if="currentEffect" class="fp-clear-btn" :class="{ dark: isDark }" @click="handleClear">
          清除特效
        </button>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useVipStore } from '../stores/vip'
import { showToast } from '../composables/useToast'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
  targetType: { type: String, default: 'global' },
  selectedEffect: { type: String, default: '' }
})

const emit = defineEmits(['close', 'select'])

const vipStore = useVipStore()

const currentEffect = ref(props.selectedEffect || '')

const hintText = computed(() => {
  const tips = {
    story: '选择一种颜色或流光效果应用到这篇故事',
    comment: '选择一种颜色或流光效果应用到这条评论',
    bio: '选择一种颜色或流光效果应用到个性签名',
    global: '选择一种颜色或流光效果作为默认'
  }
  return tips[props.targetType] || tips.global
})

const SOLID_COLORS = [
  { key: 'color_gold', label: '金色', value: '#d4a017' },
  { key: 'color_pink', label: '粉色', value: '#e84393' },
  { key: 'color_blue', label: '天蓝', value: '#0984e3' },
  { key: 'color_green', label: '翠绿', value: '#00b894' },
  { key: 'color_red', label: '红色', value: '#d63031' },
  { key: 'color_purple', label: '紫色', value: '#6c5ce7' },
  { key: 'color_cyan', label: '青色', value: '#00cec9' },
  { key: 'color_orange', label: '橙色', value: '#e17055' },
]

const FLOW_EFFECTS = [
  { key: 'flow_rainbow', label: '彩虹流光' },
  { key: 'flow_gold', label: '金色流光' },
  { key: 'flow_sunset', label: '日落流光' },
  { key: 'flow_ocean', label: '海洋流光' },
  { key: 'flow_aurora', label: '极光流光' },
  { key: 'flow_neon', label: '霓虹流光' },
  { key: 'flow_sakura', label: '樱花流光' },
  { key: 'flow_starry', label: '星空流光' },
]

watch(() => props.visible, (v) => {
  if (v) {
    currentEffect.value = props.selectedEffect || ''
  }
})

watch(() => props.selectedEffect, (val) => {
  if (props.visible) {
    currentEffect.value = val || ''
  }
})

function handleApply(key) {
  if (!vipStore.isVipActive) {
    showToast('请先开通 VIP 后使用字体特效', 'warning')
    return
  }
  currentEffect.value = key
  emit('select', key)
  showToast('特效已选择', 'success')
}

function handleClear() {
  currentEffect.value = ''
  emit('select', '')
  showToast('已清除特效', 'success')
}
</script>

<style scoped>
.effect-picker-panel {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1101;
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(160deg, rgba(255, 250, 235, 0.97), rgba(255, 243, 210, 0.98));
  backdrop-filter: blur(24px) saturate(1.4);
  border-radius: 28px;
  border: 1px solid rgba(184, 135, 46, 0.25);
  box-shadow: 0 24px 48px -20px rgba(120, 80, 10, 0.15);
  color: #4d2f14;
}

.effect-picker-panel.dark {
  background: linear-gradient(160deg, rgba(15, 22, 42, 0.97), rgba(24, 36, 62, 0.98));
  border-color: rgba(141, 176, 235, 0.22);
  color: #edf3ff;
}

.fp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.fp-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.fp-close {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(184, 135, 46, 0.3);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  color: #4d2f14;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.fp-close:hover {
  background: rgba(184, 135, 46, 0.2);
}

.effect-picker-panel.dark .fp-close {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(100, 130, 180, 0.25);
  color: #dce6f5;
}

.effect-picker-panel.dark .fp-close:hover {
  background: rgba(100, 130, 180, 0.15);
}

.fp-hint {
  margin: 0 0 18px;
  font-size: 12px;
  opacity: 0.55;
}

.effect-section {
  margin-bottom: 20px;
}

.effect-section-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  opacity: 0.7;
}

.effect-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
}

.effect-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid rgba(184, 135, 46, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  color: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.effect-chip:hover {
  border-color: rgba(184, 135, 46, 0.25);
  transform: translateY(-1px);
}

.effect-chip.dark {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(100, 130, 180, 0.12);
}

.effect-chip.dark:hover {
  border-color: rgba(100, 130, 180, 0.25);
}

.effect-chip.active:not([class*="preview-flow"]) {
  border-color: rgba(218, 180, 60, 0.5);
  background: rgba(255, 223, 120, 0.15);
}

.effect-chip.active.dark:not([class*="preview-flow"]) {
  border-color: rgba(123, 156, 224, 0.4);
  background: rgba(123, 156, 224, 0.1);
}

/* 流光选项选中时仅用边框和阴影标识，不覆盖渐变背景 */
.effect-chip.active[class*="preview-flow"] {
  border-color: rgba(218, 180, 60, 0.5);
  box-shadow: 0 0 8px rgba(218, 180, 60, 0.3);
}

.effect-chip.active.dark[class*="preview-flow"] {
  border-color: rgba(123, 156, 224, 0.4);
  box-shadow: 0 0 8px rgba(123, 156, 224, 0.3);
}

.effect-dot {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.effect-chip.active .effect-dot {
  box-shadow: 0 0 6px var(--chip-color);
}

/* 流光预览效果 */
.effect-chip.preview-flow_rainbow {
  background: linear-gradient(90deg, #ff6b6b, #ffa502, #ffd43b, #51cf66, #339af0, #845ef7, #ff6b6b);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: rainbow-flow 2s linear infinite;
}

.effect-chip.preview-flow_gold {
  background: linear-gradient(90deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gold-flow 2s linear infinite;
}

.effect-chip.preview-flow_sunset {
  background: linear-gradient(90deg, #ff6b6b, #ee5a24, #f0932b, #ffbe76, #ff6b6b);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: sunset-flow 2s linear infinite;
}

.effect-chip.preview-flow_ocean {
  background: linear-gradient(90deg, #0984e3, #00cec9, #74b9ff, #00b894, #0984e3);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ocean-flow 2s linear infinite;
}

.effect-chip.preview-flow_aurora {
  background: linear-gradient(90deg, #a29bfe, #6c5ce7, #00cec9, #55efc4, #a29bfe);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: aurora-flow 2s linear infinite;
}

.effect-chip.preview-flow_neon {
  background: linear-gradient(90deg, #ff00ff, #00ffff, #ff00ff, #ffff00, #ff00ff);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: neon-flow 1.5s linear infinite;
}

.effect-chip.preview-flow_sakura {
  background: linear-gradient(90deg, #fd79a8, #e84393, #fab1a0, #fd79a8);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: sakura-flow 2s linear infinite;
}

.effect-chip.preview-flow_starry {
  background: linear-gradient(90deg, #2d3436, #636e72, #dfe6e9, #b2bec3, #2d3436);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: starry-flow 3s linear infinite;
}

@keyframes rainbow-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes gold-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes sunset-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes ocean-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes aurora-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes neon-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes sakura-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes starry-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.fp-clear-btn {
  display: block;
  width: 100%;
  margin-top: 14px;
  padding: 10px;
  border: 1px solid rgba(184, 135, 46, 0.2);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.4);
  color: #8e6c1a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.fp-clear-btn:hover {
  background: rgba(184, 135, 46, 0.12);
}

.fp-clear-btn.dark {
  border-color: rgba(100, 130, 180, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: #a0b8e0;
}

.fp-clear-btn.dark:hover {
  background: rgba(100, 130, 180, 0.12);
}

/* 过渡动画 */
.font-picker-slide-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.font-picker-slide-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.font-picker-slide-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}

.font-picker-slide-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}
</style>
