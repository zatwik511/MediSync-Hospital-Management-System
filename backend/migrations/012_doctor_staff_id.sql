-- Link doctors to their staff record so a doctor login also carries staff metadata.
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
