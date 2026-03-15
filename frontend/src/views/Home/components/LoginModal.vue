<template>
  <div class="modal-overlay">
    <div class="modal-content glass-effect">
      
      <div class="mascot-container">
        <div 
          class="mascot continuous-breathe" 
          :class="{ 'shaking': isMascotClicked }"
          @click="handleMascotClick"
        >
          <div class="face">
            <div class="eyes" :class="{ 
              'looking-down': focusedField === 'email',
              'clicked': isMascotClicked 
            }">
              <div class="eye left"></div>
              <div class="eye right"></div>
            </div>
          </div>
          <div class="hands" :class="{ 'covering': focusedField === 'password' || focusedField === 'confirm' }">
            <div class="hand left"></div>
            <div class="hand right"></div>
          </div>
        </div>
      </div>

      <button class="close-btn glass-btn" @click="$emit('close')" aria-label="关闭"></button>

      <h2 class="modal-title">{{ isLogin ? '登录到 EchoStar' : '加入 EchoStar' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>邮箱</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="your@email.com"
            required
            :disabled="loading"
            @focus="handleFocus('email')"
            @blur="handleBlur"
          >
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="至少6位密码"
            required
            minlength="6"
            :disabled="loading"
            @focus="handleFocus('password')"
            @blur="handleBlur"
          >
        </div>

        <div v-if="!isLogin" class="form-group">
          <label>确认密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            required
            minlength="6"
            :disabled="loading"
            @focus="handleFocus('confirm')"
            @blur="handleBlur"
          >
        </div>

        <div v-if="!isLogin" class="form-group verification-group">
          <label>邮箱验证码</label>
          <div class="verification-input-wrapper">
            <input
              v-model="form.verificationCode"
              type="text"
              placeholder="请输入验证码"
              required
              maxlength="6"
              :disabled="loading"
              @focus="handleFocus('code')"
              @blur="handleBlur"
            >
            <button
              type="button"
              class="send-code-btn"
              @click="sendVerificationCode"
              :disabled="loading || countdown > 0 || !canSendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </button>
          </div>
        </div>

        <div class="actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? '请稍候...' : (isLogin ? '登录' : '注册') }}
          </button>
          <button type="button" class="btn-text" :disabled="loading" @click="toggleMode">
            {{ isLogin ? '没有账号？去注册' : '已有账号？去登录' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../../stores/user';

const emit = defineEmits(['close']);
const router = useRouter();
const userStore = useUserStore();

const isLogin = ref(true);
const loading = ref(false);
const focusedField = ref(null);
const focusTimer = ref(null);

// 新增：追踪小人是否被点击
const isMascotClicked = ref(false);

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: ''
});

const countdown = ref(0);
const countdownTimer = ref(null);

// 是否可以发送验证码
const canSendCode = computed(() => {
  return form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
});

function toggleMode() {
  isLogin.value = !isLogin.value;
  form.email = '';
  form.password = '';
  form.confirmPassword = '';
  form.verificationCode = '';
  focusedField.value = null;
  // 清除倒计时
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
  countdown.value = 0;
}

// 发送验证码
async function sendVerificationCode() {
  if (!canSendCode.value) {
    alert('请先输入有效的邮箱地址');
    return;
  }

  try {
    // TODO: 调用后端API发送验证码
    // const response = await sendCodeApi(form.email);
    console.log('发送验证码到:', form.email);

    // 开始倒计时
    countdown.value = 60;
    countdownTimer.value = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer.value);
        countdownTimer.value = null;
      }
    }, 1000);

    alert('验证码已发送到您的邮箱，请查收');
  } catch (error) {
    console.error('发送验证码失败:', error);
    alert('发送验证码失败，请重试');
  }
}

function handleFocus(field) {
  clearTimeout(focusTimer.value);
  focusedField.value = field;
}

function handleBlur() {
  focusTimer.value = setTimeout(() => {
    focusedField.value = null;
  }, 100);
}

// 新增：处理小人点击彩蛋的逻辑
function handleMascotClick() {
  // 防止重复点击打断动画
  if (isMascotClicked.value) return; 
  
  isMascotClicked.value = true;
  // 动画持续 800 毫秒后恢复原状
  setTimeout(() => {
    isMascotClicked.value = false;
  }, 800);
}

