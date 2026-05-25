-- Add staff_code and pin columns used for PIN-based staff authentication.
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS staff_code VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS pin        VARCHAR(255);
