import bcrypt from 'bcryptjs';
import { pool } from '../database/db';

interface PatientAuthResult {
  id: string;
  name: string;
  email: string;
}

export class PatientAuthService {

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
      `SELECT id, name, email, pin FROM patients WHERE email = $1`,
      [email.toLowerCase()]
    );
    const row = result.rows[0];
    if (!row || !row.pin) return null;

    const valid = await bcrypt.compare(pin, row.pin);
    if (!valid) return null;

    return { id: row.id, name: row.name, email: row.email };
  }
}

export const patientAuthService = new PatientAuthService();
