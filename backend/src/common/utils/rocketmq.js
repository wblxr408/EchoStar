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
 * RocketMQ 客户端单例
 * 支持顺序消息发送
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
      // 动态导入 rocketmq-client（如果未安装则降级为模拟实现）
      let RocketMQProducer;
      try {
        const rocketmqModule = await import('rocketmq-client');
        RocketMQProducer = rocketmqModule.Producer;
      } catch (err) {
        console.warn('⚠️  rocketmq-client 未安装，使用模拟模式');
        RocketMQProducer = this.createMockProducer();
      }

      this.producer = new RocketMQProducer({
        nameServer: config.nameServer,
        groupName: config.producerGroup
      });

      await this.producer.start();
      this.initialized = true;
      console.log('✅ RocketMQ Producer 已启动');
    } catch (error) {
      console.error('❌ RocketMQ Producer 启动失败:', error);
      // 不抛出异常，允许应用继续运行
    }
  }

  /**
   * 创建模拟 Producer（用于开发环境或未安装 rocketmq-client 时）
   */
  createMockProducer() {
    return class MockProducer {
      constructor() {}
      async start() {
        console.log('📭 模拟模式：消息将被丢弃，不会实际发送');
      }
      async shutdown() {
        console.log('📭 模拟模式：Producer 已关闭');
      }
      async send(opts) {
        console.log(`📭 模拟发送: Topic=${opts.topic}, Tag=${opts.tags}, Module=${opts.body?.module}, Operation=${opts.body?.operation}`);
        return { msgId: 'mock-' + Date.now() };
      }
    };
  }

  /**
   * 发送顺序消息（通用方法）
   * @param {string} module - 模块名称（MessageModule 枚举）
   * @param {string} operation - 操作类型
   * @param {Object} payload - 消息数据
   * @param {string|number} shardKey - 分区键（保证同一资源的顺序）
   */
  async sendOrderly(module, operation, payload, shardKey) {
    if (!this.initialized) {
      await this.init();
    }

    const message = {
      topic: config.topic,
      tags: `${module}:${operation}`,
      keys: String(shardKey),
      body: JSON.stringify({
        module,
        operation,
        shardKey: String(shardKey),
        payload,
        timestamp: Date.now()
      })
    };

    try {
      const result = await this.producer.send(message);
      logger.info(`✅ RocketMQ 消息发送成功: ${module}:${operation}`, { msgId: result.msgId });
      return result;
    } catch (error) {
      logger.error(`❌ RocketMQ 消息发送失败: ${module}:${operation}`, error);
      // 不抛出异常，避免影响主流程
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
