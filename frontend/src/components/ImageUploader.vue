<template>
  <div class="image-uploader">
    <div class="images-preview">
      <div
        v-for="(image, index) in previewImages"
        :key="index"
        class="image-item"
      >
        <img :src="image.preview" alt="预览图" />
        <button class="remove-btn" @click="removeImage(index)">
          <i class="icon-close">×</i>
        </button>
      </div>

      <label v-if="previewImages.length < maxImages" class="upload-btn">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          @change="handleFileSelect"
        />
        <div class="upload-icon">+</div>
        <div class="upload-text">添加图片</div>
      </label>
    </div>

    <p class="upload-tip">最多上传 {{ maxImages }} 张图片，每张不超过 10MB</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { validateImageFile, createPreviewURL, revokePreviewURL } from '../utils/image';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxImages: {
    type: Number,
    default: 9
  }
});

const emit = defineEmits(['update:modelValue']);

const fileInput = ref(null);
const previewImages = ref([]);

// 处理文件选择
function handleFileSelect(event) {
  const files = Array.from(event.target.files);

  files.forEach((file) => {
    // 验证文件
    const { valid, error } = validateImageFile(file);
    if (!valid) {
      alert(error);
      return;
    }

    // 检查数量限制
    if (previewImages.value.length >= props.maxImages) {
      alert(`最多只能上传 ${props.maxImages} 张图片`);
      return;
    }

    // 添加预览
    previewImages.value.push({
      file,
      preview: createPreviewURL(file)
    });
  });

  // 清空 input
  event.target.value = '';

  // 更新 v-model
  updateModelValue();
}

// 移除图片
function removeImage(index) {
  const removed = previewImages.value.splice(index, 1)[0];
  revokePreviewURL(removed.preview);
  updateModelValue();
}

// 更新 v-model
function updateModelValue() {
  emit('update:modelValue', previewImages.value.map((img) => img.file));
}

// 监听外部变化
watch(
  () => props.modelValue,
  (newFiles) => {
    if (newFiles.length === 0 && previewImages.value.length > 0) {
      // 清空预览
      previewImages.value.forEach((img) => revokePreviewURL(img.preview));
      previewImages.value = [];
    }
  }
);
</script>

<style scoped>
.image-uploader {
  padding: 20px;
}

.images-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-close {
  font-size: 18px;
  line-height: 1;
}

.upload-btn {
  aspect-ratio: 1;
  border: 2px dashed #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-btn:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.upload-btn input {
  display: none;
}

.upload-icon {
  font-size: 32px;
  color: #999;
}

.upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.upload-tip {
  margin: 0;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>
