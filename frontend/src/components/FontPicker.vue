<template>
  <Teleport to="body">
    <transition name="font-picker-slide">
      <div
        v-if="visible"
        class="font-picker-panel"
        :class="{ dark: isDark }"
        @click.stop
      >
        <div class="fp-header">
          <h3 class="fp-title">🔤 个性字体</h3>
          <button class="fp-close" @click="$emit('close')">×</button>
        </div>
        <p class="fp-hint">选择一款你喜欢的字体，应用到所有故事文本</p>
        <div class="fp-list">
          <div
            v-for="font in fontList"
            :key="font.family"
            class="fp-item"
            :class="{ 'fp-item--active': currentFont === font.family, dark: isDark }"
          >
            <div class="fp-preview-area">
              <input
                v-model="font.preview"
                type="text"
                class="fp-preview-input"
                :class="{ dark: isDark }"
                :style="{ fontFamily: `'${font.family}', ${font.fallback}` }"
                @focus="$event.target.select()"
              />
              <span class="fp-font-label" :style="{ fontFamily: `'${font.family}', ${font.fallback}` }">
                {{ font.family }}
              </span>
            </div>
            <button
              class="fp-use-btn"
              :class="{ 'fp-use-btn--active': currentFont === font.family, dark: isDark }"
              @click="handleApply(font.family)"
            >
              {{ currentFont === font.family ? '✓ 已使用' : '👑 使用' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useVipStore } from '../stores/vip'
import { showToast } from '../composables/useToast'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
})

defineEmits(['close'])

const vipStore = useVipStore()

const currentFont = ref(localStorage.getItem('storyFont') || '')

const DEFAULT_FONTS = [
  { family: 'ZCOOL KuaiLe', fallback: 'cursive, sans-serif', preview: 'ZCOOL KuaiLe 站酷快乐体' },
  { family: 'ZCOOL XiaoWei', fallback: 'serif, sans-serif', preview: 'ZCOOL XiaoWei 站酷小薇体' },
  { family: 'ZCOOL QingKe HuangYou', fallback: 'sans-serif', preview: 'ZCOOL QingKe HuangYou' },
  { family: 'Ma Shan Zheng', fallback: 'cursive, sans-serif', preview: 'Ma Shan Zheng 马善政楷体' },
  { family: 'Long Cang', fallback: 'cursive, sans-serif', preview: 'Long Cang 龙藏体' },
  { family: 'Liu Jian Mao Cao', fallback: 'cursive, sans-serif', preview: 'Liu Jian Mao Cao 流建毛草' },
  { family: 'Zhi Mang Xing', fallback: 'cursive, sans-serif', preview: 'Zhi Mang Xing 志莽行书' },
  { family: 'LXGW WenKai', fallback: 'serif, sans-serif', preview: 'LXGW WenKai 霞鹜文楷' },
  { family: 'LXGW WenKai Mono', fallback: 'monospace, sans-serif', preview: 'LXGW WenKai Mono 等宽' },
  { family: 'LXGW WenKai TC', fallback: 'serif, sans-serif', preview: 'LXGW WenKai TC 繁體' },
  { family: 'Noto Serif SC', fallback: "'Georgia', serif", preview: 'Noto Serif SC 思源宋体' },
  { family: 'Noto Sans SC', fallback: 'sans-serif', preview: 'Noto Sans SC 思源黑体' },
  { family: 'Noto Sans HK', fallback: 'sans-serif', preview: 'Noto Sans HK 思源黑體' },
  { family: 'Noto Serif HK', fallback: "'Georgia', serif", preview: 'Noto Serif HK 思源宋體' },
  { family: 'Fan Wen Ti', fallback: 'serif, sans-serif', preview: 'Fan Wen Ti 樊文体' },
  { family: 'Zhi Bi Yun', fallback: 'cursive, sans-serif', preview: 'Zhi Bi Yun 志必云' },
  { family: 'You Zi Yi', fallback: 'cursive, sans-serif', preview: 'You Zi Yi 游字蚁' },
  { family: 'Zhi Hun', fallback: 'cursive, sans-serif', preview: 'Zhi Hun 志魂' },
  { family: 'YouZai', fallback: 'cursive, sans-serif', preview: 'YouZai 优哉体' },
  { family: 'Wind', fallback: 'cursive, sans-serif', preview: 'Wind 风体 Wind' },
  { family: 'Lin Libertine', fallback: 'serif, sans-serif', preview: 'Lin Libertine 林自由体' },
  { family: 'YRDZST', fallback: 'cursive, sans-serif', preview: 'YRDZST 圆体' },
  { family: 'LiJin', fallback: 'cursive, sans-serif', preview: 'LiJin 李金体' },
  { family: 'Douyin Sans', fallback: 'sans-serif', preview: 'Douyin Sans 抖音美好体' },
  { family: 'Douyin Sans Medium', fallback: 'sans-serif', preview: 'Douyin Sans Medium 中等' },
  { family: 'Varela Round', fallback: 'sans-serif', preview: 'Varela Round ABCabc 123' },
  { family: 'Patrick Hand', fallback: 'cursive, sans-serif', preview: 'Patrick Hand 手写风' },
  { family: 'Droid Sans Fallback', fallback: 'sans-serif', preview: 'Droid Sans Fallback' },
]

  const fontList = reactive(DEFAULT_FONTS.map(f => ({ ...f })))

  watch(() => props.visible, (v) => {
  if (v) {
    fontList.splice(0, fontList.length, ...DEFAULT_FONTS.map(f => ({ ...f })))
  }
})

