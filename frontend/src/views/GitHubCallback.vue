<template>
  <div class="github-callback">
    <div class="callback-content">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const message = ref('正在通过 GitHub 登录...');

onMounted(async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      message.value = '未收到 GitHub 授权码，请重试';
      setTimeout(() => router.push('/'), 2000);
      return;
    }

    await userStore.loginWithGitHub(code);
    router.push('/map');
  } catch (error) {
    console.error('GitHub 登录失败:', error);
    message.value = error.message || 'GitHub 登录失败，请重试';
    setTimeout(() => router.push('/'), 2000);
  }
});
</script>

<style scoped>
.github-callback {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
}

.callback-content {
  text-align: center;
  color: #ffffff;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

p {
  font-size: 1.1rem;
  opacity: 0.9;
}
</style>
