import { pool } from './db';

async function runUpdatedAtMigration() {
  console.log('Adding "updatedAt" column to patients...');

  await pool.query(`
    ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW()
  `);

  console.log('updatedAt migration complete.');
  await pool.end();
}

runUpdatedAtMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
