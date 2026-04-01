import 'dotenv/config';

/**
 * RocketMQ 配置
 */
export default {
  // NameServer 地址，多个用分号分隔
  nameServer: process.env.ROCKETMQ_NAME_SERVER || 'localhost:9876',

  // Producer 组名
  producerGroup: process.env.ROCKETMQ_PRODUCER_GROUP || 'echostar-story-producer',

  // Consumer 组名
  consumerGroup: process.env.ROCKETMQ_CONSUMER_GROUP || 'echostar-story-consumer',

  // Topic
  topic: process.env.ROCKETMQ_TOPIC || 'story-operation',

  // 消息超时时间（毫秒）
  timeout: parseInt(process.env.ROCKETMQ_TIMEOUT) || 3000,

  // 重试次数
  retryTimes: parseInt(process.env.ROCKETMQ_RETRY_TIMES) || 3,

  // 消费线程数
  consumeThreadNums: parseInt(process.env.ROCKETMQ_CONSUME_THREAD_NUMS) || 4,

  // 每次拉取消息数量
  pullBatchSize: parseInt(process.env.ROCKETMQ_PULL_BATCH_SIZE) || 32
};
