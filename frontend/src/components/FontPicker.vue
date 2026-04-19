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
          <h3 class="fp-title">🔤 字体样式</h3>
          <button class="fp-close" @click="$emit('close')">×</button>
        </div>
        <p class="fp-hint">{{ hintText }}</p>

        <!-- 第一行：清除字体 -->
        <button v-if="currentFont || currentEffect" class="fp-clear-btn" :class="{ dark: isDark }" @click="handleClear">
          清除字体样式
        </button>

        <!-- 第二行：实时预览 -->
        <div class="fp-preview-box" :class="{ dark: isDark }">
          <input
            v-model="previewText"
            type="text"
            class="fp-preview-input"
            :class="{ dark: isDark }"
            :style="combinedStyle"
            placeholder="输入文字预览效果"
          />
        </div>

        <!-- 字体特效（紧跟预览框） -->
        <div class="fp-section">
          <h4 class="fp-section-title">纯色</h4>
          <div class="effect-grid">
            <button
              v-for="color in SOLID_COLORS"
              :key="color.key"
              class="effect-chip"
              :class="{ active: currentEffect === color.key, dark: isDark }"
              :style="{ '--chip-color': color.value }"
              @click="handleApplyEffect(color.key)"
            >
              <span class="effect-dot" :style="{ background: color.value }"></span>
              {{ color.label }}
            </button>
          </div>
        </div>

        <div class="fp-section">
          <h4 class="fp-section-title">流光动画</h4>
          <div class="effect-grid">
            <button
              v-for="effect in FLOW_EFFECTS"
              :key="effect.key"
              class="effect-chip"
              :class="[
                { active: currentEffect === effect.key, dark: isDark },
                `preview-${effect.key}`
              ]"
              @click="handleApplyEffect(effect.key)"
            >
              {{ effect.label }}
            </button>
          </div>
        </div>

        <!-- 字体列表 -->
        <div class="fp-section">
          <h4 class="fp-section-title">字体</h4>
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
                @click="handleApplyFont(font.family)"
              >
                {{ currentFont === font.family ? '✓ 已使用' : '👑 使用' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useVipStore } from '../stores/vip'
import { useUserStore } from '../stores/user'
import { showToast } from '../composables/useToast'
import { getFontStyle, injectFontEffectAnimations } from '../composables/useFontEffect'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
  targetType: { type: String, default: 'global' },
  selectedFont: { type: String, default: '' },
  selectedEffect: { type: String, default: '' }
})

const emit = defineEmits(['close', 'select', 'selectEffect'])

const vipStore = useVipStore()
injectFontEffectAnimations()

const currentFont = ref(props.selectedFont || '')
const currentEffect = ref(props.selectedEffect || '')
const previewText = ref('当前字体样式预览')

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

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

const combinedStyle = computed(() => getFontStyle(currentFont.value, currentEffect.value))

const hintText = computed(() => {
  const tips = {
    story: '选择字体和特效应用到这篇故事',
    comment: '选择字体和特效应用到这条评论',
    bio: '选择字体和特效应用到个性签名',
    global: '选择字体和特效作为默认样式'
  }
  return tips[props.targetType] || tips.global
})

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
    currentFont.value = props.selectedFont || readCookie('vip_default_font') || ''
    currentEffect.value = props.selectedEffect || readCookie('vip_default_font_effect') || ''
    previewText.value = '当前字体样式预览'
  }
})

watch(() => props.selectedFont, (val) => {
  if (props.visible) currentFont.value = val || ''
})

watch(() => props.selectedEffect, (val) => {
  if (props.visible) currentEffect.value = val || ''
})

function handleApplyFont(family) {
  if (!vipStore.isVipActive) {
    showToast('请先开通 VIP 后使用个性字体', 'warning')
    return
  }
  currentFont.value = family

  if (props.targetType === 'global') {
    const uid = useUserStore().user?.id
    localStorage.setItem('storyFont', family)
    if (uid) localStorage.setItem(`vip_font_${uid}`, family)
    document.documentElement.style.setProperty('--story-font', `'${family}', cursive, sans-serif`)
    document.cookie = `vip_default_font=${encodeURIComponent(family)};path=/;max-age=${365 * 86400};SameSite=Lax`
  }

  emit('select', family)
  emit('selectEffect', currentEffect.value)
  showToast('字体已选择', 'success')
}

function handleApplyEffect(key) {
  if (!vipStore.isVipActive) {
    showToast('请先开通 VIP 后使用字体特效', 'warning')
    return
  }
  currentEffect.value = key

  if (props.targetType === 'global') {
    const uid = useUserStore().user?.id
    if (uid) localStorage.setItem(`vip_font_effect_${uid}`, key)
    document.cookie = `vip_default_font_effect=${encodeURIComponent(key)};path=/;max-age=${365 * 86400};SameSite=Lax`
  }

  emit('select', currentFont.value)
  emit('selectEffect', key)
  showToast('特效已选择', 'success')
}

function handleClear() {
  currentFont.value = ''
  currentEffect.value = ''

  if (props.targetType === 'global') {
    const uid = useUserStore().user?.id
    localStorage.removeItem('storyFont')
    if (uid) {
      localStorage.removeItem(`vip_font_${uid}`)
      localStorage.removeItem(`vip_font_effect_${uid}`)
    }
    document.documentElement.style.removeProperty('--story-font')
    document.cookie = 'vip_default_font=;path=/;max-age=0'
    document.cookie = 'vip_default_font_effect=;path=/;max-age=0'
  }

  emit('select', '')
  emit('selectEffect', '')
  showToast('已清除字体样式', 'success')
}
</script>

<style scoped>
.font-picker-panel {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10000;
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
  margin: 0 0 14px;
  font-size: 12px;
  opacity: 0.55;
}

/* 清除按钮 */
.fp-clear-btn {
  display: block;
  width: 100%;
  margin-bottom: 12px;
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

/* 预览框 */
.fp-preview-box {
  margin-bottom: 16px;
}

.fp-preview-box .fp-preview-input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid rgba(184, 135, 46, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.6);
  color: #4d2f14;
  font-size: 18px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.fp-preview-box .fp-preview-input:focus {
  border-color: rgba(196, 142, 48, 0.5);
}

.fp-preview-box.dark .fp-preview-input {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(100, 130, 180, 0.2);
  color: #dce6f5;
}

.fp-preview-box.dark .fp-preview-input:focus {
  border-color: rgba(123, 156, 224, 0.45);
}

/* 分区 */
.fp-section {
  margin-bottom: 18px;
}

.fp-section-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  opacity: 0.7;
}

/* 字体列表 */
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

.fp-preview-area .fp-preview-input {
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
  box-sizing: border-box;
}

.fp-preview-area .fp-preview-input:focus {
  border-color: rgba(196, 142, 48, 0.5);
}

.fp-preview-area .fp-preview-input.dark {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(100, 130, 180, 0.2);
  color: #dce6f5;
}

.fp-preview-area .fp-preview-input.dark:focus {
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

/* 特效网格 */
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

.effect-chip.active {
  border-color: rgba(218, 180, 60, 0.5);
  background: rgba(255, 223, 120, 0.15);
}

.effect-chip.active.dark {
  border-color: rgba(123, 156, 224, 0.4);
  background: rgba(123, 156, 224, 0.1);
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
