import { pool } from './db';

async function runPatientAuthMigration() {
  console.log('Adding email and pin columns to patients table...');

  await pool.query(`
    ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS pin   VARCHAR(255)
  `);

  console.log('Patient auth migration complete.');
  await pool.end();
}

runPatientAuthMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
