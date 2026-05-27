<template>
  <div
    class="home-page"
    @pointerenter="handlePointerEnter"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <div class="page-background" aria-hidden="true">
      <div class="emotion-world">
        <div class="emotion-world__glow"></div>
        <div class="emotion-world__pattern"></div>
        <div class="emotion-world__emoji-field">
          <span
            v-for="emoji in emotionBackdropItems"
            :key="emoji.id"
            class="emotion-world__emoji"
            :style="{
              top: emoji.top,
              left: emoji.left,
              fontSize: emoji.size,
              opacity: emoji.opacity,
              transform: `rotate(${emoji.rotate})`,
            }"
          >
            {{ emoji.symbol }}
          </span>
        </div>
      </div>

      <div class="night-scene" :style="nightMaskStyle">
        <div class="stars-layer stars-layer--nebula"></div>
        <div class="stars-layer stars-layer--dots"></div>

        <div class="star-emoji-field">
          <span
            v-for="star in decorativeStars"
            :key="star.id"
            class="star-emoji"
            :style="{
              top: star.top,
              left: star.left,
              fontSize: star.size,
              '--twinkle-delay': star.delay,
              '--twinkle-duration': star.duration,
              '--star-opacity': star.opacity,
            }"
          >
            {{ star.symbol }}
          </span>
        </div>
      </div>
    </div>

    <main class="page-content">
      <section class="hero-section">
        <div class="hero-wrapper">
          <div class="hero">
            <h1 ref="logoRef" class="logo">
              <span class="logo-layer logo-layer--base artistic-text" :style="logoBaseStyle">
                EchoStar
              </span>
              <span
                class="logo-layer logo-layer--inverse artistic-text"
                :style="logoInverseStyle"
                aria-hidden="true"
              >
                EchoStar
              </span>
            </h1>

            <p class="tagline artistic-sub">在地图上留下你的情绪与故事</p>

            <div class="actions">
              <button class="btn-primary" @click="showLogin = true">开始探索</button>
            </div>

            <p class="hero-hint">向下滑动，查看更多信息</p>
          </div>
        </div>
      </section>

      <section ref="introSectionRef" class="info-section">
        <div class="section-shell">
          <div class="section-heading">
            <h2 class="section-title">Information</h2>
          </div>

          <div class="info-grid">
            <article class="info-card">
              <p class="card-eyebrow">Product</p>
              <h3 class="card-title">产品简介</h3>
              <p class="card-copy">
                EchoStar 是一个把地图、故事和情绪结合在一起的表达空间。用户可以在地点上记录自己的心情、上传图像或文字，让回忆与空间形成连接。
              </p>
              <div class="card-subitems">
                <div class="card-subitem">
                  <h4 class="card-subtitle">地图情绪记录</h4>
                  <p class="card-subcopy">大家可以选择地点，发布故事、分享情绪，让每一次表达都对应真实发生的场景。</p>
                </div>
                <div class="card-subitem">
                  <h4 class="card-subtitle">附近内容发现</h4>
                  <p class="card-subcopy">用户可以沿着地图浏览周边内容，发现不同地点留下的故事、照片和即时心情。</p>
                </div>
                <div class="card-subitem">
                  <h4 class="card-subtitle">个人记忆沉淀</h4>
                  <p class="card-subcopy">把零散的片刻记录成一张可回看的情绪地图，让日常足迹慢慢变成长期记忆。</p>
                </div>
              </div>
            </article>

            <article class="info-card info-card--accent">
              <p class="card-eyebrow">About Us</p>
              <h3 class="card-title">关于我们</h3>
              <p class="card-copy">
                我们是来自东南大学的学生团队。我们希望把冷冰冰的地图变成可以承载情绪、故事和共鸣的公共空间。
              </p>
              <div class="card-subitems">
                <div class="card-subitem">
                  <h4 class="card-subtitle">联系我们</h4>
                  <p class="card-subcopy">如果您有任何问题或者想讨论的，欢迎加入 QQ 群：1063424500</p>
                </div>
                <div class="card-subitem">
                  <h4 class="card-subtitle">问题反馈</h4>
                  <p class="card-subcopy">您可以在 QQ 群内进行反馈，也可以联系 3226872780@qq.com</p>
                </div>
                <div class="card-subitem">
                  <h4 class="card-subtitle">最后想说</h4>
                  <p class="card-subcopy">感谢您的使用与支持喵！</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer class="page-footer">
        <div class="footer-shell">
          <div class="footer-brand">
            <span class="footer-logo">EchoStar</span>
            <p class="footer-copy">让地图记录你的轨迹、你的心情。</p>
          </div>

          <div class="footer-links">
            <span class="footer-link">用户协议</span>
            <span class="footer-link">隐私政策</span>
            <span class="footer-link">联系我们</span>
          </div>
        </div>
      </footer>
    </main>

    <LoginModal v-if="showLogin" @close="showLogin = false" />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import LoginModal from './components/LoginModal.vue';

