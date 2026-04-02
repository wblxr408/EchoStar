-- Convert reports.target_id from INTEGER to BIGINT
-- Reason:
-- 1. story.id has already moved to snowflake BIGINT
-- 2. comment.id has also moved to BIGINT
-- 3. report target_id needs to support both story/comment snowflake IDs

BEGIN;

ALTER TABLE reports
  ALTER COLUMN target_id TYPE BIGINT
  USING target_id::BIGINT;

COMMIT;
