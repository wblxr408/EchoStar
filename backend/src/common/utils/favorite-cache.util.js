import { redisClient } from './redis.js';
import { sequelize } from '../../config/database.js';

/**
 * 收藏缓存工具类
 * 基于 Redis 集合增量同步（BASE/ADD/DEL）模式
 */
class FavoriteCacheUtil {
  constructor() {
    // Redis 键前缀定义
    this.KEY_PREFIX = {
      BASE: 'favorite:user:base',    // 基础收藏集合（数据库原始数据）
      ADD: 'favorite:user:add',      // 增量新增集合（缓存写入）
      DEL: 'favorite:user:del',      // 增量删除集合（缓存写入）
      SYNC_STORIES: 'favorite:sync:stories', // 需要同步到数据库的故事ID
      INIT: 'favorite:user:init'     // 初始化标记键
    };

    this.BASE_TTL = 7 * 24 * 60 * 60;  // 基础集合过期时间：7天
    this.INIT_TTL = 86400;             // 初始化标记过期时间：1天
  }

  /**
   * 获取基础集合 Redis 键
   */
  getBaseKey(storyId) {
    return `${this.KEY_PREFIX.BASE}:${this.normalizeStoryId(storyId)}`;
  }

  /**
   * 获取增量新增集合 Redis 键
   */
  getAddKey(storyId) {
    return `${this.KEY_PREFIX.ADD}:${this.normalizeStoryId(storyId)}`;
  }

  /**
   * 获取增量删除集合 Redis 键
   */
  getDelKey(storyId) {
    return `${this.KEY_PREFIX.DEL}:${this.normalizeStoryId(storyId)}`;
  }

  /**
   * 获取初始化标记 Redis 键
   */
  getInitKey(storyId) {
    return `${this.KEY_PREFIX.INIT}:${this.normalizeStoryId(storyId)}`;
  }

  /**
   * 标准化故事ID，统一格式为字符串
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
   * 确保基础集合已初始化
   * 如果未初始化，则从数据库加载数据到 Redis
   */
  async ensureBaseSetInit(storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const redis = redisClient.getClient();
    const baseKey = this.getBaseKey(normalizedStoryId);
    const initKey = this.getInitKey(normalizedStoryId);

    // 合并为单次 pipeline（原来 2 次串行 exists）
    const pipeline = redis.pipeline();
    pipeline.exists(baseKey);
    pipeline.exists(initKey);
    const [[, baseExists], [, initExists]] = await pipeline.exec();

    if (baseExists) return;
    if (initExists) {
      await redis.expire(initKey, this.INIT_TTL);
      return;
    }

    // 从数据库加载收藏数据
    const { Favorite } = await import('../../modules/favorite/favorite.model.js');
    const favorites = await Favorite.findAll({
      where: { storyId: normalizedStoryId },
      attributes: ['userId'],
      raw: true
    });
    const dbUserIds = favorites.map((item) => item.userId);

    // 写入基础集合
    if (dbUserIds.length > 0) {
      await redis.sadd(baseKey, ...dbUserIds);
      await redis.expire(baseKey, this.BASE_TTL);
    }

    // 设置初始化标记
    await redis.set(initKey, '1', 'EX', this.INIT_TTL);
    console.log(`[favorite-cache] 基础集合初始化完成: storyId=${normalizedStoryId}, count=${dbUserIds.length}`);
  }

  /**
   * 判断用户是否已收藏某故事
   * 优先走 Redis，异常降级到数据库
   */
  async isFavorited(userId, storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);

