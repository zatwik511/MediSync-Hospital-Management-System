-- In-app notification inbox for staff.
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning')),
  entity_type TEXT,
  entity_id   TEXT,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_staff_id   ON notifications (staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON notifications (staff_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at  ON notifications (created_at DESC);
