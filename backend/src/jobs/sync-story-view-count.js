import { redisClient } from '../common/utils/redis.js';
import { Story } from '../modules/story/story.model.js';

// Lua 脚本：原子性地 GET + DEL，返回当前值
const GET_AND_DEL_SCRIPT = `
local val = redis.call('GET', KEYS[1])
if val then
  redis.call('DEL', KEYS[1])
end
return val
`;

/**
 * 同步故事浏览量：Redis增量 → 数据库
 * 使用 SCAN 遍历避免阻塞 + Lua 脚本保证原子性
 */
export async function syncStoryViewCount() {
  const redis = redisClient.getClient();

  // 使用 SCAN 获取所有 story:views:* 的 key（避免 KEYS 阻塞）
  const keys = [];
  let cursor = '0';

  do {
    const [nextCursor, matchedKeys] = await redis.scan(
      cursor,
      'MATCH',
      'story:views:*',
      'COUNT',
      100
    );
    cursor = nextCursor;
    if (matchedKeys && matchedKeys.length > 0) {
      keys.push(...matchedKeys);
    }
  } while (cursor !== '0');

  if (keys.length === 0) {
    console.log('✅ 没有需要同步的浏览量数据');
    return;
  }

  // 使用 Lua 脚本原子性地获取并删除每个 key
  for (const key of keys) {
    try {
      const deltaStr = await redis.eval(GET_AND_DEL_SCRIPT, 1, key);
      const delta = Number(deltaStr || '0');

      if (delta > 0) {
        // 从 key 提取 storyId
        const storyId = key.split(':')[2];

        // 更新数据库
        await Story.increment('viewCount', {
          by: delta,
          where: { id: storyId }
        });

        console.log(`✅ 同步浏览量 [${storyId}]: +${delta}`);
      }
    } catch (err) {
      console.error(`❌ 同步浏览量失败 [${key}]:`, err);
    }
  }
}