    try {
      const redis = redisClient.getClient();
      const baseKey = this.getBaseKey(normalizedStoryId);
      const addKey = this.getAddKey(normalizedStoryId);
      const delKey = this.getDelKey(normalizedStoryId);

      await this.ensureBaseSetInit(normalizedStoryId);

      // 管道批量查询，提升性能
      const pipeline = redis.pipeline();
      pipeline.sismember(baseKey, userId);
      pipeline.sismember(addKey, userId);
      pipeline.sismember(delKey, userId);

      const results = await pipeline.exec();
      const [[, inBase], [, inAdd], [, inDel]] = results;

      // 最终状态：(在基础集 或 在新增集) 且 不在删除集
      return (inBase === 1 || inAdd === 1) && inDel !== 1;
    } catch (err) {
      console.error(`[favorite-cache] Redis 查询收藏状态失败，降级到数据库: storyId=${normalizedStoryId}`, err);
      const { Favorite } = await import('../../modules/favorite/favorite.model.js');
      const record = await Favorite.findOne({
        where: { userId, storyId: normalizedStoryId }
      });
      return !!record;
    }
  }

  /**
   * 获取故事收藏总数（三个 Set 大小相加：|base| + |add| - |del|）
   */
  async getFavoriteCount(storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);

    try {
      const redis = redisClient.getClient();
      const baseKey = this.getBaseKey(normalizedStoryId);
      const addKey = this.getAddKey(normalizedStoryId);
      const delKey = this.getDelKey(normalizedStoryId);

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
      console.error(`[favorite-cache] Redis 获取收藏数失败，降级到数据库: storyId=${normalizedStoryId}`, err);
      const { Favorite } = await import('../../modules/favorite/favorite.model.js');
      return Favorite.count({ where: { storyId: normalizedStoryId } });
    }
  }

  /**
   * 用户收藏故事（纯Redis写入 + 批量同步架构）
   * 优化：所有读取合并为单次 pipeline，count 内联计算
   */
  async favoriteStory(userId, storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const redis = redisClient.getClient();
    const addKey = this.getAddKey(normalizedStoryId);
    const delKey = this.getDelKey(normalizedStoryId);
    const baseKey = this.getBaseKey(normalizedStoryId);
    const syncKey = this.KEY_PREFIX.SYNC_STORIES;

    // 确保基础集合已初始化（只调用一次）
    await this.ensureBaseSetInit(normalizedStoryId);

    // 单次 pipeline 完成所有读取：状态检查 + 集合大小
    const readPipeline = redis.pipeline();
    readPipeline.sismember(baseKey, userId);  // [0] inBase
    readPipeline.sismember(addKey, userId);   // [1] inAdd
    readPipeline.sismember(delKey, userId);   // [2] inDel
    readPipeline.scard(baseKey);              // [3] baseSize
    readPipeline.scard(addKey);               // [4] addSize
    readPipeline.scard(delKey);               // [5] delSize

    const readResults = await readPipeline.exec();
    const [[, inBase], [, inAdd], [, inDel], [, baseSize], [, addSize], [, delSize]] = readResults;

    const isFavorited = (inBase === 1 || inAdd === 1) && inDel !== 1;
    if (isFavorited) {
      throw new Error('Story already favorited');
    }

    // Pipeline 原子操作
    const writePipeline = redis.pipeline();
    writePipeline.srem(delKey, userId);   // 从删除集移除
    if (!inBase) {
      writePipeline.sadd(addKey, userId);
    }
    writePipeline.zadd(syncKey, Date.now(), normalizedStoryId);
    await writePipeline.exec();

    // 内联计算新的收藏数（基于读取时的快照 + 本次写入的增量）
    const newDelSize = (delSize || 0) - (inDel === 1 ? 1 : 0);
    const newAddSize = (addSize || 0) + (!inBase && inAdd !== 1 ? 1 : 0);
    const favoriteCount = Math.max(0, (baseSize || 0) + newAddSize - newDelSize);

    return {
      isFavorited: true,
      favoriteCount
    };
  }

  /**
   * 用户取消收藏（纯Redis写入 + 批量同步架构）
   * 优化：所有读取合并为单次 pipeline，count 内联计算
   */
  async unfavoriteStory(userId, storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const redis = redisClient.getClient();
    const baseKey = this.getBaseKey(normalizedStoryId);
    const addKey = this.getAddKey(normalizedStoryId);
    const delKey = this.getDelKey(normalizedStoryId);
    const syncKey = this.KEY_PREFIX.SYNC_STORIES;

    // 确保基础集合已初始化（只调用一次）
    await this.ensureBaseSetInit(normalizedStoryId);

    // 单次 pipeline 完成所有读取
    const readPipeline = redis.pipeline();
    readPipeline.sismember(baseKey, userId);  // [0] inBase
    readPipeline.sismember(addKey, userId);   // [1] inAdd
    readPipeline.sismember(delKey, userId);   // [2] inDel
    readPipeline.scard(baseKey);              // [3] baseSize
    readPipeline.scard(addKey);               // [4] addSize
    readPipeline.scard(delKey);               // [5] delSize

    const readResults = await readPipeline.exec();
    const [[, inBase], [, inAdd], [, inDel], [, baseSize], [, addSize], [, delSize]] = readResults;

    const isFavorited = (inBase === 1 || inAdd === 1) && inDel !== 1;
    if (!isFavorited) {
      throw new Error('Favorite record not found');
    }

    // Pipeline 原子操作
    const writePipeline = redis.pipeline();
    writePipeline.srem(addKey, userId);     // 从新增集移除
    if (inBase) {
      writePipeline.sadd(delKey, userId);
    }
    writePipeline.zadd(syncKey, Date.now(), normalizedStoryId);
    await writePipeline.exec();

    // 内联计算新的收藏数
    const newAddSize = (addSize || 0) - (inAdd === 1 ? 1 : 0);
    const newDelSize = (delSize || 0) + (inBase === 1 ? 1 : 0);
    const favoriteCount = Math.max(0, (baseSize || 0) + newAddSize - newDelSize);

    return {
      isFavorited: false,
      favoriteCount
    };
  }

  /**
   * 批量检查多个故事的收藏状态
   */
  async checkMultipleFavorited(storyIds, userId) {
    const normalizedStoryIds = Array.isArray(storyIds)
      ? storyIds.map((storyId) => this.normalizeStoryId(storyId))
      : [];

    if (!userId) {
      return normalizedStoryIds.map((storyId) => ({
        storyId,
        isFavorited: false
      }));
    }

    try {
      const redis = redisClient.getClient();
      const results = [];
      const pipeline = redis.pipeline();

      // 批量查询所有故事
      for (const storyId of normalizedStoryIds) {
        const baseKey = this.getBaseKey(storyId);
        const addKey = this.getAddKey(storyId);
        const delKey = this.getDelKey(storyId);

        await this.ensureBaseSetInit(storyId);
        pipeline.sismember(baseKey, userId);
        pipeline.sismember(addKey, userId);
        pipeline.sismember(delKey, userId);
      }

      const pipelineResults = await pipeline.exec();

      // 解析结果
      for (let i = 0; i < normalizedStoryIds.length; i++) {
        const storyId = normalizedStoryIds[i];
        const inBase = pipelineResults[i * 3][1] === 1;
        const inAdd = pipelineResults[i * 3 + 1][1] === 1;
        const inDel = pipelineResults[i * 3 + 2][1] === 1;

        results.push({
          storyId,
          isFavorited: (inBase || inAdd) && !inDel
        });
      }

      return results;
    } catch (err) {
      console.error(`[favorite-cache] Redis 批量检查收藏失败，降级到数据库: userId=${userId}`, err);
      const { Favorite } = await import('../../modules/favorite/favorite.model.js');
      const { Op } = await import('sequelize');
      const favorites = await Favorite.findAll({
        where: {
          userId,
          storyId: { [Op.in]: normalizedStoryIds }
        },
        attributes: ['storyId']
      });
      const favoritedIds = new Set(favorites.map((item) => String(item.storyId)));

      return normalizedStoryIds.map((storyId) => ({
        storyId,
        isFavorited: favoritedIds.has(String(storyId))
      }));
    }
  }

  /**
   * 获取故事的收藏用户列表（分页）
   * 直接查询数据库，不使用缓存
   */
  async getFavoritesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const { Favorite } = await import('../../modules/favorite/favorite.model.js');
    const { User } = await import('../../modules/auth/auth.model.js');
    const offset = (page - 1) * limit;

    const { rows, count } = await Favorite.findAndCountAll({
      where: { storyId: normalizedStoryId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl', 'vip']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return {
      favorites: rows.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        user: {
          id: item.userId,
          username: item.user?.username || 'Anonymous',
          avatar: item.user?.avatarUrl || null,
          vip: item.user?.vip || 0
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
   * 将缓存中的增量数据同步到数据库
   * 可定时任务调用
   */
  async syncToDatabase() {
    const redis = redisClient.getClient();
    const syncKey = this.KEY_PREFIX.SYNC_STORIES;
    const storyIds = [];
    let cursor = '0';

    // 扫描所有需要同步的故事ID
    do {
      const [nextCursor, members] = await redis.zscan(syncKey, cursor, 'COUNT', 100);
      cursor = nextCursor;

      for (let i = 0; i < members.length; i += 2) {
        if (members[i]) {
          storyIds.push(members[i]);
        }
      }
    } while (cursor !== '0');

    if (storyIds.length === 0) {
      return { success: true, synced: 0 };
    }

    const uniqueStoryIds = [...new Set(storyIds)];
    console.log(`[favorite-cache] 开始同步收藏数据，故事数=${uniqueStoryIds.length}`);

    const { Favorite } = await import('../../modules/favorite/favorite.model.js');
    const { Op } = await import('sequelize');
    const transaction = await sequelize.transaction();
    const processedUsers = {};

    try {
      // 批量同步每个故事
      for (const storyId of uniqueStoryIds) {
        const normalizedStoryId = this.normalizeStoryId(storyId);
        const addKey = this.getAddKey(normalizedStoryId);
        const delKey = this.getDelKey(normalizedStoryId);
        const addUsers = await redis.smembers(addKey);
        const delUsers = await redis.smembers(delKey);

        if (addUsers.length === 0 && delUsers.length === 0) {
          continue;
        }

        processedUsers[normalizedStoryId] = {
          add: addUsers.map((id) => parseInt(id, 10)),
          del: delUsers.map((id) => parseInt(id, 10))
        };

        // 批量新增收藏
        if (addUsers.length > 0) {
          await Favorite.bulkCreate(
            addUsers.map((userId) => ({
              userId: parseInt(userId, 10),
              storyId: normalizedStoryId
            })),
            { ignoreDuplicates: true, transaction }
          );
        }

        // 批量删除收藏
        if (delUsers.length > 0) {
          await Favorite.destroy({
            where: {
              userId: { [Op.in]: delUsers.map((id) => parseInt(id, 10)) },
              storyId: normalizedStoryId
            },
            transaction
          });
        }
      }

      await transaction.commit();

      // 清理缓存
      const pipeline = redis.pipeline();
      for (const storyId of uniqueStoryIds) {
        const normalizedStoryId = this.normalizeStoryId(storyId);
        const { add, del } = processedUsers[normalizedStoryId] || { add: [], del: [] };

        if (add.length > 0) {
          pipeline.srem(this.getAddKey(normalizedStoryId), ...add);
        }
        if (del.length > 0) {
          pipeline.srem(this.getDelKey(normalizedStoryId), ...del);
        }

        pipeline.del(this.getBaseKey(normalizedStoryId));
        pipeline.del(this.getInitKey(normalizedStoryId));
        pipeline.zrem(syncKey, normalizedStoryId);
      }

      await pipeline.exec();
      console.log(`[favorite-cache] 同步完成，故事数=${uniqueStoryIds.length}`);
      return { success: true, synced: uniqueStoryIds.length };
    } catch (err) {
      await transaction.rollback();
      console.error('[favorite-cache] 同步失败', err);
      throw err;
    }
  }

  /**
   * 清空单个故事的所有收藏缓存
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
    console.log(`[favorite-cache] 已清空故事缓存: storyId=${normalizedStoryId}`);
  }
}

export const favoriteCacheUtil = new FavoriteCacheUtil();
export default favoriteCacheUtil;