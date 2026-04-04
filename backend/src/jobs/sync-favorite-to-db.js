import { favoriteCacheUtil } from '../common/utils/favorite-cache.util.js';

/**
 * 收藏数据同步到数据库的定时任务
 * 每5分钟执行一次
 */
async function syncFavoriteToDatabase() {
  console.log('🔄 [定时任务] 开始同步收藏数据到数据库...');

  try {
    const result = await favoriteCacheUtil.syncToDatabase();
    console.log(`✅ [定时任务] 收藏同步完成:`, result);
  } catch (error) {
    console.error('❌ [定时任务] 收藏同步失败:', error);
  }
}

// 导出任务函数
export { syncFavoriteToDatabase };

// 如果直接运行此文件，执行一次同步
if (import.meta.url === `file://${process.argv[1]}`) {
  syncFavoriteToDatabase().then(() => {
    console.log('收藏同步任务执行完毕');
    process.exit(0);
  }).catch((err) => {
    console.error('收藏同步任务执行失败:', err);
    process.exit(1);
  });
}