<template>
  <Teleport to="body">
    <div class="paper-plane-overlay" @click="handleClose">
      <!-- 飞行轨迹线 -->
      <svg class="flight-path" v-if="isFlying">
        <path 
          :d="flightPath" 
          fill="none" 
          stroke="rgba(255,255,255,0.3)" 
          stroke-width="2"
          stroke-dasharray="5,5"
        />
      </svg>

      <!-- 纸飞机 -->
      <div 
        class="paper-plane"
        :class="{ 'flying': isFlying, 'hovering': isHovering, 'unfolding': isUnfolding }"
        :style="planeStyle"
      >
        <svg viewBox="0 0 100 100" class="plane-svg">
          <path 
            d="M50 10 L90 80 L50 65 L10 80 Z" 
            fill="#f5f5f5" 
            stroke="#ddd" 
            stroke-width="1"
          />
          <path 
            d="M50 10 L50 65" 
            stroke="#ccc" 
            stroke-width="1"
            fill="none"
          />
          <path 
            d="M50 65 L90 80" 
            stroke="#ccc" 
            stroke-width="1"
            fill="none"
          />
          <path 
            d="M50 65 L10 80" 
            stroke="#ccc" 
            stroke-width="1"
            fill="none"
          />
        </svg>
      </div>

      <!-- 展开的纸张 -->
      <div 
        class="paper-sheet"
        :class="{ 'show': isUnfolded }"
        :style="sheetStyle"
        @click.stop
      >
        <!-- 纸张褶皱效果 -->
        <div class="paper-texture">
          <div class="crease crease-1"></div>
          <div class="crease crease-2"></div>
          <div class="crease crease-3"></div>
          <div class="crease crease-4"></div>
        </div>

        <!-- 关闭按钮 -->
        <button class="close-btn" @click="handleClose">
          <span>×</span>
        </button>

        <!-- 精选/置顶标识 -->
        <div v-if="story.isFeatured || story.isPinned" class="story-badges">
          <span v-if="story.isPinned" class="badge pinned">📌 置顶</span>
          <span v-if="story.isFeatured" class="badge featured">⭐ 精选</span>
        </div>

        <!-- 故事内容 -->
        <div class="story-content-wrapper">
          <div class="story-header">
            <div class="user-info">
              <img :src="story.avatar" :alt="story.username" class="avatar" />
              <div class="user-details">
                <span class="username">{{ story.username }}</span>
                <span class="time">{{ formatRelativeTime(story.createdAt) }}</span>
              </div>
            </div>
            <span class="emotion-icon">{{ getEmotionEmoji(story.emotionTag || story.emotion) }}</span>
          </div>

          <div class="story-body">
            <p class="story-text">{{ story.content }}</p>
            
            <div v-if="story.images && story.images.length > 0" class="story-images">
              <img
                v-for="(image, index) in story.images"
                :key="index"
                :src="image"
                :alt="`图片 ${index + 1}`"
                @click="previewImage(index)"
              />
            </div>
          </div>

          <div class="story-footer">
            <div class="location">
              <span class="icon">📍</span>
              <span>{{ story.location?.address || '未知地点' }}</span>
            </div>
          </div>

          <!-- 互动功能区 -->
          <div class="story-actions">
            <button class="action-btn like" :class="{ 'liked': isLiked }" @click="handleLike">
              <span class="icon">❤️</span>
              <span class="count">{{ likeCount }}</span>
            </button>
            <button class="action-btn comment" @click="showCommentInput = true">
              <span class="icon">💬</span>
              <span class="count">{{ comments.length }}</span>
            </button>
            <button class="action-btn report" @click="showReportModal = true">
              <span class="icon">🚨</span>
              <span>举报</span>
            </button>
          </div>

          <!-- 评论区 -->
          <div class="comments-section">
            <h4 class="comments-title">评论 ({{ comments.length }})</h4>
            
            <!-- 评论输入 -->
            <div v-if="showCommentInput" class="comment-input-area">
              <textarea 
                v-model="newComment" 
                placeholder="写下你的评论..." 
                rows="2"
                class="comment-textarea"
              ></textarea>
              <div class="comment-actions">
                <button class="btn-cancel" @click="showCommentInput = false">取消</button>
                <button class="btn-submit" @click="submitComment" :disabled="!newComment.trim()">发送</button>
              </div>
            </div>

            <!-- 评论列表 -->
            <div class="comments-list">
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <img :src="comment.avatar" class="comment-avatar">
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.author }}</span>
                    <span class="comment-time">{{ formatRelativeTime(comment.createdAt) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                </div>
              </div>
              <div v-if="comments.length === 0" class="no-comments">
                还没有评论，来说点什么吧～
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 举报弹窗 -->
    <Teleport to="body" v-if="showReportModal">
      <div class="report-modal-overlay" @click.self="showReportModal = false">
        <div class="report-modal-content">
          <h3>🚨 举报内容</h3>
          <p class="report-desc">请选择举报原因并填写详细描述，帮助我们更好地处理：</p>
          
          <div class="report-reasons">
            <label v-for="reason in reportReasons" :key="reason.key" class="reason-option">
              <input 
                type="radio" 
                v-model="selectedReportReason" 
                :value="reason.key"
                name="reportReason"
              >
              <span>{{ reason.label }}</span>
            </label>
          </div>

          <textarea 
            v-model="reportDescription" 
            placeholder="请详细描述举报原因（不少于10个字）..." 
            rows="4"
            class="report-textarea"
          ></textarea>
          <p v-if="reportError" class="report-error">{{ reportError }}</p>

          <div class="report-actions">
            <button class="btn-cancel" @click="showReportModal = false">取消</button>
            <button 
              class="btn-submit" 
              @click="submitReport"
              :disabled="!selectedReportReason || reportDescription.length < 10"
            >
              提交举报
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { formatRelativeTime } from '../utils/time';
import { getEmotionEmoji } from '../utils/emotion';
import { REPORT_TYPES } from '../utils/report';
import { useUserStore } from '../stores/user';
import { reportApi } from '../api/report';

const userStore = useUserStore();

const props = defineProps({
  story: {
    type: Object,
    required: true
  },
  startPosition: {
    type: Object,
    default: () => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }
});

const emit = defineEmits(['close', 'preview-image', 'like', 'comment', 'report']);

const isFlying = ref(false);
const isHovering = ref(false);
const isUnfolding = ref(false);
const isUnfolded = ref(false);

// 互动功能状态
const isLiked = ref(false);
const likeCount = ref(props.story.likes || 0);
const showCommentInput = ref(false);
const newComment = ref('');
const comments = ref(props.story.comments || []);

// 举报弹窗状态
const showReportModal = ref(false);
const selectedReportReason = ref('');
const reportDescription = ref('');
const reportError = ref('');

// 使用共享的举报类型
const reportReasons = REPORT_TYPES;

// 纸飞机当前位置
const currentPos = ref({ x: props.startPosition.x, y: props.startPosition.y });
// 目标位置（随机生成）
const targetPos = ref({ x: 0, y: 0 });
// 旋转角度
const rotation = ref(0);

// 计算纸飞机样式
const planeStyle = computed(() => ({
  left: currentPos.value.x + 'px',
  top: currentPos.value.y + 'px',
  transform: `translate(-50%, -50%) rotate(${rotation.value}deg) scale(${isHovering.value ? 1.2 : 1})`
}));

// 计算纸张展开位置
const sheetStyle = computed(() => ({
  left: currentPos.value.x + 'px',
  top: currentPos.value.y + 'px',
  transform: isUnfolded.value 
    ? 'translate(-50%, -50%) scale(1) rotate(0deg)' 
    : 'translate(-50%, -50%) scale(0.1) rotate(-5deg)'
}));

// 控制点（根据距离动态计算弧度）
const controlPoint = ref({ x: 0, y: 0 });

// 计算飞行轨迹路径
const flightPath = computed(() => {
  const startX = props.startPosition.x;
  const startY = props.startPosition.y;
  const endX = targetPos.value.x;
  const endY = targetPos.value.y;
  const cx = controlPoint.value.x;
  const cy = controlPoint.value.y;
  return `M ${startX} ${startY} Q ${cx} ${cy} ${endX} ${endY}`;
});

// 计算贝塞尔曲线上的点
function getBezierPoint(t, p0, p1, p2) {
  const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
  return { x, y };
}

// 计算贝塞尔曲线在t点的切线角度
function getBezierAngle(t, p0, p1, p2, prevAngle = null) {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
  
  // 避免角度突变（处理360°跳跃问题）
  if (prevAngle !== null) {
    while (angle - prevAngle > 180) angle -= 360;
    while (angle - prevAngle < -180) angle += 360;
  }
  
  return angle;
}

// 预览图片
function previewImage(index) {
  emit('preview-image', { index, images: props.story.images });
}

// 关闭
function handleClose() {
  emit('close');
}

// 点赞
function handleLike() {
  // 检查是否登录（游客不能点赞）
  if (!userStore.isLoggedIn || userStore.isGuest) {
    alert('请先登录后再点赞');
    return;
  }
  if (isLiked.value) {
    likeCount.value--;
    isLiked.value = false;
  } else {
    likeCount.value++;
    isLiked.value = true;
  }
  emit('like', { storyId: props.story.id, liked: isLiked.value });
}

// 提交评论
function submitComment() {
  // 检查是否登录（游客不能评论）
  if (!userStore.isLoggedIn || userStore.isGuest) {
    alert('请先登录后再评论');
    return;
  }
  if (!newComment.value.trim()) return;

  const comment = {
    id: Date.now(),
    author: '我',
    avatar: 'https://picsum.photos/32/32?random=me',
    content: newComment.value.trim(),
    createdAt: new Date().toISOString()
  };

  comments.value.unshift(comment);
  emit('comment', { storyId: props.story.id, comment });

  newComment.value = '';
  showCommentInput.value = false;
}

// 提交举报
async function submitReport() {
  // 检查是否登录（游客不能举报）
  if (!userStore.isLoggedIn || userStore.isGuest) {
    alert('请先登录后再举报');
    return;
  }
  if (!selectedReportReason.value) {
    reportError.value = '请选择举报原因';
    return;
  }
  if (reportDescription.value.length < 10) {
    reportError.value = '请详细描述举报原因（不少于10个字）';
    return;
  }

  try {
    await reportApi.create('story', props.story.id, `${selectedReportReason.value}: ${reportDescription.value}`);

    // 重置并关闭弹窗
    selectedReportReason.value = '';
    reportDescription.value = '';
    reportError.value = '';
    showReportModal.value = false;

    alert('举报已提交，我们会尽快处理');
  } catch (error) {
    console.error('举报失败:', error);
    alert(error.message || '举报失败，请重试');
  }
}

// 生成随机目标位置（确保故事框能完整显示在页面内）
function generateTargetPosition() {
  // 故事框尺寸（与CSS中的max-width和max-height对应）
  const sheetWidth = Math.min(window.innerWidth * 0.9, 500);
  const sheetHeight = Math.min(window.innerHeight * 0.8, 600);
  
  // 边距：减小边距，增加飞行距离
  const marginX = sheetWidth / 2 + 20;
  const marginY = sheetHeight / 2 + 20;
  
  const maxX = window.innerWidth - marginX;
  const maxY = window.innerHeight - marginY;
  const minX = marginX;
  const minY = marginY;
  
  return {
    x: Math.random() * (maxX - minX) + minX,
    y: Math.random() * (maxY - minY) + minY
  };
}

// 根据距离计算控制点（距离越长，弧度越大）
function calculateControlPoint(start, end) {
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  
  // 计算距离
  const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  
  // 根据距离计算弧度大小（距离越长，弧度越大，但有上限）
  const baseArc = Math.min(distance * 0.3, 300);
  const arcHeight = baseArc + Math.random() * 100;
  
  // 计算垂直方向（垂直于起点到终点的连线）
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const perpAngle = angle + Math.PI / 2; // 垂直角度
  
  // 随机选择弧线方向（向上或向下弯曲）
  const direction = Math.random() > 0.5 ? 1 : -1;
  
  return {
    x: midX + Math.cos(perpAngle) * arcHeight * direction,
    y: midY + Math.sin(perpAngle) * arcHeight * direction
  };
}

// 计算角度
function calculateAngle(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI + 90;
}

// 动画序列
onMounted(() => {
  // 生成随机目标位置
  targetPos.value = generateTargetPosition();
  
  // 计算控制点（根据距离决定弧度）
  controlPoint.value = calculateControlPoint(props.startPosition, targetPos.value);
  
  // 设置初始位置
  currentPos.value = { x: props.startPosition.x, y: props.startPosition.y };
  
  // 开始飞行动画
  setTimeout(() => {
    isFlying.value = true;
    
    // 动画飞行
    const duration = 1200; // 1.2秒飞行时间
    const startTime = Date.now();
    const start = { x: props.startPosition.x, y: props.startPosition.y };
    const end = { x: targetPos.value.x, y: targetPos.value.y };
    const control = controlPoint.value;
    let prevRotation = rotation.value;
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 缓动函数：先快后慢
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // 使用贝塞尔曲线计算位置（严格按照轨迹飞行）
      const pos = getBezierPoint(easeOut, start, control, end);
      
      // 添加轻微的随机摆动（不影响主要轨迹）
      const wobble = Math.sin(progress * Math.PI * 6) * 5 * (1 - progress);
      const wobbleAngle = Math.atan2(end.y - start.y, end.x - start.x) + Math.PI / 2;
      
      currentPos.value = {
        x: pos.x + Math.cos(wobbleAngle) * wobble,
        y: pos.y + Math.sin(wobbleAngle) * wobble
      };
      
      // 根据贝塞尔曲线切线方向计算旋转角度（传入前一个角度避免突变）
      const newRotation = getBezierAngle(easeOut, start, control, end, prevRotation);
      rotation.value = newRotation;
      prevRotation = newRotation;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 飞行结束，开始悬停
        isFlying.value = false;
        isHovering.value = true;
        currentPos.value = { x: end.x, y: end.y };
        // 保持最后飞行时的方向，不重置
        
        // 悬停一下再展开
        setTimeout(() => {
          isHovering.value = false;
          isUnfolding.value = true;
          
          setTimeout(() => {
            isUnfolded.value = true;
          }, 500);
        }, 300);
      }
    }
    
    requestAnimationFrame(animate);
  }, 100);
});
</script>

