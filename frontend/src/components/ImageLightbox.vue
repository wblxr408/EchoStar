<template>
  <Teleport to="body">
    <Transition name="lightbox-fade">
      <div
        v-if="visible"
        class="lightbox-overlay"
        :class="{ 'overlay-dark': isDark }"
        role="dialog"
        aria-modal="true"
        :aria-label="'图片预览 ' + (currentIndex + 1) + '/' + images.length"
        tabindex="-1"
        ref="containerRef"
        @click.self="handleClose"
        @keydown.esc="handleClose"
        @keydown.left="prevImage"
        @keydown.right="nextImage"
      >
        <!-- 关闭按钮 -->
        <button
          class="lb-close"
          :class="{ closeDark: isDark }"
          aria-label="关闭预览"
          @click="handleClose"
        >&times;</button>

        <!-- 导航按钮 -->
        <button
          v-if="images.length > 1 && currentIndex > 0"
          class="lb-nav lb-nav--prev"
          :class="{ navDark: isDark }"
          aria-label="上一张图片"
          @click.stop="prevImage"
        >&#10094;</button>
        <button
          v-if="images.length > 1 && currentIndex < images.length - 1"
          class="lb-nav lb-nav--next"
          :class="{ navDark: isDark }"
          aria-label="下一张图片"
          @click.stop="nextImage"
        >&#10095;</button>

        <!-- 图片区域 -->
        <div class="lb-image-wrap" ref="imageWrapRef">
          <img
            v-if="currentSrc"
            :src="currentSrc"
            :alt="currentAlt || ('图片' + (currentIndex + 1))"
            class="lb-image"
            draggable="false"
            fetchpriority="high"
            style="
              object-fit: contain;
              max-width: 90vw;
              max-height: 85vh;
            "
            @load="onImgLoad"
          />
        </div>

        <!-- 底部计数器 -->
        <div class="lb-counter" :class="{ counterDark: isDark }">
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  images: {
    type: Array,
    default: () => [],
  },
  initialIndex: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["close"]);

const containerRef = ref(null);
const imageWrapRef = ref(null);
const currentIndex = ref(Math.max(0, Math.min(props.initialIndex, (props.images || []).length - 1)));
let touchStartX = 0;
let prevFocusEl = null;

const isDark = computed(() => {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.classList.contains("dark-mode") ||
    document.documentElement.getAttribute("data-theme") === "dark"
  );
});

const currentSrc = computed(() => {
  const imgs = props.images || [];
  if (!imgs[currentIndex.value]) return "";
  const item = imgs[currentIndex.value];
  return typeof item === "string" ? item : (item?.url || item?.src || "");
});

const currentAlt = computed(() => {
  const imgs = props.images || [];
  if (!imgs[currentIndex.value]) return "";
  const item = imgs[currentIndex.value];
  return typeof item === "string" ? "" : (item?.alt || item?.description || "");
});

function prevImage() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

function nextImage() {
  const len = (props.images || []).length;
  if (currentIndex.value < len - 1) {
    currentIndex.value++;
  }
}

function handleClose() {
  emit("close");
  // 恢复焦点
  nextTick(() => {
    if (prevFocusEl) {
      try { prevFocusEl.focus(); } catch {}
      prevFocusEl = null;
    }
  });
}

// 触摸滑动支持
function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
}
function handleTouchEnd(e) {
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 50) {
    diff > 0 ? prevImage() : nextImage();
  }
}

// 焦点陷阱：聚焦到容器
function focusContainer() {
  if (containerRef.value) {
    containerRef.value.focus();
  }
}
function savePrevFocus() {
  prevFocusEl = document.activeElement;
}

function onImgLoad() {}

watch(() => props.visible, async (val) => {
  if (val) {
    currentIndex.value = Math.max(0, Math.min(props.initialIndex, (props.images || []).length - 1));
    savePrevFocus();
    await nextTick();
    focusContainer();
  }
}, { immediate: false });

watch(() => props.initialIndex, (val) => {
  if (props.visible) {
    currentIndex.value = Math.max(0, Math.min(val, (props.images || []).length - 1));
  }
});

onMounted(() => {
  window.addEventListener("keydown", handleKeydownGlobal);
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydownGlobal);
});

function handleKeydownGlobal(e) {
  if (!props.visible) return;
  if (e.key === "Escape") handleClose();
}

// 绑定触摸事件（通过容器ref）
watch(containerRef, (el) => {
  if (el) {
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
  }
});
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 日间遮罩 */
  background: rgba(0, 0, 0, 0.88);
  outline: none;
  touch-action: manipulation;
}

/* 夜间遮罩：深空色 */
.overlay-dark {
  background: rgba(2, 4, 11, 0.95);
}

.lb-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.lb-image {
  border-radius: 4px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  user-select: none;
  -webkit-user-drag: none;
  transition-property: opacity, transform;
  transition-duration: 0s;
}

/* ===== 关闭按钮 ===== */
.lb-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 日间 */
  background: rgba(255, 255, 255, 0.9);
  color: #555;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition-property: background-color, color, transform;
  transition-duration: 0.15s;
}

.lb-close:hover {
  background: white;
  color: #222;
  transform: scale(1.08);
}

.closeDark {
  background: rgba(26, 26, 46, 0.9);
  color: #8fb4ff;
  border: 1px solid rgba(143, 180, 255, 0.2);
}
.closeDark:hover {
  background: rgba(40, 40, 70, 0.95);
  color: #b8cfff;
}

/* ===== 导航按钮 ===== */
.lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 日间 */
  background: rgba(255, 255, 255, 0.88);
  color: #333;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition-property: background-color, transform, opacity;
  transition-duration: 0.15s;
}

.lb-nav:hover {
  background: white;
  transform: translateY(-50%) scale(1.08);
}

.lb-nav--prev { left: 12px; }
.lb-nav--next { right: 12px; }

.navDark {
  background: rgba(26, 26, 46, 0.85);
  color: #8fb4ff;
  border: 1px solid rgba(143, 180, 255, 0.2);
}
.navDark:hover {
  background: rgba(40, 40, 70, 0.92);
  color: #b8cfff;
}

/* ===== 计数器 ===== */
.lb-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  /* 日间 */
  background: rgba(255, 255, 255, 0.82);
  color: #333;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  letter-spacing: 0.3px;
}

.counterDark {
  background: rgba(26, 26, 46, 0.85);
  color: #b8cfff;
  border: 1px solid rgba(143, 180, 255, 0.15);
}

/* ===== 动画 ===== */
.lightbox-fade-enter-active {
  animation: lb-in 0.25s ease-out both;
}
.lightbox-fade-leave-active {
  animation: lb-out 0.2s ease-in both;
}

@keyframes lb-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes lb-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .lightbox-fade-enter-active,
  .lightbox-fade-leave-active {
    animation-duration: 0s !important;
  }
}
</style>
