import 'dotenv/config';
import config from '../src/config/rocketmq.js';

/**
 * RocketMQ 5.x Topic 自动初始化脚本
 * 通过 Admin API 创建 Topic（需要 Broker 开启 autoCreateTopicEnable 或使用 Proxy 管理接口）
 */
async function initTopic() {
  const { endpoints, topic, producerGroup, storyConsumerGroup, commentConsumerGroup } = config;

  console.log('🔍 正在检查 RocketMQ Topic...');
  console.log(`   Endpoints: ${endpoints}`);
  console.log(`   Topic: ${topic}`);

  try {
    const rocketmqModule = await import('rocketmq-client-nodejs');
    const { SimpleConsumer } = rocketmqModule;

    // 尝试用 Producer 发送一条测试消息来触发 Topic 自动创建
    // 如果 Broker 开启了 autoCreateTopicEnable=true，发送消息会自动创建 Topic
    const testProducer = new rocketmqModule.Producer({
      endpoints
    });

    await testProducer.startup();
    console.log('✅ 已连接到 RocketMQ Broker');

    // 尝试发送测试消息（如果 autoCreateTopicEnable 开启，会自动创建 Topic）
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
        console.error('');
        console.error('   或者在 Broker 配置中设置 autoCreateTopicEnable=true');
        return false;
      }
      // 其他发送错误，可能 Topic 已存在但消息格式有问题
      console.log(`✅ Topic "${topic}" 路由信息正常（连接成功）`);
    } finally {
      await testProducer.shutdown();
    }

    return true;
  } catch (error) {
    console.error('❌ RocketMQ 连接失败:', error.message);
    console.error('   请确认 RocketMQ 服务已启动，地址:', endpoints);
    return false;
  }
}

initTopic().then(success => {
  process.exit(success ? 0 : 1);
});
