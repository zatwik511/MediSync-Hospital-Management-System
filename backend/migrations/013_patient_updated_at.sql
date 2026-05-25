-- Timestamp for optimistic concurrency and change tracking on patient records.
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
