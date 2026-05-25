-- Track when a staff member last authenticated.
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
