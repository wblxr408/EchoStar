import cors from 'cors';

/**
 * CORS 配置
 */
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的来源列表
    const allowedOrigins = [
      'http://localhost:5173', // Vite 开发服务器
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // 允许无来源请求（如 Postman）
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // 允许携带凭证
  optionsSuccessStatus: 200
};

export const corsMiddleware = cors(corsOptions);
