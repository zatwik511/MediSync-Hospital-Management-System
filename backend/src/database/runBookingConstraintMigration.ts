import { pool } from './db';

async function runBookingConstraintMigration() {
  console.log('Adding partial unique index for active appointment slots...');

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot_uq
    ON appointments (doctor_id, date, time)
    WHERE status <> 'Cancelled'
  `);

  console.log('Booking constraint migration complete.');
  await pool.end();
}

runBookingConstraintMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
