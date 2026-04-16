<template>
  <transition name="cs-fade">
    <div v-if="visible" class="comment-settings" :class="{ 'comment-settings--dark': isDark }" @click.stop>
      <!-- Header -->
      <div class="cs-header">
        <div class="cs-header__left">
          <span class="cs-header__icon">💬</span>
          <span class="cs-header__title">评论高级设置</span>
          <span v-if="vipStore.isVipActive" class="cs-vip-badge">VIP</span>
        </div>
        <button class="cs-close" @click="handleClose" aria-label="关闭">
          <span>✕</span>
        </button>
      </div>

      <!-- VIP Gate -->
      <div v-if="!vipStore.isVipActive" class="cs-vip-gate">
        <span class="cs-vip-gate__icon">🔒</span>
        <p class="cs-vip-gate__title">评论高级设置仅限 VIP</p>
        <p class="cs-vip-gate__desc">开通 VIP 后可自定义评论时间窗口、关键词过滤、评论背景等</p>
        <button class="cs-vip-gate__btn" @click="$emit('request-vip')">
          <span>👑</span>
          <span>了解 VIP</span>
        </button>
      </div>

      <!-- Settings Content -->
      <template v-else>
        <!-- Time Window -->
        <section class="cs-section">
          <h3 class="cs-section__title">
            <span>⏰</span>
            <span>评论时间窗口</span>
          </h3>
          <p class="cs-section__desc">设置故事发布后允许评论的时间范围</p>
          <div class="cs-time-options">
            <button
              v-for="opt in timeOptions"
              :key="opt.value"
              class="cs-time-btn"
              :class="{ 'cs-time-btn--active': timeWindow === opt.value }"
              @click="timeWindow = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </section>

        <!-- Keyword Filter -->
        <section class="cs-section">
          <h3 class="cs-section__title">
            <span>🚫</span>
            <span>关键词过滤</span>
          </h3>
          <p class="cs-section__desc">包含这些关键词的评论将被自动隐藏</p>
          <div class="cs-keyword-input-wrap">
            <input
              v-model="newKeyword"
              class="cs-keyword-input"
              type="text"
              placeholder="输入关键词后回车添加"
              @keydown.enter="addKeyword"
            />
            <button class="cs-keyword-add-btn" @click="addKeyword">添加</button>
          </div>
          <div v-if="keywords.length > 0" class="cs-keyword-tags">
            <span v-for="(kw, i) in keywords" :key="i" class="cs-keyword-tag">
              {{ kw }}
              <button class="cs-keyword-remove" @click="removeKeyword(i)">×</button>
            </span>
          </div>
        </section>

        <!-- Commenter Qualification -->
        <section class="cs-section">
          <h3 class="cs-section__title">
            <span>👤</span>
            <span>评论者资格</span>
          </h3>
          <p class="cs-section__desc">限制哪些用户可以在你的故事下评论</p>
          <div class="cs-qual-options">
            <label v-for="opt in qualOptions" :key="opt.value" class="cs-qual-item">
              <input
                type="radio"
                :value="opt.value"
                v-model="qualLevel"
                class="cs-qual-radio"
              />
              <span class="cs-qual-label">{{ opt.label }}</span>
              <span class="cs-qual-desc">{{ opt.desc }}</span>
            </label>
          </div>
        </section>

        <!-- Comment Background (VIP Exclusive) -->
        <section class="cs-section cs-section--vip">
          <h3 class="cs-section__title">
            <span>🎨</span>
            <span>评论区背景</span>
            <span class="cs-vip-tag">VIP专属</span>
          </h3>
          <p class="cs-section__desc">自定义评论区的背景样式</p>

          <!-- Background type selector -->
          <div class="cs-bg-type-tabs">
            <button
              v-for="t in bgTypes"
              :key="t.value"
              class="cs-bg-type-btn"
              :class="{ 'cs-bg-type-btn--active': bgType === t.value }"
              @click="bgType = t.value"
            >
              {{ t.label }}
            </button>
          </div>

          <!-- Solid color picker -->
          <div v-if="bgType === 'solid'" class="cs-bg-colors">
            <button
              v-for="c in solidColors"
              :key="c"
              class="cs-bg-color-swatch"
              :class="{ 'cs-bg-color-swatch--active': bgSolid === c }"
              :style="{ background: c }"
              @click="bgSolid = c"
            ></button>
          </div>

          <!-- Gradient picker -->
          <div v-if="bgType === 'gradient'" class="cs-bg-gradients">
            <button
              v-for="(g, i) in gradients"
              :key="i"
              class="cs-bg-gradient-swatch"
              :class="{ 'cs-bg-gradient-swatch--active': bgGradient === g.css }"
              :style="{ background: g.css }"
              @click="bgGradient = g.css"
            ></button>
          </div>

          <!-- Sticker picker -->
          <div v-if="bgType === 'sticker'" class="cs-bg-stickers">
            <button
              v-for="(s, i) in stickers"
              :key="i"
              class="cs-bg-sticker-btn"
              :class="{ 'cs-bg-sticker-btn--active': bgSticker === s.emoji }"
              @click="bgSticker = s.emoji"
            >
              <span class="cs-bg-sticker-emoji">{{ s.emoji }}</span>
              <span class="cs-bg-sticker-name">{{ s.name }}</span>
            </button>
          </div>

          <!-- Preview -->
          <div class="cs-bg-preview" :style="previewStyle">
            <div class="cs-bg-preview-comment">
              <div class="cs-bg-preview-avatar">😊</div>
              <div class="cs-bg-preview-bubble">
                <span class="cs-bg-preview-name">旅行者</span>
                <span class="cs-bg-preview-text">这条评论的背景就是预览效果</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div class="cs-actions">
          <button class="cs-action-btn cs-action-btn--secondary" @click="resetSettings">重置</button>
          <button class="cs-action-btn cs-action-btn--primary" @click="saveSettings">保存设置</button>
        </div>
      </template>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVipStore } from '../stores/vip'
