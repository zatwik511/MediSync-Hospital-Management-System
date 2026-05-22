import { pool } from './db';

async function runNotificationMigration() {
  console.log('Creating notifications table...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_id    TEXT NOT NULL,
      message     TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning')),
      entity_type TEXT,
      entity_id   TEXT,
      is_read     BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_staff_id   ON notifications(staff_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON notifications(staff_id, is_read)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at  ON notifications(created_at DESC)`);

  console.log('notifications table ready.');
  await pool.end();
}

runNotificationMigration().catch((err) => {
  console.error('Notification migration failed:', err);
  process.exit(1);
});
