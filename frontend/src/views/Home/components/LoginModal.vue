<template>
  <div class="modal-overlay">
    <div class="modal-content glass-effect">
      <div class="mascot-container">
        <div
          class="mascot continuous-breathe"
          :class="{ shaking: isMascotClicked }"
          @click="handleMascotClick"
        >
          <div class="face">
            <div
              class="eyes"
              :class="{
                'looking-down': focusedField === 'email',
                clicked: isMascotClicked,
              }"
            >
              <div class="eye left"></div>
              <div class="eye right"></div>
            </div>
          </div>
          <div
            class="hands"
            :class="{
              covering:
                focusedField === 'password' || focusedField === 'confirm',
            }"
          >
            <div class="hand left"></div>
            <div class="hand right"></div>
          </div>
        </div>
      </div>

      <button
        class="close-btn glass-btn"
        @click="$emit('close')"
        aria-label="关闭"
      >
        <span></span>
      </button>

      <h2 class="modal-title">
        {{
          isForgotPassword
            ? "重置密码"
            : isAdmin
              ? "管理员登录"
              : isLogin
                ? "登录到 EchoStar"
                : "加入 EchoStar"
        }}
      </h2>

      <div class="login-type-tabs" v-if="isLogin && !isForgotPassword">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: !isAdmin }"
          @click="isAdmin = false"
        >
          用户
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: isAdmin }"
          @click="isAdmin = true"
        >
          管理员
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <template v-if="isForgotPassword">
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
            />
          </div>

          <div class="form-group verification-group">
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
              />
              <button
                type="button"
                class="send-code-btn"
                @click="sendVerificationCode"
                :disabled="loading || countdown > 0 || !canSendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : "发送验证码" }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>新密码</label>
            <input
              v-model="form.newPassword"
              type="password"
              placeholder="至少6位新密码"
              required
              minlength="6"
              :disabled="loading"
              @focus="handleFocus('password')"
              @blur="handleBlur"
            />
          </div>

          <div class="form-group">
            <label>确认新密码</label>
            <input
              v-model="form.confirmNewPassword"
              type="password"
              placeholder="再次输入新密码"
              required
              minlength="6"
              :disabled="loading"
              @focus="handleFocus('confirm')"
              @blur="handleBlur"
            />
          </div>
        </template>

        <template v-else>
          <div v-if="!isLogin" class="form-group">
            <label>用户名</label>
            <input
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              required
              minlength="2"
              maxlength="20"
              :disabled="loading"
              @focus="handleFocus('username')"
              @blur="handleBlur"
            />
          </div>

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
            />
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
              :class="{ 'input-error': passwordError }"
              @focus="handleFocus('password')"
              @blur="handleBlur"
            />
            <div v-if="passwordError" class="field-error">
              {{ passwordError }}
            </div>
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
              :class="{ 'input-error': confirmPasswordError }"
              @focus="handleFocus('confirm')"
              @blur="handleBlur"
            />
            <div v-if="confirmPasswordError" class="field-error">
              {{ confirmPasswordError }}
            </div>
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
              />
              <button
                type="button"
                class="send-code-btn"
                @click="sendVerificationCode"
                :disabled="loading || countdown > 0 || !canSendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : "发送验证码" }}
              </button>
            </div>
          </div>
        </template>

        <div class="actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{
              loading
                ? "请稍候..."
                : isForgotPassword
                  ? "重置密码"
                  : isLogin
                    ? "登录"
                    : "注册"
            }}
          </button>

          <button
            v-if="isLogin && !isAdmin && !isForgotPassword"
            type="button"
            class="btn-text forgot-link"
            :disabled="loading"
            @click="toggleForgotPassword"
          >
            忘记密码？
          </button>

          <div
            v-if="isLogin && !isAdmin && !isForgotPassword"
            class="social-login"
          >
            <div v-if="false" class="divider">
              <span>或</span>
            </div>
            <button
              v-if="false"
              type="button"
              class="btn-github"
              :disabled="loading"
              @click="handleGitHubLogin"
            >
              <svg
                class="github-icon"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  fill="currentColor"
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
              <span>使用 GitHub 登录</span>
            </button>
            <button
              type="button"
              class="btn-guest"
              :disabled="loading"
              @click="handleGuestLogin"
            >
              <span class="guest-icon">🚶</span>
              <span>游客体验</span>
            </button>
          </div>

          <button
            v-if="isForgotPassword"
            type="button"
            class="btn-text"
            :disabled="loading"
            @click="toggleForgotPassword"
          >
            返回登录
          </button>
          <button
            v-else
            type="button"
            class="btn-text"
            :disabled="loading"
            @click="toggleMode"
          >
            {{ isLogin ? "没有账号？去注册" : "已有账号？去登录" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../../../stores/user";
import { authApi } from "../../../api/auth";
import { showToast } from "../../../composables/useToast.js";

const emit = defineEmits(["close"]);
const router = useRouter();
const userStore = useUserStore();

const isLogin = ref(true);
const isAdmin = ref(false);
const loading = ref(false);
const focusedField = ref(null);
const focusTimer = ref(null);
const isForgotPassword = ref(false);

const isMascotClicked = ref(false);

const form = reactive({
  email: "",
  password: "",
  username: "",
  confirmPassword: "",
  verificationCode: "",
  newPassword: "",
  confirmNewPassword: "",
});

const countdown = ref(0);
const countdownTimer = ref(null);

const passwordError = ref("");
const confirmPasswordError = ref("");

const canSendCode = computed(() => {
  const emailValid =
    form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  if (!isLogin.value && !isForgotPassword.value) {
    return (
      emailValid &&
      form.password.length >= 6 &&
      form.password === form.confirmPassword
    );
  }
  return emailValid;
});

watch(
  () => form.password,
  (val) => {
    if (!isLogin.value && val) {
      if (val.length < 6) {
        passwordError.value = "密码至少需要6位";
      } else {
        passwordError.value = "";
      }
      if (form.confirmPassword) {
        confirmPasswordError.value =
          val !== form.confirmPassword ? "两次输入的密码不一致" : "";
      }
    } else {
      passwordError.value = "";
    }
  },
);

watch(
  () => form.confirmPassword,
  (val) => {
    if (!isLogin.value && val) {
      if (val !== form.password) {
        confirmPasswordError.value = "两次输入的密码不一致";
      } else if (val.length < 6) {
        confirmPasswordError.value = "密码至少需要6位";
      } else {
        confirmPasswordError.value = "";
      }
    } else {
      confirmPasswordError.value = "";
    }
  },
);

function toggleMode() {
  isLogin.value = !isLogin.value;
  isAdmin.value = false;
  isForgotPassword.value = false;
  form.email = "";
  form.password = "";
  form.username = "";
  form.confirmPassword = "";
  form.verificationCode = "";
  form.newPassword = "";
  form.confirmNewPassword = "";
  focusedField.value = null;
  passwordError.value = "";
  confirmPasswordError.value = "";
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
  countdown.value = 0;
}

function toggleForgotPassword() {
  isForgotPassword.value = !isForgotPassword.value;
  isAdmin.value = false;
  isLogin.value = true;
  form.password = "";
  form.verificationCode = "";
  form.newPassword = "";
  form.confirmNewPassword = "";
  focusedField.value = null;
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
    countdownTimer.value = null;
  }
  countdown.value = 0;
}

async function sendVerificationCode() {
  if (!canSendCode.value) {
    if (!isLogin.value && !isForgotPassword.value) {
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        showToast("请先输入有效的邮箱地址", "warning");
        return;
      }
      if (form.password.length < 6) {
        showToast("密码至少需要6位", "warning");
        return;
      }
      if (form.password !== form.confirmPassword) {
        showToast("两次输入的密码不一致", "warning");
        return;
      }
    } else {
      showToast("请先输入有效的邮箱地址", "warning");
    }
    return;
  }

  try {
    await authApi.sendVerificationCode(form.email);

    countdown.value = 60;
    countdownTimer.value = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer.value);
        countdownTimer.value = null;
      }
    }, 1000);

    showToast("验证码已发送到您的邮箱，请查收", "success");
  } catch (error) {
    console.error("发送验证码失败:", error);
    showToast(error.message || "发送验证码失败，请重试", "error");
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

function handleMascotClick() {
  if (isMascotClicked.value) return;

  isMascotClicked.value = true;
  setTimeout(() => {
    isMascotClicked.value = false;
  }, 800);
}

function handleGitHubLogin() {
  const clientId =
    import.meta.env.VITE_GITHUB_CLIENT_ID || "your-github-client-id";
  const redirectUri = encodeURIComponent(
    window.location.origin + "/auth/github/callback",
  );
  const scope = "read:user user:email";
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}`;
  window.location.href = githubAuthUrl;
}

function handleGuestLogin() {
  userStore.loginAsGuest();
  emit("close");
  router.push("/map");
}

async function handleSubmit() {
  if (isForgotPassword.value) {
    await handleForgotPassword();
    return;
  }

  if (!isLogin.value && form.password !== form.confirmPassword) {
    showToast("两次输入的密码不一致", "warning");
    return;
  }

  if (!isLogin.value && !form.username) {
    showToast("请输入用户名", "warning");
    return;
  }

  if (!isLogin.value && !form.verificationCode.trim()) {
    showToast("请输入验证码", "warning");
    return;
  }

  loading.value = true;
  focusedField.value = null;

  try {
    if (isAdmin.value) {
      await userStore.adminLogin(form.email, form.password);

      setTimeout(() => {
        emit("close");
        router.push("/admin");
      }, 1000);
    } else {
      if (isLogin.value) {
        await userStore.login(form.email, form.password);
      } else {
        await userStore.register(
          form.email,
          form.password,
          form.username,
          form.verificationCode.trim(),
        );
      }

      setTimeout(() => {
        emit("close");
        router.push("/map");
      }, 500);
    }
  } catch (error) {
    console.error("登录/注册失败:", error);
    showToast(error.message || "操作失败，请重试", "error");
  } finally {
    loading.value = false;
  }
}

async function handleForgotPassword() {
  if (!form.email) {
    showToast("请输入邮箱", "warning");
    return;
  }
  if (!form.verificationCode) {
    showToast("请输入验证码", "warning");
    return;
  }
  if (!form.newPassword || form.newPassword.length < 6) {
    showToast("新密码至少需要6位", "warning");
    return;
  }
  if (form.newPassword !== form.confirmNewPassword) {
    showToast("两次输入的新密码不一致", "warning");
    return;
  }

  loading.value = true;
  focusedField.value = null;

  try {
    await authApi.forgotPassword(
      form.email,
      form.newPassword,
      form.verificationCode,
    );
    showToast("密码重置成功，请使用新密码登录", "success");
    isForgotPassword.value = false;
    form.password = "";
    form.verificationCode = "";
    form.newPassword = "";
    form.confirmNewPassword = "";
  } catch (error) {
    console.error("重置密码失败:", error);
    showToast(error.message || "重置密码失败，请重试", "error");
  } finally {
    loading.value = false;
  }
}

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

.mascot-container {
  position: absolute;
  top: -65px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 100px;
  pointer-events: none;
}

.continuous-breathe {
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.mascot {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, #ffde59 0%, #ffb347 100%);
  border-radius: 50%;
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.2),
    inset -4px -4px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.2s;
}

.mascot.shaking {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0) rotate(0);
  }
  25% {
    transform: translateX(-6px) rotate(-10deg);
  }
  50% {
    transform: translateX(6px) rotate(10deg);
  }
  75% {
    transform: translateX(-6px) rotate(-10deg);
  }
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
  0%,
  96%,
  100% {
    transform: scaleY(1);
  }
  98% {
    transform: scaleY(0.1);
  }
}

.eyes.clicked .eye {
  background: transparent;
  border-radius: 0;
  width: 14px;
  height: 14px;
  animation: none;
}

.eyes.clicked .eye.left {
  border-right: 4px solid #333;
  border-bottom: 4px solid #333;
  transform: rotate(-45deg);
}

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
  background: linear-gradient(135deg, #ffde59 0%, #ffb347 100%);
  border-radius: 50%;
  bottom: -20px;
  box-shadow:
    0 -4px 15px rgba(0, 0, 0, 0.4),
    inset -2px -2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.15);
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 5;
}

.hand.left {
  left: 2px;
}
.hand.right {
  right: 2px;
}

.hands.covering .hand.left {
  transform: translateY(-46px) translateX(6px) rotate(15deg);
}
.hands.covering .hand.right {
  transform: translateY(-46px) translateX(-6px) rotate(-15deg);
}

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

.close-btn.glass-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 20px;
  color: #ffffff;
}

.close-btn::before,
.close-btn::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 2px;
  background-color: #ffffff;
  border-radius: 2px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
}

.close-btn::before {
  transform: translate(-50%, calc(-50% + 0.5px)) rotate(45deg);
}
.close-btn::after {
  transform: translate(-50%, calc(-50% + 0.5px)) rotate(-45deg);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}
.close-btn:hover::before {
  transform: translate(-50%, -50%) rotate(135deg);
}
.close-btn:hover::after {
  transform: translate(-50%, -50%) rotate(45deg);
}
.close-btn:active {
  transform: scale(0.95);
}

.modal-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #ffffff;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.login-type-tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.5rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.form-group {
  margin-bottom: 0.75rem;
}

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

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

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

.form-group input.input-error {
  border-color: rgba(244, 67, 54, 0.6);
  background: rgba(244, 67, 54, 0.1);
}

.field-error {
  font-size: 0.75rem;
  color: #ff6b6b;
  margin-top: 0.25rem;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
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
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.social-login {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.btn-github {
  width: 100%;
  padding: 0.85rem 1rem;
  background: #24292e;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
}

.btn-github:hover:not(:disabled) {
  background: #1a1e22;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.btn-github:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-github:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-guest {
  width: 100%;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
}

.btn-guest:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.btn-guest:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-guest:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.guest-icon {
  font-size: 18px;
}

.github-icon {
  flex-shrink: 0;
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

.btn-text:hover {
  color: #ffffff;
}

.forgot-link {
  font-size: 0.85rem;
  opacity: 0.8;
}

.forgot-link:hover {
  opacity: 1;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
