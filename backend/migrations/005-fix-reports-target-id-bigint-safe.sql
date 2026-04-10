-- =====================================================
-- 005-fix-reports-target-id-bigint-safe.sql
-- 作用：
-- 1. 修复 reports.target_id 仍为 INTEGER 的旧库
-- 2. 兼容已完成迁移的库，可重复执行
-- =====================================================

BEGIN;

DO $$
DECLARE
  current_type text;
BEGIN
  SELECT data_type
    INTO current_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'reports'
    AND column_name = 'target_id';

  IF current_type IS NULL THEN
    RAISE EXCEPTION 'Column public.reports.target_id does not exist';
  END IF;

  IF current_type = 'integer' THEN
    ALTER TABLE public.reports
      ALTER COLUMN target_id TYPE BIGINT
      USING target_id::BIGINT;

    RAISE NOTICE 'reports.target_id converted from INTEGER to BIGINT';
  ELSIF current_type = 'bigint' THEN
    RAISE NOTICE 'reports.target_id is already BIGINT, skipping';
  ELSE
    RAISE EXCEPTION 'Unexpected type for public.reports.target_id: %', current_type;
  END IF;
END $$;

COMMIT;
