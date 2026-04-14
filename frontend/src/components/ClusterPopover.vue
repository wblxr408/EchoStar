<template>
  <Teleport to="body">
    <Transition name="popover-fade">
      <div v-if="visible" class="cluster-popover-overlay" @click="handleClose">
        <div
          class="cluster-popover"
          :class="themeClass"
          role="dialog"
          :aria-label="'该地点的故事列表（' + enrichedStories.length + '条）'"
          @click.stop
        >
          <!-- 装饰内描边 -->
          <div class="popover-inner-border"></div>

          <!-- 装饰星光粒子 -->
          <div class="popover-sparkles">
            <span class="sparkle sparkle-1"></span>
            <span class="sparkle sparkle-2"></span>
            <span class="sparkle sparkle-3"></span>
          </div>

          <!-- 头部 -->
          <div class="popover-header">
            <div class="popover-header-left">
              <span class="popover-star-icon">&#9733;</span>
              <h3 class="popover-title">{{ enrichedStories.length }} 条故事</h3>
            </div>
            <button class="popover-close" aria-label="关闭" @click="handleClose">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="1" y1="1" x2="13" y2="13" /><line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          </div>

          <!-- 故事列表 -->
          <div class="popover-list" ref="listRef">
            <template v-if="enrichedStories.length > 0">
              <TransitionGroup name="list-stagger" tag="div" class="popover-list-inner"
                @before-enter="onBeforeEnter"
                @enter="onEnter"
                @leave="onLeave"
              >
                <div
                  v-for="(story, index) in enrichedStories"
                  :key="story.id || story._id || index"
                  class="popover-item"
                  :style="{ contentVisibility: enrichedStories.length > 20 ? 'auto' : '' }"
                  @click="$emit('select-story', story)"
                >
                  <div class="item-emotion-bar" :style="emotionBarStyle(story)"></div>
                  <div class="item-content">
                    <p class="item-title">{{ story.content || story.preview || '无标题' }}</p>
                    <span class="item-meta">
                      {{ formatTime(story.createdAt) }}
                      <span v-if="story.likeCount" class="meta-likes">&#9829; {{ story.likeCount }}</span>
                      <span v-if="story.favoriteCount" class="meta-favorites">&#9734; {{ story.favoriteCount }}</span>
                    </span>
                  </div>
                </div>
              </TransitionGroup>
            </template>
            <div v-else class="popover-empty">暂无故事</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { storyApi } from "@/api/story";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  stories: {
    type: Array,
    default: () => [],
  },
  mapTheme: {
    type: String,
    default: "light",
  },
});

const emit = defineEmits(["close", "select-story", "preview-image"]);

const listRef = ref(null);
const enrichedStories = ref([]);
const isLoadingCounts = ref(false);

const themeClass = computed(() =>
  props.mapTheme === "dark" ? "theme-dark" : "theme-light"
);

// 当弹窗打开且故事列表变化时，批量请求点赞数和收藏数
watch(
  [() => props.visible, () => props.stories],
  async ([visible, stories]) => {
    if (!visible || !stories || stories.length === 0) {
      enrichedStories.value = stories || [];
      return;
    }

    // 先用原始数据展示
    enrichedStories.value = stories.map((s) => ({ ...s }));
    isLoadingCounts.value = true;

    try {
      // 并行请求所有故事的详情，提取 likeCount 和 favoriteCount
      const results = await Promise.allSettled(
        stories.map((s) => {
          const id = s.id || s._id;
          if (!id) return Promise.resolve(null);
          return storyApi.getStoryById(id).catch(() => null);
        })
      );

      const updated = stories.map((s, index) => {
        const result = results[index];
        if (result.status === "fulfilled" && result.value?.data) {
          const detail = result.value.data;
          return {
            ...s,
            likeCount: detail.likeCount ?? 0,
            favoriteCount: detail.favoriteCount ?? 0,
          };
        }
        return { ...s };
      });

      enrichedStories.value = updated;
    } catch {
      // 请求失败保持原始数据
    } finally {
      isLoadingCounts.value = false;
    }
  },
  { immediate: true }
);

