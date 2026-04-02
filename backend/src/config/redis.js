import 'dotenv/config';
import Redis from 'ioredis';

/**
 * Redis 客户端配置
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true
};

// 创建 Redis 客户端实例
const redisClient = new Redis(redisConfig);

// 监听连接事件
redisClient.on('connect', () => {
  console.log('[Redis] 连接成功');
});

redisClient.on('error', (err) => {
  console.error('[Redis] 连接错误:', err);
});

redisClient.on('close', () => {
  console.log('[Redis] 连接关闭');
});

export default redisClient;
