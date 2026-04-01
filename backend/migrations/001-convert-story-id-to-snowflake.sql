-- 雪花ID迁移脚本
-- 将 stories 表和相关关联表的 id/story_id 字段从 INTEGER 改为 BIGINT

-- 注意：执行前请备份数据库！
-- 注意：由于数据迁移涉及外键，需要按特定顺序执行

-- 1. 删除相关表的外键约束
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_story_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_story_id_fkey;
ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_story_id_fkey;
ALTER TABLE time_capsules DROP CONSTRAINT IF EXISTS time_capsules_story_id_fkey;
ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_story_id_fkey;

-- 2. 修改 stories 表 id 字段为 BIGINT
ALTER TABLE stories ALTER COLUMN id TYPE BIGINT USING id::BIGINT;

-- 3. 修改各关联表的 story_id 字段为 BIGINT
ALTER TABLE likes ALTER COLUMN story_id TYPE BIGINT USING story_id::BIGINT;
ALTER TABLE comments ALTER COLUMN story_id TYPE BIGINT USING story_id::BIGINT;
ALTER TABLE favorites ALTER COLUMN story_id TYPE BIGINT USING story_id::BIGINT;
ALTER TABLE time_capsules ALTER COLUMN story_id TYPE BIGINT USING story_id::BIGINT;
ALTER TABLE admin_actions ALTER COLUMN story_id TYPE BIGINT USING story_id::BIGINT;

-- 4. 重建外键约束
ALTER TABLE likes ADD CONSTRAINT likes_story_id_fkey
  FOREIGN KEY (story_id) REFERENCES stories(id) ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE comments ADD CONSTRAINT comments_story_id_fkey
  FOREIGN KEY (story_id) REFERENCES stories(id) ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE favorites ADD CONSTRAINT favorites_story_id_fkey
  FOREIGN KEY (story_id) REFERENCES stories(id) ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE time_capsules ADD CONSTRAINT time_capsules_story_id_fkey
  FOREIGN KEY (story_id) REFERENCES stories(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE admin_actions ADD CONSTRAINT admin_actions_story_id_fkey
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;

-- 迁移完成
-- 执行此脚本后，所有新创建的故事将使用雪花ID
-- 现有的故事ID保持不变（因为 INTEGER 可以无损转换为 BIGINT）
