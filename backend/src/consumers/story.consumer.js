import config from '../config/rocketmq.js';
import { redisClient, clearUpdatingMarker } from '../common/utils/redis.js';
import { MessageModule, StoryOperation } from '../common/utils/rocketmq.js';
import { Story } from '../modules/story/story.model.js';
import { likeCacheUtil } from '../common/utils/like-cache.util.js';
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
      // 等待下一个周期（最多等待 100ms 避免死锁）
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
 * 消息处理失败记录（内存存储，可升级为 Redis 或数据库）
 */
const failedMessages = [];

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
}, 60 * 1000); // 每分钟清理一次

/**
 * 故事操作消费者
 * 顺序消费，执行数据库写操作 + 清除缓存
 */
class StoryConsumer {
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
      // 动态导入 rocketmq-client
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

      // 订阅 Topic，顺序消费
      this.consumer.subscribe(config.topic, '*', async (msg) => {
        return await this.handleMessage(msg);
      });

      await this.consumer.start();
      this.initialized = true;
      console.log('✅ RocketMQ Consumer 已启动');
    } catch (error) {
      console.error('❌ RocketMQ Consumer 启动失败:', error);
    }
  }

  /**
   * 创建模拟 Consumer
   */
  createMockConsumer() {
    return class MockConsumer {
      constructor() {}
      async start() {
        console.log('📭 模拟模式：Consumer 已启动（不会实际消费消息）');
      }
      async shutdown() {
        console.log('📭 模拟模式：Consumer 已关闭');
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

    // 只处理 story 模块的消息
    if (module !== MessageModule.STORY) {
      console.log(`⚠️  忽略非 story 模块消息: ${module}`);
      return;
    }

    // 去重检查
    const dedupKey = `${shardKey}-${timestamp}`;
    if (processedMessages.has(dedupKey)) {
      console.log(`🔄 消息已处理，跳过: ${dedupKey}`);
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
      return;
    } catch (error) {
      logger.error(`❌ 消息处理失败: ${module}:${operation}`, error);

      // 记录失败消息
      failedMessages.push({
        msgId,
        module,
        operation,
        shardKey,
        payload,
        error: error.message,
        timestamp: Date.now()
      });

      // 最多保留 1000 条失败记录
      if (failedMessages.length > 1000) {
        failedMessages.shift();
      }

      // 抛出异常会触发重试
      throw error;
    }
  }

  /**
   * 处理创建故事
   * 写数据库 + 清除缓存
   */
  async handleCreate(payload) {
    const { storyId, userId, content, images, location, locationName, emotionTag, isTimeCapsule, unlockAt, visibility, visibilityStartTime, visibilityEndTime } = payload;

    // 创建故事（使用预先生成的雪花ID）
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

    // 清除更新中标记（或删除整个缓存 key）
    await clearUpdatingMarker(`story:raw:${storyId}`);
  }

  /**
   * 处理删除故事
   * 写数据库 + 清除缓存 + 清理点赞缓存
   */
  async handleDelete(payload) {
    const { storyId } = payload;

    // 更新故事可见性
    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error(`故事不存在: ${storyId}`);
    }

    await story.update({ visibility: 'deleted' });

    // 清除故事缓存
    const redis = redisClient.getClient();
    await redis.del(`story:raw:${storyId}`);

    // 清理点赞缓存
    await likeCacheUtil.clearStoryCache(storyId);
  }

  /**
   * 处理修改故事
   * 写数据库 + 清除缓存
   */
  async handleModify(payload) {
    const { storyId, content, emotionTag } = payload;

    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error(`故事不存在: ${storyId}`);
    }

    await story.update({ content, emotionTag });

    // 清除更新中标记（或删除整个缓存 key）
    await clearUpdatingMarker(`story:raw:${storyId}`);
  }

  /**
   * 处理更新可见性
   * 写数据库 + 清除缓存
   */
  async handleUpdateVisibility(payload) {
    const { storyId, visibility } = payload;

    const story = await Story.findByPk(storyId);
    if (!story) {
      throw new Error(`故事不存在: ${storyId}`);
    }

    await story.update({ visibility });

    // 清除更新中标记（或删除整个缓存 key）
    await clearUpdatingMarker(`story:raw:${storyId}`);
  }

  /**
   * 获取失败消息列表（用于监控）
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
      console.log('✅ RocketMQ Consumer 已关闭');
    }
    // 关闭限流器
    this.rateLimiter.shutdown();
  }
}

export const storyConsumer = new StoryConsumer();
export default storyConsumer;
