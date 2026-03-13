import { Story, TimeCapsule } from './story.model.js';
import { generateOSSToken } from '../../common/utils/oss.js';

/**
 * Story Service - 故事业务逻辑
 */
export const StoryService = {
  /**
   * 发布故事
   */
  async createStory(userId, data) {
    const { content, images, location, emotion, isTimeCapsule, unlockAt } = data;

    // 创建故事
    const story = await Story.create({
      userId,
      content,
      images: JSON.stringify(images),
      latitude: location.latitude,
      longitude: location.longitude,
      locationName: location.name,
      emotion,
      visibility: isTimeCapsule ? 'time_capsule' : 'public'
    });

    // 如果是时光胶囊，创建关联记录
    if (isTimeCapsule) {
      await TimeCapsule.create({
        storyId: story.id,
        unlockAt: new Date(unlockAt),
        isUnlocked: false
      });
    }

    return {
      id: story.id,
      content: story.content,
      images: JSON.parse(story.images),
      location: {
        latitude: story.latitude,
        longitude: story.longitude,
        name: story.locationName
      },
      emotion: story.emotion,
      isTimeCapsule,
      createdAt: story.createdAt
    };
  },

  /**
   * 查看故事详情（需判断可见性）
   */
  async getStoryById(storyId, userId) {
    const story = await Story.findByPk(storyId, {
      include: [{
        model: TimeCapsule,
        as: 'timeCapsule'
      }]
    });

    if (!story) {
      throw new Error('故事不存在');
    }

    // 检查可见性
    if (story.visibility === 'shadowban') {
      throw new Error('故事不存在');
    }

    if (story.visibility === 'private' && story.userId !== userId) {
      throw new Error('无权访问此故事');
    }

    if (story.visibility === 'time_capsule') {
      if (!story.timeCapsule || !story.timeCapsule.isUnlocked) {
        if (story.userId !== userId) {
          throw new Error('时光胶囊尚未解锁');
        }
      }
    }

    return {
      id: story.id,
      content: story.content,
      images: JSON.parse(story.images),
      location: {
        latitude: story.latitude,
        longitude: story.longitude,
        name: story.locationName
      },
      emotion: story.emotion,
      visibility: story.visibility,
      isRecommended: story.isRecommended,
      createdAt: story.createdAt,
      author: {
        id: story.userId,
        nickname: story.user?.nickname
      },
      timeCapsule: story.timeCapsule ? {
        unlockAt: story.timeCapsule.unlockAt,
        isUnlocked: story.timeCapsule.isUnlocked
      } : null
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
      offset: parseInt(offset),
      include: [{
        model: TimeCapsule,
        as: 'timeCapsule'
      }]
    });

    return {
      stories: rows.map(story => ({
        id: story.id,
        content: story.content,
        images: JSON.parse(story.images),
        emotion: story.emotion,
        visibility: story.visibility,
        createdAt: story.createdAt,
        timeCapsule: story.timeCapsule ? {
          unlockAt: story.timeCapsule.unlockAt,
          isUnlocked: story.timeCapsule.isUnlocked
        } : null
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
    const timeCapsule = await TimeCapsule.findOne({
      where: { storyId }
    });

    if (!timeCapsule) {
      throw new Error('时光胶囊不存在');
    }

    if (timeCapsule.isUnlocked) {
      throw new Error('时光胶囊已解锁');
    }

    if (new Date() < timeCapsule.unlockAt) {
      throw new Error('尚未到解锁时间');
    }

    // 解锁时光胶囊
    await timeCapsule.update({ isUnlocked: true });

    // 更新故事可见性
    await Story.update(
      { visibility: 'public' },
      { where: { id: storyId } }
    );
  }
};
