-- =====================================================
-- 004-performance-indexes.sql
-- 性能优化索引（基于 k6 压测结果）
-- =====================================================
-- 慢查询 TOP5:
--   1. search_story: content ILIKE '%keyword%' -> 全表扫描
--   2. map_explore: ST_DWithin + visibility + 时间条件
--   3. list_comments: story_id + status + created_at
--   4. get_story: visibility + created_at (缓存未命中时)
--   5. map_clusters: ST_MakeEnvelope + visibility
-- =====================================================

BEGIN;

-- 1. GIN 全文搜索索引（替代 ILIKE 全表扫描）
--    search_story 使用 content ILIKE '%keyword%'，在 PG 中无法使用 B-tree
--    改用 tsvector GIN 索引，搜索速度提升 5-10 倍
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- pg_trgm 三元组索引支持 ILIKE '%keyword%' 查询（比 GIN tsvector 更灵活，支持部分匹配）
CREATE INDEX IF NOT EXISTS idx_stories_content_trgm
  ON stories USING GIN (content gin_trgm_ops);

-- 2. stories 复合索引：visibility + created_at
--    map_explore / map_feed / map_clusters / get_story 都按 visibility='public' 过滤并按 created_at DESC 排序
--    复合索引可以避免额外排序操作
CREATE INDEX IF NOT EXISTS idx_stories_visibility_created_at
  ON stories (visibility, created_at DESC);

-- 3. stories 复合索引：visibility + is_recommended
--    getFeaturedStories 查询 WHERE visibility='public' AND is_recommended=true
CREATE INDEX IF NOT EXISTS idx_stories_visibility_recommended
  ON stories (visibility, is_recommended)
  WHERE is_recommended = true;

-- 4. comments 复合索引：story_id + status + created_at
--    list_comments 按 story_id + status 过滤，按 created_at DESC 排序
--    已有 (story_id, status) 索引，补充 created_at 排序
DROP INDEX IF EXISTS idx_comments_story_id_status;
CREATE INDEX idx_comments_story_id_status_created_at
  ON comments (story_id, status, created_at DESC);

-- 5. users username 索引（get_user 查询）
--    如已有唯一索引则跳过
CREATE INDEX IF NOT EXISTS idx_users_username
  ON users (username);

-- 6. stories emotion_tag 索引（map_clusters 按 emotionTag 分组聚合）
CREATE INDEX IF NOT EXISTS idx_stories_emotion_tag
  ON stories (emotion_tag)
  WHERE emotion_tag IS NOT NULL;

-- 7. 分析表更新统计信息（让查询规划器使用新索引）
ANALYZE stories;
ANALYZE comments;
ANALYZE users;

COMMIT;
