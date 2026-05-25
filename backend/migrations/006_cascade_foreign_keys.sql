-- Replace any bare FK constraints with ON DELETE CASCADE so child rows are
-- automatically removed when a patient or doctor is deleted.

-- Remove orphaned child rows first (no-op if the DB is already consistent).
DELETE FROM medical_images
WHERE NOT EXISTS (
  SELECT 1 FROM patients WHERE patients.id::text = medical_images.patient_id::text
);
DELETE FROM tasks
WHERE NOT EXISTS (
  SELECT 1 FROM patients WHERE patients.id::text = tasks.patient_id::text
);
DELETE FROM appointments
WHERE NOT EXISTS (
  SELECT 1 FROM patients WHERE patients.id::text = appointments.patient_id::text
);

-- Drop then re-add with CASCADE (DROP IF EXISTS makes this idempotent).
ALTER TABLE medical_images DROP CONSTRAINT IF EXISTS medical_images_patient_id_fkey;
ALTER TABLE tasks          DROP CONSTRAINT IF EXISTS tasks_patient_id_fkey;
ALTER TABLE appointments   DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE appointments   DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

ALTER TABLE medical_images
  ADD CONSTRAINT medical_images_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;
