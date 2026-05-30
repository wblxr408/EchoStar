import 'dotenv/config';
import config from '../src/config/rocketmq.js';

/**
 * RocketMQ 5.x Topic 自动初始化脚本
 * 通过 Admin API 创建 Topic（需要 Broker 开启 autoCreateTopicEnable 或使用 Proxy 管理接口）
 */
const TOPICS = [
  process.env.ROCKETMQ_STORY_TOPIC || 'story-operation',
  process.env.ROCKETMQ_COMMENT_TOPIC || 'comment-operation'
];

async function initTopic() {
  const { endpoints } = config;

  console.log('🔍 正在检查 RocketMQ Topic...');
  console.log(`   Endpoints: ${endpoints}`);
  console.log(`   Topics: ${TOPICS.join(', ')}`);

  try {
    const rocketmqModule = await import('rocketmq-client-nodejs');

    const testProducer = new rocketmqModule.Producer({
      endpoints
    });

    await testProducer.startup();
    console.log('✅ 已连接到 RocketMQ Broker');

    let allSuccess = true;
    for (const topic of TOPICS) {
      try {
        await testProducer.send({
          topic,
          tag: 'init:CHECK',
          body: Buffer.from(JSON.stringify({ __init: true, timestamp: Date.now() }))
        });
        console.log(`✅ Topic "${topic}" 已就绪（发送测试消息成功）`);
      } catch (sendErr) {
        if (sendErr.message?.includes('No topic route info')) {
          console.error(`❌ Topic "${topic}" 不存在，且 Broker 未开启自动创建`);
          console.error('   请手动创建 Topic，执行以下命令：');
          console.error(`   docker exec -it rmqbroker mqadmin topic create -c DefaultCluster -t ${topic}`);
          allSuccess = false;
        } else {
          console.log(`✅ Topic "${topic}" 路由信息正常（连接成功）`);
        }
      }
    }

    await testProducer.shutdown();

    if (!allSuccess) {
      console.error('');
      console.error('   或者在 Broker 配置中设置 autoCreateTopicEnable=true');
    }

    return allSuccess;
  } catch (error) {
    console.error('❌ RocketMQ 连接失败:', error.message);
    console.error('   请确认 RocketMQ 服务已启动，地址:', endpoints);
    return false;
  }
}

initTopic().then(success => {
  process.exit(success ? 0 : 1);
});