const router = useRouter();
const userStore = useUserStore();
const showLogin = ref(false);
const logoRef = ref(null);
const introSectionRef = ref(null);
const pageLockSnapshot = {
  htmlOverflow: '',
  htmlHeight: '',
  bodyOverflow: '',
  bodyHeight: '',
  appHeight: '',
};

const decorativeStars = [
  { id: 1, symbol: '✦', top: '8%', left: '9%', size: '24px', delay: '0s', duration: '4.8s', opacity: 0.72 },
  { id: 2, symbol: '✧', top: '14%', left: '22%', size: '20px', delay: '0.8s', duration: '5.4s', opacity: 0.6 },
  { id: 3, symbol: '✦', top: '10%', left: '78%', size: '26px', delay: '1.2s', duration: '6.2s', opacity: 0.8 },
  { id: 4, symbol: '✶', top: '18%', left: '90%', size: '22px', delay: '0.3s', duration: '4.6s', opacity: 0.58 },
  { id: 5, symbol: '✧', top: '30%', left: '7%', size: '18px', delay: '1.7s', duration: '5.1s', opacity: 0.55 },
  { id: 6, symbol: '✹', top: '24%', left: '84%', size: '24px', delay: '1.1s', duration: '6s', opacity: 0.76 },
  { id: 7, symbol: '✦', top: '42%', left: '12%', size: '22px', delay: '2s', duration: '5.8s', opacity: 0.62 },
  { id: 8, symbol: '✶', top: '50%', left: '6%', size: '20px', delay: '0.6s', duration: '4.9s', opacity: 0.52 },
  { id: 9, symbol: '✦', top: '60%', left: '14%', size: '28px', delay: '1.4s', duration: '6.4s', opacity: 0.82 },
  { id: 10, symbol: '✧', top: '76%', left: '9%', size: '20px', delay: '2.3s', duration: '5.7s', opacity: 0.6 },
  { id: 11, symbol: '✦', top: '86%', left: '20%', size: '22px', delay: '1.8s', duration: '4.7s', opacity: 0.56 },
  { id: 12, symbol: '✺', top: '15%', left: '68%', size: '26px', delay: '0.5s', duration: '5.3s', opacity: 0.76 },
  { id: 13, symbol: '✶', top: '72%', left: '84%', size: '18px', delay: '1.9s', duration: '4.5s', opacity: 0.52 },
  { id: 14, symbol: '✦', top: '84%', left: '71%', size: '24px', delay: '0.9s', duration: '5.9s', opacity: 0.68 },
  { id: 15, symbol: '✧', top: '58%', left: '90%', size: '22px', delay: '1.3s', duration: '5.2s', opacity: 0.58 },
  { id: 16, symbol: '✦', top: '34%', left: '93%', size: '24px', delay: '0.4s', duration: '6.1s', opacity: 0.74 },
];

const moodPool = ['😊', '🤩', '😌', '🥹', '😎', '🙂', '😄', '🫶', '😉', '🥰', '🌤', '💌', '🎈', '✨', '📍', '🌙'];
const moodSizes = ['32px', '34px', '36px', '38px', '40px', '42px'];
const moodRotations = ['-12deg', '-8deg', '-4deg', '0deg', '6deg', '10deg'];

