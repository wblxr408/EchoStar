<template>
  <div class="emotion-selector">
    <h3>选择你的情绪</h3>
    <div class="emotions">
      <button
        v-for="emotion in emotions"
        :key="emotion.value"
        class="emotion-btn"
        :class="{ active: modelValue === emotion.value }"
        @click="selectEmotion(emotion.value)"
      >
        <span class="emotion-icon">{{ emotion.icon }}</span>
        <span class="emotion-label">{{ emotion.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);

const emotions = [
  { value: 'happy', icon: '😊', label: '开心' },
  { value: 'sad', icon: '😢', label: '难过' },
  { value: 'neutral', icon: '😐', label: '平静' },
  { value: 'excited', icon: '🤩', label: '兴奋' },
  { value: 'peaceful', icon: '😌', label: '祥和' }
];

function selectEmotion(value) {
  emit('update:modelValue', value);
}
</script>

<style scoped>
.emotion-selector {
  padding: 20px;
}

.emotion-selector h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
}

.emotions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
}

.emotion-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.emotion-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.emotion-btn.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.emotion-icon {
  font-size: 32px;
}

.emotion-label {
  font-size: 14px;
  color: #666;
}

.emotion-btn.active .emotion-label {
  color: #667eea;
  font-weight: 600;
}
</style>
