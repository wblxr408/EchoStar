import config from '../../config/rocketmq.js';
import logger from './logger.js';

/**
 * 消息模块枚举
 */
export const MessageModule = {
  STORY: 'story',
  COMMENT: 'comment',
  FAVORITE: 'favorite'
};

/**
 * 故事操作枚举
 */
export const StoryOperation = {
  CREATE: 'CREATE',
  DELETE: 'DELETE',
  MODIFY: 'MODIFY',
  UPDATE_VISIBILITY: 'UPDATE_VISIBILITY'
};

/**
 * 评论操作枚举
 */
export const CommentOperation = {
  CREATE: 'CREATE',
  DELETE: 'DELETE'
};

/**
 * 收藏操作枚举（预留）
 */
export const FavoriteOperation = {
  ADD: 'ADD',
  REMOVE: 'REMOVE'
};

/**
 * RocketMQ 5.x 客户端单例
 */
class RocketMQClient {
  constructor() {
    this.producer = null;
    this.initialized = false;
  }

  /**
   * 初始化 Producer
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      // 动态导入 rocketmq-client-nodejs
      const rocketmqModule = await import('rocketmq-client-nodejs');
      const { Producer } = rocketmqModule;

      this.producer = new Producer({
        endpoints: config.endpoints
      });

      await this.producer.startup();
      this.initialized = true;
      console.log('✅ RocketMQ Producer 已启动');
    } catch (error) {
      console.error('❌ RocketMQ Producer 启动失败:', error.message);
      logger.error('RocketMQ Producer 启动失败', error);
    }
  }

  /**
   * 发送消息（RocketMQ 5.x）
   * @param {string} module - 模块名称（MessageModule 枚举）
   * @param {string} operation - 操作类型
   * @param {Object} payload - 消息数据
   * @param {string|number} shardKey - 分区键（用于顺序消息）
   */
  async sendOrderly(module, operation, payload, shardKey) {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.initialized) {
      console.warn('⚠️  Producer 未初始化，消息未发送');
      return null;
    }

    try {
      const receipt = await this.producer.send({
        topic: config.topic,
        tag: `${module}:${operation}`,
        messageGroup: String(shardKey),  // 顺序消息的消息组
        body: Buffer.from(JSON.stringify({
          module,
          operation,
          shardKey: String(shardKey),
          payload,
          timestamp: Date.now()
        }))
      });

      logger.info(`✅ RocketMQ 消息发送成功: ${module}:${operation}`, { messageId: receipt.messageId });
      return receipt;
    } catch (error) {
      logger.error(`❌ RocketMQ 消息发送失败: ${module}:${operation}`, error);
      return null;
    }
  }

  /**
   * 关闭 Producer
   */
  async shutdown() {
    if (this.producer && this.initialized) {
      await this.producer.shutdown();
      this.initialized = false;
      console.log('✅ RocketMQ Producer 已关闭');
    }
  }
}

export const rocketmqClient = new RocketMQClient();
export default rocketmqClient;
