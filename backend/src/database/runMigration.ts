import { pool } from './db';
import bcrypt from 'bcryptjs';

async function runMigration() {
  console.log('Adding staff_code and pin columns...');

  await pool.query(`
    ALTER TABLE staff
      ADD COLUMN IF NOT EXISTS staff_code VARCHAR(20) UNIQUE,
      ADD COLUMN IF NOT EXISTS pin VARCHAR(255)
  `);

  // Assign codes to existing staff that don't have one yet
  await pool.query(`
    WITH ranked AS (
      SELECT id, role,
        ROW_NUMBER() OVER (PARTITION BY role ORDER BY created_at) AS rn
      FROM staff
      WHERE staff_code IS NULL
    ),
    assignments AS (
      SELECT id,
        CASE
          WHEN role = 'doctor'       THEN 'DOC'
          WHEN role = 'admin'        THEN 'ADM'
          WHEN role = 'receptionist' THEN 'REC'
          WHEN role = 'radiologist'  THEN 'RAD'
          ELSE 'STF'
        END || '-' || LPAD(rn::text, 3, '0') AS new_code
      FROM ranked
    )
    UPDATE staff s
    SET staff_code = a.new_code
    FROM assignments a
    WHERE s.id = a.id
  `);

  // Set default PIN (000000) for any staff without one
  const defaultHash = await bcrypt.hash('000000', 10);
  await pool.query(`UPDATE staff SET pin = $1 WHERE pin IS NULL`, [defaultHash]);

  const { rows } = await pool.query(
    `SELECT name, role, staff_code FROM staff ORDER BY role, staff_code`
  );
  console.log('Migration complete. Current staff codes:');
  console.table(rows);

  await pool.end();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
