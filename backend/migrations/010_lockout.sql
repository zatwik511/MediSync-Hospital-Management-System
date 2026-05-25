-- Brute-force protection: track failed PIN attempts and temporary lockouts.
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until        TIMESTAMPTZ;

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until        TIMESTAMPTZ;
