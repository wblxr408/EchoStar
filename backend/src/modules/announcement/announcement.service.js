import { Announcement } from './announcement.model.js';
import { redisClient } from '../../common/utils/redis.js';
import { wrapWithCache } from '../../common/utils/redis.js';

// 缓存配置
const CACHE_KEY_PREFIX = 'announcements:list';
const CACHE_TTL = 300; // 公告列表缓存 5 分钟（公告更新频率低）

/**
 * Announcement Service - 公告业务逻辑（带 Redis 缓存）
 */
class AnnouncementServiceClass {
  /**
   * 获取公告列表（公开接口，带缓存）
   * @param {Object} options - 查询选项 { page, limit }
   */
  async getAll({ page = 1, limit = 20 } = {}) {
    // 先查缓存
    const redis = redisClient.getClient();
    const cacheKey = `${CACHE_KEY_PREFIX}:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null && cached !== '__EMPTY__') {
        console.log(`✅ 命中公告缓存：${cacheKey}`);
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error(`❌ 读公告缓存失败 [${cacheKey}]:`, err);
    }

    // 缓存未命中，查数据库
    const offset = (page - 1) * limit;
    const { count, rows } = await Announcement.findAndCountAll({
      order: [['is_pinned', 'DESC'], ['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
      attributes: { exclude: [] }
    });

    const result = {
      announcements: rows.map(a => a.toJSON()),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };

    // 写入缓存
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      console.log(`✅ 写入公告缓存：${cacheKey}，TTL=${CACHE_TTL}s`);
    } catch (err) {
      console.error(`❌ 写公告缓存失败 [${cacheKey}]:`, err);
    }

    return result;
  }

  /**
   * 清除公告列表所有分页缓存
   * 在增删改操作后调用
   */
  async _clearListCache() {
    const redis = redisClient.getClient();
    try {
      const keys = await redis.keys(`${CACHE_KEY_PREFIX}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`✅ 清除公告缓存：${keys.length} 个键已删除`);
      }
    } catch (err) {
      console.error(`❌ 清除公告缓存失败:`, err);
    }
  }

  /**
   * 创建公告（管理员）→ 写库 + 清除缓存
   * @param {Object} data - { title, content, type }
   * @param {number} authorId - 管理员用户ID
   */
  async create(data, authorId) {
    const announcement = await Announcement.create({
      title: data.title,
      content: data.content,
      type: data.type || 'info',
      authorId,
      isPinned: data.isPinned || false
    });

    // 清除缓存，让下次请求重新加载
    await this._clearListCache();

    console.log(`✅ 创建公告成功: id=${announcement.id}, title=${announcement.title}, by=userId:${authorId}`);
    return announcement.toJSON();
  }

  /**
   * 更新公告（管理员）→ 写库 + 清除缓存
   * @param {number} id - 公告ID
   * @param {Object} data - 更新字段
   */
  async update(id, data) {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      throw new Error('公告不存在');
    }

    const allowedFields = ['title', 'content', 'type', 'isPinned'];
    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    await announcement.update(updateData);

    // 清除缓存
    await this._clearListCache();

    console.log(`✅ 更新公告成功: id=${id}`);
    return announcement.toJSON();
  }

  /**
   * 删除公告（管理员）→ 写库 + 清除缓存
   * @param {number} id - 公告ID
   */
  async delete(id) {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) {
      throw new Error('公告不存在');
    }

    await announcement.destroy();

    // 清除缓存
    await this._clearListCache();

    console.log(`✅ 删除公告成功: id=${id}`);
    return { success: true };
  }
}

export const AnnouncementService = new AnnouncementServiceClass();
