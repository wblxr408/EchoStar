<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <button class="close-btn" @click="$emit('close')">×</button>

      <h2 class="modal-title">{{ isLogin ? '登录' : '注册' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>邮箱</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱"
            required
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '处理中...' : isLogin ? '登录' : '注册' }}
        </button>
      </form>

      <div class="divider">或</div>

      <button class="btn-github" @click="handleGitHubLogin">
        <span>使用 GitHub 登录</span>
      </button>

      <p class="switch-mode">
        {{ isLogin ? '还没有账号？' : '已有账号？' }}
        <a href="#" @click.prevent="isLogin = !isLogin">
          {{ isLogin ? '立即注册' : '立即登录' }}
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../../stores/user';

const emit = defineEmits(['close']);

const router = useRouter();
const userStore = useUserStore();

const isLogin = ref(true);
const loading = ref(false);
const form = ref({
  email: '',
  password: ''
});

// 处理登录/注册
async function handleSubmit() {
  loading.value = true;

  try {
    if (isLogin.value) {
      await userStore.login(form.value.email, form.value.password);
    } else {
      await userStore.register(form.value.email, form.value.password);
    }

    emit('close');
    router.push('/map');
  } catch (error) {
    alert(error.response?.data?.message || '操作失败，请重试');
  } finally {
    loading.value = false;
  }
}

// GitHub 登录
function handleGitHubLogin() {
  // TODO: 实现 GitHub OAuth 流程
  alert('GitHub 登录功能开发中');
}

// 点击遮罩关闭
function handleOverlayClick() {
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 32px;
  animation: fadeInUp 0.3s ease;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 24px;
  color: #999;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-title {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  border-color: #667eea;
}

.btn-primary {
  width: 100%;
  margin-top: 8px;
}

.divider {
  margin: 24px 0;
  text-align: center;
  color: #999;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e0e0e0;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.btn-github {
  width: 100%;
  padding: 12px 24px;
  background: #24292e;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-github:hover {
  background: #1b1f23;
}

.switch-mode {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.switch-mode a {
  color: #667eea;
  font-weight: 600;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
