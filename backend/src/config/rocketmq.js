import 'dotenv/config';

/**
 * RocketMQ 5.x 配置
 */
export default {
  // Proxy 地址（RocketMQ 5.x 通过 Proxy 连接）
  endpoints: process.env.ROCKETMQ_ENDPOINTS || '127.0.0.1:8081',

  // Producer 组名
  producerGroup: process.env.ROCKETMQ_PRODUCER_GROUP || 'echostar-story-producer',

  // Consumer 组名
  storyConsumerGroup: process.env.ROCKETMQ_STORY_CONSUMER_GROUP || 'echostar-story-consumer',
  commentConsumerGroup: process.env.ROCKETMQ_COMMENT_CONSUMER_GROUP || 'echostar-comment-consumer',

  // Topic
  topic: process.env.ROCKETMQ_TOPIC || 'story-operation',

  // 消息超时时间（毫秒）
  timeout: parseInt(process.env.ROCKETMQ_TIMEOUT) || 3000,

  // 每次拉取消息数量（新版使用）
  maxMessagesPerPoll: parseInt(process.env.ROCKETMQ_MAX_MESSAGES_PER_POLL) || 32,

  // 消费等待时间（毫秒，最少 10000）
  awaitDuration: parseInt(process.env.ROCKETMQ_AWAIT_DURATION) || 30000
};
