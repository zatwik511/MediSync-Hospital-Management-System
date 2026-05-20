import { pool } from './db';

async function runAuditMigration() {
  console.log('Creating audit_logs table...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_id    TEXT NOT NULL,
      staff_name  TEXT NOT NULL DEFAULT 'Unknown',
      action      TEXT NOT NULL CHECK (action IN ('LOGIN','LOGOUT','CREATE','READ','UPDATE','DELETE','EXPORT')),
      entity_type TEXT NOT NULL,
      entity_id   TEXT,
      description TEXT NOT NULL,
      ip_address  TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id   ON audit_logs(staff_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON audit_logs(action)`);

  console.log('audit_logs table ready.');
  await pool.end();
}

runAuditMigration().catch((err) => {
  console.error('Audit migration failed:', err);
  process.exit(1);
});
