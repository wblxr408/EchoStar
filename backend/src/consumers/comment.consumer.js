import config from '../config/rocketmq.js';
import { MessageModule, CommentOperation } from '../common/utils/rocketmq.js';
import { Comment } from '../modules/comment/comment.model.js';
import { commentCacheUtil } from '../common/utils/comment-cache.util.js';
import { NotificationService } from '../modules/notification/notification.service.js';
import logger from '../common/utils/logger.js';

/**
 * 简单的 TPS 限流器
 * 每秒最多处理 maxTps 条消息
 */
class RateLimiter {
  constructor(maxTps = 100) {
    this.maxTps = maxTps;
    this.currentTps = 0;
    this.resetInterval = setInterval(() => {
      this.currentTps = 0;
    }, 1000);
  }

  /**
   * 等待令牌
   */
  async waitForToken() {
    while (this.currentTps >= this.maxTps) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.currentTps++;
  }

  /**
   * 关闭限流器
   */
  shutdown() {
    clearInterval(this.resetInterval);
  }
}

/**
 * 消息处理失败记录
 */
const failedMessages = [];

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
 * 顺序消费，执行数据库写操作 + 更新评论数缓存
 */
class CommentConsumer {
  constructor() {
    this.consumer = null;
    this.initialized = false;
    this.rateLimiter = new RateLimiter(100);  // 限制 TPS 为 100
  }

  /**
   * 初始化 Consumer
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      let RocketMQConsumer;
      try {
        const rocketmqModule = await import('rocketmq-client');
        RocketMQConsumer = rocketmqModule.Consumer;
      } catch (err) {
        console.warn('⚠️  rocketmq-client 未安装，使用模拟模式');
        RocketMQConsumer = this.createMockConsumer();
      }

      this.consumer = new RocketMQConsumer({
        nameServer: config.nameServer,
        groupName: config.consumerGroup,
        consumeThreadNums: config.consumeThreadNums
      });

      this.consumer.subscribe(config.topic, '*', async (msg) => {
        return await this.handleMessage(msg);
      });

      await this.consumer.start();
      this.initialized = true;
      console.log('✅ Comment Consumer 已启动');
    } catch (error) {
      console.error('❌ Comment Consumer 启动失败:', error);
    }
  }

  /**
   * 创建模拟 Consumer
   */
  createMockConsumer() {
    return class MockConsumer {
      constructor() {}
      async start() {
        console.log('📭 模拟模式：Comment Consumer 已启动');
      }
      async shutdown() {
        console.log('📭 模拟模式：Comment Consumer 已关闭');
      }
      // eslint-disable-next-line no-unused-vars
      subscribe(topic, tag, _handler) {
        console.log(`📭 模拟模式：订阅 Topic=${topic}, Tag=${tag}`);
      }
    };
  }

  /**
   * 消息处理逻辑
   */
  async handleMessage(msg) {
    // TPS 限流：等待令牌
    await this.rateLimiter.waitForToken();

    const msgId = msg.msgId;
    const body = JSON.parse(msg.body);
    const { module, operation, shardKey, timestamp, payload } = body;

    if (module !== MessageModule.COMMENT) {
      console.log(`⚠️  忽略非 comment 模块消息: ${module}`);
      return;
    }

    const dedupKey = `${shardKey}-${timestamp}`;
    if (processedMessages.has(dedupKey)) {
      console.log(`🔄 消息已处理，跳过: ${dedupKey}`);
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
      return;
    } catch (error) {
      logger.error(`❌ 消息处理失败: ${module}:${operation}`, error);

      failedMessages.push({
        msgId,
        module,
        operation,
        shardKey,
        payload,
        error: error.message,
        timestamp: Date.now()
      });

      if (failedMessages.length > 1000) {
        failedMessages.shift();
      }

      throw error;
    }
  }

  /**
   * 处理创建评论
   * 写数据库 + 增加评论数缓存 + 发送通知
   */
  async handleCreate(payload) {
    const { userId, storyId, content } = payload;

    // 创建评论
    const comment = await Comment.create({
      userId,
      storyId,
      content
    });

    // 增加评论数缓存
    await commentCacheUtil.incrementCommentCount(storyId);

    // 发送评论通知
    const { Story } = await import('../modules/story/story.model.js');
    const story = await Story.findByPk(storyId);
    if (story && story.userId !== userId) {
      NotificationService.createNotification('comment', story.userId, userId, storyId, content).catch(err => {
        console.error('❌ 发送评论通知失败:', err);
      });
    }

    console.log(`✅ 创建评论成功: commentId=${comment.id}, storyId=${storyId}`);
  }

  /**
   * 处理删除评论
   * 写数据库 + 减少评论数缓存
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

    // 软删除
    await comment.update({ status: 'deleted' });

    // 减少评论数缓存
    await commentCacheUtil.decrementCommentCount(comment.storyId);

    console.log(`✅ 删除评论成功: commentId=${commentId}, storyId=${comment.storyId}`);
  }

  /**
   * 获取失败消息列表
   */
  getFailedMessages() {
    return failedMessages;
  }

  /**
   * 关闭 Consumer
   */
  async shutdown() {
    if (this.consumer && this.initialized) {
      await this.consumer.shutdown();
      this.initialized = false;
      console.log('✅ Comment Consumer 已关闭');
    }
    // 关闭限流器
    this.rateLimiter.shutdown();
  }
}

export const commentConsumer = new CommentConsumer();
export default commentConsumer;