const emotionBackdropItems = Array.from({ length: 90 }, (_, index) => {
  const columns = 10;
  const row = Math.floor(index / columns);
  const col = index % columns;
  const left = 5.5 + col * 9.6 + ((row % 2) * 1.4 - 0.7);
  const top = 8 + row * 10.2 + ((col % 2) * 2.1 - 1.05);

  return {
    id: index + 1,
    symbol: moodPool[index % moodPool.length],
    left: `${left}%`,
    top: `${top}%`,
    size: moodSizes[index % moodSizes.length],
    opacity: 0.9 - (index % 5) * 0.06,
    rotate: moodRotations[index % moodRotations.length],
  };
});

const lensVisible = ref(false);
const lensX = ref(0);
const lensY = ref(0);
const lensRadiusX = ref(220);
const lensRadiusY = ref(220);
const logoBounds = ref(null);

const pointerTarget = { x: 0, y: 0 };
const pointerPrevious = { x: 0, y: 0 };
const pointerVelocity = { x: 0, y: 0 };
let pointerInside = false;
let animationFrameId = 0;
let logoResizeObserver = null;
const lensInnerStop = 68;
const lensOuterStop = 77;

const nightMaskStyle = computed(() => {
  if (!lensVisible.value) {
    return {
      maskImage: 'none',
      WebkitMaskImage: 'none',
    };
  }

  const mask = `radial-gradient(ellipse ${lensRadiusX.value}px ${lensRadiusY.value}px at ${lensX.value}px ${lensY.value}px, transparent 0, transparent ${lensInnerStop}%, black ${lensOuterStop}%)`;

  return {
    maskImage: mask,
    WebkitMaskImage: mask,
  };
});

function buildMaskedLogoStyle(maskImage, opacity = 1) {
  return {
    opacity,
    maskImage,
    WebkitMaskImage: maskImage,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
  };
}

function getElementMasks(bounds) {
  if (!lensVisible.value || !bounds) {
    return null;
  }

  const localX = lensX.value - bounds.left;
  const localY = lensY.value - bounds.top;
  const revealMask = `radial-gradient(ellipse ${lensRadiusX.value}px ${lensRadiusY.value}px at ${localX}px ${localY}px, black 0, black ${lensInnerStop}%, transparent ${lensOuterStop}%)`;
  const hideMask = `radial-gradient(ellipse ${lensRadiusX.value}px ${lensRadiusY.value}px at ${localX}px ${localY}px, transparent 0, transparent ${lensInnerStop}%, black ${lensOuterStop}%)`;

  return {
    revealMask,
    hideMask,
  };
}

const logoBaseStyle = computed(() => {
  const masks = getElementMasks(logoBounds.value);

  if (!masks) {
    return {
      opacity: 1,
      maskImage: 'none',
      WebkitMaskImage: 'none',
    };
  }

  return buildMaskedLogoStyle(masks.hideMask);
});

const logoInverseStyle = computed(() => {
  const masks = getElementMasks(logoBounds.value);

  if (!masks) {
    return {
      opacity: 0,
      maskImage: 'none',
      WebkitMaskImage: 'none',
    };
  }

  return buildMaskedLogoStyle(masks.revealMask, 1);
});

