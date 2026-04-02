import config from '../config/rocketmq.js';
import { redisClient, clearUpdatingMarker } from '../common/utils/redis.js';
import { MessageModule, StoryOperation } from '../common/utils/rocketmq.js';
import { Story } from '../modules/story/story.model.js';
import { likeCacheUtil } from '../common/utils/like-cache.util.js';
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
        consumerGroup: config.storyConsumerGroup,
        endpoints: config.endpoints,
        subscriptions: new Map([[config.topic, '*']])
      });

      await this.consumer.startup();
      this.initialized = true;
      console.log('✅ RocketMQ Consumer 已启动');

      // 开始轮询消息
      this.startPolling();
    } catch (error) {
      console.error('❌ RocketMQ Consumer 启动失败:', error.message);
      logger.error('RocketMQ Consumer 启动失败', error);
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
      const tag = message.getTag();
      const body = message.getBody().toString();
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
      processedMessages.add(dedupKey);

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
    const { storyId, userId, content, images, location, locationName, emotionTag, isTimeCapsule, unlockAt, visibility, visibilityStartTime, visibilityEndTime } = payload;

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
      visibilityEndTime: visibilityEndTime || null
    });

    await clearUpdatingMarker(`story:raw:${storyId}`);
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
