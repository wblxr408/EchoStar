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

      <!-- Tab switcher -->
      <div class="vc-tabs">
        <button
          class="vc-tab"
          :class="{ 'vc-tab--active': activeTab === 'emotion' }"
          @click="activeTab = 'emotion'"
        >
          <span>🎭</span><span>情绪标签</span>
        </button>
        <button
          class="vc-tab"
          :class="{ 'vc-tab--active': activeTab === 'profile' }"
          @click="activeTab = 'profile'"
        >
          <span>🖼</span><span>我的背景</span>
        </button>
      </div>

      <!-- === Emotion Tab === -->
      <div v-if="activeTab === 'emotion'" class="vc-tab-content">
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
              <span class="vc-vip-tag">VIP</span>
            </h3>
            <span v-if="!vipStore.isVipActive" class="vc-lock-hint">🔒 开通VIP解锁</span>
          </div>
          <div class="vc-emotion-grid" :class="{ 'vc-emotion-grid--locked': !vipStore.isVipActive }">
            <button
              v-for="e in vipEmotions"
              :key="e.value"
              class="vc-emotion-item vc-emotion-item--vip"
              :class="{ 'vc-emotion-item--selected': isEmotionSelected(e.value) }"
              :disabled="!vipStore.isVipActive"
              @click="vipStore.isVipActive && toggleEmotion(e.value)"
            >
              <span class="vc-emotion-icon">{{ e.icon }}</span>
              <span class="vc-emotion-label">{{ e.label }}</span>
              <span v-if="!vipStore.isVipActive" class="vc-emotion-lock">🔒</span>
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
      </div>

      <!-- === Profile Background Tab === -->
      <div v-if="activeTab === 'profile'" class="vc-tab-content">
        <div v-if="!vipStore.isVipActive" class="vc-vip-gate">
          <span class="vc-vip-gate__icon">🔒</span>
          <p class="vc-vip-gate__title">个人主页背景仅限 VIP</p>
          <p class="vc-vip-gate__desc">开通 VIP 后可设置专属个人主页背景</p>
          <button class="vc-vip-gate__btn" @click="$emit('request-vip')">
            <span>👑</span><span>了解 VIP</span>
          </button>
        </div>

        <template v-else>
          <!-- Background type -->
          <section class="vc-section">
            <h3 class="vc-section__title">背景类型</h3>
            <div class="vc-bg-type-tabs">
              <button
                v-for="t in profileBgTypes"
                :key="t.value"
                class="vc-bg-type-btn"
                :class="{ 'vc-bg-type-btn--active': profileBgType === t.value }"
                @click="profileBgType = t.value"
              >{{ t.label }}</button>
            </div>
          </section>

          <!-- Preset gradients -->
          <section v-if="profileBgType === 'gradient'" class="vc-section">
            <h3 class="vc-section__title">选择渐变</h3>
            <div class="vc-gradient-grid">
              <button
                v-for="(g, i) in profileGradients"
                :key="i"
                class="vc-gradient-item"
                :class="{ 'vc-gradient-item--active': profileBgValue === g.css }"
                :style="{ background: g.css }"
                @click="profileBgValue = g.css"
              >
                <span class="vc-gradient-name">{{ g.name }}</span>
              </button>
            </div>
          </section>

          <!-- Theme backgrounds -->
          <section v-if="profileBgType === 'theme'" class="vc-section">
            <h3 class="vc-section__title">主题背景</h3>
            <div class="vc-theme-grid">
              <button
                v-for="(t, i) in themeBackgrounds"
                :key="i"
                class="vc-theme-item"
                :class="{ 'vc-theme-item--active': profileBgValue === t.css }"
                @click="profileBgValue = t.css"
              >
                <div class="vc-theme-preview" :style="{ background: t.css }">
                  <span class="vc-theme-emoji">{{ t.emoji }}</span>
                </div>
                <span class="vc-theme-name">{{ t.name }}</span>
              </button>
            </div>
          </section>

          <!-- Custom image upload -->
          <section v-if="profileBgType === 'image'" class="vc-section">
            <h3 class="vc-section__title">上传背景图片</h3>
            <div class="vc-upload-area" @click="triggerUpload">
              <div v-if="!profileBgValue" class="vc-upload-placeholder">
                <span>📷</span>
                <p>点击上传背景图片</p>
                <p class="vc-upload-hint">建议 1920×1080，支持 JPG/PNG</p>
              </div>
              <div v-else class="vc-upload-preview" :style="{ backgroundImage: `url(${profileBgValue})` }"></div>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="vc-file-input" @change="handleFileUpload" />
          </section>

          <!-- Live preview -->
          <div class="vc-profile-preview" :style="profilePreviewStyle">
            <div class="vc-profile-preview__card">
              <div class="vc-profile-preview__avatar">😊</div>
              <div class="vc-profile-preview__name">我的主页</div>
              <div class="vc-profile-preview__bio">这是一个预览效果</div>
            </div>
          </div>
        </template>
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
import { EMOTIONS, getEmotionEmoji, getEmotionColor } from '../utils/emotion'
import { showToast } from '../composables/useToast'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'request-vip', 'saved'])

const vipStore = useVipStore()

// Tabs
const activeTab = ref('emotion')

// === Emotion Tab ===
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

// === Profile Background Tab ===
const profileBgTypes = [
  { label: '渐变', value: 'gradient' },
  { label: '主题', value: 'theme' },
  { label: '图片', value: 'image' },
]

const profileBgType = ref('gradient')
const profileBgValue = ref(null)
const fileInput = ref(null)