function updateElementBounds(elementRef, boundsRef) {
  if (!elementRef.value) {
    return;
  }

  const rect = elementRef.value.getBoundingClientRect();
  boundsRef.value = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function updateLogoBounds() {
  updateElementBounds(logoRef, logoBounds);
}

function seedPointer(event) {
  pointerTarget.x = event.clientX;
  pointerTarget.y = event.clientY;
  pointerPrevious.x = event.clientX;
  pointerPrevious.y = event.clientY;
  pointerVelocity.x = 0;
  pointerVelocity.y = 0;
  lensX.value = event.clientX;
  lensY.value = event.clientY;
  updateLogoBounds();
}

function handlePointerEnter(event) {
  if (event.pointerType === 'touch') {
    return;
  }

  pointerInside = true;
  lensVisible.value = true;
  seedPointer(event);
}

function handlePointerMove(event) {
  if (event.pointerType === 'touch') {
    return;
  }

  if (!pointerInside) {
    handlePointerEnter(event);
    return;
  }

  pointerTarget.x = event.clientX;
  pointerTarget.y = event.clientY;
  lensX.value = event.clientX;
  lensY.value = event.clientY;
}

function handlePointerLeave() {
  pointerInside = false;
  lensVisible.value = false;
}

function animateReveal() {
  const velocityX = pointerTarget.x - pointerPrevious.x;
  const velocityY = pointerTarget.y - pointerPrevious.y;
  const speed = Math.min(Math.hypot(velocityX, velocityY), 42);
  const accelerationX = velocityX - pointerVelocity.x;
  const accelerationY = velocityY - pointerVelocity.y;

  pointerPrevious.x = pointerTarget.x;
  pointerPrevious.y = pointerTarget.y;
  pointerVelocity.x = velocityX;
  pointerVelocity.y = velocityY;

  const stretchX = Math.min(88, Math.abs(velocityX) * 2.4 + Math.abs(accelerationX) * 1.3 + speed * 0.38);
  const stretchY = Math.min(88, Math.abs(velocityY) * 2.4 + Math.abs(accelerationY) * 1.3 + speed * 0.38);
  const squeezeX = Math.min(22, Math.abs(velocityY) * 0.55 + speed * 0.14);
  const squeezeY = Math.min(22, Math.abs(velocityX) * 0.55 + speed * 0.14);

  const radiusXTarget = Math.max(198, 220 + stretchX - squeezeX);
  const radiusYTarget = Math.max(198, 220 + stretchY - squeezeY);

  lensRadiusX.value += (radiusXTarget - lensRadiusX.value) * 0.48;
  lensRadiusY.value += (radiusYTarget - lensRadiusY.value) * 0.48;

  if (!pointerInside) {
    lensRadiusX.value += (220 - lensRadiusX.value) * 0.15;
    lensRadiusY.value += (220 - lensRadiusY.value) * 0.15;
    pointerVelocity.x += (0 - pointerVelocity.x) * 0.4;
    pointerVelocity.y += (0 - pointerVelocity.y) * 0.4;
  }

  animationFrameId = window.requestAnimationFrame(animateReveal);
}

function enablePageScroll() {
  const appRoot = document.getElementById('app');

  pageLockSnapshot.htmlOverflow = document.documentElement.style.overflow;
  pageLockSnapshot.htmlHeight = document.documentElement.style.height;
  pageLockSnapshot.bodyOverflow = document.body.style.overflow;
  pageLockSnapshot.bodyHeight = document.body.style.height;
  pageLockSnapshot.appHeight = appRoot?.style.height || '';

  document.documentElement.style.overflow = 'auto';
  document.documentElement.style.height = 'auto';
  document.body.style.overflow = 'auto';
  document.body.style.height = 'auto';

  if (appRoot) {
    appRoot.style.height = 'auto';
  }
}

function restorePageScrollLock() {
  const appRoot = document.getElementById('app');

  document.documentElement.style.overflow = pageLockSnapshot.htmlOverflow;
  document.documentElement.style.height = pageLockSnapshot.htmlHeight;
  document.body.style.overflow = pageLockSnapshot.bodyOverflow;
  document.body.style.height = pageLockSnapshot.bodyHeight;

  if (appRoot) {
    appRoot.style.height = pageLockSnapshot.appHeight;
  }
}

onMounted(() => {
  if (userStore?.isLoggedIn) {
    router.push('/map');
    return;
  }

  enablePageScroll();

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  pointerTarget.x = centerX;
  pointerTarget.y = centerY;
  pointerPrevious.x = centerX;
  pointerPrevious.y = centerY;
  lensX.value = centerX;
  lensY.value = centerY;

  nextTick(() => {
    updateLogoBounds();

    if (typeof ResizeObserver !== 'undefined' && logoRef.value) {
      logoResizeObserver = new ResizeObserver(() => {
        updateLogoBounds();
      });
      logoResizeObserver.observe(logoRef.value);
    }
  });

  window.addEventListener('resize', updateLogoBounds);
  window.addEventListener('scroll', updateLogoBounds, { passive: true });
  animationFrameId = window.requestAnimationFrame(animateReveal);
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }

  if (logoResizeObserver) {
    logoResizeObserver.disconnect();
  }

  window.removeEventListener('resize', updateLogoBounds);
  window.removeEventListener('scroll', updateLogoBounds);
  restorePageScrollLock();
});
</script>

