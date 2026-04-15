import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { corsMiddleware } from './common/middleware/cors.js';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler.js';
import { generalLimiter } from './common/middleware/rate-limit.js';
import logger from './common/utils/logger.js';
import cron from 'node-cron';

// 导入路由
import authRoutes from './routes/auth.routes.js';
import storyRoutes from './routes/story.routes.js';
import mapRoutes from './routes/map.routes.js';
import adminRoutes from './routes/admin.routes.js';
import commentRoutes from './routes/comment.routes.js';
import likeRoutes from './routes/like.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import vipRoutes from './routes/vip.routes.js';

// 导入定时任务
import { syncStoryViewCount } from './jobs/sync-story-view-count.js';
import { syncLikeToDatabase } from './jobs/sync-like-to-db.js';
import { syncFavoriteToDatabase } from './jobs/sync-favorite-to-db.js';
import { checkVipExpiry } from './jobs/check-vip-expiry.js';

// 导入 RocketMQ
import { rocketmqClient } from './common/utils/rocketmq.js';
import { storyConsumer } from './consumers/story.consumer.js';
import { commentConsumer } from './consumers/comment.consumer.js';

/**
 * 创建 Express 应用
 */
export function createApp() {
  const app = express();

  // 安全中间件
  app.use(helmet());

  // CORS
  app.use(corsMiddleware);

  // 请求体解析
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Gzip 压缩
  app.use(compression());

  // 通用限流
  app.use(generalLimiter);

  // 请求日志
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  });

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  // API 路由 (v1 版本)
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/stories', storyRoutes);
  app.use('/api/v1/map', mapRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/comments', commentRoutes);
  app.use('/api/v1/likes', likeRoutes);
  app.use('/api/v1/favorites', favoriteRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/announcements', announcementRoutes);
  app.use('/api/v1/vip', vipRoutes);

  // 兼容旧版 API 路由 (不带 v1 前缀)
  app.use('/api/auth', authRoutes);
  app.use('/api/stories', storyRoutes);
  app.use('/api/map', mapRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/likes', likeRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/vip', vipRoutes);

  // 404 处理
  app.use(notFoundHandler);

  // 错误处理
  app.use(errorHandler);

  // ======================
  // RocketMQ 初始化
  // ======================
  // 初始化 Producer 和 Consumer（异步启动，不阻塞应用）
  rocketmqClient.init().catch(err => {
    console.error('❌ RocketMQ 初始化失败:', err);
  });
  storyConsumer.init().catch(err => {
    console.error('❌ Story Consumer 初始化失败:', err);
  });
  commentConsumer.init().catch(err => {
    console.error('❌ Comment Consumer 初始化失败:', err);
  });

  // ======================
  // 定时任务（仅主 worker 执行，避免多进程重复）
  // ======================
  const isPrimaryWorker = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';

  if (isPrimaryWorker) {
    // 定时任务：每小时同步浏览量到数据库
    setInterval(() => {
      syncStoryViewCount().catch(err => {
        console.error('❌ 同步浏览量失败:', err);
      });
    }, 60 * 60 * 1000);  // 每小时执行一次

    // 定时任务：每5秒同步点赞数据到数据库
    setInterval(() => {
      syncLikeToDatabase().catch(err => {
        console.error('❌ 同步点赞数据失败:', err);
      });
    }, 5 * 1000);  // 每5秒执行一次

    // 定时任务：每5s同步收藏数据到数据库
    setInterval(() => {
      syncFavoriteToDatabase().catch(err => {
        console.error('❌ 同步收藏数据失败:', err);
      });
    }, 5 * 1000);

    // 定时任务：每天凌晨1点检查VIP过期
    cron.schedule('0 1 * * *', () => {
      console.log('🕐 开始执行VIP过期检查...');
      checkVipExpiry().catch(err => {
        console.error('❌ 检查VIP过期失败:', err);
      });
    }, {
      timezone: 'Asia/Shanghai'  // 设置时区
    });

    // 启动时执行一次（防止服务重启期间的数据丢失）
    syncStoryViewCount().catch(err => {
      console.error('❌ 启动时同步浏览量失败:', err);
    });
    syncLikeToDatabase().catch(err => {
      console.error('❌ 启动时同步点赞数据失败:', err);
    });
    syncFavoriteToDatabase().catch(err => {
      console.error('❌ 启动时同步收藏数据失败:', err);
    });
    checkVipExpiry().catch(err => {
      console.error('❌ 启动时检查VIP过期失败:', err);
    });
  }

  return app;
}