import { showToast } from '../composables/useToast'

const props = defineProps({
  visible: { type: Boolean, default: false },
  isDark: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'request-vip', 'saved'])

const vipStore = useVipStore()

// Time window
const timeOptions = [
  { label: '不限', value: 'unlimited' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '关闭评论', value: 'closed' },
]
const timeWindow = ref('unlimited')

// Keywords
const newKeyword = ref('')
const keywords = ref([])

function addKeyword() {
  const kw = newKeyword.value.trim()
  if (kw && !keywords.value.includes(kw)) {
    keywords.value.push(kw)
    newKeyword.value = ''
  }
}

function removeKeyword(index) {
  keywords.value.splice(index, 1)
}

// Qualification
const qualOptions = [
  { label: '所有人', value: 'all', desc: '任何注册用户都可以评论' },
  { label: '仅关注者', value: 'followers', desc: '只有关注你的用户可以评论' },
  { label: '仅VIP', value: 'vip', desc: '只有VIP会员可以评论' },
]
const qualLevel = ref('all')

// Background
const bgTypes = [
  { label: '纯色', value: 'solid' },
  { label: '渐变', value: 'gradient' },
  { label: '贴图', value: 'sticker' },
]
const bgType = ref('solid')

const solidColors = [
  '#fff8e7', '#f0f9ff', '#fef2f2', '#f0fdf4', '#faf5ff',
  '#1a1a2e', '#16213e', '#0f3460', '#1b1b2f', '#162447',
]