<style scoped>
.home-page {
  position: relative;
  min-height: 100vh;
  min-height: 220vh;
  overflow-x: hidden;
  color: #ffffff;
  background: #02040b;
}

.page-background,
.emotion-world,
.night-scene,
.stars-layer,
.star-emoji-field {
  position: fixed;
  inset: 0;
}

.page-background {
  z-index: 0;
  pointer-events: none;
}

.page-content {
  position: relative;
  z-index: 10;
}

.hero-section,
.info-section {
  position: relative;
  min-height: 100vh;
  padding: 32px 24px;
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-section {
  display: flex;
  align-items: center;
}

.emotion-world {
  z-index: 1;
  overflow: hidden;
  background:
    radial-gradient(circle at 22% 22%, rgba(255, 244, 216, 0.92) 0%, transparent 24%),
    radial-gradient(circle at 82% 18%, rgba(224, 186, 111, 0.2) 0%, transparent 22%),
    linear-gradient(160deg, #faefd9 0%, #f0dfbf 54%, #e5c996 100%);
}

.emotion-world__glow,
.emotion-world__pattern,
.emotion-world__emoji-field {
  position: absolute;
  inset: 0;
}

.emotion-world__glow {
  background:
    radial-gradient(circle at 28% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 24%),
    radial-gradient(circle at 70% 72%, rgba(183, 132, 56, 0.14) 0%, transparent 26%);
}

.emotion-world__pattern {
  opacity: 0.42;
  background:
    linear-gradient(rgba(151, 101, 34, 0.04), rgba(151, 101, 34, 0.04)),
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 76px,
      rgba(151, 101, 34, 0.04) 76px,
      rgba(151, 101, 34, 0.04) 77px
    );
}

.emotion-world__emoji-field {
  z-index: 2;
}

.emotion-world__emoji {
  position: absolute;
  display: block;
  color: #6f4317;
  text-shadow:
    0 1px 0 rgba(255, 252, 245, 0.42),
    0 0 14px rgba(255, 236, 187, 0.2);
}

.night-scene {
  z-index: 4;
  background:
    radial-gradient(circle at 18% 18%, rgba(56, 74, 168, 0.14) 0%, transparent 22%),
    radial-gradient(circle at 82% 14%, rgba(82, 52, 142, 0.12) 0%, transparent 20%),
    radial-gradient(circle at 50% 110%, rgba(28, 62, 120, 0.18) 0%, transparent 34%),
    linear-gradient(180deg, #02040b 0%, #060b18 46%, #0b1530 100%);
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}

.stars-layer--nebula {
  z-index: 0;
  background:
    radial-gradient(circle at 24% 28%, rgba(118, 141, 241, 0.09) 0%, transparent 24%),
    radial-gradient(circle at 76% 32%, rgba(154, 113, 222, 0.08) 0%, transparent 20%),
    radial-gradient(circle at 50% 72%, rgba(82, 136, 226, 0.08) 0%, transparent 26%);
  filter: blur(20px);
  opacity: 0.8;
}

.stars-layer--dots {
  z-index: 1;
  background-image:
    radial-gradient(circle at 7% 12%, rgba(255, 255, 255, 0.95) 0 1px, transparent 1.6px),
    radial-gradient(circle at 17% 68%, rgba(255, 244, 201, 0.88) 0 1.3px, transparent 2px),
    radial-gradient(circle at 24% 22%, rgba(255, 255, 255, 0.78) 0 1px, transparent 1.8px),
    radial-gradient(circle at 32% 14%, rgba(201, 224, 255, 0.8) 0 1.2px, transparent 2px),
    radial-gradient(circle at 43% 82%, rgba(255, 244, 201, 0.84) 0 1.3px, transparent 2px),
    radial-gradient(circle at 54% 18%, rgba(255, 255, 255, 0.78) 0 1px, transparent 1.8px),
    radial-gradient(circle at 63% 72%, rgba(201, 224, 255, 0.84) 0 1.4px, transparent 2.1px),
    radial-gradient(circle at 72% 10%, rgba(255, 244, 201, 0.9) 0 1.3px, transparent 2px),
    radial-gradient(circle at 86% 24%, rgba(255, 255, 255, 0.85) 0 1.1px, transparent 1.8px),
    radial-gradient(circle at 93% 66%, rgba(201, 224, 255, 0.82) 0 1.4px, transparent 2.2px),
    radial-gradient(circle at 14% 88%, rgba(255, 255, 255, 0.72) 0 1px, transparent 1.7px),
    radial-gradient(circle at 84% 86%, rgba(255, 244, 201, 0.82) 0 1.2px, transparent 2px);
  opacity: 0.95;
}

.star-emoji-field {
  z-index: 2;
}

.star-emoji {
  position: absolute;
  display: block;
  color: #ffe8ab;
  text-shadow:
    0 0 8px rgba(255, 244, 201, 0.32),
    0 0 18px rgba(179, 212, 255, 0.16);
  opacity: var(--star-opacity);
  animation: twinkle var(--twinkle-duration) ease-in-out infinite;
  animation-delay: var(--twinkle-delay);
}

.hero-wrapper {
  width: min(92vw, 720px);
  margin: 0 auto;
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 72px 80px;
  border-radius: 36px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.28);
  text-align: center;
  animation: floatUp 1s ease-out;
}

.section-shell,
.footer-shell {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.section-eyebrow,
.card-eyebrow {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.logo {
  position: relative;
  display: inline-block;
  margin: 0 0 16px;
}

.logo-layer {
  display: block;
  white-space: nowrap;
}

.logo-layer--inverse {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, #fff9ef 0%, #f3d59b 44%, #d79a43 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: invert(1) hue-rotate(180deg) saturate(1.15) contrast(1.08);
  text-shadow: none;
  transition: opacity 120ms ease-out;
}

.artistic-text {
  display: block;
  font-size: 84px;
  font-weight: 700;
  font-family: 'Georgia', 'Palatino Linotype', 'Book Antiqua', serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #fff9ef 0%, #f3d59b 44%, #d79a43 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.artistic-sub {
  margin: 0 0 20px;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.18em;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}

.hero-description,
.section-copy,
.card-copy,
.footer-copy {
  line-height: 1.7;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  min-width: 180px;
  padding: 16px 80px;
  font-size: 20px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-primary {
  background: rgba(255, 255, 255, 0.16);
  border: 2px solid rgba(255, 255, 255, 0.42);
}

.btn-secondary {
  background: rgba(6, 11, 24, 0.28);
  color: #fff7e4;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-primary:hover,
.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.24);
  border-color: #ffffff;
}

.btn-secondary:hover {
  background: rgba(6, 11, 24, 0.42);
  border-color: rgba(255, 255, 255, 0.36);
}

.hero-hint {
  margin: 28px 0 0;
  font-size: 14px;
  letter-spacing: 0.08em;
}

.section-shell {
  display: grid;
  gap: 28px;
}

.section-heading {
  width: min(760px, 100%);
}

.section-eyebrow,
.card-eyebrow {
  color: rgba(255, 239, 205, 0.84);
  margin-bottom: 12px;
}

.section-title {
  margin: 0 0 16px;
  font-size: clamp(36px, 4vw, 54px);
  line-height: 1.06;
  font-family: 'Georgia', 'Palatino Linotype', 'Book Antiqua', serif;
  color: #ffffff;
}

.section-copy {
  margin: 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.82);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.info-card {
  min-height: 420px;
  padding: 32px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.08)),
    rgba(7, 12, 28, 0.28);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 24px 40px rgba(3, 7, 16, 0.24);
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease,
    background 0.24s ease,
    filter 0.24s ease;
}

.info-card--accent {
  background:
    linear-gradient(180deg, rgba(255, 244, 216, 0.18), rgba(255, 255, 255, 0.07)),
    rgba(13, 20, 40, 0.34);
}

.info-card:hover,
.info-card:focus-within {
  transform: none;
  filter: none;
  border-color: rgba(117, 73, 20, 0.3);
  background:
    linear-gradient(180deg, rgba(255, 250, 242, 0.98), rgba(245, 230, 205, 0.94)),
    rgba(248, 239, 223, 0.96);
  box-shadow: 0 30px 54px rgba(84, 55, 18, 0.24);
}

.info-card--accent:hover,
.info-card--accent:focus-within {
  background:
    linear-gradient(180deg, rgba(255, 247, 230, 0.98), rgba(239, 219, 186, 0.95)),
    rgba(244, 230, 204, 0.96);
}

.card-title {
  margin: 0 0 18px;
  font-size: 30px;
  color: #fffdf7;
}

.card-copy {
  margin: 0 0 22px;
  min-height: 5.4em;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.88);
  transition: color 0.24s ease;
}

