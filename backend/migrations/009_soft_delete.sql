-- Soft-delete support: rows with deleted_at set are treated as removed.
ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE doctors  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients (deleted_at);
CREATE INDEX IF NOT EXISTS idx_doctors_deleted_at  ON doctors  (deleted_at);
