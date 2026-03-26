import { Comment } from './comment.model.js';
import { User } from '../auth/auth.model.js';
import { Story } from '../story/story.model.js';
import { Op } from 'sequelize';
import { NotificationService } from '../notification/notification.service.js';

/**
 * Comment Service - 评论业务逻辑
 */
class CommentServiceClass {
  /**
   * 创建评论
   */
  async createComment(userId, data) {
    const { storyId, content } = data;

    // 验证故事是否存在
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error('故事不存在');
    }

    // 创建评论
    const comment = await Comment.create({
      userId,
      storyId,
      content
    });

    // 发送评论通知（评论者不是故事作者时才发送）
    if (story.userId !== userId) {
      NotificationService.createNotification('comment', story.userId, userId, storyId, content).catch(err => {
        console.error('❌ 发送评论通知失败:', err);
      });
    }

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt
    };
  }

  /**
   * 获取故事评论列表
   */
  async getCommentsByStoryId(storyId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Comment.findAndCountAll({
      where: {
        storyId,
        status: 'active'
      },
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
      comments: rows.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.userId,
          username: comment.user?.username || '匿名用户',
          avatar: comment.user?.avatarUrl || null
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
   * 删除评论
   */
  async deleteComment(commentId, userId) {
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      throw new Error('评论不存在');
    }

    if (comment.userId !== userId) {
      throw new Error('无权删除此评论');
    }

    // 软删除
    await comment.update({ status: 'deleted' });

    return { success: true, message: '删除成功' };
  }

  /**
   * 统计评论数量
   */
  async getCommentCount(storyId) {
    const count = await Comment.count({
      where: {
        storyId,
        status: 'active'
      }
    });

    return { storyId, commentCount: count };
  }

  /**
   * 搜索评论（模糊匹配 content）
   */
  async searchComments(keyword, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Comment.findAndCountAll({
      where: {
        status: 'active',
        content: {
          [Op.iLike]: `%${keyword}%`
        }
      },
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
      comments: rows.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        storyId: comment.storyId,
        user: {
          id: comment.userId,
          username: comment.user?.username || '匿名用户',
          avatar: comment.user?.avatarUrl || null
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
   * 获取用户的评论列表
   */
  async getUserComments(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { rows, count } = await Comment.findAndCountAll({
      where: {
        userId,
        status: 'active'
      },
      include: [{
        model: Story,
        as: 'story',
        attributes: ['id', 'content']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      comments: rows.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        story: {
          id: comment.storyId,
          content: comment.story?.content?.substring(0, 100) || '...'
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
}

// 创建单例实例
export const commentServiceInstance = new CommentServiceClass();

// 导出别名
export { commentServiceInstance as CommentService };
