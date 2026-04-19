<template>
  <div class="app-toast-layer">
    <TransitionGroup name="toast-pop">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card"
        :class="[`toast-${toast.type}`, { dark: isDark }]"
      >
        <span class="toast-icon">{{ iconMap[toast.type] || "ℹ" }}</span>
        <span class="toast-text">{{ toast.message }}</span>
      </div>
    </TransitionGroup>

    <Transition name="confirm-fade">
      <div
        v-if="confirmDialog"
        class="confirm-backdrop"
        :class="{ dark: isDark }"
        @click.self="handleConfirmResult(false)"
      >
        <div class="confirm-card" :class="{ dark: isDark }">
          <p class="confirm-message">{{ confirmDialog.message }}</p>
          <div class="confirm-actions">
            <button
              class="confirm-btn cancel"
              @click="handleConfirmResult(false)"
            >
              取消
            </button>
            <button class="confirm-btn ok" @click="handleConfirmResult(true)">
              确定
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="confirm-fade">
        <div
          v-if="promptDialog"
          class="confirm-backdrop"
          :class="{ dark: promptIsDark }"
          @click.self="handlePromptSubmit(null)"
        >
          <div class="prompt-card" :class="{ dark: promptIsDark }">
          <p class="prompt-label">{{ promptDialog.message }}</p>
          <input
            ref="promptInputRef"
            v-model="promptValue"
            class="prompt-input"
            :placeholder="promptDialog.placeholder || ''"
            :class="{ dark: promptIsDark }"
            @keyup.enter="promptValue.trim() && handlePromptSubmit(promptValue)"
          />
          <div class="confirm-actions">
            <button
              class="confirm-btn cancel"
              @click="handlePromptSubmit(null)"
            >
              取消
            </button>
            <button
              class="confirm-btn ok"
              :disabled="!promptValue.trim()"
              @click="handlePromptSubmit(promptValue)"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "../composables/useToast.js";

const {
  toasts,
  confirmDialog,
  handleConfirmResult,
  promptDialog,
  handlePromptResult,
} = useToast();
const promptValue = ref("");
const promptInputRef = ref(null);
const route = useRoute();
const promptIsDark = computed(
  () => promptDialog.value?.theme === "light" ? false : isDark.value,
);

watch(promptDialog, (val) => {
  if (val) {
    promptValue.value = val.defaultValue || "";
    nextTick(() => promptInputRef.value?.focus());
  }
});

function handlePromptSubmit(value) {
  if (value !== null && !value.trim()) {
    value = null;
  }
  handlePromptResult(value);
}

const isDark = ref(false);
let themeTimer = null;

function handleThemeStorageChange(event) {
  if (event.key && event.key !== "mapTheme") {
    return;
  }

  detectTheme();
}

function handleMapThemeChange() {
  detectTheme();
}

function detectTheme() {
  const path = window.location.pathname;
  if (
    path === "/" ||
    path.includes("/login") ||
    path.includes("/home") ||
    path.includes("/admin")
  ) {
    isDark.value = true;
    return;
  }

  const saved = localStorage.getItem("mapTheme");
  if (saved === "light") {
    isDark.value = false;
    return;
  }
  if (saved === "dark" || saved === "vip") {
    isDark.value = true;
    return;
  }
  const h = new Date().getHours();
  isDark.value = !(h >= 6 && h < 18);
}

watch(
  () => route.fullPath,
  () => {
    detectTheme();
  },
  { immediate: true },
);

onMounted(() => {
  themeTimer = setInterval(detectTheme, 30000);
  window.addEventListener("storage", handleThemeStorageChange);
  window.addEventListener("map-theme-change", handleMapThemeChange);
});

onUnmounted(() => {
  clearInterval(themeTimer);
  window.removeEventListener("storage", handleThemeStorageChange);
  window.removeEventListener("map-theme-change", handleMapThemeChange);
});

const iconMap = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};
</script>

<style scoped>
.app-toast-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.toast-card {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 18px;
  margin-bottom: 10px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  max-width: 420px;
  word-break: break-word;
}