const gradients = [
  { css: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { css: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
  { css: 'linear-gradient(135deg, #d4fc79, #96e6a1)' },
  { css: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)' },
  { css: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { css: 'linear-gradient(135deg, #2c3e50, #4ca1af)' },
]

const stickers = [
  { emoji: '🌟', name: '星光' },
  { emoji: '🌙', name: '月夜' },
  { emoji: '🌸', name: '花瓣' },
  { emoji: '🌊', name: '海浪' },
  { emoji: '🔥', name: '烈焰' },
  { emoji: '❄️', name: '冰雪' },
]

const bgSolid = ref('#fff8e7')
const bgGradient = ref(gradients[0].css)
const bgSticker = ref('🌟')

const previewStyle = computed(() => {
  if (bgType.value === 'solid') return { background: bgSolid.value }
  if (bgType.value === 'gradient') return { background: bgGradient.value }
  if (bgType.value === 'sticker') {
    return {
      background: `radial-gradient(circle at 20% 30%, rgba(255,215,0,0.1), transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(255,215,0,0.08), transparent 40%),
        #1a1a2e`,
      position: 'relative',
    }
  }
  return {}
})

function handleClose() { emit('close') }

function resetSettings() {
  timeWindow.value = 'unlimited'
  keywords.value = []
  qualLevel.value = 'all'
  bgType.value = 'solid'
  bgSolid.value = '#fff8e7'
  bgGradient.value = gradients[0].css
  bgSticker.value = '🌟'
  vipStore.setCommentBg(null)
  showToast('设置已重置')
}

function saveSettings() {
  const bgConfig = {
    type: bgType.value,
    solid: bgSolid.value,
    gradient: bgGradient.value,
    sticker: bgSticker.value,
  }
  vipStore.setCommentBg(bgConfig)
  emit('saved', { timeWindow: timeWindow.value, keywords: [...keywords.value], qualLevel: qualLevel.value, bg: bgConfig })
  showToast('评论设置已保存')
  handleClose()
}
</script>

<style scoped>
.comment-settings {
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

.comment-settings--dark {
  background: linear-gradient(160deg, rgba(24, 28, 50, 0.98), rgba(32, 40, 68, 0.98));
  border-color: rgba(143, 180, 255, 0.2);
  color: #edf3ff;
}

/* --- Header --- */
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

/* --- VIP Gate --- */
.cs-vip-gate {
  text-align: center;
  padding: 32px 16px;
  opacity: 0.8;
}

.cs-vip-gate__icon { font-size: 40px; display: block; margin-bottom: 12px; }

.cs-vip-gate__title { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
.cs-vip-gate__desc { font-size: 13px; opacity: 0.6; margin: 0 0 16px; }

.cs-vip-gate__btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 24px; border-radius: 999px; border: none;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a; font-size: 14px; font-weight: 700; cursor: pointer;
  transition: all 0.22s ease;
}
.cs-vip-gate__btn:hover { transform: translateY(-2px); }

/* --- Sections --- */
.cs-section {
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(184, 135, 46, 0.08);
}

.comment-settings--dark .cs-section {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(143, 180, 255, 0.08);
}

.cs-section--vip {
  border-color: rgba(255, 215, 0, 0.2);
  background: rgba(255, 215, 0, 0.04);
}

.cs-section__title {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 700; margin: 0 0 4px;
}

.cs-section__desc {
  font-size: 12px; opacity: 0.55; margin: 0 0 12px;
}

.cs-vip-tag {
  padding: 1px 6px; border-radius: 999px;
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a; font-size: 9px; font-weight: 800;
}

/* Time window */
.cs-time-options { display: flex; gap: 6px; flex-wrap: wrap; }

.cs-time-btn {
  padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(184, 135, 46, 0.2);
  background: transparent; color: inherit; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s ease;
}

.cs-time-btn--active {
  background: rgba(184, 135, 46, 0.15);
  border-color: rgba(184, 135, 46, 0.4);
}

/* Keywords */
.cs-keyword-input-wrap {
  display: flex; gap: 6px;
}

.cs-keyword-input {
  flex: 1; padding: 8px 12px; border-radius: 10px;
  border: 1px solid rgba(184, 135, 46, 0.2); background: rgba(255, 255, 255, 0.5);
  color: inherit; font-size: 13px; outline: none;
  transition: border-color 0.2s ease;
}

.cs-keyword-input:focus { border-color: rgba(184, 135, 46, 0.5); }

.cs-keyword-add-btn {
  padding: 8px 14px; border-radius: 10px; border: none;
  background: rgba(184, 135, 46, 0.15); color: inherit;
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
}

.cs-keyword-add-btn:hover { background: rgba(184, 135, 46, 0.25); }

.cs-keyword-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }

.cs-keyword-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 999px;
  background: rgba(184, 135, 46, 0.1); font-size: 12px;
}

.cs-keyword-remove {
  background: none; border: none; color: inherit; opacity: 0.5;
  cursor: pointer; font-size: 14px; padding: 0; line-height: 1;
}

.cs-keyword-remove:hover { opacity: 1; }

/* Qualification */
.cs-qual-options { display: flex; flex-direction: column; gap: 8px; }

.cs-qual-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: 10px;
  background: rgba(255, 255, 255, 0.3); cursor: pointer;
  transition: all 0.2s ease;
}

.cs-qual-item:hover { background: rgba(255, 255, 255, 0.5); }

.cs-qual-radio { accent-color: #b8860b; }

.cs-qual-label { font-size: 13px; font-weight: 600; }
.cs-qual-desc { font-size: 11px; opacity: 0.5; margin-left: auto; }

/* Background */
.cs-bg-type-tabs { display: flex; gap: 4px; margin-bottom: 12px; }

.cs-bg-type-btn {
  padding: 6px 14px; border-radius: 999px;
  border: 1px solid rgba(184, 135, 46, 0.2);
  background: transparent; color: inherit;
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
}

.cs-bg-type-btn--active {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.4);
}

.cs-bg-colors { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }

.cs-bg-color-swatch {
  width: 32px; height: 32px; border-radius: 10px;
  border: 2px solid transparent; cursor: pointer;
  transition: all 0.2s ease;
}

.cs-bg-color-swatch--active {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.cs-bg-gradients { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }

.cs-bg-gradient-swatch {
  width: 48px; height: 32px; border-radius: 10px;
  border: 2px solid transparent; cursor: pointer;
  transition: all 0.2s ease;
}

.cs-bg-gradient-swatch--active {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.cs-bg-stickers { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }

.cs-bg-sticker-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 10px; border-radius: 10px; border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.3); cursor: pointer;
  transition: all 0.2s ease;
}

.cs-bg-sticker-btn--active {
  border-color: rgba(255, 215, 0, 0.4);
  background: rgba(255, 215, 0, 0.1);
}

.cs-bg-sticker-emoji { font-size: 20px; }
.cs-bg-sticker-name { font-size: 10px; opacity: 0.6; }

/* Preview */
.cs-bg-preview {
  border-radius: 14px; padding: 14px; min-height: 60px;
  border: 1px solid rgba(184, 135, 46, 0.1);
}

.cs-bg-preview-comment {
  display: flex; gap: 10px; align-items: flex-start;
}

.cs-bg-preview-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}

.cs-bg-preview-bubble {
  padding: 8px 12px; border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
}

.cs-bg-preview-name { font-size: 12px; font-weight: 700; display: block; }
.cs-bg-preview-text { font-size: 12px; opacity: 0.7; }

/* Actions */
.cs-actions {
  display: flex; gap: 10px; justify-content: flex-end;
  margin-top: 8px;
}

.cs-action-btn {
  padding: 8px 20px; border-radius: 999px; border: none;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease;
}

.cs-action-btn--secondary {
  background: rgba(184, 135, 46, 0.1); color: inherit;
}

.cs-action-btn--primary {
  background: linear-gradient(135deg, #ffd700, #f5a623);
  color: #3d2e0a;
}

.cs-action-btn:hover { transform: translateY(-1px); }

/* --- Transition --- */
.cs-fade-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.cs-fade-leave-active { transition: all 0.22s ease; }
.cs-fade-enter-from { opacity: 0; transform: translateX(20px) scale(0.96); }
.cs-fade-leave-to { opacity: 0; transform: translateX(12px) scale(0.98); }
</style>
