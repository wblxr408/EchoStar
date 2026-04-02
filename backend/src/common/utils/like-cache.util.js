import { redisClient } from './redis.js';
import { sequelize } from '../../config/database.js';

/**
 * Like cache utility based on Redis set deltas.
 */
class LikeCacheUtil {
  constructor() {
    this.KEY_PREFIX = {
      BASE: 'like:user:base',
      ADD: 'like:user:add',
      DEL: 'like:user:del',
      SYNC_STORIES: 'like:sync:stories',
      INIT: 'like:user:init'
    };

    this.BASE_TTL = 7 * 24 * 60 * 60;
    this.INIT_TTL = 86400;
  }

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

  normalizeStoryId(storyId) {
    if (storyId === undefined || storyId === null) {
      throw new Error('Story ID is required');
    }

    return typeof storyId === 'bigint'
      ? storyId.toString()
      : String(storyId).trim();
  }

  async ensureBaseSetInit(storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);
    const redis = redisClient.getClient();
    const baseKey = this.getBaseKey(normalizedStoryId);
    const initKey = this.getInitKey(normalizedStoryId);

    const baseExists = await redis.exists(baseKey);
    if (baseExists) {
      return;
    }

    const initExists = await redis.exists(initKey);
    if (initExists) {
      await redis.expire(initKey, this.INIT_TTL);
      return;
    }

    const { Like } = await import('../../modules/like/like.model.js');
    const likes = await Like.findAll({
      where: { storyId: normalizedStoryId },
      attributes: ['userId'],
      raw: true
    });
    const dbUserIds = likes.map((like) => like.userId);

    if (dbUserIds.length > 0) {
      await redis.sadd(baseKey, ...dbUserIds);
      await redis.expire(baseKey, this.BASE_TTL);
    }

