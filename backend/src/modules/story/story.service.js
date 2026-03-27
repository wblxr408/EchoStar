import { Story } from './story.model.js';
import { User } from '../auth/auth.model.js';
import { Like } from '../like/like.model.js';
import { Comment } from '../comment/comment.model.js';
import { generateStoryUploadToken } from '../../common/utils/oss.js';
import { wrapWithCache, wrapWithClearCache, redisClient } from '../../common/utils/redis.js';
import { getVisibilityTimeCondition } from '../../common/utils/visibility-time.util.js';
import { Op } from 'sequelize';

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
   */
  async createStory(userId, data) {
    const { content, images, location, locationName, emotionTag, isTimeCapsule, unlockAt, visibility = 'public', visibilityStartTime, visibilityEndTime } = data;

    // 验证 visibility 只能是 public 或 shadowban
    if (!['public', 'shadowban'].includes(visibility)) {
      throw new Error('可见性只能为 public 或 shadowban');
    }
    const safeImages = images || [];

    // 处理可见时间段的默认值逻辑
    // 如果是 public，且没有传可见时间段，则默认为全天可见 (00:00 - 23:59)
    let finalStartTime = visibilityStartTime;
    let finalEndTime = visibilityEndTime;

    if (visibility === 'public') {
      if (!visibilityStartTime || !visibilityEndTime) {
        finalStartTime = '00:00';
        finalEndTime = '23:59';
      }
    } else {
      // 如果不是 public，则清除时间段
      finalStartTime = null;
      finalEndTime = null;
    }

    // 创建故事
    const story = await Story.create({
      userId,
      content,
      images:safeImages,  // JSONB 类型，Sequelize 自动处理
      // 修改后的代码：
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat]  // ✅ 改为读取 lng 和 lat (记得依然是经度在前)
      },
      locationName,  // ✅ 新增：地点名称
      emotionTag,
      isTimeCapsule: isTimeCapsule || false,
      unlockAt: isTimeCapsule ? new Date(unlockAt) : null,
      visibility,  // 允许用户指定可见性
      visibilityStartTime: visibilityStartTime || null,
      visibilityEndTime: visibilityEndTime || null
    });

    // 清除可能存在的旧占位值（防止缓存穿透导致新创建的故事查询失败）
    try {
      const redis = redisClient.getClient();
      await redis.del(`story:raw:${story.id}`);
    } catch (err) {
      console.error(`❌ 清除缓存失败 [story:raw:${story.id}]:`, err);
    }

    return {
      id: story.id,
      content: story.content,
      images: story.images,
      createdAt: story.createdAt,
      visibilityStartTime: story.visibilityStartTime,
      visibilityEndTime: story.visibilityEndTime
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
        attributes: ['id', 'username', 'avatarUrl']
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
    if (false && story.location) {
      // 1. 如果 Sequelize 已经把它解析成了 GeoJSON 对象 (绝大多数情况)
      if (story.location.type === 'Point' && Array.isArray(story.location.coordinates)) {
        location = {
          lng: story.location.coordinates[0],
          lat: story.location.coordinates[1]
        };
      }
      // 2. 备用逻辑：如果是 WKT 字符串格式
      else {
        const locationStr = typeof story.location === 'string'
          ? story.location
          : story.location.toString();
        const match = locationStr.match(/POINT\(([^ ]+) ([^ ]+)\)/i);
        if (match) {
          location = {
            lng: parseFloat(match[1]),
            lat: parseFloat(match[2])
          };
        }
      }
    }

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
    // 实时计算总浏览量
    // 数据库基数 + Redis增量
    // ======================
    const redis = redisClient.getClient();
    const viewCountKey = `story:views:${storyId}`;
    const delta = await redis.incr(viewCountKey);  // 原子操作，返回自增后的值
    const totalViewCount = (story.viewCount || 0) + delta - 1;

    // ======================
    // 获取点赞数和评论数
    // ======================
    const [likeCount, commentCount] = await Promise.all([
      Like.count({ where: { storyId } }),
      Comment.count({ where: { storyId, status: 'active' } })
    ]);

    // 格式化返回数据
    return {
      id: story.id,
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
      createdAt: story.createdAt,
      visibilityStartTime: story.visibilityStartTime,
      visibilityEndTime: story.visibilityEndTime,
      author: {
        id: story.userId,
        username: author?.username || '匿名用户',
        avatar: author?.avatarUrl || null
      }
    };
  }

  /**
   * 删除故事
   * 注意：缓存清除通过 wrapWithClearCache 在类外部手动应用
   */
  async deleteStory(storyId, userId) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new Error('故事不存在');
    }

    if (story.userId !== userId) {
      throw new Error('无权删除此故事');
    }

    // 检查是否已删除
    if (story.visibility === 'deleted') {
      throw new Error('故事已被删除');
    }

    await story.update({ visibility: 'deleted' });

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
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 验证页码是否超出范围
    const totalPages = Math.ceil(count / limit);
    if (page > totalPages && count > 0) {
      throw new Error(`请求的页码超出范围，共 ${totalPages} 页`);
    }

    // 批量获取真实浏览量
    const storyIds = rows.map(story => story.id);
    const realViewCounts = await Promise.all(
      storyIds.map(id => this.getRealViewCount(id, rows.find(s => s.id === id).viewCount))
    );

    return {
      stories: rows.map((story, index) => ({
        id: story.id,
        content: story.content,
        images: story.images,
        createdAt: story.createdAt,
        viewCount: realViewCounts[index],
        visibility: story.visibility,
        location: parseStoryLocationValue(story.location),
        locationName: story.locationName
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
      storyId: story.id
    };
  }
  //修改故事内容（只允许修改 content 和 emotionTag）
  async modifyStory(storyId, userId, content, emotionTag) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new Error('故事不存在');
    }

    if (story.userId !== userId) {
      throw new Error('无权修改此故事');
    }

    // 只修改 content 和 emotionTag
    await story.update({
      content,
      emotionTag
    });

    return {
      id: story.id,
      content: story.content,
      emotionTag: story.emotionTag
    };
  }

  //修改故事可见性
  async updateVisibility(storyId, userId, visibility) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new Error('故事不存在');
    }

    if (story.userId !== userId) {
      throw new Error('无权修改此故事');
    }

    // 验证 visibility 只能是 public 或 shadowban
    if (!['public', 'shadowban'].includes(visibility)) {
      throw new Error('可见性只能为 public 或 shadowban');
    }

    await story.update({
      visibility
    });

    return {
      id: story.id,
      visibility: story.visibility
    };
  }

  //搜索故事（模糊匹配 content）
  async searchStories(keyword, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Story.findAndCountAll({
      where: {
        visibility: 'public',
        content: {
          [Op.iLike]: `%${keyword}%`  // PostgreSQL 不区分大小写模糊匹配
        },
        [Op.and]: [getVisibilityTimeCondition()]
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
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

    // 批量获取真实浏览量
    const storyIds = rows.map(story => story.id);
    const realViewCounts = await Promise.all(
      storyIds.map(id => this.getRealViewCount(id, rows.find(s => s.id === id).viewCount))
    );

    // PostGIS 坐标转换
    const storiesWithLocation = rows.map((story, index) => {
      let location = null;
      if (story.location) {
        if (story.location.type === 'Point' && Array.isArray(story.location.coordinates)) {
          location = {
            lng: story.location.coordinates[0],
            lat: story.location.coordinates[1]
          };
        }
      }

      return {
        id: story.id,
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
          avatar: story.author?.avatarUrl || null
        }
      };
    });

    return {
      stories: storiesWithLocation,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    };
  }

  /**
   * 管理员获取所有帖子（public + shadowban）
   */
  async getAllStoriesForAdmin({ page = 1, limit = 20, visibility = null }) {
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

    const { rows, count } = await Story.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['id', 'emotionTag', 'content', 'visibility', 'locationName', 'createdAt', 'viewCount'],
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }]
    });

    // 验证页码是否超出范围
    const totalPages = Math.ceil(count / limit);
    if (page > totalPages && count > 0) {
      throw new Error(`请求的页码超出范围，共 ${totalPages} 页`);
    }

    // 批量获取真实浏览量
    const storyIds = rows.map(story => story.id);
    const realViewCounts = await Promise.all(
      storyIds.map(id => this.getRealViewCount(id, rows.find(s => s.id === id).viewCount))
    );

    return {
      stories: rows.map((story, index) => ({
        id: story.id,
        emotionTag: story.emotionTag,
        content: story.content,
        visibility: story.visibility,
        locationName: story.locationName,
        createdAt: story.createdAt,
        viewCount: realViewCounts[index],
        author: {
          id: story.author.id,
          username: story.author.username,
          avatar: story.author.avatarUrl
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

  // 应用清除缓存包装器：deleteStory
  instance.deleteStory = wrapWithClearCache(
    instance,
    'deleteStory',
    instance.deleteStory,
    'story:raw',
    0
  );

  // 应用清除缓存包装器：unlockTimeCapsule
  instance.unlockTimeCapsule = wrapWithClearCache(
    instance,
    'unlockTimeCapsule',
    instance.unlockTimeCapsule,
    'story:raw',
    0
  );
  instance.modifyStory = wrapWithClearCache(
    instance,
    'modifyStory',
    instance.modifyStory,
    'story:raw',
    0
  );
  instance.updateVisibility = wrapWithClearCache(
    instance,
    'updateVisibility',
    instance.updateVisibility,
    'story:raw',
    0
  );

  return instance;
})();

// ✅ 正确导出：提供命名导出 StoryService（解决报错）
export { storyServiceInstance as StoryService };
