-- ============================================
-- 用户名和故事内容模糊搜索功能 - 数据库迁移SQL
-- ============================================
-- 说明：创建pg_trgm扩展和GIN索引以支持高效的模糊搜索

-- 1. 创建pg_trgm扩展（PostgreSQL模糊搜索扩展）
-- pg_trgm提供三元组相似度计算和基于GIN索引的模糊搜索功能
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 2. 用户名搜索索引
-- ============================================
-- 为username字段创建GIN索引（高效模糊搜索）
-- gin_trgm_ops是pg_trgm提供的操作符类，用于支持LIKE操作符
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin (username gin_trgm_ops);
COMMENT ON INDEX idx_users_username_trgm IS 'GIN索引用于用户名模糊搜索（配合pg_trgm扩展）';

-- ============================================
-- 3. 故事内容搜索索引
-- ============================================
-- 为stories表的content字段创建GIN索引
-- 注意：content是TEXT类型，pg_trgm也支持TEXT类型
CREATE INDEX IF NOT EXISTS idx_stories_content_trgm ON stories USING gin (content gin_trgm_ops);
COMMENT ON INDEX idx_stories_content_trgm IS 'GIN索引用于故事内容模糊搜索（配合pg_trgm扩展）';

-- ============================================
-- 验证索引是否创建成功
-- ============================================
-- 可以使用以下查询验证索引：
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('users', 'stories') AND indexname LIKE '%_trgm';

-- ============================================
-- 性能测试
-- ============================================
-- 执行前后可以对比EXPLAIN ANALYZE结果：

-- 用户名搜索测试
-- EXPLAIN ANALYZE SELECT * FROM users WHERE username ILIKE '%test%';

-- 故事内容搜索测试
-- EXPLAIN ANALYZE SELECT * FROM stories WHERE content ILIKE '%关键词%';

-- ============================================
-- 注意事项
-- ============================================
-- 1. pg_trgm扩展需要数据库超级用户权限
-- 2. GIN索引会增加写入开销和存储空间（约占原表大小的20-30%）
-- 3. 对于已有大量数据的表，索引创建可能需要较长时间
-- 4. 搜索关键词长度过短时（1个字符），索引效果不佳
-- 5. TEXT字段的GIN索引比VARCHAR占用更多空间，但搜索更灵活
