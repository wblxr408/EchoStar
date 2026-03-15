<template>
  <div class="image-uploader">
    <!-- 拖拽上传区域 -->
    <div
      class="upload-area"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="handleDrop"
    >
      <div class="images-preview">
        <div
          v-for="(image, index) in previewImages"
          :key="index"
          class="image-item"
          :class="{ 'uploading': image.uploading, 'error': image.error }"
          :style="{ transform: `rotate(${image.rotation || 0}deg)` }"
        >
          <img :src="image.preview" alt="预览图" @click="previewImage(index)" />

          <!-- 上传进度条 -->
          <div v-if="image.uploading" class="upload-progress">
            <div class="progress-bar" :style="{ width: image.progress + '%' }"></div>
            <span class="progress-text">{{ image.progress }}%</span>
          </div>

          <!-- 错误提示 -->
          <div v-if="image.error" class="error-overlay">
            <span class="error-icon">⚠️</span>
            <span class="error-text">上传失败</span>
          </div>

          <!-- 删除按钮 -->
          <button class="remove-btn" @click="removeImage(index)">
            <i class="icon-close">×</i>
          </button>

          <!-- 图片操作按钮 -->
          <div class="image-actions">
            <button class="action-btn" @click="previewImage(index)" title="预览">
              <span>👁️</span>
            </button>
            <button class="action-btn" @click="rotateImage(index)" title="旋转">
              <span>🔄</span>
            </button>
          </div>
        </div>

        <!-- 添加图片按钮 -->
        <label
          v-if="previewImages.length < maxImages"
          class="upload-btn"
          :class="{ 'pulse': isDragOver }"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            @change="handleFileSelect"
          />
          <div class="upload-icon" :class="{ 'animate': isDragOver }">
            {{ isDragOver ? '📥' : '📷' }}
          </div>
          <div class="upload-text">{{ isDragOver ? '松开上传' : '添加图片' }}</div>
          <div class="upload-hint">或拖拽图片到这里</div>
        </label>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <div v-if="previewingImage !== null" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <button class="close-preview-btn" @click="closePreview">×</button>
        <img :src="previewImages[previewingImage]?.preview" alt="预览" />
        <div class="preview-info">
          <span>图片 {{ previewingImage + 1 }} / {{ previewImages.length }}</span>
        </div>
        <div class="preview-nav">
          <button
            class="nav-btn"
            :disabled="previewingImage === 0"
            @click="navigatePreview(-1)"
          >
            ← 上一张
          </button>
          <button
            class="nav-btn"
            :disabled="previewingImage === previewImages.length - 1"
            @click="navigatePreview(1)"
          >
            下一张 →
          </button>
        </div>
      </div>
    </div>

    <p class="upload-tip">
      最多上传 {{ maxImages }} 张图片，每张不超过 10MB
      <span class="drag-hint">💡 支持拖拽上传</span>
    </p>
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
const isDragOver = ref(false);
const previewingImage = ref(null);

// 处理文件选择
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  addFiles(files);

  // 清空 input
  event.target.value = '';
}

// 添加文件
function addFiles(files) {
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
      preview: createPreviewURL(file),
      uploading: false,
      progress: 0,
      error: false,
      rotation: 0
    });
  });

  // 更新 v-model
  updateModelValue();
}

// 处理拖放
function handleDrop(event) {
  isDragOver.value = false;
  const files = Array.from(event.dataTransfer.files);

  // 过滤图片文件
  const imageFiles = files.filter((file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  });

  if (imageFiles.length === 0) {
    alert('请上传图片文件');
    return;
  }

  addFiles(imageFiles);
}

// 移除图片
function removeImage(index) {
  const removed = previewImages.value.splice(index, 1)[0];
  revokePreviewURL(removed.preview);
  updateModelValue();
}

// 旋转图片
function rotateImage(index) {
  const image = previewImages.value[index];
  image.rotation = (image.rotation || 0) + 90;
  if (image.rotation >= 360) {
    image.rotation = 0;
  }
}

// 预览图片
function previewImage(index) {
  previewingImage.value = index;
}

// 关闭预览
function closePreview() {
  previewingImage.value = null;
}

// 导航预览
function navigatePreview(delta) {
  const newIndex = previewingImage.value + delta;
  if (newIndex >= 0 && newIndex < previewImages.value.length) {
    previewingImage.value = newIndex;
  }
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

.upload-area {
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.upload-area.drag-over {
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
  border: 2px dashed #667eea;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
  transition: transform 0.3s ease;
}

.image-item:hover img {
  transform: scale(1.1);
}

.image-item.uploading img,
.image-item.error img {
  filter: blur(2px);
}

.upload-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.progress-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  gap: 8px;
}

.error-icon {
  font-size: 24px;
}

.error-text {
  font-size: 12px;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.remove-btn:hover {
  background: #ff4757;
  transform: scale(1.1);
}

.icon-close {
  font-size: 20px;
  line-height: 1;
}

.image-actions {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  display: flex;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #667eea;
  transform: scale(1.1);
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
  transition: all 0.3s ease;
  background: white;
}

.upload-btn:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.upload-btn.pulse {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
}

.upload-btn input {
  display: none;
}

.upload-icon {
  font-size: 36px;
  color: #999;
  transition: all 0.3s ease;
}

.upload-icon.animate {
  animation: bounce 0.5s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.upload-text {
  margin-top: 8px;
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.upload-hint {
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.upload-tip {
  margin: 0;
  font-size: 12px;
  color: #999;
  text-align: center;
}

.drag-hint {
  margin-left: 8px;
  padding: 2px 8px;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 4px;
  font-size: 11px;
}

/* 预览弹窗 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.2s ease;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.preview-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

.close-preview-btn {
  position: absolute;
  top: -40px;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: white;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-preview-btn:hover {
  background: #ff4757;
  color: white;
}

.preview-info {
  text-align: center;
  color: white;
  margin-top: 16px;
  font-size: 14px;
}

.preview-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.nav-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.nav-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
