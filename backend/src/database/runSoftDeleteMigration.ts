import { pool } from './db';

async function runSoftDeleteMigration() {
  console.log('Adding deleted_at column to patients and doctors...');

  await pool.query(`
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    ALTER TABLE doctors  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

    CREATE INDEX IF NOT EXISTS idx_patients_deleted_at ON patients (deleted_at);
    CREATE INDEX IF NOT EXISTS idx_doctors_deleted_at  ON doctors  (deleted_at);
  `);

  console.log('Soft-delete migration complete.');
  await pool.end();
}

runSoftDeleteMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
