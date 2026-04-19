import { redisClient } from '../common/utils/redis.js';
import { Story } from '../modules/story/story.model.js';
import { sequelize } from '../config/database.js';

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
 * 使用 SCAN 遍历避免阻塞 + Lua 脚本保证原子性 + 批量 SQL 更新
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

  // 使用 Lua 脚本原子性地获取并删除每个 key，收集 delta
  const deltas = [];
  for (const key of keys) {
    try {
      const deltaStr = await redis.eval(GET_AND_DEL_SCRIPT, 1, key);
      const delta = Number(deltaStr || '0');
      if (delta > 0) {
        const storyId = key.split(':')[2];
        deltas.push({ storyId, delta });
      }
    } catch (err) {
      console.error(`❌ 同步浏览量失败 [${key}]:`, err);
    }
  }

  if (deltas.length === 0) return;

  // 批量更新：单条 SQL + CASE WHEN（消除 N+1）
  try {
    const caseParts = deltas.map((d, i) => `WHEN id = :id${i} THEN view_count + :delta${i}`);
    const idList = deltas.map((_, i) => `:id${i}`);
    const replacements = {};
    deltas.forEach((d, i) => {
      replacements[`id${i}`] = d.storyId;
      replacements[`delta${i}`] = d.delta;
    });

    await sequelize.query(
      `UPDATE stories SET view_count = CASE ${caseParts.join(' ')} END WHERE id IN (${idList.join(',')})`,
      { replacements, type: sequelize.QueryTypes.UPDATE }
    );

    console.log(`✅ 批量同步浏览量完成: ${deltas.length} 条`);
  } catch (err) {
    console.error('❌ 批量同步浏览量失败:', err);
    // 降级逐条更新
    for (const { storyId, delta } of deltas) {
      try {
        await Story.increment('viewCount', { by: delta, where: { id: storyId } });
      } catch (e) {
        console.error(`❌ 降级同步浏览量失败 [${storyId}]:`, e);
      }
    }
  }
}