.toast-card:not(.dark) {
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.96) 0%,
    rgba(240, 223, 191, 0.98) 56%,
    rgba(229, 206, 166, 0.98) 100%
  );
  border: 1px solid rgba(184, 135, 46, 0.3);
  box-shadow: 0 8px 32px rgba(71, 43, 17, 0.18);
}
.toast-success:not(.dark) {
  border-left: 4px solid #2cb67d;
}
.toast-error:not(.dark) {
  border-left: 4px solid #e0677f;
}
.toast-warning:not(.dark) {
  border-left: 4px solid #f2a93b;
}
.toast-info:not(.dark) {
  border-left: 4px solid #5f7cff;
}

.toast-icon {
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}
.toast-success .toast-icon {
  color: #2cb67d;
}
.toast-error .toast-icon {
  color: #e0677f;
}
.toast-warning .toast-icon {
  color: #f2a93b;
}
.toast-info .toast-icon {
  color: #5f7cff;
}

.toast-text:not(.dark) {
  color: #3c2910;
  font-size: 14px;
  line-height: 1.5;
}

.toast-card.dark {
  background: linear-gradient(
    160deg,
    rgba(20, 27, 48, 0.98) 0%,
    rgba(28, 40, 68, 0.98) 58%,
    rgba(36, 53, 88, 0.98) 100%
  );
  border: 1px solid rgba(144, 177, 236, 0.24);
  box-shadow: 0 8px 32px rgba(7, 12, 26, 0.32);
}
.toast-success.dark {
  border-left: 4px solid #4eeaac;
}
.toast-error.dark {
  border-left: 4px solid #ff8fa6;
}
.toast-warning.dark {
  border-left: 4px solid #ffc65c;
}
.toast-info.dark {
  border-left: 4px solid #8ea0ff;
}

.toast-success.dark .toast-icon {
  color: #4eeaac;
}
.toast-error.dark .toast-icon {
  color: #ff8fa6;
}
.toast-warning.dark .toast-icon {
  color: #ffc65c;
}
.toast-info.dark .toast-icon {
  color: #8ea0ff;
}

.toast-card.dark .toast-text {
  color: #edf3ff;
  font-size: 14px;
  line-height: 1.5;
}

.toast-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-pop-leave-active {
  transition: all 0.25s ease-in;
}
.toast-pop-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-16px);
}
.toast-pop-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

.confirm-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.confirm-backdrop:not(.dark) {
  background: rgba(0, 0, 0, 0.28);
}
.confirm-backdrop.dark {
  background: rgba(0, 0, 0, 0.52);
}

.confirm-card {
  border-radius: 18px;
  padding: 32px 36px 24px;
  min-width: 320px;
  max-width: 420px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  text-align: center;
}

.confirm-card:not(.dark) {
  background: linear-gradient(
    160deg,
    rgba(250, 239, 217, 0.96) 0%,
    rgba(240, 223, 191, 0.98) 56%,
    rgba(229, 206, 166, 0.98) 100%
  );
  border: 1px solid rgba(184, 135, 46, 0.3);
}
.confirm-card.dark {
  background: linear-gradient(
    160deg,
    rgba(20, 27, 48, 0.98) 0%,
    rgba(28, 40, 68, 0.98) 58%,
    rgba(36, 53, 88, 0.98) 100%
  );
  border: 1px solid rgba(144, 177, 236, 0.2);
  box-shadow: 0 16px 48px rgba(7, 12, 26, 0.35);
}

