process.env.TZ = 'Asia/Shanghai';

import { createApp } from './app.js';
import config from './config/index.js';
import { testConnection, syncDatabase } from './config/database.js';
import { redisClient } from './common/utils/redis.js';
import logger from './common/utils/logger.js';
import { rocketmqClient } from './common/utils/rocketmq.js';
import { storyConsumer } from './consumers/story.consumer.js';
import { commentConsumer } from './consumers/comment.consumer.js';

async function startServer() {
  try {
    await testConnection();

    redisClient.connect();

    if (config.server.env === 'development') {
      await syncDatabase(false);
    }

    const app = createApp();

    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📍 Environment: ${config.server.env}`);
      console.log(`\n✅ Server is ready at http://localhost:${config.server.port}`);
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');

        await redisClient.disconnect();
        logger.info('Redis disconnected');

        await rocketmqClient.shutdown();
        await storyConsumer.shutdown();
        await commentConsumer.shutdown();
        logger.info('RocketMQ disconnected');

        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
