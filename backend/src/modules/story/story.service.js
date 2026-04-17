import { Story, TimeCapsule } from './story.model.js';
import { User } from '../auth/auth.model.js';
import { generateStoryUploadToken } from '../../common/utils/oss.js';
import { wrapWithCache, redisClient, setUpdatingMarker } from '../../common/utils/redis.js';
import { getVisibilityTimeCondition } from '../../common/utils/visibility-time.util.js';
import { rocketmqClient, StoryOperation, MessageModule } from '../../common/utils/rocketmq.js';
import { snowflake } from '../../common/utils/snowflake.js';
import { Op } from 'sequelize';
import { likeCacheUtil } from '../../common/utils/like-cache.util.js';
import { favoriteCacheUtil } from '../../common/utils/favorite-cache.util.js';
import { safeParseJSONB } from '../../common/utils/jsonb.util.js';

function parseStoryLocationValue(locationValue) {
  if (!locationValue) {
    return null;
  }

  if (locationValue.type === 'Point' && Array.isArray(locationValue.coordinates)) {
    return {
      lng: locationValue.coordinates[0],
      lat: locationValue.coordinates[1]
    };
  }

  const locationStr = typeof locationValue === 'string'
    ? locationValue
    : locationValue.toString();
  const match = locationStr.match(/POINT\(([^ ]+) ([^ ]+)\)/i);

  if (!match) {
    return null;
  }

  return {
    lng: parseFloat(match[1]),
    lat: parseFloat(match[2])
  };
}

function normalizeStoryId(storyId) {
  if (storyId === undefined || storyId === null) {
    throw new Error('Story ID is required');
  }

  return typeof storyId === 'bigint'
    ? storyId.toString()
    : String(storyId).trim();
}

/**
 * Story Service - 故事业务逻辑
 */
class StoryServiceClass {
  /**
   * 获取真实浏览量（数据库基数 + Redis增量）
   * @param {number} storyId - 故事ID
   * @param {number} dbViewCount - 数据库中的浏览量基数
   * @returns {number} 真实浏览量
   */
  async getRealViewCount(storyId, dbViewCount = 0) {
    try {
      const redis = redisClient.getClient();
      const viewCountKey = `story:views:${storyId}`;
      const delta = await redis.get(viewCountKey);
      return (dbViewCount || 0) + (parseInt(delta) || 0);
    } catch (err) {
      console.error(`❌ 获取浏览量失败 [story:views:${storyId}]:`, err);
      return dbViewCount || 0;
    }
  }

  /**
   * 发布故事
   * 发送 MQ 消息异步写入数据库
   */
  async createStory(userId, data) {
    const { content, images, location, locationName, emotionTag, isTimeCapsule, unlockAt, visibility = 'public', visibilityStartTime, visibilityEndTime } = data;

    // 验证 visibility 只能是 public 或 shadowban
    if (!['public', 'shadowban'].includes(visibility)) {
      throw new Error('可见性只能为 public 或 shadowban');
    }

    const safeImages = images || [];

    // 处理可见时间段的默认值逻辑
    let finalStartTime = visibilityStartTime;
    let finalEndTime = visibilityEndTime;

    if (visibility === 'public') {
      if (!visibilityStartTime || !visibilityEndTime) {
        finalStartTime = '00:00';
        finalEndTime = '23:59';
      }
    } else {
      finalStartTime = null;
      finalEndTime = null;
    }

    // =====================
    // 基于用户ID + 时间窗口获取分布式锁
    // =====================
    const windowSize = 3; // 3秒窗口
    const timestampWindow = Math.floor(Date.now() / 1000 / windowSize);
    const lockKey = `story:create:lock:${userId}:${timestampWindow}`;

    const redis = redisClient.getClient();
    const acquired = await redis.set(
      lockKey,
      '1',
      'NX',
      'EX',
      windowSize
    );

    if (!acquired) {
      throw new Error('发布过于频繁，请3秒后再试');
    }

    // 生成雪花ID
    const storyId = snowflake.nextId();

    // 设置更新中标记（TTL 5秒）
    await setUpdatingMarker(`story:raw:${storyId}`, 5);

    // 发送 MQ 消息，让消费者异步写入数据库
    const messageData = {
      storyId,
      userId,
      content,
      images: safeImages,
      location,
      locationName,
      emotionTag,
      isTimeCapsule,
      unlockAt,
      visibility,
      visibilityStartTime,
      visibilityEndTime,
      lockKey
    };

    try {
      await rocketmqClient.sendOrderly(
        MessageModule.STORY,
        StoryOperation.CREATE,
        messageData,
        storyId
      );
    } catch (mqError) {
      // 发送失败，手动释放锁（保底）
      console.error(`❌ 发送 CREATE 消息失败 [storyId: ${storyId}]:`, mqError);
      await redis.del(lockKey);
      await redis.del(`story:raw:${storyId}`);
      throw new Error('发布失败，请稍后重试');
    }

    // 立即返回真实的 ID
    return {
      id: normalizeStoryId(storyId),
      content,
      images: safeImages,
      createdAt: new Date().toISOString(),
      visibilityStartTime: finalStartTime,
      visibilityEndTime: finalEndTime
    };
  }