async function handleSubmit() {
  if (!isLogin.value && form.password !== form.confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }

  loading.value = true;
  focusedField.value = null;

  try {
    // TODO: 调用实际的登录/注册API
    // if (isLogin.value) {
    //   await userStore.login(form.email, form.password);
    // } else {
    //   await userStore.register(form.email, form.password);
    // }

    // 模拟登录成功
    userStore.setAuth('mock-token', {
      email: form.email,
      id: 'mock-user-id'
    });

    setTimeout(() => {
      emit('close');
      router.push('/map');
    }, 1000);
  } catch (error) {
    console.error('登录/注册失败:', error);
    alert('操作失败，请重试');
  } finally {
    loading.value = false;
  }
}

// 组件卸载时清除定时器
onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.modal-content {
  padding: 2.5rem 2.5rem 3rem;
  border-radius: 24px;
  width: 90%;
  max-width: 440px;
  position: relative;
  margin-top: 40px;
  animation: slideDown 0.4s ease-out;
}

/* ================= 🌟 活泼的 Emoji 小人系统 ================= */
.mascot-container {
  position: absolute;
  top: -65px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 100px;
  /* 允许鼠标穿透容器本身... */
  pointer-events: none; 
}

.continuous-breathe {
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.mascot {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, #FFDE59 0%, #FFB347 100%);
  border-radius: 50%;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), inset -4px -4px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; 
  /* ...但恢复小人本体的点击响应 */
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.2s;
}

/* 点击时的摇头晃脑动画 */
.mascot.shaking {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-6px) rotate(-10deg); }
  50% { transform: translateX(6px) rotate(10deg); }
  75% { transform: translateX(-6px) rotate(-10deg); }
}

.eyes {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.eyes.looking-down {
  transform: translateY(10px) scale(0.95);
}

.eye {
  width: 12px;
  height: 12px;
  background: #333;
  border-radius: 50%;
  animation: blink 5s infinite;
  transform-origin: center;
  transition: all 0.2s;
}

@keyframes blink {
  0%, 96%, 100% { transform: scaleY(1); }
  98% { transform: scaleY(0.1); }
}

/* 🌟 彩蛋：点击时眼睛变成 > < */
.eyes.clicked .eye {
  background: transparent;
  border-radius: 0;
  width: 14px;
  height: 14px;
  /* 暂停眨眼动画，防止表情抽搐 */
  animation: none; 
}

/* 利用边框和旋转画出 > */
.eyes.clicked .eye.left {
  border-right: 4px solid #333;
  border-bottom: 4px solid #333;
  transform: rotate(-45deg);
}

/* 利用边框和旋转画出 < */
.eyes.clicked .eye.right {
  border-left: 4px solid #333;
  border-bottom: 4px solid #333;
  transform: rotate(45deg);
}

.hands {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.hand {
  position: absolute;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #FFDE59 0%, #FFB347 100%);
  border-radius: 50%;
  bottom: -20px;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.4), inset -2px -2px 5px rgba(0,0,0,0.1);
  border: 1px solid rgba(0, 0, 0, 0.15);
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 5;
}

.hand.left { left: 2px; }
.hand.right { right: 2px; }

.hands.covering .hand.left {
  transform: translateY(-46px) translateX(6px) rotate(15deg);
}
.hands.covering .hand.right {
  transform: translateY(-46px) translateX(-6px) rotate(-15deg);
}
/* ======================================================= */

.close-btn.glass-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;
}

.close-btn::before,
.close-btn::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 2px;
  background-color: #ffffff; 
  border-radius: 2px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.close-btn::before { transform: rotate(45deg); }
.close-btn::after { transform: rotate(-45deg); }

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}
.close-btn:hover::before { transform: rotate(135deg); }
.close-btn:hover::after { transform: rotate(45deg); }
.close-btn:active { transform: scale(0.95); }

.modal-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #ffffff; 
  text-align: center;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.form-group { margin-bottom: 1.2rem; }

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #eeeeee;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.9rem 1rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-group input::placeholder { color: rgba(255, 255, 255, 0.6); }

.form-group input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.25);
  border-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.verification-group {
  margin-bottom: 1.2rem;
}

.verification-input-wrapper {
  display: flex;
  gap: 10px;
}

.verification-input-wrapper input {
  flex: 1;
}

.send-code-btn {
  padding: 0 1.2rem;
  background: transparent;
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 110px;
}

.send-code-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.send-code-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.send-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.actions {
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  background: transparent;
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
}

.btn-primary:disabled {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-text {
  background: transparent;
  border: none;
  color: #e0e0e0; 
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-text:hover { color: #ffffff; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>