<style scoped>
.paper-plane-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  overflow: hidden;
}

/* 飞行轨迹 */
.flight-path {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 纸飞机 */
.paper-plane {
  position: absolute;
  width: 50px;
  height: 50px;
  z-index: 3;
  pointer-events: none;
  transition: transform 0.1s ease-out;
}

.paper-plane.flying {
  opacity: 1;
}

.paper-plane.hovering {
  animation: hover 0.3s ease-in-out infinite alternate;
  /* 悬停时保持当前旋转角度，只添加小幅摆动 */
}

.paper-plane.unfolding {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.1) rotate(180deg);
  transition: all 0.5s ease-in-out;
}

@keyframes hover {
  from {
    margin-top: -3px;
  }
  to {
    margin-top: 3px;
  }
}

.plane-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(3px 6px 8px rgba(0, 0, 0, 0.3));
}

/* 展开的纸张 */
.paper-sheet {
  position: absolute;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 0 60px rgba(102, 126, 234, 0.3),
    0 0 100px rgba(118, 75, 162, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.1);
  opacity: 0;
  overflow: hidden;
  z-index: 2;
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.paper-sheet.show {
  opacity: 1;
  pointer-events: auto;
}

/* 纸张褶皱效果 */
.paper-texture {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.crease {
  position: absolute;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(0, 0, 0, 0.03) 40%,
    rgba(0, 0, 0, 0.06) 50%,
    rgba(0, 0, 0, 0.03) 60%,
    transparent 100%
  );
}

.crease-1 {
  top: 25%;
  left: -10%;
  width: 120%;
  height: 1px;
  transform: rotate(-3deg);
}

.crease-2 {
  top: 60%;
  left: -10%;
  width: 120%;
  height: 1px;
  transform: rotate(2deg);
}

.crease-3 {
  top: 40%;
  left: 30%;
  width: 1px;
  height: 120%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.03) 40%,
    rgba(0, 0, 0, 0.06) 50%,
    rgba(0, 0, 0, 0.03) 60%,
    transparent 100%
  );
  transform: rotate(-1deg);
}

