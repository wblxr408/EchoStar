import { redisClient } from './redis.js';
import { Op } from 'sequelize';

/**
 * 点赞缓存工具类
 * 使用三集合增量同步架构：
 *   BASE: 基准集（从DB懒加载）
 *   ADD:  新增集（新增点赞，待同步到DB）
 *   DEL:  删除集（取消点赞，待同步到DB）
 *
 * 点赞状态 = (BASE ∪ ADD) - DEL
 */
class LikeCacheUtil {
  constructor() {
    // Redis key 前缀
    this.KEY_PREFIX = {
      BASE: 'like:user:base',
      ADD: 'like:user:add',
      DEL: 'like:user:del',
      SYNC_STORIES: 'like:sync:stories',
      INIT: 'like:user:init'
    };

    // 基准 Set 过期时间（7天，防止永久占用内存）
    this.BASE_TTL = 7 * 24 * 60 * 60;

    // 初始化标记过期时间（1天）
    this.INIT_TTL = 86400;
  }

  /**
   * 规范化 storyId（兼容 bigint 雪花ID）
   */
  normalizeStoryId(storyId) {
    if (storyId === undefined || storyId === null) {
      throw new Error('Story ID is required');
    }
    return typeof storyId === 'bigint'
      ? storyId.toString()
      : String(storyId).trim();
  }

  /**
   * 生成 Redis key
   */
  getBaseKey(storyId) {
    return `${this.KEY_PREFIX.BASE}:${this.normalizeStoryId(storyId)}`;
  }

  getAddKey(storyId) {
    return `${this.KEY_PREFIX.ADD}:${this.normalizeStoryId(storyId)}`;
  }

  getDelKey(storyId) {
    return `${this.KEY_PREFIX.DEL}:${this.normalizeStoryId(storyId)}`;
  }

  getInitKey(storyId) {
    return `${this.KEY_PREFIX.INIT}:${this.normalizeStoryId(storyId)}`;
  }

  /**
   * 确保基准点赞 Set 已初始化（懒加载）
   */
  async ensureBaseSetInit(storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const redis = redisClient.getClient();
    const baseKey = this.getBaseKey(normalizedStoryId);
    const initKey = this.getInitKey(normalizedStoryId);

    // 检查是否已初始化
    const baseExists = await redis.exists(baseKey);
    if (baseExists) return;

    const initExists = await redis.exists(initKey);
    if (initExists) {
      // 有初始化标记但基准不存在，说明数据库中没有点赞记录
      await redis.expire(initKey, this.INIT_TTL);
      return;
    }

    // 从数据库加载基准数据
    const { Like } = await import('../../modules/like/like.model.js');
    const likes = await Like.findAll({
      where: { storyId: normalizedStoryId },
      attributes: ['userId'],
      raw: true
    });
    const dbUserIds = likes.map(l => l.userId);

    // 写入基准 Set
    if (dbUserIds.length > 0) {
      await redis.sadd(baseKey, ...dbUserIds);
      await redis.expire(baseKey, this.BASE_TTL);
    }

    // 设置初始化标记（即使没有点赞记录也要设置，避免重复查询DB）
    await redis.set(initKey, '1', 'EX', this.INIT_TTL);

    console.log(`[like-cache] 基准点赞Set懒加载成功 [storyId: ${normalizedStoryId}, count: ${dbUserIds.length}]`);
  }

  /**
   * 获取用户是否点赞过
   */
  async isLiked(userId, storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);