    await redis.set(initKey, '1', 'EX', this.INIT_TTL);
    console.log(`[like-cache] base set initialized: storyId=${normalizedStoryId}, count=${dbUserIds.length}`);
  }

  async isLiked(userId, storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);

    try {
      const redis = redisClient.getClient();
      const baseKey = this.getBaseKey(normalizedStoryId);
      const addKey = this.getAddKey(normalizedStoryId);
      const delKey = this.getDelKey(normalizedStoryId);

      await this.ensureBaseSetInit(normalizedStoryId);

      const pipeline = redis.pipeline();
      pipeline.sismember(baseKey, userId);
      pipeline.sismember(addKey, userId);
      pipeline.sismember(delKey, userId);

      const results = await pipeline.exec();
      const [[, inBase], [, inAdd], [, inDel]] = results;

      return (inBase === 1 || inAdd === 1) && inDel !== 1;
    } catch (err) {
      console.error(`[like-cache] Redis isLiked failed, fallback to DB: storyId=${normalizedStoryId}`, err);
      const { Like } = await import('../../modules/like/like.model.js');
      const record = await Like.findOne({
        where: { userId, storyId: normalizedStoryId }
      });
      return !!record;
    }
  }

  async getLikeCount(storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);

    try {
      const redis = redisClient.getClient();
      const baseKey = this.getBaseKey(normalizedStoryId);
      const addKey = this.getAddKey(normalizedStoryId);
      const delKey = this.getDelKey(normalizedStoryId);

      await this.ensureBaseSetInit(normalizedStoryId);

      const tempKey = `like:temp:count:${normalizedStoryId}`;
      let tempCreated = false;

      try {
        const unionCount = await redis.sunionstore(tempKey, baseKey, addKey);
        tempCreated = true;

        if (unionCount > 0) {
          const delMembers = await redis.smembers(delKey);
          if (delMembers.length > 0) {
            await redis.srem(tempKey, ...delMembers);
          }
        }

        const finalCount = await redis.scard(tempKey);
        return Math.max(0, finalCount || 0);
      } finally {
        if (tempCreated) {
          await redis.del(tempKey).catch(() => {});
        }
      }
    } catch (err) {
      console.error(`[like-cache] Redis getLikeCount failed, fallback to DB: storyId=${normalizedStoryId}`, err);
      const { Like } = await import('../../modules/like/like.model.js');
      return Like.count({ where: { storyId: normalizedStoryId } });
    }
  }

  async likeStory(userId, storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);

    try {
      const redis = redisClient.getClient();
      const addKey = this.getAddKey(normalizedStoryId);
      const delKey = this.getDelKey(normalizedStoryId);
      const syncKey = this.KEY_PREFIX.SYNC_STORIES;

      const isLiked = await this.isLiked(userId, normalizedStoryId);
      if (isLiked) {
        throw new Error('Story already liked');
      }

      const pipeline = redis.pipeline();
      pipeline.srem(delKey, userId);
      pipeline.sadd(addKey, userId);
      pipeline.zadd(syncKey, Date.now(), normalizedStoryId);
      await pipeline.exec();

      const likeCount = await this.getLikeCount(normalizedStoryId);
      return {
        isLiked: true,
        likeCount
      };
    } catch (err) {
      if (err.message === 'Story already liked') {
        throw err;
      }

      console.error(`[like-cache] Redis likeStory failed, fallback to DB: storyId=${normalizedStoryId}`, err);
      const { Like } = await import('../../modules/like/like.model.js');
      const [, created] = await Like.findOrCreate({
        where: { userId, storyId: normalizedStoryId }
      });

      if (!created) {
        throw new Error('Story already liked');
      }

      const likeCount = await Like.count({ where: { storyId: normalizedStoryId } });
      return {
        isLiked: true,
        likeCount
      };
    }
  }

  async unlikeStory(userId, storyId) {
    const normalizedStoryId = this.normalizeStoryId(storyId);

    try {
      const redis = redisClient.getClient();
      const addKey = this.getAddKey(normalizedStoryId);
      const delKey = this.getDelKey(normalizedStoryId);
      const syncKey = this.KEY_PREFIX.SYNC_STORIES;

      const isLiked = await this.isLiked(userId, normalizedStoryId);
      if (!isLiked) {
        throw new Error('Like record not found');
      }

      const pipeline = redis.pipeline();
      pipeline.srem(addKey, userId);
      pipeline.sadd(delKey, userId);
      pipeline.zadd(syncKey, Date.now(), normalizedStoryId);
      await pipeline.exec();

      const likeCount = await this.getLikeCount(normalizedStoryId);
      return {
        isLiked: false,
        likeCount
      };
    } catch (err) {
      if (err.message === 'Like record not found') {
        throw err;
      }

      console.error(`[like-cache] Redis unlikeStory failed, fallback to DB: storyId=${normalizedStoryId}`, err);
      const { Like } = await import('../../modules/like/like.model.js');
      const record = await Like.findOne({
        where: { userId, storyId: normalizedStoryId }
      });

      if (!record) {
        throw new Error('Like record not found');
      }

      await record.destroy();
      const likeCount = await Like.count({ where: { storyId: normalizedStoryId } });
      return {
        isLiked: false,
        likeCount
      };
    }
  }

  async checkMultipleLiked(storyIds, userId) {
    const normalizedStoryIds = Array.isArray(storyIds)
      ? storyIds.map((storyId) => this.normalizeStoryId(storyId))
      : [];

    if (!userId) {
      return normalizedStoryIds.map((storyId) => ({
        storyId,
        isLiked: false
      }));
    }

    try {
      const redis = redisClient.getClient();
      const results = [];
      const pipeline = redis.pipeline();

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

      for (let i = 0; i < normalizedStoryIds.length; i++) {
        const storyId = normalizedStoryIds[i];
        const baseIdx = i * 3;
        const addIdx = i * 3 + 1;
        const delIdx = i * 3 + 2;

        const inBase = pipelineResults[baseIdx][1] === 1;
        const inAdd = pipelineResults[addIdx][1] === 1;
        const inDel = pipelineResults[delIdx][1] === 1;

        results.push({
          storyId,
          isLiked: (inBase || inAdd) && !inDel
        });
      }

      return results;
    } catch (err) {
      console.error(`[like-cache] Redis checkMultipleLiked failed, fallback to DB: userId=${userId}`, err);
      const { Like } = await import('../../modules/like/like.model.js');
      const { Op } = await import('sequelize');
      const likes = await Like.findAll({
        where: {
          userId,
          storyId: { [Op.in]: normalizedStoryIds }
        },
        attributes: ['storyId']
      });
      const likedIds = new Set(likes.map((like) => String(like.storyId)));

      return normalizedStoryIds.map((storyId) => ({
        storyId,
        isLiked: likedIds.has(String(storyId))
      }));
    }
  }

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

  async syncToDatabase() {
    const redis = redisClient.getClient();
    const syncKey = this.KEY_PREFIX.SYNC_STORIES;
    const storyIds = [];
    let cursor = '0';

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
    console.log(`[like-cache] start syncing likes, stories=${uniqueStoryIds.length}`);

    const { Like } = await import('../../modules/like/like.model.js');
    const { Op } = await import('sequelize');
    const transaction = await sequelize.transaction();
    const processedUsers = {};

    try {
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

        if (addUsers.length > 0) {
          await Like.bulkCreate(
            addUsers.map((userId) => ({
              userId: parseInt(userId, 10),
              storyId: normalizedStoryId
            })),
            { ignoreDuplicates: true, transaction }
          );
        }

        if (delUsers.length > 0) {
          await Like.destroy({
            where: {
              userId: { [Op.in]: delUsers.map((id) => parseInt(id, 10)) },
              storyId: normalizedStoryId
            },
            transaction
          });
        }
      }

      await transaction.commit();

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
      console.log(`[like-cache] sync finished, stories=${uniqueStoryIds.length}`);
      return { success: true, synced: uniqueStoryIds.length };
    } catch (err) {
      await transaction.rollback();
      console.error('[like-cache] sync failed', err);
      throw err;
    }
  }

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
    console.log(`[like-cache] cleared story cache: storyId=${normalizedStoryId}`);
  }
}

export const likeCacheUtil = new LikeCacheUtil();
export default likeCacheUtil;
