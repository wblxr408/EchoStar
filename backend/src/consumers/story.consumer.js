import config from '../config/rocketmq.js';
import { redisClient, clearUpdatingMarker } from '../common/utils/redis.js';
import { MessageModule, StoryOperation } from '../common/utils/rocketmq.js';
import { Story } from '../modules/story/story.model.js';
import { likeCacheUtil } from '../common/utils/like-cache.util.js';
import { commentCacheUtil } from '../common/utils/comment-cache.util.js';
import logger from '../common/utils/logger.js';

/**
 * 消息去重集合（内存存储，重启后丢失）
 */
const processedMessages = new Set();
const DEDUP_TTL = 5 * 60 * 1000; // 5分钟去重窗口

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
 * 故事操作消费者
 * 使用 RocketMQ 5.x SimpleConsumer
 */
class StoryConsumer {
  constructor() {
    this.consumer = null;
    this.initialized = false;
    this.polling = false;
    this.shouldStop = false;
  }

  /**
   * 初始化 Consumer（带自动重试）
   */
  async init() {
    if (this.initialized) {
      return;
    }

    const maxRetries = 10;
    const retryDelay = 10000; // 10秒

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const rocketmqModule = await import('rocketmq-client-nodejs');
        const { SimpleConsumer } = rocketmqModule;

        const topic = process.env.ROCKETMQ_STORY_TOPIC || 'story-operation';

        this.consumer = new SimpleConsumer({
          consumerGroup: config.storyConsumerGroup,
          endpoints: config.endpoints,
          subscriptions: new Map([[topic, '*']])
        });

        await this.consumer.startup();
        this.initialized = true;
        console.log(`✅ RocketMQ Consumer 已启动 [topic: ${topic}]`);

        // 开始轮询消息
        this.startPolling();
        return;
      } catch (error) {
        const isTopicNotFound = error.message?.includes('No topic route info');
        if (isTopicNotFound && attempt < maxRetries) {
          console.warn(`⚠️  Topic 尚未就绪，${retryDelay / 1000}s 后重试 (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        console.error('❌ RocketMQ Consumer 启动失败:', error.message);
        logger.error('RocketMQ Consumer 启动失败', error);
        if (isTopicNotFound) {
          console.error(`   请确认 Topic "${process.env.ROCKETMQ_STORY_TOPIC || 'story-operation'}" 已创建`);
        }
        return;
      }
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
          logger.error('Consumer 轮询失败', error);
          // 短暂延迟后继续
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
      const tag = message.tag;  // RocketMQ 5.x 使用属性而非方法
      const body = message.body instanceof Buffer ? message.body.toString() : message.body;
      const { module, operation, shardKey, timestamp, payload } = JSON.parse(body);

      // 只处理 story 模块的消息
      if (module !== MessageModule.STORY) {
        await this.consumer.ack(message);
        return;
      }

      // 去重检查
      const dedupKey = `${shardKey}-${timestamp}`;
      if (processedMessages.has(dedupKey)) {
        logger.info(`🔄 消息已处理，跳过: ${dedupKey}`);
        await this.consumer.ack(message);
        return;
      }

      logger.info(`📨 处理消息: ${module}:${operation}`, { shardKey, msgId });

      try {
        switch (operation) {
          case StoryOperation.CREATE:
            await this.handleCreate(payload);
            break;
          case StoryOperation.DELETE:
            await this.handleDelete(payload);
            break;
          case StoryOperation.MODIFY:
            await this.handleModify(payload);
            break;
          case StoryOperation.UPDATE_VISIBILITY:
            await this.handleUpdateVisibility(payload);
            break;
          default:
            console.warn(`⚠️  未知操作类型: ${operation}`);
        }

        processedMessages.add(dedupKey);
        logger.info(`✅ 消息处理成功: ${module}:${operation}`, { shardKey });
        await this.consumer.ack(message);
      } catch (error) {
        logger.error(`❌ 消息处理失败: ${module}:${operation}`, error);
        // 不 ack，让消息重新消费
        throw error;
      }
    } catch (error) {
      logger.error('❌ 消息解析失败', error);
    }
  }

  /**
   * 处理创建故事
   */
  async handleCreate(payload) {
    const { storyId, userId, content, images, location, locationName, emotionTag, isTimeCapsule, unlockAt, visibility, visibilityStartTime, visibilityEndTime, fontFamily, fontEffect, lockKey } = payload;

    const redis = redisClient.getClient();

    try {
      await Story.create({
        id: storyId,
        userId,
        content,
        images: images || [],
        location: {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        },
        locationName,
        emotionTag,
        isTimeCapsule: isTimeCapsule || false,
        unlockAt: isTimeCapsule ? new Date(unlockAt) : null,
        visibility,
        visibilityStartTime: visibilityStartTime || null,
        visibilityEndTime: visibilityEndTime || null,
        fontFamily: fontFamily || null,
        fontEffect: fontEffect || null
      });

      console.log(`✅ 故事创建成功 [storyId: ${storyId}]`);
    } catch (dbError) {
      console.error(`❌ 故事创建失败 [storyId: ${storyId}]:`, dbError);

      // 主键冲突不抛异常
      if (dbError.name !== 'SequelizeUniqueConstraintError' && dbError.code !== '23505') {
        throw dbError;
      }
    } finally {
      // 释放锁（无论成功失败）
      await redis.del(lockKey);
      await clearUpdatingMarker(`story:raw:${storyId}`);
      console.log(`🔓 锁已释放 [lockKey: ${lockKey}]`);
    }
  }

  /**
   * 处理删除故事
   */
  async handleDelete(payload) {
    const { storyId } = payload;

    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error(`故事不存在: ${storyId}`);
    }

    await story.update({ visibility: 'deleted' });

    const redis = redisClient.getClient();
    await redis.del(`story:raw:${storyId}`);

    await likeCacheUtil.clearStoryCache(storyId);
    await commentCacheUtil.deleteCommentCache(storyId);
  }

  /**
   * 处理修改故事
   */
  async handleModify(payload) {
    const { storyId, content, emotionTag } = payload;

    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error(`故事不存在: ${storyId}`);
    }

    await story.update({ content, emotionTag });
    await clearUpdatingMarker(`story:raw:${storyId}`);
  }

  /**
   * 处理更新可见性
   */
  async handleUpdateVisibility(payload) {
    const { storyId, visibility } = payload;

    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error(`故事不存在: ${storyId}`);
    }

    await story.update({ visibility });
    await clearUpdatingMarker(`story:raw:${storyId}`);
  }

  /**
   * 关闭 Consumer
   */
  async shutdown() {
    this.shouldStop = true;
    this.stopPolling();

    // 等待轮询停止
    while (this.polling) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.consumer && this.initialized) {
      await this.consumer.shutdown();
      this.initialized = false;
      console.log('✅ RocketMQ Consumer 已关闭');
    }
  }
}

export const storyConsumer = new StoryConsumer();
export default storyConsumer;