.confirm-message:not(.dark) {
}
.confirm-card:not(.dark) .confirm-message {
  color: #3c2910;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 24px;
}
.confirm-card.dark .confirm-message {
  color: #e8e8ec;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  padding: 10px 28px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.confirm-btn.cancel:not(.dark),
.confirm-card:not(.dark) .confirm-btn.cancel {
  background: rgba(0, 0, 0, 0.05);
  color: #6b5e52;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.confirm-btn.cancel:not(.dark):hover {
  background: rgba(0, 0, 0, 0.1);
}
.confirm-card.dark .confirm-btn.cancel {
  background: rgba(255, 255, 255, 0.06);
  color: #b0b4c8;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.confirm-card.dark .confirm-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.12);
}

.confirm-btn.ok:not(.dark),
.confirm-card:not(.dark) .confirm-btn.ok {
  background: linear-gradient(135deg, #b36e2d 0%, #8e4d15 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(179, 110, 45, 0.3);
}
.confirm-btn.ok:not(.dark):hover {
  box-shadow: 0 6px 20px rgba(179, 110, 45, 0.45);
  transform: translateY(-1px);
}
.confirm-btn.ok:not(.dark):disabled,
.confirm-card:not(.dark) .confirm-btn.ok:disabled {
  background: #c9a87d;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.5;
}
.confirm-card.dark .confirm-btn.ok,
.prompt-card.dark .confirm-btn.ok {
  background: linear-gradient(135deg, #8fb4ff 0%, #6696f7 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(143, 180, 255, 0.35);
}
.confirm-card.dark .confirm-btn.ok:hover,
.prompt-card.dark .confirm-btn.ok:hover {
  box-shadow: 0 6px 20px rgba(143, 180, 255, 0.5);
  transform: translateY(-1px);
}
.confirm-card.dark .confirm-btn.ok:disabled,
.prompt-card.dark .confirm-btn.ok:disabled {
  background: #5a7ab8;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.5;
}
.prompt-card.dark .confirm-btn.cancel {
  background: rgba(255, 255, 255, 0.06);
  color: #b0b4c8;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.prompt-card.dark .confirm-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.12);
}

.confirm-fade-enter-active {
  transition: all 0.25s ease-out;
}
.confirm-fade-leave-active {
  transition: all 0.2s ease-in;
}
.confirm-fade-enter-from .confirm-card {
  opacity: 0;
  transform: scale(0.85);
}
.confirm-fade-leave-to .confirm-card {
  opacity: 0;
  transform: scale(0.92);
}
.confirm-fade-enter-from {
  opacity: 0;
}
.confirm-fade-leave-to {
  opacity: 0;
}

.prompt-card {
  border-radius: 14px;
  padding: 24px;
  min-width: 360px;
  max-width: 440px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.2);
}

.prompt-card:not(.dark) {
  background: #ffffff;
  border: 1px solid #d9dee7;
}
.prompt-card.dark {
  background: linear-gradient(
    160deg,
    rgba(20, 27, 48, 0.98) 0%,
    rgba(28, 40, 68, 0.98) 58%,
    rgba(36, 53, 88, 0.98) 100%
  );
  border: 1px solid rgba(144, 177, 236, 0.24);
}

.prompt-label {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 16px;
  font-weight: 600;
}
.prompt-card:not(.dark) .prompt-label {
  color: #111827;
}
.prompt-card.dark .prompt-label {
  color: #e8e8ec;
}

.prompt-input {
  width: 100%;
  padding: 11px 14px;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.prompt-input:not(.dark) {
  background: #ffffff;
  border: 1px solid #cfd6e3;
  color: #111827;
}
.prompt-input:not(.dark):focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.18);
}
.prompt-input:not(.dark)::placeholder {
  color: #94a3b8;
}

.prompt-input.dark {
  background: rgba(14, 20, 37, 0.78);
  border: 1px solid rgba(144, 177, 236, 0.2);
  color: #edf3ff;
}
.prompt-input.dark:focus {
  border-color: #8fb4ff;
  box-shadow: 0 0 0 3px rgba(143, 180, 255, 0.15);
}
.prompt-input.dark::placeholder {
  color: #6b7a9e;
}

.prompt-card:not(.dark) .confirm-btn.cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.prompt-card:not(.dark) .confirm-btn.cancel:hover {
  background: #e5e7eb;
}

.prompt-card:not(.dark) .confirm-btn.ok {
  background: #111827;
  color: #ffffff;
  box-shadow: none;
}

.prompt-card:not(.dark) .confirm-btn.ok:hover {
  background: #1f2937;
  transform: translateY(-1px);
}

.prompt-card:not(.dark) .confirm-btn.ok:disabled {
  background: #9ca3af;
  color: #ffffff;
  box-shadow: none;
  cursor: not-allowed;
}
</style>
