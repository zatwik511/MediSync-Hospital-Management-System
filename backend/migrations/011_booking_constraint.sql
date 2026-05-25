-- Prevent double-booking: a doctor can only have one active appointment per slot.
CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot_uq
  ON appointments (doctor_id, date, time)
  WHERE status <> 'Cancelled';
