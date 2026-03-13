import { Sequelize } from 'sequelize';
import config from './index.js';
import logger from '../common/utils/logger.js';

/**
 * Sequelize 实例
 */
export const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: config.database.logging ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // PostGIS 支持
    dialectOptions: {
      // 如果需要 SSL
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false
      // }
    }
  }
);

/**
 * 测试数据库连接
 */
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    process.exit(1);
  }
}

/**
 * 同步数据库模型
 */
export async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Database synchronized${force ? ' (force mode)' : ''}`);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    throw error;
  }
}
