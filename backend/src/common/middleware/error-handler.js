import logger from '../utils/logger.js';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // 默认错误响应
  const response = {
    code: err.statusCode || 500,
    message: err.message || '服务器内部错误'
  };

  // 开发环境返回堆栈信息
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(response.code).json(response);
};

/**
 * 404 处理中间件
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  });
};

/**
 * 异步路由错误捕获包装器
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
