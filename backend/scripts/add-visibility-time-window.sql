-- 时段限定可见功能：为 stories 表添加可见时间窗口字段
-- 执行: psql -d <database_name> -f add-visibility-time-window.sql

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS visibility_start_time VARCHAR(5) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS visibility_end_time VARCHAR(5) DEFAULT NULL;

COMMENT ON COLUMN stories.visibility_start_time IS '时段限定可见：开始时间 HH:mm，null 表示无限制';
COMMENT ON COLUMN stories.visibility_end_time IS '时段限定可见：结束时间 HH:mm，null 表示无限制';
