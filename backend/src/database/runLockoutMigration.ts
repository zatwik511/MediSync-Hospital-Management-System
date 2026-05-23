import { pool } from './db';

async function runLockoutMigration() {
  console.log('Adding failed_pin_attempts and locked_until columns...');

  await pool.query(`
    ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE staff
      ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ
  `);

  console.log('Lockout migration complete.');
  await pool.end();
}

runLockoutMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
