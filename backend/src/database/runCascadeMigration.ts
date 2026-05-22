import { pool } from './db';

async function runCascadeMigration() {
  console.log('Starting ON DELETE CASCADE migration...\n');

  // ── Step 1: Clean up orphaned records ────────────────────────────────────
  // Must happen before adding FK constraints, otherwise the ALTER TABLE will
  // fail if child rows reference non-existent parent rows.
  // Cast both sides to text so the query works regardless of column types
  // (UUID vs TEXT) in the existing schema.

  const [orphanImages, orphanTasks, orphanAppts] = await Promise.all([
    pool.query(`
      DELETE FROM medical_images
      WHERE NOT EXISTS (
        SELECT 1 FROM patients WHERE patients.id::text = medical_images.patient_id::text
      )
    `),
    pool.query(`
      DELETE FROM tasks
      WHERE NOT EXISTS (
        SELECT 1 FROM patients WHERE patients.id::text = tasks.patient_id::text
      )
    `),
    pool.query(`
      DELETE FROM appointments
      WHERE NOT EXISTS (
        SELECT 1 FROM patients WHERE patients.id::text = appointments.patient_id::text
      )
    `),
  ]);

  console.log('Orphan cleanup:');
  console.log(`  medical_images: ${orphanImages.rowCount ?? 0} row(s) removed`);
  console.log(`  tasks:          ${orphanTasks.rowCount  ?? 0} row(s) removed`);
  console.log(`  appointments:   ${orphanAppts.rowCount  ?? 0} row(s) removed`);

  // ── Step 2: Drop existing FK constraints (idempotent) ────────────────────
  // Standard auto-generated names from PostgreSQL; use IF EXISTS so this is
  // safe to run even if the constraints were never created.
  console.log('\nDropping existing FK constraints (if any)...');

  await pool.query(`ALTER TABLE medical_images DROP CONSTRAINT IF EXISTS medical_images_patient_id_fkey`);
  await pool.query(`ALTER TABLE tasks          DROP CONSTRAINT IF EXISTS tasks_patient_id_fkey`);
  await pool.query(`ALTER TABLE appointments   DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey`);
  await pool.query(`ALTER TABLE appointments   DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey`);

  // ── Step 3: Add ON DELETE CASCADE constraints ─────────────────────────────
  console.log('Adding ON DELETE CASCADE constraints...');

  await pool.query(`
    ALTER TABLE medical_images
      ADD CONSTRAINT medical_images_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  `);
  console.log('  ✓ medical_images.patient_id → patients.id');

  await pool.query(`
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  `);
  console.log('  ✓ tasks.patient_id → patients.id');

  await pool.query(`
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  `);
  console.log('  ✓ appointments.patient_id → patients.id');

  await pool.query(`
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_doctor_id_fkey
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
  `);
  console.log('  ✓ appointments.doctor_id → doctors.id');

  // ── Step 4: Verify ────────────────────────────────────────────────────────
  const { rows } = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name  AS foreign_table,
      ccu.column_name AS foreign_column,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = rc.unique_constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('medical_images', 'tasks', 'appointments')
    ORDER BY tc.table_name, kcu.column_name
  `);

  console.log('\nActive FK constraints on child tables:');
  console.table(rows);

  await pool.end();
  console.log('\nMigration complete.');
}

runCascadeMigration().catch((err) => {
  console.error('CASCADE migration failed:', err.message);
  process.exit(1);
});
