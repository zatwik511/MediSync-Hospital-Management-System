import { pool } from './db';

async function runIndexMigration() {
  console.log('Creating performance indexes...');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
      ON appointments (doctor_id, date);

    CREATE INDEX IF NOT EXISTS idx_appointments_patient_id
      ON appointments (patient_id);

    CREATE INDEX IF NOT EXISTS idx_medical_images_patient_id
      ON medical_images (patient_id);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id
      ON audit_logs (staff_id);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
      ON audit_logs (created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_notifications_staff_is_read
      ON notifications (staff_id, is_read);
  `);

  console.log('Index migration complete.');
  await pool.end();
}

runIndexMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
