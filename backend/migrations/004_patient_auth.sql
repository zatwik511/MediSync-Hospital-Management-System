-- Email and PIN columns for patient portal self-service login.
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS pin   VARCHAR(255);