.card-section-label {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(255, 239, 205, 0.82);
}

.card-subitems {
  display: grid;
  gap: 12px;
}

.card-subitem {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  transition:
    background 0.24s ease,
    border-color 0.24s ease,
    box-shadow 0.24s ease;
}

.info-card:hover .card-subitem,
.info-card:focus-within .card-subitem {
  background: rgba(92, 57, 17, 0.08);
  border-color: rgba(117, 73, 20, 0.18);
  box-shadow: 0 10px 18px rgba(84, 55, 18, 0.12);
}

.card-subtitle {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #fff6e2;
  transition: color 0.24s ease;
}

.card-subcopy {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.65;
  transition: color 0.24s ease;
}

.info-card:hover .card-title,
.info-card:hover .card-eyebrow,
.info-card:hover .card-section-label,
.info-card:hover .card-subtitle,
.info-card:focus-within .card-title,
.info-card:focus-within .card-eyebrow,
.info-card:focus-within .card-section-label,
.info-card:focus-within .card-subtitle {
  color: #3c240d;
}

.info-card:hover .card-copy,
.info-card:hover .card-subcopy,
.info-card:focus-within .card-copy,
.info-card:focus-within .card-subcopy {
  color: rgba(52, 31, 10, 0.88);
}

.info-card:hover .card-section-label--ghost,
.info-card:focus-within .card-section-label--ghost {
  visibility: hidden;
}

