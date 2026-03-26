<template>
  <div class="home">
    <div class="emoji-bg">
      <div class="emoji-container">
        <div
          v-for="i in 12"
          :key="i"
          class="emoji-row"
          :class="i % 2 === 0 ? 'move-left' : 'move-right'"
        >
          <div class="marquee-track">
            <div class="emoji-content">{{ emojiString }}</div>
            <div class="emoji-content">{{ emojiString }}</div>
          </div>
        </div>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/user';
import LoginModal from './components/LoginModal.vue';

const router = useRouter();
const userStore = useUserStore();
const showLogin = ref(false);

const baseEmojis = "😀 😍 😎 🥳 😇 🤩 😌 😋 🥰 🤭 🌻 ✨ 😭 😡 😍 😱 😴 🌟 🍀 ";
const emojiString = ref(baseEmojis.repeat(15));

// 如果已登录，直接跳转到地图页
if (userStore?.isLoggedIn) {
  router.push('/map');
}
</script>

<style scoped>
.home {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #2a2a4a;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ---------------- Emoji 背景动画系统 ---------------- */
.emoji-bg {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0.35;
}

.emoji-container {
  transform: rotate(-25deg);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.emoji-row {
  display: flex;
  width: 100%;
}

.marquee-track {
  display: flex;
  width: max-content;
}

.emoji-content {
  font-size: 9rem;
  letter-spacing: -4px;
  white-space: nowrap;
}

.move-left .marquee-track {
  animation: scroll-left 480s linear infinite;
}

.move-right .marquee-track {
  animation: scroll-right 480s linear infinite;
}

@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes scroll-right {
  0% { transform: translateX(-30%); }
  100% { transform: translateX(0); }
}

/* ---------------- 前景艺术字与毛玻璃卡片 ---------------- */
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
  font-weight: 900;
  margin-bottom: 16px;
  font-family: 'Arial Black', Impact, sans-serif;
  background: linear-gradient(135deg, #ffffff 0%, #f093fb 50%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 6px 4px rgba(0, 0, 0, 0.4))
          drop-shadow(0px 0px 20px rgba(240, 147, 251, 0.5));
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
</style>
