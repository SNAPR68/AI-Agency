ALTER TABLE brand_users
ADD COLUMN IF NOT EXISTS job_title TEXT;

UPDATE brand_users
SET job_title = initcap(regexp_replace(role, '_', ' ', 'g'))
WHERE job_title IS NULL;