const profileGradients = [
  { name: '落日', css: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { name: '深海', css: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { name: '森林', css: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { name: '星空', css: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { name: '极光', css: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { name: '暖阳', css: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
]

const themeBackgrounds = [
  { name: '星夜', emoji: '🌃', css: 'radial-gradient(ellipse at top, #1a1a2e, #16213e)' },
  { name: '沙漠', emoji: '🏜️', css: 'linear-gradient(180deg, #f5af19, #f12711)' },
  { name: '海洋', emoji: '🌊', css: 'linear-gradient(180deg, #2193b0, #6dd5ed)' },
  { name: '樱花', emoji: '🌸', css: 'linear-gradient(180deg, #fbc2eb, #a6c1ee)' },
]

const profilePreviewStyle = computed(() => {
  if (!profileBgValue.value) {
    return { background: 'rgba(184, 135, 46, 0.1)' }
  }
  return { background: profileBgValue.value }
})

function triggerUpload() {
  fileInput.value?.click()
}

function handleFileUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    profileBgValue.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

// === Actions ===
function handleClose() { emit('close') }

function resetCustomization() {
  selectedEmotions.value = []
  profileBgType.value = 'gradient'
  profileBgValue.value = null
  vipStore.setEmotionStyles([])
  vipStore.setProfileBg(null)
  showToast('已重置个性化设置')
}

function saveCustomization() {
  vipStore.setEmotionStyles([...selectedEmotions.value])
  if (activeTab.value === 'profile' && profileBgValue.value) {
    const bgConfig = { type: profileBgType.value, value: profileBgValue.value }
    vipStore.setProfileBg(bgConfig)
  }
  emit('saved', {
    emotions: [...selectedEmotions.value],
    profileBg: vipStore.savedProfileBg,
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

/* --- Tabs --- */
.vc-tabs {
  display: flex; gap: 4px;
  padding: 4px; border-radius: 14px;
  background: rgba(184, 135, 46, 0.06);
  margin-bottom: 20px;
}

.vc-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border-radius: 10px; border: none;
  background: transparent; color: inherit;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
}

.vc-tab--active {
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.visual-customizer--dark .vc-tab--active {
  background: rgba(255, 255, 255, 0.1);
}

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

/* Emotion grid */
.vc-emotion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}

.vc-emotion-grid--locked { opacity: 0.5; }

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

.vc-emotion-item--vip:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.vc-emotion-icon { font-size: 22px; }
.vc-emotion-label { font-size: 11px; font-weight: 600; }

.vc-emotion-lock {
  position: absolute; top: 4px; right: 4px;
  font-size: 10px; opacity: 0.6;
}

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

/* --- VIP Gate --- */
.vc-vip-gate {
  text-align: center; padding: 32px 16px; opacity: 0.8;
}
.vc-vip-gate__icon { font-size: 40px; display: block; margin-bottom: 12px; }
.vc-vip-gate__title { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
.vc-vip-gate__desc { font-size: 13px; opacity: 0.6; margin: 0 0 16px; }

.vc-vip-gate__btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 24px; border-radius: 999px; border: none;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a; font-size: 14px; font-weight: 700; cursor: pointer;
}
.vc-vip-gate__btn:hover { transform: translateY(-2px); }

/* --- Profile Background --- */
.vc-bg-type-tabs { display: flex; gap: 4px; }
.vc-bg-type-btn {
  padding: 6px 14px; border-radius: 999px;
  border: 1px solid rgba(184, 135, 46, 0.2);
  background: transparent; color: inherit;
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
}
.vc-bg-type-btn--active {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.4);
}

.vc-gradient-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.vc-gradient-item {
  height: 48px; border-radius: 12px;
  border: 2px solid transparent; cursor: pointer;
  transition: all 0.2s ease; position: relative; overflow: hidden;
}
.vc-gradient-item--active {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}
.vc-gradient-name {
  position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
  font-size: 10px; font-weight: 600; color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

.vc-theme-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.vc-theme-item {
  padding: 8px; border-radius: 12px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer; transition: all 0.2s ease;
  text-align: center;
}
.vc-theme-item--active {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}
.vc-theme-preview {
  height: 48px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.vc-theme-emoji { font-size: 24px; }
.vc-theme-name { font-size: 11px; font-weight: 600; }

/* Upload */
.vc-upload-area {
  border: 2px dashed rgba(184, 135, 46, 0.3);
  border-radius: 16px; padding: 24px;
  text-align: center; cursor: pointer;
  transition: all 0.2s ease;
}
.vc-upload-area:hover { border-color: rgba(184, 135, 46, 0.5); }

.vc-upload-placeholder p { margin: 4px 0; font-size: 13px; }
.vc-upload-hint { font-size: 11px !important; opacity: 0.5; }
.vc-upload-preview {
  height: 120px; border-radius: 12px;
  background-size: cover; background-position: center;
}
.vc-file-input { display: none; }

/* Profile preview */
.vc-profile-preview {
  border-radius: 16px; padding: 32px 16px 16px;
  margin-top: 12px; min-height: 120px;
  display: flex; align-items: flex-end; justify-content: center;
}
.vc-profile-preview__card {
  padding: 16px; border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  text-align: center; width: 100%;
}
.vc-profile-preview__avatar { font-size: 28px; margin-bottom: 4px; }
.vc-profile-preview__name { font-size: 14px; font-weight: 700; color: #4d2f14; }
.vc-profile-preview__bio { font-size: 11px; color: rgba(77, 47, 20, 0.6); }

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
