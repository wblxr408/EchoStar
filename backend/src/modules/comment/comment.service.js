import { Comment } from './comment.model.js';
import { User } from '../auth/auth.model.js';
import { Op } from 'sequelize';
import { rocketmqClient, CommentOperation, MessageModule } from '../../common/utils/rocketmq.js';
import { snowflake } from '../../common/utils/snowflake.js';
import { Story } from '../story/story.model.js';

/**
 * Comment Service - 评论业务逻辑（使用 RocketMQ 异步写）
 */
class CommentServiceClass {
  /**
   * 创建评论
   * 发送 MQ 消息异步写入数据库
   */
  async createComment(userId, data) {
    const { storyId, content } = data;

    // 使用缓存查询验证故事是否存在
    const { StoryService } = await import('../story/story.service.js');
    const rawData = await StoryService.fetchStoryRaw(storyId);

    if (!rawData) {
      throw new Error('故事不存在');
    }

    // =====================
    // 基于用户ID + 故事ID + 时间窗口获取分布式锁
    // =====================
    const windowSize = 3; // 3秒窗口
    const timestampWindow = Math.floor(Date.now() / 1000 / windowSize);
    const lockKey = `comment:create:lock:${userId}:${storyId}:${timestampWindow}`;

    const { redisClient } = await import('../../common/utils/redis.js');
    const redis = redisClient.getClient();
    const acquired = await redis.set(
      lockKey,
      '1',
      'NX',
      'EX',
      windowSize
    );

    if (!acquired) {
      throw new Error('评论过于频繁，请3秒后再试');
    }

    // 生成雪花ID
    const commentId = snowflake.nextId();

    // 发送 MQ 消息，让消费者异步处理
    const messageData = {
      commentId,
      userId,
      storyId,
      content,
      lockKey
    };

    try {
      await rocketmqClient.sendOrderly(
        MessageModule.COMMENT,
        CommentOperation.CREATE,
        messageData,
        storyId
      );
    } catch (mqError) {
      // 发送失败，手动释放锁（保底）
      console.error(`❌ 发送 CREATE 消息失败 [commentId: ${commentId}]:`, mqError);
      await redis.del(lockKey);
      throw new Error('评论发布失败，请稍后重试');
    }

    return {
      id: commentId,
      content,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 获取故事评论列表
   * 直接查询数据库（列表数据不需要缓存）
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
        attributes: ['id', 'username', 'avatarUrl', 'vip', 'commentBg']
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
          avatar: comment.user?.avatarUrl || null,
          vip: comment.user?.vip || 0,
          commentBg: comment.user?.commentBg || null
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
   * 发送 MQ 消息异步写入数据库
   */
  async deleteComment(commentId, userId) {
    // 权限检查
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      throw new Error('评论不存在');
    }

    if (comment.userId !== userId) {
      throw new Error('无权删除此评论');
    }

    // 发送 MQ 消息，让消费者异步处理
    rocketmqClient.sendOrderly(
      MessageModule.COMMENT,
      CommentOperation.DELETE,
      { commentId, userId },
      comment.storyId
    ).catch(err => {
      console.error(`❌ 发送 DELETE 消息失败:`, err);
    });

    // 立即返回
    return { success: true, message: '删除成功' };
  }

  /**
   * 统计评论数量
   * 优先从缓存获取
   */
  async getCommentCount(storyId) {
    const { commentCacheUtil } = await import('../../common/utils/comment-cache.util.js');

    // 尝试从缓存获取
    const cachedCount = await commentCacheUtil.getCommentCount(storyId);
    if (cachedCount >= 0) {
      return { storyId, commentCount: cachedCount };
    }

    // 缓存未命中，从数据库查询
    const count = await Comment.count({
      where: {
        storyId,
        status: 'active'
      }
    });

    // 写入缓存
    await commentCacheUtil.setCommentCount(storyId, count);

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
        attributes: ['id', 'username', 'avatarUrl', 'vip', 'commentBg']
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
          avatar: comment.user?.avatarUrl || null,
          vip: comment.user?.vip || 0,
          commentBg: comment.user?.commentBg || null
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