.crease-4 {
  bottom: 20%;
  left: 70%;
  width: 1px;
  height: 80%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.02) 30%,
    rgba(0, 0, 0, 0.04) 50%,
    rgba(0, 0, 0, 0.02) 70%,
    transparent 100%
  );
  transform: rotate(1deg);
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.08);
  color: #555;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.15);
  color: #333;
}

.close-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  height: 100%;
  width: 100%;
  transform: translate(-0.25px, -1.25px);
}

/* 故事内容 */
.story-content-wrapper {
  position: relative;
  z-index: 1;
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-size: 15px;
  font-weight: 600;
  color: #2d3436;
}

.time {
  font-size: 12px;
  color: #888;
}

.emotion-icon {
  font-size: 28px;
  margin-right: 40px; /* 向右平移，避免与关闭按钮重叠 */
}

.story-body {
  margin-bottom: 16px;
}

.story-text {
  margin: 0 0 16px 0;
  font-size: 15px;
  line-height: 1.8;
  color: #2d3436;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Georgia', 'Times New Roman', serif;
}

.story-images {
  display: grid;
  gap: 8px;
}

.story-images:has(:nth-child(1)):not(:has(:nth-child(2))) {
  grid-template-columns: 1fr;
}

.story-images:has(:nth-child(2)):not(:has(:nth-child(3))) {
  grid-template-columns: repeat(2, 1fr);
}

