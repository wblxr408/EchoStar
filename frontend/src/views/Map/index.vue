<template>
  <div class="map-page">
    <!-- TODO: 集成高德地图或 Mapbox -->
    <div class="map-placeholder">
      <h2>地图组件待实现</h2>
      <p>将在此集成高德地图 API</p>
    </div>

    <!-- 发布按钮 -->
    <button class="publish-btn" @click="$router.push('/publish')">
      <span>+</span>
    </button>

    <!-- 随机漫步按钮 -->
    <button class="random-walk-btn">
      <span>🎲</span>
    </button>
  </div>
</template>

<script setup>
// 地图页面主组件
</script>

<style scoped>
.map-page {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  color: #999;
}

.publish-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 32px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.2s ease;
}

.publish-btn:hover {
  transform: scale(1.1);
}

.random-walk-btn {
  position: fixed;
  bottom: 32px;
  left: 32px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  font-size: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.random-walk-btn:hover {
  transform: scale(1.1);
}
</style>
