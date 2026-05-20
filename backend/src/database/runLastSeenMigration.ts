import { pool } from './db';

async function run() {
  console.log('Adding last_seen column to staff...');
  await pool.query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ`);
  console.log('Done.');
  await pool.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
