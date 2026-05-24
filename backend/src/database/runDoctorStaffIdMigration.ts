import { pool } from './db';

async function runDoctorStaffIdMigration() {
  console.log('Adding staff_id FK to doctors table...');

  await pool.query(`
    ALTER TABLE doctors
      ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL
  `);

  console.log('Doctor staff_id migration complete.');
  await pool.end();
}

runDoctorStaffIdMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
