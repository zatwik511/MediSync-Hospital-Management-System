import { pool } from './db';

async function runAvailabilityMigration() {
  console.log('Creating doctor_availability table...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS doctor_availability (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      start_time  VARCHAR(5) NOT NULL,
      end_time    VARCHAR(5) NOT NULL,
      UNIQUE (doctor_id, day_of_week)
    );

    CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id
      ON doctor_availability (doctor_id);
  `);

  console.log('doctor_availability migration complete.');
  await pool.end();
}

runAvailabilityMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
