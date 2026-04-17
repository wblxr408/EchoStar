import config from '../config/rocketmq.js';
import { MessageModule, CommentOperation } from '../common/utils/rocketmq.js';
import { Comment } from '../modules/comment/comment.model.js';
import { commentCacheUtil } from '../common/utils/comment-cache.util.js';
import { NotificationService } from '../modules/notification/notification.service.js';
import logger from '../common/utils/logger.js';

/**
 * 消息去重集合
 */
const processedMessages = new Set();
const DEDUP_TTL = 5 * 60 * 1000;

// 定期清理去重集合
setInterval(() => {
  const now = Date.now();
  for (const msgId of processedMessages) {
    const timestamp = parseInt(msgId.split('-')[1]);
    if (now - timestamp > DEDUP_TTL) {
      processedMessages.delete(msgId);
    }
  }
}, 60 * 1000);

/**
 * 评论操作消费者
 * 使用 RocketMQ 5.x SimpleConsumer
 */
class CommentConsumer {
  constructor() {
    this.consumer = null;
    this.initialized = false;
    this.polling = false;
    this.shouldStop = false;
  }

  /**
   * 初始化 Consumer
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      const rocketmqModule = await import('rocketmq-client-nodejs');
      const { SimpleConsumer } = rocketmqModule;

      this.consumer = new SimpleConsumer({
        consumerGroup: config.commentConsumerGroup,
        endpoints: config.endpoints,
        subscriptions: new Map([[config.topic, '*']])
      });

      await this.consumer.startup();
      this.initialized = true;
      console.log('✅ Comment Consumer 已启动');

      // 开始轮询消息
      this.startPolling();
    } catch (error) {
      console.error('❌ Comment Consumer 启动失败:', error.message);
      logger.error('Comment Consumer 启动失败', error);
    }
  }

  /**
   * 开始轮询消息
   */
  async startPolling() {
    if (this.polling || this.shouldStop) {
      return;
    }

    this.polling = true;
    this.shouldStop = false;

    while (!this.shouldStop && this.initialized) {
      try {
        const messages = await this.consumer.receive(
          config.maxMessagesPerPoll,
          config.awaitDuration
        );

        for (const message of messages) {
          await this.handleMessage(message);
        }
      } catch (error) {
        if (!this.shouldStop) {
          logger.error('Comment Consumer 轮询失败', error);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    this.polling = false;
  }

  /**
   * 停止轮询
   */
  stopPolling() {
    this.shouldStop = true;
  }

  /**
   * 消息处理逻辑
   */
  async handleMessage(message) {
    try {
      const msgId = message.messageId;
      const body = message.body instanceof Buffer ? message.body.toString() : message.body;
      const { module, operation, shardKey, timestamp, payload } = JSON.parse(body);

      if (module !== MessageModule.COMMENT) {
        await this.consumer.ack(message);
        return;
      }

      const dedupKey = `${shardKey}-${timestamp}`;
      if (processedMessages.has(dedupKey)) {
        logger.info(`🔄 消息已处理，跳过: ${dedupKey}`);
        await this.consumer.ack(message);
        return;
      }
      processedMessages.add(dedupKey);

      logger.info(`📨 处理消息: ${module}:${operation}`, { shardKey, msgId });

      try {
        switch (operation) {
          case CommentOperation.CREATE:
            await this.handleCreate(payload);
            break;
          case CommentOperation.DELETE:
            await this.handleDelete(payload);
            break;
          default:
            console.warn(`⚠️  未知操作类型: ${operation}`);
        }

        logger.info(`✅ 消息处理成功: ${module}:${operation}`, { shardKey });
        await this.consumer.ack(message);
      } catch (error) {
        logger.error(`❌ 消息处理失败: ${module}:${operation}`, error);
        throw error;
      }
    } catch (error) {
      logger.error('❌ 消息解析失败', error);
    }
  }

  /**
   * 处理创建评论
   */
  async handleCreate(payload) {
    const { commentId, userId, storyId, content, lockKey } = payload;

    const { redisClient } = await import('../common/utils/redis.js');
    const redis = redisClient.getClient();

    try {
      const comment = await Comment.create({
        id: commentId,
        userId,
        storyId,
        content
      });

      await commentCacheUtil.incrementCommentCount(storyId);

      const { Story } = await import('../modules/story/story.model.js');
      const story = await Story.findByPk(storyId);
      if (story && story.userId !== userId) {
        NotificationService.createNotification('comment', story.userId, userId, storyId, content).catch(err => {
          console.error('❌ 发送评论通知失败:', err);
        });
      }

      console.log(`✅ 创建评论成功: commentId=${comment.id}, storyId=${storyId}`);
    } catch (dbError) {
      console.error(`❌ 评论创建失败 [commentId: ${commentId}]:`, dbError);

      // 主键冲突不抛异常
      if (dbError.name !== 'SequelizeUniqueConstraintError' && dbError.code !== '23505') {
        throw dbError;
      }
    } finally {
      // 释放锁（无论成功失败）
      await redis.del(lockKey);
      console.log(`🔓 评论锁已释放 [lockKey: ${lockKey}]`);
    }
  }

  /**
   * 处理删除评论
   */
  async handleDelete(payload) {
    const { commentId, userId } = payload;

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      throw new Error(`评论不存在: ${commentId}`);
    }

    if (comment.userId !== userId) {
      throw new Error(`无权删除评论: ${commentId}`);
    }

    await comment.update({ status: 'deleted' });
    await commentCacheUtil.decrementCommentCount(comment.storyId);

    console.log(`✅ 删除评论成功: commentId=${commentId}, storyId=${comment.storyId}`);
  }

  /**
   * 关闭 Consumer
   */
  async shutdown() {
    this.shouldStop = true;
    this.stopPolling();

    while (this.polling) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.consumer && this.initialized) {
      await this.consumer.shutdown();
      this.initialized = false;
      console.log('✅ Comment Consumer 已关闭');
    }
  }
}

export const commentConsumer = new CommentConsumer();
export default commentConsumer;
