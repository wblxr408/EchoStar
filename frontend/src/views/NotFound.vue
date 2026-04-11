<template>
  <div class="not-found">
    <div class="not-found__content">
      <div class="not-found__emoji">🌟</div>
      <h1 class="not-found__title">404</h1>
      <p class="not-found__message">页面似乎迷失在了星空中...</p>
      <div class="not-found__actions">
        <button class="btn-primary" @click="goHome">
          返回首页
        </button>
        <button class="btn-secondary" @click="goBack">
          返回上页
        </button>
      </div>
    </div>
    
    <!-- 装饰星星 -->
    <div class="not-found__stars" aria-hidden="true">
      <span
        v-for="star in decorativeStars"
        :key="star.id"
        class="star"
        :style="{
          top: star.top,
          left: star.left,
          fontSize: star.size,
          animationDelay: star.delay
        }"
      >
        {{ star.symbol }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const decorativeStars = [
  { id: 1, symbol: '✦', top: '10%', left: '15%', size: '20px', delay: '0s' },
  { id: 2, symbol: '✧', top: '20%', left: '80%', size: '24px', delay: '0.5s' },
  { id: 3, symbol: '✨', top: '60%', left: '10%', size: '28px', delay: '1s' },
  { id: 4, symbol: '⭐', top: '75%', left: '85%', size: '22px', delay: '1.5s' },
  { id: 5, symbol: '✦', top: '85%', left: '25%', size: '18px', delay: '2s' },
  { id: 6, symbol: '✧', top: '30%', left: '90%', size: '26px', delay: '0.8s' },
];

function goHome(): void {
  router.push({ name: 'Home' });
}

function goBack(): void {
  router.back();
}
</script>

<style scoped lang="scss">
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.not-found__content {
  text-align: center;
  z-index: 1;
  animation: fadeInUp 0.6s ease;
}

.not-found__emoji {
  font-size: 80px;
  margin-bottom: 16px;
  animation: bounce 2s infinite;
}

.not-found__title {
  font-size: 120px;
  font-weight: 700;
  color: white;
  line-height: 1;
  margin-bottom: 16px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.not-found__message {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 32px;
}

.not-found__actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.not-found__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.star {
  position: absolute;
  animation: twinkle 3s infinite;
  opacity: 0.6;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

// 按钮样式继承全局
.btn-primary {
  padding: 14px 28px;
  background: white;
  color: #667eea;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

.btn-secondary {
  padding: 14px 28px;
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: white;
  }
}
</style>
