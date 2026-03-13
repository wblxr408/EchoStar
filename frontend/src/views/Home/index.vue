<template>
  <div class="home">
    <div class="hero">
      <h1 class="logo">EchoStar</h1>
      <p class="tagline">在地图上留下你的情绪印记</p>

      <div class="actions">
        <button class="btn-primary" @click="showLogin = true">开始探索</button>
      </div>
    </div>

    <!-- 登录模态框 -->
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

// 如果已登录，直接跳转到地图页
if (userStore.isLoggedIn) {
  router.push('/map');
}
</script>

<style scoped>
.home {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero {
  text-align: center;
  color: white;
}

.logo {
  font-size: 64px;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(to right, #fff, #f0f4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  font-size: 20px;
  margin-bottom: 48px;
  opacity: 0.9;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-primary {
  padding: 16px 32px;
  font-size: 18px;
  background: white;
  color: #667eea;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}
</style>