  /**
   * 纯查询函数：获取故事原始数据（受缓存适配器管理）
   * 职责：数据库查询 + 静态规则检查 + 数据转换
   * 注意：不包含动态业务逻辑（时光胶囊、浏览量等）
   * 注意：缓存通过 wrapWithCache 在类外部手动应用
   */
  async fetchStoryRaw(storyId) {
    const story = await Story.findByPk(storyId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl', 'vip']
      }]
    });

    if (!story) {
      return null;
    }

    // 静态可见性检查（可缓存）
    if (story.visibility === 'shadowban' || story.visibility === 'deleted') {
      return null;
    }

//    // PostGIS 坐标转换（可缓存）
//    let location = null;
//    if (story.location) {
//      const locationStr = typeof story.location === 'string'
//        ? story.location
//        : story.location.toString();
//      const match = locationStr.match(/POINT\(([^ ]+) ([^ ]+)\)/);
//      if (match) {
//        location = {
//          lng: parseFloat(match[1]),
//          lat: parseFloat(match[2])
//        };
//      }
//    }
// ✅ 这是你要粘贴进去的新代码
    // PostGIS 坐标转换（可缓存）
    let location = parseStoryLocationValue(story.location);

    // 返回原始数据结构
    return {
      story,
      author: story.author,
      location,
      locationName: story.locationName  // ✅ 新增：地点名称
    };
  }

  /**
   * 查看故事详情（需判断可见性）
   * 职责：调用缓存适配器 + 动态业务逻辑处理 + 数据格式化
   */
  async getStoryById(storyId, userId) {
    // 调用带缓存的纯查询函数
    const rawData = await this.fetchStoryRaw(storyId);

    // 检查是否正在更新
    if (rawData && rawData._updating) {
      return {
        id: normalizeStoryId(storyId),
        _updating: true,
        message: '故事正在更新中，请稍后再试'
      };
    }

    if (!rawData) {
      throw new Error('故事不存在');
    }

    const { story, author, location } = rawData;

    // 动态业务逻辑：时光胶囊解锁检查（不缓存）
    let content = story.content;
    if (story.isTimeCapsule && story.unlockAt && new Date() < story.unlockAt) {
      if (story.userId !== userId) {
        content = null;  // 未解锁时光胶囊，内容为空
      }
    }

    // ======================
    // 浏览量自增（fire-and-forget，不阻塞响应）
    // ======================
    const redis = redisClient.getClient();
    const viewCountKey = `story:views:${storyId}`;
    const viewDeltaPromise = redis.incr(viewCountKey).catch(() => 1);  // 失败时默认 +1

    // ======================
    // 获取点赞数和评论数（与浏览量并行）
    // ======================
    const { commentCacheUtil } = await import('../../common/utils/comment-cache.util.js');
    const { Comment } = await import('../comment/comment.model.js');
    const [likeCount, commentCount, favoriteCount, viewDelta] = await Promise.all([
      likeCacheUtil.getLikeCount(storyId),
      commentCacheUtil.getCommentCount(storyId).then(async (r) => {
        if (r >= 0) return r;
        // 缓存未命中，从DB查询并回写缓存
        const count = await Comment.count({ where: { storyId, status: 'active' } });
        await commentCacheUtil.setCommentCount(storyId, count);
        return count;
      }),
      favoriteCacheUtil.getFavoriteCount(storyId).catch(() => 0),
      viewDeltaPromise
    ]);
    const totalViewCount = (story.viewCount || 0) + viewDelta - 1;

    // 格式化返回数据
    return {
      id: normalizeStoryId(story.id),
      content,
      images: story.images,
      location,
      locationName: story.locationName,  // ✅ 新增：地点名称
      emotionTag: story.emotionTag,
      isTimeCapsule: story.isTimeCapsule,
      isRecommended: story.isRecommended,
      viewCount: totalViewCount,
      likeCount,  // ✅ 新增
      commentCount,  // ✅ 新增
      favoriteCount,
      createdAt: story.createdAt,
      visibilityStartTime: story.visibilityStartTime,
      visibilityEndTime: story.visibilityEndTime,
      author: {
        id: story.userId,
        username: author?.username || '匿名用户',
        avatar: author?.avatarUrl || null,
        vip: author?.vip || 0
      }
    };
  }

  /**
   * 删除故事
   * 发送 MQ 消息异步写入数据库 + 清除缓存
   */
  async deleteStory(storyId, userId) {
    // 使用缓存查询（更快）
    const story = await this.fetchStoryRaw(storyId);

    // 处理正在更新状态
    if (story && story._updating) {
      // 正在更新中，尝试查询数据库获取权限信息
      const dbStory = await Story.findByPk(storyId);
      if (!dbStory) {
        throw new Error('故事正在处理中，请稍后再试');
      }
      if (dbStory.userId !== userId) {
        throw new Error('无权删除此故事');
      }
    } else if (!story) {
      throw new Error('故事不存在或已被删除');
    } else {
      // 正常状态，检查权限
      if (story.author.id !== userId) {
        throw new Error('无权删除此故事');
      }
    }

    // 发送 MQ 消息，让消费者异步处理
    rocketmqClient.sendOrderly(
      MessageModule.STORY,
      StoryOperation.DELETE,
      { storyId, userId },
      storyId
    ).catch(err => {
      console.error(`❌ 发送 DELETE 消息失败 [storyId: ${storyId}]:`, err);
    });

    // 立即返回
    return { success: true, message: '删除成功' };
  }

  /**
   * 我的故事列表
   */
  async getMyStories(userId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Story.findAndCountAll({
      where: { userId,
            visibility: {
            [Op.notIn]: ['deleted']
            }
       },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl', 'vip']
      }, {
        model: TimeCapsule,
        as: 'timeCapsule',
        attributes: ['isUnlocked'],
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 验证页码是否超出范围
    const totalPages = Math.ceil(count / limit);
    if (page > totalPages && count > 0) {
      throw new Error(`请求的页码超出范围，共 ${totalPages} 页`);
    }

    // 批量获取真实浏览量（单次 pipeline，替代 N 次独立 GET）
    const storyIds = rows.map(story => story.id);
    const redis = redisClient.getClient();
    const viewPipeline = redis.pipeline();
    storyIds.forEach(id => viewPipeline.get(`story:views:${id}`));
    const [viewResults, likeCounts, favoriteCounts] = await Promise.all([
      viewPipeline.exec(),
      Promise.all(storyIds.map((id) => likeCacheUtil.getLikeCount(id).catch(() => 0))),
      Promise.all(storyIds.map((id) => favoriteCacheUtil.getFavoriteCount(id).catch(() => 0)))
    ]);
    const realViewCounts = rows.map((story, index) => {
      const delta = parseInt(viewResults[index]?.[1]) || 0;
      return (story.viewCount || 0) + delta;
    });

    // 计算时光胶囊是否已解锁
    function computeIsUnlocked(story) {
      if (!story.isTimeCapsule) return true;
      if (story.unlockAt && new Date(story.unlockAt) <= new Date()) return true;
      if (story.timeCapsule?.isUnlocked === true) return true;
      return false;
    }

    return {
      stories: rows.map((story, index) => ({
        id: normalizeStoryId(story.id),
        content: story.content,
        images: story.images,
        createdAt: story.createdAt,
        viewCount: realViewCounts[index],
        likeCount: likeCounts[index] || 0,
        favoriteCount: favoriteCounts[index] || 0,
        visibility: story.visibility,
        location: parseStoryLocationValue(story.location),
        locationName: story.locationName,
        isTimeCapsule: story.isTimeCapsule || false,
        unlockAt: story.unlockAt || null,
        isUnlocked: computeIsUnlocked(story),
        author: {
          id: story.userId,
          username: story.author?.username || '匿名用户',
          avatar: story.author?.avatarUrl || null,
          vip: story.author?.vip || 0
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    };
  }

  /**
   * 获取 OSS 上传凭证
   */
  async getUploadToken() {
    return generateStoryUploadToken();
  }

  /**
   * 解锁时光胶囊（定时任务调用）
   * 注意：缓存清除通过 wrapWithClearCache 在类外部手动应用
   */
  async unlockTimeCapsule(storyId) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new Error('故事不存在');
    }

    if (!story.isTimeCapsule) {
      throw new Error('此故事不是时光胶囊');
    }

    if (story.unlockAt && new Date() < story.unlockAt) {
      throw new Error('尚未到解锁时间');
    }

    return {
      success: true,
      message: '时光胶囊解锁成功',
      storyId: normalizeStoryId(story.id)
    };
  }
  //修改故事内容（只允许修改 content 和 emotionTag）
  // 发送 MQ 消息异步写入数据库 + 清除缓存
  async modifyStory(storyId, userId, content, emotionTag) {
    // 使用缓存查询（更快）
    const story = await this.fetchStoryRaw(storyId);

    // 处理正在更新状态
    if (story && story._updating) {
      // 正在更新中，尝试查询数据库获取权限信息
      const dbStory = await Story.findByPk(storyId);
      if (!dbStory) {
        throw new Error('故事正在处理中，请稍后再试');
      }
      if (dbStory.userId !== userId) {
        throw new Error('无权修改此故事');
      }
    } else if (!story) {
      throw new Error('故事不存在');
    } else {
      // 正常状态，检查权限
      if (story.author.id !== userId) {
        throw new Error('无权修改此故事');
      }
    }

    // 设置更新中标记（TTL 5秒）
    await setUpdatingMarker(`story:raw:${storyId}`, 5);

    // 发送 MQ 消息，让消费者异步处理
    rocketmqClient.sendOrderly(
      MessageModule.STORY,
      StoryOperation.MODIFY,
      { storyId, content, emotionTag },
      storyId
    ).catch(err => {
      console.error(`❌ 发送 MODIFY 消息失败 [storyId: ${storyId}]:`, err);
    });

    // 立即返回
    return {
      id: normalizeStoryId(storyId),
      content,
      emotionTag
    };
  }

  //修改故事可见性
  // 发送 MQ 消息异步写入数据库 + 清除缓存
  async updateVisibility(storyId, userId, visibility) {
    // 使用缓存查询（更快）
    const story = await this.fetchStoryRaw(storyId);

    // 处理正在更新状态
    if (story && story._updating) {
      // 正在更新中，尝试查询数据库获取权限信息
      const dbStory = await Story.findByPk(storyId);
      if (!dbStory) {
        throw new Error('故事正在处理中，请稍后再试');
      }
      if (dbStory.userId !== userId) {
        throw new Error('无权修改此故事');
      }
    } else if (!story) {
      throw new Error('故事不存在');
    } else {
      // 正常状态，检查权限
      if (story.author.id !== userId) {
        throw new Error('无权修改此故事');
      }
    }

    // 验证 visibility 只能是 public 或 shadowban
    if (!['public', 'shadowban'].includes(visibility)) {
      throw new Error('可见性只能为 public 或 shadowban');
    }

    // 设置更新中标记（TTL 5秒）
    await setUpdatingMarker(`story:raw:${storyId}`, 5);

    // 发送 MQ 消息，让消费者异步处理
    rocketmqClient.sendOrderly(
      MessageModule.STORY,
      StoryOperation.UPDATE_VISIBILITY,
      { storyId, visibility },
      storyId
    ).catch(err => {
      console.error(`❌ 发送 UPDATE_VISIBILITY 消息失败 [storyId: ${storyId}]:`, err);
    });

    // 立即返回
    return {
      id: normalizeStoryId(storyId),
      visibility
    };
  }

  //搜索故事（模糊匹配 content）
  async searchStories(keyword, { page = 1, limit = 10 } = {}) {
    // =====================
    // 业务逻辑验证
    // =====================

    // 1. 验证关键词
    if (!keyword || typeof keyword !== 'string') {
      throw new Error('请提供搜索关键词');
    }

    const trimmedKeyword = keyword.trim();

    if (trimmedKeyword === '') {
      throw new Error('搜索关键词不能为空');
    }

    // 关键词长度限制
    if (trimmedKeyword.length < 1) {
      throw new Error('搜索关键词不能为空');
    }

    if (trimmedKeyword.length > 100) {
      throw new Error('搜索关键词不能超过100个字符');
    }

    // 2. 验证分页参数
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('页码必须大于0');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new Error('每页数量必须在1-100之间');
    }

    // =====================
    // 业务逻辑处理
    // =====================

    const offset = (pageNum - 1) * limitNum;

    const { rows, count } = await Story.findAndCountAll({
      where: {
        visibility: 'public',
        content: {
          [Op.iLike]: `%${trimmedKeyword}%`  // pg_trgm索引会自动优化此查询
        },
        [Op.and]: [getVisibilityTimeCondition()]
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl', 'vip']
      }],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: parseInt(offset)
    });

    // 验证页码是否超出范围
    const totalPages = Math.ceil(count / limitNum);
    if (pageNum > totalPages && count > 0) {
      throw new Error(`请求的页码超出范围，共 ${totalPages} 页`);
    }

    // 批量获取真实浏览量（单次 pipeline，替代 N 次独立 GET）
    const storyIds = rows.map(story => story.id);
    const redis2 = redisClient.getClient();
    const viewPipeline = redis2.pipeline();
    storyIds.forEach(id => viewPipeline.get(`story:views:${id}`));
    const viewResults = await viewPipeline.exec();
    const realViewCounts = rows.map((story, index) => {
      const delta = parseInt(viewResults[index]?.[1]) || 0;
      return (story.viewCount || 0) + delta;
    });

    // PostGIS 坐标转换
    const storiesWithLocation = rows.map((story, index) => {
      const location = parseStoryLocationValue(story.location);

      return {
        id: normalizeStoryId(story.id),
        content: story.content,
        images: story.images,
        location,
        locationName: story.locationName,
        emotionTag: story.emotionTag,
        isTimeCapsule: story.isTimeCapsule,
        isRecommended: story.isRecommended,
        viewCount: realViewCounts[index],
        createdAt: story.createdAt,
        visibilityStartTime: story.visibilityStartTime,
        visibilityEndTime: story.visibilityEndTime,
        author: {
          id: story.userId,
          username: story.author?.username || '匿名用户',
          avatar: story.author?.avatarUrl || null,
          vip: story.author?.vip || 0
        }
      };
    });

    return {
      stories: storiesWithLocation,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    };
  }

  /**
   * 获取精选推荐故事（公开接口）
   */
  async getFeaturedStories({ page = 1, limit = 20, summary } = {}) {
    const offset = (page - 1) * limit;
    
    const { rows, count } = await Story.findAndCountAll({
      where: {
        visibility: 'public',
        isRecommended: true,
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl', 'vip']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 批量获取点赞数
    const storyIds = rows.map(story => story.id);
    const likeCounts = await Promise.all(
      storyIds.map(id => likeCacheUtil.getLikeCount(id).catch(() => 0))
    );

    return {
      stories: rows.map((story, index) => {
        const coords = parseStoryLocationValue(story.location) || { lat: 0, lng: 0 };
        const { lat, lng } = coords;
        const rawImages = safeParseJSONB(story.images, []);
        return {
          id: normalizeStoryId(story.id),
          content: story.content,
          images: summary && rawImages.length > 1 ? [rawImages[0]] : rawImages,
          username: story.author?.username || '',
          avatar: story.author?.avatarUrl || null,
          author: story.author ? {
            id: story.author.id,
            username: story.author.username || '匿名用户',
            avatar: story.author.avatarUrl || null,
            vip: story.author.vip || 0
          } : null,
          location: { latitude: lat, longitude: lng },
          locationName: story.locationName,
          emotionTag: story.emotionTag,
          isRecommended: true,
          likeCount: likeCounts[index] || 0,
          createdAt: story.createdAt
        };
      }),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 管理员获取所有帖子（public + shadowban）
   */
  async getAllStoriesForAdmin({ page = 1, limit = 20, visibility = null, isRecommended = null }) {
    const offset = (page - 1) * limit;

    // 构建 where 条件
    const whereCondition = {
      visibility: {
        [Op.in]: ['public', 'shadowban']
      }
    };

    // 如果指定了 visibility，则过滤
    if (visibility && ['public', 'shadowban'].includes(visibility)) {
      whereCondition.visibility = visibility;
    }

    // 如果指定了 isRecommended，则过滤推荐故事
    if (isRecommended === 'true' || isRecommended === true) {
      whereCondition.isRecommended = true;
    }

    const { rows, count } = await Story.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['id', 'emotionTag', 'content', 'visibility', 'locationName', 'createdAt', 'viewCount', 'isRecommended', 'images', 'location', 'userId'],
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl', 'vip']
      }]
    });

    // 验证页码是否超出范围
    const totalPages = Math.ceil(count / limit);
    if (page > totalPages && count > 0) {
      throw new Error(`请求的页码超出范围，共 ${totalPages} 页`);
    }

    // 批量获取真实浏览量（单次 pipeline，替代 N 次独立 GET）
    const storyIds = rows.map(story => story.id);
    const redis3 = redisClient.getClient();
    const viewPipeline = redis3.pipeline();
    storyIds.forEach(id => viewPipeline.get(`story:views:${id}`));
    const viewResults = await viewPipeline.exec();
    const realViewCounts = rows.map((story, index) => {
      const delta = parseInt(viewResults[index]?.[1]) || 0;
      return (story.viewCount || 0) + delta;
    });

    const { commentCacheUtil } = await import('../../common/utils/comment-cache.util.js');
    const { Comment } = await import('../comment/comment.model.js');
    const [adminLikeCounts, adminCommentCounts, adminFavoriteCounts] = await Promise.all([
      Promise.all(storyIds.map((id) => likeCacheUtil.getLikeCount(id).catch(() => 0))),
      Promise.all(
        storyIds.map((id) =>
          commentCacheUtil.getCommentCount(id)
            .then(async (cachedCount) => {
              if (cachedCount >= 0) {
                return cachedCount;
              }

              const dbCount = await Comment.count({ where: { storyId: id, status: 'active' } });
              await commentCacheUtil.setCommentCount(id, dbCount);
              return dbCount;
            })
            .catch(() => 0)
        )
      ),
      Promise.all(storyIds.map((id) => favoriteCacheUtil.getFavoriteCount(id).catch(() => 0)))
    ]);

    return {
      stories: rows.map((story, index) => ({
        id: normalizeStoryId(story.id),
        emotionTag: story.emotionTag,
        content: story.content,
        visibility: story.visibility,
        locationName: story.locationName,
        createdAt: story.createdAt,
        viewCount: realViewCounts[index],
        likeCount: adminLikeCounts[index] || 0,
        commentCount: adminCommentCounts[index] || 0,
        favoriteCount: adminFavoriteCounts[index] || 0,
        isRecommended: Boolean(story.isRecommended),
        images: safeParseJSONB(story.images, []),
        location: story.location ? parseStoryLocationValue(story.location) : null,
        userId: story.userId,
        author: {
          id: story.author?.id || story.userId,
          username: story.author?.username || '匿名用户',
          avatar: story.author?.avatarUrl || null,
          vip: story.author?.vip || 0
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    };
  }
}

// 创建实例并手动应用缓存包装器
export const storyServiceInstance = (() => {
  const instance = new StoryServiceClass();

  // 应用缓存包装器：fetchStoryRaw
  instance.fetchStoryRaw = wrapWithCache(
    instance,
    'fetchStoryRaw',
    instance.fetchStoryRaw,
    'story:raw',
    3600,
    300,
    0
  );

  // 注：缓存清除已迁移到 RocketMQ 消费者异步处理，不再使用 wrapWithClearCache

  return instance;
})();

// ✅ 正确导出：提供命名导出 StoryService（解决报错）
export { storyServiceInstance as StoryService };