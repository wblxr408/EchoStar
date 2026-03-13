<template>
  <div class="admin-page">
    <header class="admin-header">
      <h1>管理后台</h1>
      <button @click="$router.push('/map')">返回地图</button>
    </header>

    <div class="admin-content">
      <div class="stats-grid">
        <div class="stat-card">
          <h3>总用户数</h3>
          <p class="stat-value">-</p>
        </div>
        <div class="stat-card">
          <h3>总故事数</h3>
          <p class="stat-value">-</p>
        </div>
        <div class="stat-card">
          <h3>待处理举报</h3>
          <p class="stat-value">-</p>
        </div>
        <div class="stat-card">
          <h3>今日新增</h3>
          <p class="stat-value">-</p>
        </div>
      </div>

      <div class="admin-sections">
        <section class="admin-section">
          <h2>举报管理</h2>
          <p class="placeholder">举报列表功能待实现</p>
        </section>

        <section class="admin-section">
          <h2>内容管理</h2>
          <p class="placeholder">内容审核功能待实现</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
// 管理后台页面
</script>

<style scoped>
.admin-page {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  overflow-y: auto;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.admin-header h1 {
  font-size: 24px;
  font-weight: 700;
}

.admin-content {
  padding: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-card h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #667eea;
}

.admin-sections {
  display: grid;
  gap: 20px;
}

.admin-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.admin-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.placeholder {
  color: #999;
  font-size: 14px;
}
</style>
