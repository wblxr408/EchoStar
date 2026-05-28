BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_bg JSONB;

COMMENT ON COLUMN users.profile_bg IS 'VIP profile background configuration';

COMMIT;
