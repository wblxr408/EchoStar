<template>
  <div class="time-capsule" :class="{ unlocked: isUnlocked }">
    <!-- 解锁状态变更广播 -->
    <div :aria-label="isUnlocked ? '时光胶囊已解锁' : '时光胶囊未解锁'" aria-live="polite">
      <div class="capsule-icon" aria-hidden="true">
        <!-- 日间/夜间 SVG 图标 -->
        <svg v-if="isDark" class="capsule-svg capsule-svg--night" viewBox="0 0 64 64" width="56" height="56"
          xmlns="http://www.w3.org/2000/svg">
          <g v-if="!isUnlocked" class="icon-lock-group icon-lock-group--night">
            <rect x="18" y="26" width="28" height="28" rx="6" fill="rgba(20,27,48,0.4)"
              stroke="#8fb4ff" stroke-width="2.5"/>
            <path d="M24 26V19c0-4.5 3.5-8 8-8s8 3.5 8 8v7" fill="none" stroke="#8fb4ff"
              stroke-width="2.5" stroke-linecap="round"/>
          </g>
          <g v-else class="icon-unlock-group icon-unlock-group--night">
            <rect x="18" y="26" width="28" height="28" rx="6" fill="rgba(20,27,48,0.35)"
              stroke="#8fb4ff" stroke-width="2.5"/>
            <path d="M22 21V17c0-4.5 3.5-8 8-8s8 3.5 8 8v4" fill="none" stroke="#8fb4ff"
              stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="32" cy="40" r="5" fill="#8fb4ff" opacity="0.85"/>
          </g>
        </svg>
        <svg v-else class="capsule-svg capsule-svg--day" viewBox="0 0 64 64" width="56" height="56"
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fff9ef"/>
              <stop offset="50%" stop-color="#f3d59b"/>
              <stop offset="100%" stop-color="#d79a43"/>
            </linearGradient>
          </defs>
          <g v-if="!isUnlocked" class="icon-lock-group icon-lock-group--day">
            <rect x="18" y="26" width="28" height="28" rx="6" fill="rgba(250,239,217,0.3)"
              stroke="url(#goldGrad)" stroke-width="2.5"/>
            <path d="M24 26V19c0-4.5 3.5-8 8-8s8 3.5 8 8v7" fill="none"
              stroke="url(#goldGrad)" stroke-width="2.5" stroke-linecap="round"/>
          </g>
          <g v-else class="icon-unlock-group icon-unlock-group--day">
            <rect x="18" y="26" width="28" height="28" rx="6" fill="rgba(250,239,217,0.25)"
              stroke="url(#goldGrad)" stroke-width="2.5"/>
            <path d="M22 21V17c0-4.5 3.5-8 8-8s8 3.5 8 8v4" fill="none"
              stroke="url(#goldGrad)" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="32" cy="40" r="5" fill="#d79a43" opacity="0.85"/>
          </g>
        </svg>
      </div>
    </div>

    <div class="capsule-info">
      <h3 v-if="isUnlocked">时光胶囊已解锁</h3>
      <h3 v-else>时光胶囊</h3>

      <p class="unlock-time">
        {{ isUnlocked ? "解锁于 " + formatUnlockTime : countdown }}
      </p>
    </div>

    <div v-if="!isUnlocked" class="capsule-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ Math.round(progress) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed, shallowRef, onMounted, onUnmounted } from "vue";
import {
  formatDateTime,
  getTimeCapsuleCountdown,
  isTimeCapsuleUnlocked,
} from "../utils/time";

const props = defineProps({
  unlockAt: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    required: true,
  },
});

const now = shallowRef(new Date());
let timer = null;

const isUnlocked = computed(() => {
  return isTimeCapsuleUnlocked(props.unlockAt);
});

const countdown = computed(() => {
  return getTimeCapsuleCountdown(props.unlockAt);
});

const formatUnlockTime = computed(() => {
  return formatDateTime(props.unlockAt, "YYYY-MM-DD HH:mm");
});

const progress = computed(() => {
  const created = new Date(props.createdAt).getTime();
  const unlock = new Date(props.unlockAt).getTime();
  const current = now.value.getTime();

  if (current >= unlock) return 100;
  if (current <= created) return 0;

  return ((current - created) / (unlock - created)) * 100;
});

// 主题检测：通过 data-theme 属性判断当前主题
const isDark = computed(() => {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark-mode") ||
    document.documentElement.getAttribute("data-theme") === "dark";
});

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<style scoped>
.time-capsule {
  padding: 20px;
  border-radius: 16px;
  color: white;
  transition-property: background-color, box-shadow, border-color;
  transition-duration: 0.3s;
  transition-timing-function: ease-out;
}

/* ===== 日间主题 — 暖金羊皮纸风格 ===== */
.time-capsule:not(.unlocked) {
  background: linear-gradient(135deg, rgba(250, 239, 217, 0.9) 0%, rgba(243, 213, 155, 0.75) 100%);
  color: #4a3000;
  box-shadow:
    0 2px 12px rgba(215, 154, 67, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.time-capsule.unlocked {
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.88) 0%, rgba(245, 87, 108, 0.78) 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);
}

/* ===== 夜间主题 — 深空冰蓝风格 ===== */
:global([data-theme="dark"]) .time-capsule:not(.unlocked),
:global(.dark-mode) .time-capsule:not(.unlocked) {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.92) 0%, rgba(14, 14, 30, 0.95) 100%);
  color: #b8c5dc;
  border: 1px solid rgba(143, 180, 255, 0.12);
  box-shadow:
    0 2px 16px rgba(143, 180, 255, 0.08),
    inset 0 1px 0 rgba(143, 180, 255, 0.06);
}

:global([data-theme="dark"]) .time-capsule.unlocked,
:global(.dark-mode) .time-capsule.unlocked {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.82) 0%, rgba(118, 75, 162, 0.78) 100%);
  color: #e0e0f0;
  border: 1px solid rgba(143, 180, 255, 0.15);
}

.capsule-icon {
  text-align: center;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.capsule-svg {
  /* 呼吸动画：仅操作 opacity + transform（合成器友好） */
  animation: capsule-breathe 3s ease-in-out infinite;
}

@keyframes capsule-breathe {
  0% {
    opacity: 0.7;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
  100% {
    opacity: 0.7;
    transform: scale(0.98);
  }
}

/* 夜间叠加微弱辉光 */
:global([data-theme="dark"]) .capsule-svg--night,
:global(.dark-mode) .capsule-svg--night {
  filter: drop-shadow(0 0 10px rgba(143, 180, 255, 0.45));
}

/* 减少动画偏好：关闭所有动画 */
@media (prefers-reduced-motion: reduce) {
  .capsule-svg {
    animation: none !important;
    transform: none;
    opacity: 1;
  }
}

.capsule-info {
  text-align: center;
  margin-bottom: 16px;
}

.capsule-info h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.unlock-time {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.capsule-progress {
  margin-top: 16px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition-property: width;
  transition-duration: 1s;
  transition-timing-function: linear;
}

.time-capsule:not(.unlocked) .progress-fill {
  background: linear-gradient(90deg, #d79a43, #f3d59b);
}

:global([data-theme="dark"]) .time-capsule:not(.unlocked) .progress-fill,
:global(.dark-mode) .time-capsule:not(.unlocked) .progress-fill {
  background: linear-gradient(90deg, #667eea, #8fb4ff);
}

.time-capsule.unlocked .progress-fill {
  background: linear-gradient(90deg, #f093fb, #f5576c);
}

.progress-text {
  display: block;
  text-align: center;
  font-size: 12px;
  opacity: 0.9;
}
</style>
