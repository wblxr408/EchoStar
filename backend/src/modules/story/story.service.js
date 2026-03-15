import { Story } from './story.model.js';
import { User } from '../auth/auth.model.js';
import { generateOSSToken } from '../../common/utils/oss.js';

/**
 * Story Service - 故事业务逻辑
 */
export const StoryService = {
  /**
   * 发布故事
   */
  async createStory(userId, data) {
    const { content, images, location, emotionTag, isTimeCapsule, unlockAt } = data;

    // 创建故事
    const story = await Story.create({
      userId,
      content,
      images,  // JSONB 类型，Sequelize 自动处理
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]  // PostGIS: 经度在前
      },
      emotionTag,
      isTimeCapsule: isTimeCapsule || false,
      unlockAt: isTimeCapsule ? new Date(unlockAt) : null,
      visibility: 'public'  // 时光胶囊通过 isTimeCapsule 字段判断
    });

    return {
      id: story.id,
      content: story.content,
      createdAt: story.createdAt
    };
  },

  /**
   * 查看故事详情（需判断可见性）
   */
  async getStoryById(storyId, userId) {
    const story = await Story.findByPk(storyId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatarUrl']
      }]
    });

    if (!story) {
      throw new Error('故事不存在');
    }

    // 检查可见性
    if (story.visibility === 'shadowban') {
      throw new Error('故事不存在');
    }

    if (story.visibility === 'deleted') {
      throw new Error('故事不存在');
    }

    // 时光胶囊检查：如果是时光胶囊且未到解锁时间，仅作者可见
    let content = story.content;
    if (story.isTimeCapsule && story.unlockAt && new Date() < story.unlockAt) {
      if (story.userId !== userId) {
        content = null;  // 未解锁时光胶囊，内容为空
      }
    }

    // 增加浏览量
    await Story.increment('viewCount', { where: { id: storyId } });

    // 从 PostGIS GEOGRAPHY 提取坐标
    let location = null;
    if (story.location) {
      // 如果 location 是 PostGIS 对象，提取坐标
      // Sequelize 返回的格式可能是字符串或对象
      const locationStr = typeof story.location === 'string'
        ? story.location
        : story.location.toString();
      // GeoJSON 格式: POINT(lng lat)
      const match = locationStr.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        location = {
          lng: parseFloat(match[1]),
          lat: parseFloat(match[2])
        };
      }
    }

    return {
      id: story.id,
      content,
      images: story.images,
      location,
      emotionTag: story.emotionTag,
      isTimeCapsule: story.isTimeCapsule,
      isRecommended: story.isRecommended,
      viewCount: story.viewCount + 1,
      createdAt: story.createdAt,
      author: {
        id: story.userId,
        username: story.author?.username || '匿名用户',
        avatar: story.author?.avatarUrl || null
      }
    };
  },

  /**
   * 删除故事
   */
  async deleteStory(storyId, userId) {
    const story = await Story.findByPk(storyId);

    if (!story) {
      throw new Error('故事不存在');
    }

    if (story.userId !== userId) {
      throw new Error('无权删除此故事');
    }

    await story.destroy();

    return { success: true, message: '删除成功' };
  },

  /**
   * 我的故事列表
   */
  async getMyStories(userId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Story.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      stories: rows.map(story => ({
        id: story.id,
        content: story.content,
        images: story.images,
        createdAt: story.createdAt,
        viewCount: story.viewCount,
        visibility: story.visibility
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  },

  /**
   * 获取 OSS 上传凭证
   */
  async getUploadToken() {
    return generateOSSToken();
  },

  /**
   * 解锁时光胶囊（定时任务调用）
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

    // 如果已经是 public 可见性，无需重复解锁
    if (story.visibility === 'public') {
      return { success: true, message: '时光胶囊已解锁' };
    }

    // 解锁时光胶囊：将可见性改为 public
    await story.update({ visibility: 'public' });

    return {
      success: true,
      message: '时光胶囊解锁成功',
      storyId: story.id
    };
  }
};
