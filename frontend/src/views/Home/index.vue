<template>
  <div
    class="home"
    @pointerenter="handlePointerEnter"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <div class="emotion-world">
      <div class="emotion-world__glow"></div>
      <div class="emotion-world__pattern"></div>
      <div class="emotion-world__emoji-field" aria-hidden="true">
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

    <div
      class="night-scene"
      :class="{ active: lensVisible }"
      :style="nightMaskStyle"
    >
      <div class="stars-layer stars-layer--nebula"></div>
      <div class="stars-layer stars-layer--dots"></div>

      <div class="star-emoji-field" aria-hidden="true">
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

    <div class="hero-wrapper">
      <div class="hero">
        <h1 class="logo artistic-text">EchoStar</h1>
        <p class="tagline artistic-sub">在地图上留下你的情绪印记</p>

        <div class="actions">
          <button class="btn-primary" @click="showLogin = true">开始探索</button>
        </div>
      </div>
    </div>

    <LoginModal v-if="showLogin" @close="showLogin = false" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import LoginModal from './components/LoginModal.vue';

const router = useRouter();
const userStore = useUserStore();
const showLogin = ref(false);

const decorativeStars = [
  { id: 1, symbol: '✦', top: '8%', left: '9%', size: '24px', delay: '0s', duration: '4.8s', opacity: 0.72 },
  { id: 2, symbol: '✧', top: '14%', left: '22%', size: '20px', delay: '0.8s', duration: '5.4s', opacity: 0.6 },
  { id: 3, symbol: '✨', top: '10%', left: '78%', size: '26px', delay: '1.2s', duration: '6.2s', opacity: 0.8 },
  { id: 4, symbol: '⋆', top: '18%', left: '90%', size: '22px', delay: '0.3s', duration: '4.6s', opacity: 0.58 },
  { id: 5, symbol: '✦', top: '30%', left: '7%', size: '18px', delay: '1.7s', duration: '5.1s', opacity: 0.55 },
  { id: 6, symbol: '⭐', top: '24%', left: '84%', size: '24px', delay: '1.1s', duration: '6s', opacity: 0.76 },
  { id: 7, symbol: '✧', top: '42%', left: '12%', size: '22px', delay: '2s', duration: '5.8s', opacity: 0.62 },
  { id: 8, symbol: '⋆', top: '50%', left: '6%', size: '20px', delay: '0.6s', duration: '4.9s', opacity: 0.52 },
  { id: 9, symbol: '✨', top: '60%', left: '14%', size: '28px', delay: '1.4s', duration: '6.4s', opacity: 0.82 },
  { id: 10, symbol: '✦', top: '76%', left: '9%', size: '20px', delay: '2.3s', duration: '5.7s', opacity: 0.6 },
  { id: 11, symbol: '✧', top: '86%', left: '20%', size: '22px', delay: '1.8s', duration: '4.7s', opacity: 0.56 },
  { id: 12, symbol: '🌟', top: '15%', left: '68%', size: '26px', delay: '0.5s', duration: '5.3s', opacity: 0.76 },
  { id: 13, symbol: '⋆', top: '72%', left: '84%', size: '18px', delay: '1.9s', duration: '4.5s', opacity: 0.52 },
  { id: 14, symbol: '✦', top: '84%', left: '71%', size: '24px', delay: '0.9s', duration: '5.9s', opacity: 0.68 },
  { id: 15, symbol: '✧', top: '58%', left: '90%', size: '22px', delay: '1.3s', duration: '5.2s', opacity: 0.58 },
  { id: 16, symbol: '✨', top: '34%', left: '93%', size: '24px', delay: '0.4s', duration: '6.1s', opacity: 0.74 },
];

const moodPool = ['😊', '🥰', '😌', '🤩', '🥳', '😎', '😇', '🙂', '😍', '🤭', '🫶', '💛', '🌻', '✨', '💫', '🍀'];
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
const lensOffsetX = ref(0);
const lensOffsetY = ref(0);
const lensRadiusX = ref(220);
const lensRadiusY = ref(220);

const pointerTarget = { x: 0, y: 0 };
const pointerCurrent = { x: 0, y: 0 };
const pointerPrevious = { x: 0, y: 0 };
const pointerVelocity = { x: 0, y: 0 };
let pointerInside = false;
let animationFrameId = 0;

const nightMaskStyle = computed(() => {
  if (!lensVisible.value) {
    return {
      maskImage: 'none',
      WebkitMaskImage: 'none',
    };
  }

  const centerX = lensX.value + lensOffsetX.value;
  const centerY = lensY.value + lensOffsetY.value;
  const mask = `radial-gradient(ellipse ${lensRadiusX.value}px ${lensRadiusY.value}px at ${centerX}px ${centerY}px, transparent 0, transparent 68%, black 77%)`;

  return {
    maskImage: mask,
    WebkitMaskImage: mask,
  };
});

function seedPointer(event) {
  pointerTarget.x = event.clientX;
  pointerTarget.y = event.clientY;
  pointerCurrent.x = event.clientX;
  pointerCurrent.y = event.clientY;
  pointerPrevious.x = event.clientX;
  pointerPrevious.y = event.clientY;
  pointerVelocity.x = 0;
  pointerVelocity.y = 0;
  lensX.value = event.clientX;
  lensY.value = event.clientY;
}

