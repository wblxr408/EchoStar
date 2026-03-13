import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { corsMiddleware } from './common/middleware/cors.js';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler.js';
import { generalLimiter } from './common/middleware/rate-limit.js';
import logger from './common/utils/logger.js';

// 导入路由
import authRoutes from './routes/auth.routes.js';
import storyRoutes from './routes/story.routes.js';
import mapRoutes from './routes/map.routes.js';
import adminRoutes from './routes/admin.routes.js';

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

  // API 路由
  app.use('/api/auth', authRoutes);
  app.use('/api/stories', storyRoutes);
  app.use('/api/map', mapRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 处理
  app.use(notFoundHandler);

  // 错误处理
  app.use(errorHandler);

  return app;
}