const emotionColors = {
  joy: "#FFB347",
  sadness: "#6C8EBF",
  anger: "#E06666",
  fear: "#9370DB",
  surprise: "#FFD700",
  love: "#FF69B4",
  calm: "#66CDAA",
  nostalgia: "#CD853F",
  hope: "#87CEEB",
  gratitude: "#DDA0DD",
};

function emotionBarStyle(story) {
  const emotion = story.emotionTag || story.emotion;
  const color = emotionColors[emotion];
  if (!color) return {};
  return {
    background: `linear-gradient(180deg, ${color}, ${color}88)`,
  };
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function handleClose() {
  emit("close");
}

// TransitionGroup 交错动画钩子
function onBeforeEnter(el) {
  el.style.opacity = '0';
  el.style.transform = 'translateX(-12px) scale(0.96)';
}

function onEnter(el, done) {
  const index = el.dataset?.index ?? Array.from(el.parentNode.children).indexOf(el);
  const delay = Math.min(index * 40, 400);
  requestAnimationFrame(() => {
    el.style.transition = `opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
    el.style.opacity = '1';
    el.style.transform = 'translateX(0) scale(1)';
  });
  const duration = 350 + delay;
  setTimeout(done, duration);
}

function onLeave(el, done) {
  el.style.transition = 'opacity 0.15s ease-in, transform 0.15s ease-in';
  el.style.opacity = '0';
  el.style.transform = 'translateX(8px) scale(0.97)';
  setTimeout(done, 150);
}

function handleKeydown(e) {
  if (e.key === "Escape") handleClose();
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
/* ===== 遮罩层 ===== */
.cluster-popover-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* ===== 日间主题（暖琥珀） ===== */
.cluster-popover {
  --panel-bg: linear-gradient(160deg, rgba(250,239,217,0.97) 0%, rgba(240,223,191,0.98) 56%, rgba(229,206,166,0.98) 100%);
  --panel-border: rgba(184,135,46,0.46);
  --panel-strong: #4d2f14;
  --panel-muted: rgba(77,47,20,0.6);
  --panel-soft: rgba(91,58,25,0.08);
  --panel-soft-strong: rgba(125,84,37,0.14);
  --panel-shadow: rgba(71,43,17,0.22);
  --accent: #b36e2d;
  --accent-soft: rgba(179,110,45,0.12);
  --inner-border: rgba(199,151,60,0.2);
  --overlay-shadow: rgba(255,248,232,0.36);
  --close-bg: rgba(91,58,25,0.12);
  --close-hover: rgba(91,58,25,0.22);
  --close-color: #5a3a1a;
  --star-color: #c88b2e;
  --heart-color: #c4716a;

  position: relative;
  width: min(420px, calc(100vw - 32px));
  max-height: 70vh;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  box-shadow:
    0 24px 48px -16px var(--panel-shadow),
    0 0 0 1px var(--overlay-shadow),
    inset 0 1px 0 rgba(255,255,255,0.5);
}

/* 装饰内描边 */
.popover-inner-border {
  position: absolute;
  inset: 10px;
  border-radius: 18px;
  border: 1px solid var(--inner-border);
  background:
    radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 24%),
    linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 48%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}

/* ===== 夜间主题（冷蓝） ===== */
.cluster-popover.theme-dark {
  --panel-bg: linear-gradient(160deg, rgba(20,27,48,0.98) 0%, rgba(28,40,68,0.98) 58%, rgba(36,53,88,0.98) 100%);
  --panel-border: rgba(144,177,236,0.24);
  --panel-strong: #edf3ff;
  --panel-muted: rgba(228,238,255,0.55);
  --panel-soft: rgba(131,164,224,0.08);
  --panel-soft-strong: rgba(131,164,224,0.16);
  --panel-shadow: rgba(7,12,26,0.4);
  --accent: #8fb4ff;
  --accent-soft: rgba(143,180,255,0.12);
  --inner-border: rgba(141,176,235,0.14);
  --overlay-shadow: rgba(182,208,255,0.14);
  --close-bg: rgba(131,164,224,0.12);
  --close-hover: rgba(131,164,224,0.22);
  --close-color: #b8cfff;
  --star-color: #8fb4ff;
  --heart-color: #ff9eaf;

  box-shadow:
    0 24px 48px -16px var(--panel-shadow),
    0 0 0 1px var(--overlay-shadow),
    inset 0 1px 0 rgba(255,255,255,0.08);
}

.theme-dark .popover-inner-border {
  border-color: rgba(141,176,235,0.12);
  background:
    radial-gradient(circle at top right, rgba(255,255,255,0.06) 0%, transparent 24%),
    linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 48%, transparent 100%);
}

/* ===== 头部 ===== */
.popover-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--panel-soft-strong);
}

.popover-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.popover-star-icon {
  font-size: 18px;
  color: var(--star-color);
  filter: drop-shadow(0 1px 3px rgba(200,139,46,0.3));
}

.theme-dark .popover-star-icon {
  filter: drop-shadow(0 1px 6px rgba(143,180,255,0.3));
}

.popover-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--panel-strong);
  letter-spacing: 0.01em;
}

.popover-close {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: var(--close-bg);
  color: var(--close-color);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.popover-close:hover {
  background: var(--close-hover);
  transform: scale(1.05);
}

/* ===== 列表区域 ===== */
.popover-list {
  position: relative;
  z-index: 2;
  padding: 10px 12px 14px;
  overflow-y: auto;
  overscroll-behavior: contain;
  flex: 1;
}

/* 滚动条美化 */
.popover-list::-webkit-scrollbar {
  width: 5px;
}

.popover-list::-webkit-scrollbar-track {
  background: transparent;
}

.popover-list::-webkit-scrollbar-thumb {
  background: var(--panel-soft-strong);
  border-radius: 4px;
}

.popover-list::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

/* ===== 列表项 ===== */
.popover-item {
  display: flex;
  align-items: stretch;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 3px;
  transition: background 0.18s ease, transform 0.18s ease;
}

.popover-item:hover {
  background: var(--accent-soft);
  transform: translateX(3px);
}

.popover-item:active {
  transform: translateX(1px) scale(0.995);
}

.item-emotion-bar {
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--accent), var(--star-color));
  margin-right: 12px;
  flex-shrink: 0;
  transition: width 0.2s ease;
}

.popover-item:hover .item-emotion-bar {
  width: 4px;
}

.item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--panel-strong);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: 12px;
  color: var(--panel-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-likes {
  color: var(--heart-color);
  font-size: 11px;
}

.meta-favorites {
  color: var(--star-color);
  font-size: 11px;
}

/* ===== 空状态 ===== */
.popover-empty {
  text-align: center;
  padding: 28px 16px;
  font-size: 14px;
  color: var(--panel-muted);
}

/* ===== 动画 ===== */

/* --- 遮罩 + 弹窗整体动画 --- */
.popover-fade-enter-active {
  animation: overlay-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.popover-fade-enter-active .cluster-popover {
  animation: panel-in 0.48s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.popover-fade-enter-active .popover-inner-border {
  animation: border-draw 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
}

.popover-fade-enter-active .popover-header {
  animation: header-slide 0.38s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
}

.popover-fade-enter-active .popover-sparkles .sparkle {
  animation: sparkle-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.popover-fade-enter-active .popover-sparkles .sparkle-1 { animation-delay: 0.25s; }
.popover-fade-enter-active .popover-sparkles .sparkle-2 { animation-delay: 0.38s; }
.popover-fade-enter-active .popover-sparkles .sparkle-3 { animation-delay: 0.48s; }

.popover-fade-leave-active {
  animation: overlay-out 0.22s ease-in both;
}

.popover-fade-leave-active .cluster-popover {
  animation: panel-out 0.22s ease-in both;
}

.popover-fade-leave-active .popover-inner-border {
  animation: border-fade 0.15s ease-in both;
}

/* 遮罩渐入 */
@keyframes overlay-in {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
}

/* 弹窗弹性展开 */
@keyframes panel-in {
  from {
    opacity: 0;
    transform: scale(0.78) translateY(20px);
    filter: blur(6px);
  }
  60% {
    opacity: 1;
    filter: blur(0px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0px);
  }
}

/* 内描边绘制动画 */
@keyframes border-draw {
  from {
    opacity: 0;
    clip-path: inset(0 100% 100% 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}

/* 头部下滑渐入 */
@keyframes header-slide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 星光粒子弹出 */
@keyframes sparkle-pop {
  from {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  60% {
    opacity: 1;
    transform: scale(1.3) rotate(180deg);
  }
  to {
    opacity: 0.7;
    transform: scale(1) rotate(360deg);
  }
}

/* 遮罩渐出 */
@keyframes overlay-out {
  from {
    opacity: 1;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  to {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
}

/* 弹窗收缩消失 */
@keyframes panel-out {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
}

/* 内描边淡出 */
@keyframes border-fade {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* --- 列表项交错动画 --- */
.list-stagger-enter-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.list-stagger-leave-active {
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}

.list-stagger-enter-from {
  opacity: 0;
  transform: translateX(-12px) scale(0.96);
}

.list-stagger-leave-to {
  opacity: 0;
  transform: translateX(8px) scale(0.97);
}

/* --- 星光粒子装饰 --- */
.popover-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
  border-radius: 24px;
}

.sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  opacity: 0;
}

.sparkle-1 {
  top: 18%;
  right: 12%;
  background: var(--star-color);
  box-shadow: 0 0 8px 2px var(--star-color);
}

.sparkle-2 {
  top: 45%;
  right: 6%;
  width: 4px;
  height: 4px;
  background: var(--heart-color);
  box-shadow: 0 0 6px 1px var(--heart-color);
}

.sparkle-3 {
  bottom: 20%;
  left: 8%;
  width: 5px;
  height: 5px;
  background: var(--accent);
  box-shadow: 0 0 6px 1px var(--accent);
}

/* 粒子呼吸动画（进入后持续） */
.theme-light .sparkle-1 { animation: sparkle-breathe 3s ease-in-out 1s infinite; }
.theme-light .sparkle-2 { animation: sparkle-breathe 4s ease-in-out 1.5s infinite; }
.theme-light .sparkle-3 { animation: sparkle-breathe 3.5s ease-in-out 2s infinite; }
.theme-dark .sparkle-1 { animation: sparkle-glow 3s ease-in-out 1s infinite; }
.theme-dark .sparkle-2 { animation: sparkle-glow 4s ease-in-out 1.5s infinite; }
.theme-dark .sparkle-3 { animation: sparkle-glow 3.5s ease-in-out 2s infinite; }

@keyframes sparkle-breathe {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.4); }
}

@keyframes sparkle-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); filter: blur(0px); }
  50% { opacity: 1; transform: scale(1.6); filter: blur(1px); }
}

/* --- 列表内部容器 --- */
.popover-list-inner {
  display: flex;
  flex-direction: column;
}

@media (prefers-reduced-motion: reduce) {
  .popover-fade-enter-active,
  .popover-fade-leave-active,
  .popover-fade-enter-active .cluster-popover,
  .popover-fade-enter-active .popover-inner-border,
  .popover-fade-enter-active .popover-header,
  .popover-fade-enter-active .popover-sparkles .sparkle,
  .theme-light .sparkle-1,
  .theme-light .sparkle-2,
  .theme-light .sparkle-3,
  .theme-dark .sparkle-1,
  .theme-dark .sparkle-2,
  .theme-dark .sparkle-3,
  .list-stagger-enter-active,
  .list-stagger-leave-active {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
}
</style>
