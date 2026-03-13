import { createApp } from './app.js';
import config from './config/index.js';
import { testConnection, syncDatabase } from './config/database.js';
import { redisClient } from './common/utils/redis.js';
import logger from './common/utils/logger.js';

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 1. 测试数据库连接
    await testConnection();

    // 2. 连接 Redis
    redisClient.connect();

    // 3. 同步数据库模型（开发环境）
    if (config.server.env === 'development') {
      await syncDatabase(false);
    }

    // 4. 创建 Express 应用
    const app = createApp();

    // 5. 启动 HTTP 服务器
    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📍 Environment: ${config.server.env}`);
      console.log(`\n✅ Server is ready at http://localhost:${config.server.port}`);
    });

    // 6. 优雅关闭
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // 关闭数据库连接
        await redisClient.disconnect();
        logger.info('Redis disconnected');

        process.exit(0);
      });

      // 如果 10 秒后还没关闭，强制退出
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // 监听终止信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();
