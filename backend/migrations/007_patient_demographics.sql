-- Extended patient demographics and vitals tracking.
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS date_of_birth                  DATE,
  ADD COLUMN IF NOT EXISTS gender                         VARCHAR(50),
  ADD COLUMN IF NOT EXISTS phone                          VARCHAR(50),
  ADD COLUMN IF NOT EXISTS blood_type                     VARCHAR(10),
  ADD COLUMN IF NOT EXISTS allergies                      JSONB        NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS emergency_contact_name         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone        VARCHAR(50);

CREATE TABLE IF NOT EXISTS vitals (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id               UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  recorded_by              VARCHAR(255) NOT NULL DEFAULT '',
  blood_pressure_systolic  INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate               INTEGER,
  temperature              NUMERIC(4,1),
  oxygen_saturation        NUMERIC(4,1),
  weight                   NUMERIC(5,1),
  height                   NUMERIC(5,1),
  notes                    TEXT         NOT NULL DEFAULT ''
);