.card-placeholder {
  display: grid;
  gap: 12px;
}

.card-placeholder--legacy {
  display: none;
}

.card-placeholder-line {
  margin: 0;
  min-height: 48px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.58);
  line-height: 1.5;
}

.page-footer {
  position: relative;
  padding: 28px 24px 40px;
}

.footer-shell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
  border-radius: 22px;
  background: rgba(5, 10, 22, 0.32);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.footer-brand {
  display: grid;
  gap: 8px;
}

.footer-logo {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fff5dd;
}

.footer-copy {
  margin: 0;
  max-width: 560px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: flex-end;
}

.footer-link {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.86);
}

@keyframes floatUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: calc(var(--star-opacity) * 0.65);
    transform: scale(0.95);
  }

  50% {
    opacity: var(--star-opacity);
    transform: scale(1.08);
  }
}

@media (max-width: 900px) {
  .hero-section,
  .info-section,
  .page-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .hero-wrapper {
    padding: 52px 30px;
  }

  .artistic-text {
    font-size: 64px;
  }

  .artistic-sub {
    font-size: 20px;
    letter-spacing: 0.1em;
  }

  .hero-description,
  .section-copy {
    font-size: 16px;
  }

  .card-copy {
    min-height: auto;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-card {
    min-height: auto;
  }

  .footer-shell {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-links {
    justify-content: flex-start;
  }

  .emotion-world__emoji-field span:nth-child(n + 45) {
    display: none;
  }
}

@media (max-width: 640px) {
  .hero-section {
    align-items: stretch;
    padding-top: 88px;
    padding-bottom: 56px;
  }

  .hero-wrapper {
    padding: 40px 22px;
    border-radius: 28px;
  }

  .artistic-text {
    font-size: 48px;
  }

  .artistic-sub {
    font-size: 17px;
  }

  .hero-description,
  .hero-hint,
  .card-copy,
  .card-subcopy,
  .card-placeholder-line,
  .footer-copy {
    font-size: 15px;
  }

  .section-title {
    font-size: 34px;
  }

  .card-title {
    font-size: 26px;
  }

  .info-card {
    padding: 24px;
    border-radius: 24px;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .star-emoji:nth-child(n + 11),
  .emotion-world__emoji-field span:nth-child(n + 49) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-wrapper,
  .star-emoji {
    animation: none;
  }

  .btn-primary,
  .btn-secondary,
  .logo-layer--inverse {
    transition: none;
  }
}
</style>
