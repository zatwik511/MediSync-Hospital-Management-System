import bcrypt from 'bcryptjs';
import { pool } from '../database/db';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export class AccountLockedError extends Error {
  constructor() {
    super('Too many failed attempts. Account locked for 15 minutes.');
    this.name = 'AccountLockedError';
  }
}

interface PatientAuthResult {
  id: string;
  name: string;
  email: string;
}

export class PatientAuthService {

  async ensureColumns(): Promise<void> {
    await pool.query(`
      ALTER TABLE patients
        ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ
    `);
  }

  async register(name: string, email: string, pin: string): Promise<PatientAuthResult> {
    if (!/^\d{6}$/.test(pin)) {
      throw new Error('PIN must be exactly 6 digits');
    }

    const existing = await pool.query(
      `SELECT id FROM patients WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (existing.rows[0]) {
      throw new Error('An account with this email already exists');
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const result = await pool.query(
      `INSERT INTO patients (name, address, conditions, diagnosis, "totalCost", "medicalHistory", "createdAt", email, pin)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
       RETURNING id, name, email`,
      [name, '', [], '', 0, [], email.toLowerCase(), pinHash]
    );
    return result.rows[0] as PatientAuthResult;
  }

  async login(email: string, pin: string): Promise<PatientAuthResult | null> {
    const result = await pool.query(
      `SELECT id, name, email, pin, failed_pin_attempts, locked_until FROM patients WHERE email = $1`,
      [email.toLowerCase()]
    );
    const row = result.rows[0];
    if (!row || !row.pin) return null;

    // Check lockout before attempting bcrypt (prevents timing oracle on locked accounts)
    if (row.locked_until && new Date(row.locked_until) > new Date()) {
      throw new AccountLockedError();
    }

    const valid = await bcrypt.compare(pin, row.pin);

    if (!valid) {
      const attempts = (row.failed_pin_attempts ?? 0) + 1;
      const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
      await pool.query(
        `UPDATE patients SET failed_pin_attempts = $1, locked_until = $2 WHERE id = $3`,
        [attempts, lockedUntil, row.id]
      );
      return null;
    }

    // Successful login — reset counters
    await pool.query(
      `UPDATE patients SET failed_pin_attempts = 0, locked_until = NULL WHERE id = $1`,
      [row.id]
    );

    return { id: row.id, name: row.name, email: row.email };
  }
}

export const patientAuthService = new PatientAuthService();
