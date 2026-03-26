import { Like } from './like.model.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { Op } from 'sequelize';
import { NotificationService } from '../notification/notification.service.js';

/**
 * Like Service - 点赞业务逻辑
 */
class LikeServiceClass {
  /**
   * 点赞/取消点赞（根据是否存在决定操作）
   */
  async toggleLike(userId, storyId) {
    // 验证故事是否存在
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('故事不存在');
    }

    // 检查是否已点赞
    const existingLike = await Like.findOne({
      where: { userId, storyId }
    });

    if (existingLike) {
      // 已点赞，则取消点赞
      await existingLike.destroy();
      return { isLiked: false, message: '已取消点赞' };
    } else {
      // 未点赞，则点赞
      const like = await Like.create({
        userId,
        storyId
      });

      // 发送点赞通知（点赞者不是故事作者时才发送）
      if (story.userId !== userId) {
        NotificationService.createNotification('like', story.userId, userId, storyId).catch(err => {
          console.error('❌ 发送点赞通知失败:', err);
        });
      }

      return { isLiked: true, message: '点赞成功', id: like.id };
    }
  }

  /**
   * 创建点赞
   */
  async createLike(userId, storyId) {
    // 验证故事是否存在
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('故事不存在');
    }

    // 检查是否已点赞
    const existingLike = await Like.findOne({
      where: { userId, storyId }
    });

    if (existingLike) {
      throw new Error('已经点赞过此故事');
    }

    // 创建点赞
    const like = await Like.create({
      userId,
      storyId
    });

    // 发送点赞通知（点赞者不是故事作者时才发送）
    if (story.userId !== userId) {
      NotificationService.createNotification('like', story.userId, userId, storyId).catch(err => {
        console.error('❌ 发送点赞通知失败:', err);
      });
    }

    return {
      id: like.id,
      storyId: like.storyId,
      createdAt: like.createdAt
    };
  }

  /**
   * 取消点赞
   */
  async deleteLike(storyId, userId) {
    const like = await Like.findOne({
      where: { userId, storyId }
    });

    if (!like) {
      throw new Error('点赞记录不存在');
    }

    await like.destroy();

    return { success: true, message: '取消点赞成功' };
  }

  /**
   * 获取故事点赞列表
   */
  async getLikesByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Like.findAndCountAll({
      where: { storyId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      likes: rows.map(like => ({
        id: like.id,
        createdAt: like.createdAt,
        user: {
          id: like.userId,
          username: like.user?.username || '匿名用户',
          avatar: like.user?.avatarUrl || null
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 统计点赞数量
   */
  async getLikeCount(storyId) {
    const count = await Like.count({
      where: { storyId }
    });

    return { storyId, likeCount: count };
  }

  /**
   * 检查用户是否已点赞
   */
  async checkIsLiked(storyId, userId) {
    const like = await Like.findOne({
      where: { userId, storyId }
    });

    return { storyId, isLiked: !!like };
  }

  /**
   * 获取用户的点赞列表
   */
  async getUserLikes(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Like.findAndCountAll({
      where: { userId },
      include: [{
        model: Story,
        as: 'story',
        attributes: ['id', 'content', 'images', 'emotionTag', 'createdAt']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      likes: rows.map(like => ({
        id: like.id,
        createdAt: like.createdAt,
        story: {
          id: like.storyId,
          content: like.story?.content,
          images: like.story?.images || [],
          emotionTag: like.story?.emotionTag,
          createdAt: like.story?.createdAt
        }
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 批量检查多个故事的点赞状态
   */
  async checkMultipleLiked(storyIds, userId) {
    const likes = await Like.findAll({
      where: {
        userId,
        storyId: { [Op.in]: storyIds }
      },
      attributes: ['storyId']
    });

    const likedStoryIds = likes.map(like => like.storyId);

    return storyIds.map(storyId => ({
      storyId,
      isLiked: likedStoryIds.includes(storyId)
    }));
  }
}

// 创建单例实例
export const likeServiceInstance = new LikeServiceClass();

// 导出别名
export { likeServiceInstance as LikeService };
