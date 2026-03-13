<template>
  <div class="time-capsule" :class="{ unlocked: isUnlocked }">
    <div class="capsule-icon">
      <i v-if="isUnlocked" class="icon-unlock">🔓</i>
      <i v-else class="icon-lock">🔒</i>
    </div>

    <div class="capsule-info">
      <h3 v-if="isUnlocked">时光胶囊已解锁</h3>
      <h3 v-else>时光胶囊</h3>

      <p class="unlock-time">
        {{ isUnlocked ? '解锁于 ' + formatUnlockTime : countdown }}
      </p>
    </div>

    <div v-if="!isUnlocked" class="capsule-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ Math.round(progress) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { formatDateTime, getTimeCapsuleCountdown, isTimeCapsuleUnlocked } from '../utils/time';

const props = defineProps({
  unlockAt: {
    type: String,
    required: true
  },
  createdAt: {
    type: String,
    required: true
  }
});

const now = ref(new Date());
let timer = null;

// 是否已解锁
const isUnlocked = computed(() => {
  return isTimeCapsuleUnlocked(props.unlockAt);
});

// 倒计时
const countdown = computed(() => {
  return getTimeCapsuleCountdown(props.unlockAt);
});

// 格式化解锁时间
const formatUnlockTime = computed(() => {
  return formatDateTime(props.unlockAt, 'YYYY-MM-DD HH:mm');
});

// 进度百分比
const progress = computed(() => {
  const created = new Date(props.createdAt).getTime();
  const unlock = new Date(props.unlockAt).getTime();
  const current = now.value.getTime();

  if (current >= unlock) return 100;
  if (current <= created) return 0;

  return ((current - created) / (unlock - created)) * 100;
});

// 定时更新
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.time-capsule {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.time-capsule.unlocked {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.capsule-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.capsule-info {
  text-align: center;
  margin-bottom: 16px;
}

.capsule-info h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.unlock-time {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.capsule-progress {
  margin-top: 16px;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 4px;
  transition: width 1s linear;
}

.progress-text {
  display: block;
  text-align: center;
  font-size: 12px;
  opacity: 0.9;
}
</style>