    try {
      const redis = redisClient.getClient();
      const baseKey = this.getBaseKey(normalizedStoryId);
      const addKey = this.getAddKey(normalizedStoryId);
      const delKey = this.getDelKey(normalizedStoryId);

      // 确保 base 已初始化
      await this.ensureBaseSetInit(normalizedStoryId);

      // Pipeline 批量查询
      const pipeline = redis.pipeline();
      pipeline.sismember(baseKey, userId);
      pipeline.sismember(addKey, userId);
      pipeline.sismember(delKey, userId);

      const results = await pipeline.exec();
      const [[, inBase], [, inAdd], [, inDel]] = results;

      return (inBase === 1 || inAdd === 1) && inDel !== 1;
    } catch (err) {
      console.error(`[like-cache] Redis isLiked 失败，回退到DB: storyId=${normalizedStoryId}`, err);
      // Redis故障时回退查数据库
      const { Like } = await import('../../modules/like/like.model.js');
      const record = await Like.findOne({
        where: { userId, storyId: normalizedStoryId }
      });
      return !!record;
    }
  }

  /**
   * 获取点赞数（三个 Set 大小相加：|base| + |add| - |del|）
   */
  async getLikeCount(storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);

    try {
      const redis = redisClient.getClient();
      const baseKey = this.getBaseKey(normalizedStoryId);
      const addKey = this.getAddKey(normalizedStoryId);
      const delKey = this.getDelKey(normalizedStoryId);

      // 确保 base 已初始化
      await this.ensureBaseSetInit(normalizedStoryId);

      // Pipeline 批量获取 Set 大小
      const pipeline = redis.pipeline();
      pipeline.scard(baseKey);
      pipeline.scard(addKey);
      pipeline.scard(delKey);

      const results = await pipeline.exec();
      const [[, baseSize], [, addSize], [, delSize]] = results;

      return Math.max(0, (baseSize || 0) + (addSize || 0) - (delSize || 0));
    } catch (err) {
      console.error(`[like-cache] Redis getLikeCount 失败，回退到DB: storyId=${normalizedStoryId}`, err);
      const { Like } = await import('../../modules/like/like.model.js');
      return Like.count({ where: { storyId: normalizedStoryId } });
    }
  }

  /**
   * 点赞（纯Redis写入 + 批量同步架构）
   * 核心优化：先检查用户是否在 BASE 里，避免重复写入 ADD
   * @returns {Object} { isLiked, likeCount }
   */
  async likeStory(userId, storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const redis = redisClient.getClient();
    const addKey = this.getAddKey(normalizedStoryId);
    const delKey = this.getDelKey(normalizedStoryId);
    const baseKey = this.getBaseKey(normalizedStoryId);
    const syncKey = this.KEY_PREFIX.SYNC_STORIES;

    // 操作前快照
    const [preBase, preAdd, preDel] = (await redis.pipeline().scard(baseKey).scard(addKey).scard(delKey).exec()).map(r => r[1]);

    // 检查是否已点赞
    const isLiked = await this.isLiked(userId, normalizedStoryId);

    // ✅ 核心优化：先检查用户是否在 BASE 里
    const inBase = await redis.sismember(baseKey, userId);

    console.log(`[DEBUG-like] story=${normalizedStoryId} user=${userId} | isLiked=${isLiked} inBase=${inBase} | 前: base=${preBase} add=${preAdd} del=${preDel}`);

    if (isLiked) {
      throw new Error('Story already liked');
    }

    // Pipeline 原子操作
    const pipeline = redis.pipeline();
    // 1. 从取消 Set 移除（如果之前取消过）
    pipeline.srem(delKey, userId);
    // 2. 只有不在 BASE 里，才加到 ADD（避免冗余）
    const willWriteAdd = !inBase;
    if (willWriteAdd) {
      pipeline.sadd(addKey, userId);
    }
    // 3. 添加到待同步集合
    pipeline.zadd(syncKey, Date.now(), normalizedStoryId);
    await pipeline.exec();

    const likeCount = await this.getLikeCount(normalizedStoryId);
    console.log(`[DEBUG-like] 操作后: writeAdd=${willWriteAdd} count=${likeCount}`);

    return {
      isLiked: true,
      likeCount
    };
  }

  /**
   * 取消点赞（纯Redis写入 + 批量同步架构）
   * @returns {Object} { isLiked, likeCount }
   */
  async unlikeStory(userId, storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const redis = redisClient.getClient();
    const baseKey = this.getBaseKey(normalizedStoryId);
    const addKey = this.getAddKey(normalizedStoryId);
    const delKey = this.getDelKey(normalizedStoryId);
    const syncKey = this.KEY_PREFIX.SYNC_STORIES;

    // 操作前快照
    const [preBase, preAdd, preDel] = (await redis.pipeline().scard(baseKey).scard(addKey).scard(delKey).exec()).map(r => r[1]);

    // 检查是否未点赞
    const isLiked = await this.isLiked(userId, normalizedStoryId);

    console.log(`[DEBUG-unlike] story=${normalizedStoryId} user=${userId} | isLiked=${isLiked} | 前: base=${preBase} add=${preAdd} del=${preDel}`);

    if (!isLiked) {
      throw new Error('Like record not found');
    }

    // Pipeline 原子操作
    const pipeline = redis.pipeline();
    // 1. 从新增 Set 移除
    pipeline.srem(addKey, userId);
    // 2. 加入取消 Set
    pipeline.sadd(delKey, userId);
    // 3. 添加到待同步集合
    pipeline.zadd(syncKey, Date.now(), normalizedStoryId);
    await pipeline.exec();

    const likeCount = await this.getLikeCount(normalizedStoryId);
    console.log(`[DEBUG-unlike] 操作后: count=${likeCount}`);

    return {
      isLiked: false,
      likeCount
    };
  }

  /**
   * 批量检查多个故事的点赞状态
   * @param {Array<number|string>} storyIds 故事ID数组
   * @param {number} userId 用户ID
   * @returns {Array<{ storyId, isLiked }>}
   */
  async checkMultipleLiked(storyIds, userId) {
    if (!userId) {
      return storyIds.map(storyId => ({ storyId, isLiked: false }));
    }

    const normalizedStoryIds = storyIds.map(sid => this.normalizeStoryId(sid));
    const redis = redisClient.getClient();
    const results = [];

    try {
      // 批量获取每个故事的点赞状态
      const pipeline = redis.pipeline();

      for (const storyId of normalizedStoryIds) {
        const baseKey = this.getBaseKey(storyId);
        const addKey = this.getAddKey(storyId);
        const delKey = this.getDelKey(storyId);

        // 确保 base 已初始化
        await this.ensureBaseSetInit(storyId);

        pipeline.sismember(baseKey, userId);
        pipeline.sismember(addKey, userId);
        pipeline.sismember(delKey, userId);
      }

      const pipelineResults = await pipeline.exec();

      // 每个故事对应3个结果
      for (let i = 0; i < normalizedStoryIds.length; i++) {
        const storyId = normalizedStoryIds[i];
        const baseIdx = i * 3;
        const addIdx = i * 3 + 1;
        const delIdx = i * 3 + 2;

        const inBase = pipelineResults[baseIdx][1] === 1;
        const inAdd = pipelineResults[addIdx][1] === 1;
        const inDel = pipelineResults[delIdx][1] === 1;

        const isLiked = (inBase || inAdd) && !inDel;
        results.push({ storyId, isLiked });
      }

      return results;
    } catch (err) {
      console.error(`[like-cache] Redis checkMultipleLiked 失败，回退到DB: userId=${userId}`, err);
      const { Like } = await import('../../modules/like/like.model.js');
      const likes = await Like.findAll({
        where: { userId, storyId: { [Op.in]: normalizedStoryIds } },
        attributes: ['storyId']
      });
      const likedIds = new Set(likes.map(l => String(l.storyId)));
      return normalizedStoryIds.map(storyId => ({ storyId, isLiked: likedIds.has(String(storyId)) }));
    }
  }

  /**
   * 获取故事点赞列表（直接查数据库，列表数据不需要缓存）
   */
  async getLikesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const { Like } = await import('../../modules/like/like.model.js');
    const { User } = await import('../../modules/auth/auth.model.js');
    const offset = (page - 1) * limit;

    const { rows, count } = await Like.findAndCountAll({
      where: { storyId: normalizedStoryId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return {
      likes: rows.map((like) => ({
        id: like.id,
        createdAt: like.createdAt,
        user: {
          id: like.userId,
          username: like.user?.username || 'Anonymous',
          avatar: like.user?.avatarUrl || null
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 同步到数据库（使用 SCAN 避免阻塞）
   * 将 ADD/DEL 集合的变更批量持久化到数据库
   */
  async syncToDatabase() {
    const redis = redisClient.getClient();
    const syncKey = this.KEY_PREFIX.SYNC_STORIES;

    // 使用 SCAN 获取待同步的故事ID（避免 KEYS 阻塞 Redis）
    const storyIds = [];
    let cursor = '0';

    do {
      const [nextCursor, members] = await redis.zscan(syncKey, cursor, 'COUNT', 100);
      cursor = nextCursor;

      // members 是数组，奇数位是 storyId，偶数位是 score
      for (let i = 0; i < members.length; i += 2) {
        if (members[i]) {
          storyIds.push(members[i]);
        }
      }
    } while (cursor !== '0');

    if (storyIds.length === 0) {
      return { success: true, synced: 0 };
    }

    // 去重
    const uniqueStoryIds = [...new Set(storyIds)];

    console.log(`[like-cache] 开始同步点赞数据，待同步故事数: ${uniqueStoryIds.length}`);

    const { Like } = await import('../../modules/like/like.model.js');
    const { sequelize } = await import('../../config/database.js');

    const t = await sequelize.transaction();
    const processedUsers = {};

    try {
      for (const rawStoryId of uniqueStoryIds) {
        const normalizedStoryId = this.normalizeStoryId(rawStoryId);
        const addKey = this.getAddKey(normalizedStoryId);
        const delKey = this.getDelKey(normalizedStoryId);

        // 获取快照
        const addUsers = await redis.smembers(addKey);
        const delUsers = await redis.smembers(delKey);

        if (addUsers.length === 0 && delUsers.length === 0) {
          continue;
        }

        processedUsers[normalizedStoryId] = {
          add: addUsers.map(id => parseInt(id)),
          del: delUsers.map(id => parseInt(id))
        };

        // 批量插入点赞
        if (addUsers.length > 0) {
          await Like.bulkCreate(
            addUsers.map(userId => ({ userId: parseInt(userId), storyId: normalizedStoryId })),
            { ignoreDuplicates: true, transaction: t }
          );
        }

        // 批量删除取消赞
        if (delUsers.length > 0) {
          await Like.destroy({
            where: {
              userId: { [Op.in]: delUsers.map(id => parseInt(id)) },
              storyId: normalizedStoryId
            },
            transaction: t
          });
        }
      }

      await t.commit();

      // 精准删除已处理的用户，并清理基准 Set 以触发重新加载
      const pipeline = redis.pipeline();
      for (const rawStoryId of uniqueStoryIds) {
        const normalizedStoryId = this.normalizeStoryId(rawStoryId);
        const { add, del } = processedUsers[normalizedStoryId] || { add: [], del: [] };

        // 只删除已同步的用户
        if (add.length > 0) {
          pipeline.srem(this.getAddKey(normalizedStoryId), ...add);
        }
        if (del.length > 0) {
          pipeline.srem(this.getDelKey(normalizedStoryId), ...del);
        }

        // 删除基准 Set 和初始化标记（下次访问时重新从DB加载）
        pipeline.del(this.getBaseKey(normalizedStoryId));
        pipeline.del(this.getInitKey(normalizedStoryId));
        // 从待同步集合移除
        pipeline.zrem(syncKey, normalizedStoryId);
      }

      await pipeline.exec();

      console.log(`[like-cache] 点赞同步完成，处理 ${uniqueStoryIds.length} 个故事`);
      return { success: true, synced: uniqueStoryIds.length };
    } catch (err) {
      await t.rollback();
      console.error('[like-cache] 点赞同步失败：', err);
      throw err;
    }
  }

  /**
   * 清理故事相关的缓存
   * 当故事被删除或隐藏时调用
   */
  async clearStoryCache(storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const redis = redisClient.getClient();
    const syncKey = this.KEY_PREFIX.SYNC_STORIES;

    const pipeline = redis.pipeline();
    pipeline.del(this.getBaseKey(normalizedStoryId));
    pipeline.del(this.getAddKey(normalizedStoryId));
    pipeline.del(this.getDelKey(normalizedStoryId));
    pipeline.del(this.getInitKey(normalizedStoryId));
    pipeline.zrem(syncKey, normalizedStoryId);

    await pipeline.exec();

    console.log(`[like-cache] 清理故事点赞缓存: storyId=${normalizedStoryId}`);
  }
}

export const likeCacheUtil = new LikeCacheUtil();
export default likeCacheUtil;
