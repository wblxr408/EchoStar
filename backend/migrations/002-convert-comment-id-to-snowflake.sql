-- 评论表 id 字段迁移到雪花ID（BIGINT）
-- 将 comments 表的 id 字段从 INTEGER 改为 BIGINT

-- 注意：执行前请备份数据库！

-- 修改 comments 表 id 字段为 BIGINT
ALTER TABLE comments ALTER COLUMN id TYPE BIGINT USING id::BIGINT;

-- 迁移完成
-- 执行此脚本后，所有新创建的评论将使用雪花ID
-- 现有的评论ID保持不变（因为 INTEGER 可以无损转换为 BIGINT）