function handlePointerEnter(event) {
  pointerInside = true;
  lensVisible.value = true;
  seedPointer(event);
}

function handlePointerMove(event) {
  if (!pointerInside) {
    handlePointerEnter(event);
    return;
  }

  pointerTarget.x = event.clientX;
  pointerTarget.y = event.clientY;
}

function handlePointerLeave() {
  pointerInside = false;
  lensVisible.value = false;
}

function animateReveal() {
  const easing = pointerInside ? 0.24 : 0.12;
  pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * easing;
  pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * easing;

  const velocityX = pointerCurrent.x - pointerPrevious.x;
  const velocityY = pointerCurrent.y - pointerPrevious.y;
  const speed = Math.min(Math.hypot(velocityX, velocityY), 34);
  const accelerationX = velocityX - pointerVelocity.x;
  const accelerationY = velocityY - pointerVelocity.y;
  const acceleration = Math.min(Math.hypot(accelerationX, accelerationY), 26);

  pointerPrevious.x = pointerCurrent.x;
  pointerPrevious.y = pointerCurrent.y;
  pointerVelocity.x = velocityX;
  pointerVelocity.y = velocityY;

  const offsetTargetX = -velocityX * 1.8 - accelerationX * 1.25;
  const offsetTargetY = -velocityY * 1.8 - accelerationY * 1.25;
  lensOffsetX.value += (offsetTargetX - lensOffsetX.value) * 0.2;
  lensOffsetY.value += (offsetTargetY - lensOffsetY.value) * 0.2;

  const radiusXTarget = Math.max(
    206,
    220 + Math.abs(velocityX) * 1.7 + Math.abs(accelerationX) * 1.9 - Math.abs(velocityY) * 0.14 + speed * 0.14 + acceleration * 0.2
  );
  const radiusYTarget = Math.max(
    206,
    220 + Math.abs(velocityY) * 1.7 + Math.abs(accelerationY) * 1.9 - Math.abs(velocityX) * 0.14 + speed * 0.14 + acceleration * 0.2
  );

  lensRadiusX.value += (radiusXTarget - lensRadiusX.value) * 0.22;
  lensRadiusY.value += (radiusYTarget - lensRadiusY.value) * 0.22;
  lensX.value = pointerCurrent.x;
  lensY.value = pointerCurrent.y;

  if (!pointerInside) {
    lensOffsetX.value += (0 - lensOffsetX.value) * 0.17;
    lensOffsetY.value += (0 - lensOffsetY.value) * 0.17;
    lensRadiusX.value += (220 - lensRadiusX.value) * 0.15;
    lensRadiusY.value += (220 - lensRadiusY.value) * 0.15;
    pointerVelocity.x += (0 - pointerVelocity.x) * 0.2;
    pointerVelocity.y += (0 - pointerVelocity.y) * 0.2;
  }

  animationFrameId = window.requestAnimationFrame(animateReveal);
}

onMounted(() => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  pointerTarget.x = centerX;
  pointerTarget.y = centerY;
  pointerCurrent.x = centerX;
  pointerCurrent.y = centerY;
  pointerPrevious.x = centerX;
  pointerPrevious.y = centerY;
  lensX.value = centerX;
  lensY.value = centerY;
  animationFrameId = window.requestAnimationFrame(animateReveal);
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }
});

if (userStore?.isLoggedIn) {
  router.push('/map');
}
</script>

<style scoped>
.home {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: #02040b;
}

.emotion-world,
.night-scene,
.stars-layer,
.star-emoji-field {
  position: absolute;
  inset: 0;
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
  pointer-events: none;
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
  pointer-events: none;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
}

.stars-layer,
.star-emoji-field {
  pointer-events: none;
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
  position: relative;
  z-index: 10;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 60px 80px;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: floatUp 1s ease-out;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.artistic-text {
  font-size: 80px;
  font-weight: 700;
  margin-bottom: 16px;
  font-family: 'Georgia', 'Palatino Linotype', 'Book Antiqua', serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #fff9ef 0%, #f3d59b 44%, #d79a43 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 6px 4px rgba(51, 31, 5, 0.32))
          drop-shadow(0px 0px 18px rgba(255, 220, 150, 0.32));
}

.artistic-sub {
  font-size: 24px;
  margin-bottom: 48px;
  font-weight: bold;
  color: #ffffff;
  letter-spacing: 4px;
  text-shadow: 0px 4px 8px rgba(0, 0, 0, 0.6);
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-primary {
  padding: 16px 80px;
  font-size: 20px;
  background: transparent;
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

@keyframes floatUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
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
  .home {
    padding: 24px 16px;
  }

  .hero-wrapper {
    padding: 44px 32px;
    width: min(92vw, 560px);
  }

  .artistic-text {
    font-size: 64px;
  }

  .artistic-sub {
    font-size: 20px;
    letter-spacing: 2px;
  }

  .emotion-world__emoji-field span:nth-child(n + 45) {
    display: none;
  }
}

@media (max-width: 640px) {
  .hero-wrapper {
    padding: 36px 24px;
  }

  .artistic-text {
    font-size: 52px;
  }

  .artistic-sub {
    font-size: 17px;
    line-height: 1.6;
  }

  .btn-primary {
    width: 100%;
    padding: 16px 24px;
  }

  .star-emoji:nth-child(n + 11),
  .emotion-world__emoji-field span:nth-child(n + 49) {
    display: none;
  }
}
</style>
