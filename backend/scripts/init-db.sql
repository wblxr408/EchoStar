-- ============================================
-- EchoStar 数据库初始化脚本
-- ============================================
-- 用途: 创建数据库和用户
-- 使用方法: 在 PostgreSQL 中执行此脚本
-- ============================================

-- 1. 创建数据库（如果不存在）
CREATE DATABASE echostar;

-- 2. 创建专用用户（如果不存在）
-- 注意: 请将 'your_secure_password' 替换为实际密码
CREATE USER echostar_user WITH PASSWORD 'your_secure_password';

-- 3. 授予权限
-- 连接到 echostar 数据库
\c echostar;

-- 授予 echostar_user 对所有表、序列和函数的权限
GRANT ALL PRIVILEGES ON DATABASE echostar TO echostar_user;
GRANT ALL ON SCHEMA public TO echostar_user;

-- 以下权限将在表创建后自动应用
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO echostar_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO echostar_user;

-- 4. 创建扩展（可选，用于地理位置计算）
-- 启用 PostGIS 扩展（如果已安装）
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 验证
-- ============================================
-- 查看数据库列表
\l

-- 查看用户列表
\du

-- 查看扩展列表
\dx

-- ============================================
-- 注意事项
-- ============================================
-- 1. 此脚本需要以 postgres 超级用户身份执行
-- 2. 请确保将 'your_secure_password' 替换为实际密码
-- 3. 记住此密码，需要在 .env 文件中配置
-- 4. PostGIS 是可选的，如果不需要地理位置功能可以跳过
-- ============================================
