import { redisClient } from '../common/utils/redis.js';
import { Story } from '../modules/story/story.model.js';

/**
 * 同步故事浏览量：Redis增量 → 数据库
 * 遍历 Redis 的 story:views:* key，只处理有访问量的故事
 */
export async function syncStoryViewCount() {
  const redis = redisClient.getClient();

  // 获取所有 story:views:* 的 key
  const keys = await redis.keys('story:views:*');

  if (keys.length === 0) {
    console.log('✅ 没有需要同步的浏览量数据');
    return;
  }

  // 批量获取所有增量
  const values = await redis.mget(keys);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const delta = Number(values[i] || '0');

    if (delta > 0) {
      // 从 key 提取 storyId
      const storyId = key.split(':')[2];

      // 更新数据库
      await Story.increment('viewCount', {
        by: delta,
        where: { id: storyId }
      });

      // 重置 Redis 计数器
      await redis.del(key);

      console.log(`✅ 同步浏览量 [${storyId}]: +${delta}`);
    }
  }
}
