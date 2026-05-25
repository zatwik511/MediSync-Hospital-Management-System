-- Immutable audit trail for every staff action.
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    TEXT        NOT NULL,
  staff_name  TEXT        NOT NULL DEFAULT 'Unknown',
  action      TEXT        NOT NULL CHECK (action IN ('LOGIN','LOGOUT','CREATE','READ','UPDATE','DELETE','EXPORT')),
  entity_type TEXT        NOT NULL,
  entity_id   TEXT,
  description TEXT        NOT NULL,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id   ON audit_logs (staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON audit_logs (action);