.story-images:has(:nth-child(3)) {
  grid-template-columns: repeat(3, 1fr);
}

.story-images img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.story-images img:hover {
  opacity: 0.9;
}

.story-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}

.location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #777;
}

.location .icon {
  font-size: 16px;
}

/* 精选/置顶标识 */
.story-badges {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.badge.featured {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: white;
}

.badge.pinned {
  background: #667eea;
  color: white;
}

/* 互动功能区 */
.story-actions {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  margin-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.action-btn.like.liked {
  background: #ffebee;
  color: #e53935;
}

.action-btn.report:hover {
  background: #ffebee;
  color: #c62828;
}

/* 评论区 */
.comments-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.comments-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.comment-input-area {
  margin-bottom: 16px;
}

.comment-textarea {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  font-size: 14px;
  resize: none;
  font-family: inherit;
}

.comment-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.btn-cancel, .btn-submit {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 评论列表 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 11px;
  color: #999;
}

.comment-text {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  margin: 0;
}

.no-comments {
  text-align: center;
  padding: 24px;
  color: #999;
  font-size: 13px;
}

/* 举报弹窗 */
.report-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11000;
}

.report-modal-content {
  background: white;
  padding: 28px;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.report-modal-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.report-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 20px;
}

.report-reasons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.reason-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.reason-option:hover {
  background: rgba(0, 0, 0, 0.03);
}

.reason-option input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
}

.reason-option span {
  font-size: 14px;
  color: #333;
}

.report-textarea {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  font-size: 14px;
  resize: none;
  font-family: inherit;
}

.report-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.report-error {
  color: #e53935;
  font-size: 12px;
  margin-top: 8px;
}

.report-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.report-actions .btn-cancel,
.report-actions .btn-submit {
  flex: 1;
  padding: 12px;
}
</style>