function handleApply(family) {
  if (!vipStore.isVipActive) {
    showToast('请先开通 VIP 后使用个性字体', 'warning')
    return
  }
  currentFont.value = family
  localStorage.setItem('storyFont', family)
  document.documentElement.style.setProperty('--story-font', `'${family}', cursive, sans-serif`)
  showToast('字体已切换', 'success')
}
</script>

<style scoped>
.font-picker-panel {
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

.font-picker-panel.dark {
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

.font-picker-panel.dark .fp-close {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(100, 130, 180, 0.25);
  color: #dce6f5;
}

.font-picker-panel.dark .fp-close:hover {
  background: rgba(100, 130, 180, 0.15);
}

.fp-hint {
  margin: 0 0 18px;
  font-size: 12px;
  opacity: 0.55;
}

.fp-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(184, 135, 46, 0.12);
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.18s ease;
}

.fp-item:hover {
  border-color: rgba(184, 135, 46, 0.25);
  box-shadow: 0 4px 12px -4px rgba(184, 135, 46, 0.12);
}

.fp-item.dark {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(100, 130, 180, 0.12);
}

.fp-item.dark:hover {
  border-color: rgba(100, 130, 180, 0.25);
  box-shadow: 0 4px 12px -4px rgba(100, 130, 180, 0.1);
}

.fp-item--active {
  border-color: rgba(218, 180, 60, 0.5);
  background: rgba(255, 223, 120, 0.15);
}

.fp-item--active.dark {
  border-color: rgba(123, 156, 224, 0.4);
  background: rgba(123, 156, 224, 0.1);
}

.fp-preview-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.fp-preview-input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid rgba(184, 135, 46, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  color: #4d2f14;
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s;
}

.fp-preview-input:focus {
  border-color: rgba(196, 142, 48, 0.5);
}

.fp-preview-input.dark {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(100, 130, 180, 0.2);
  color: #dce6f5;
}

.fp-preview-input.dark:focus {
  border-color: rgba(123, 156, 224, 0.45);
}

.fp-font-label {
  font-size: 10px;
  opacity: 0.45;
  letter-spacing: 0.04em;
}

.fp-use-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 215, 0, 0.25);
  color: #8e6c1a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.fp-use-btn:hover {
  background: rgba(255, 215, 0, 0.4);
  transform: translateY(-1px);
}

.fp-use-btn.dark {
  background: rgba(255, 215, 0, 0.12);
  color: #d4b96a;
}

.fp-use-btn.dark:hover {
  background: rgba(255, 215, 0, 0.22);
}

.fp-use-btn--active {
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
  box-shadow: 0 4px 12px -4px rgba(255, 215, 0, 0.4);
}

.fp-use-btn--active.dark {
  color: #3d2e0a;
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
