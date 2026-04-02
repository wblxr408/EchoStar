import { likeCacheUtil } from '../common/utils/like-cache.util.js';

/**
 * 点赞数据同步到数据库的定时任务
 * 每5分钟执行一次
 */
async function syncLikeToDatabase() {
  console.log('🔄 [定时任务] 开始同步点赞数据到数据库...');

  try {
    const result = await likeCacheUtil.syncToDatabase();
    console.log(`✅ [定时任务] 点赞同步完成:`, result);
  } catch (error) {
    console.error('❌ [定时任务] 点赞同步失败:', error);
  }
}

// 导出任务函数
export { syncLikeToDatabase };

// 如果直接运行此文件，执行一次同步
if (import.meta.url === `file://${process.argv[1]}`) {
  syncLikeToDatabase().then(() => {
    console.log('同步任务执行完毕');
    process.exit(0);
  }).catch((err) => {
    console.error('同步任务执行失败:', err);
    process.exit(1);
  });
}
