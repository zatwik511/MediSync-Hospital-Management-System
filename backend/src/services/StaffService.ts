import bcrypt from 'bcryptjs';
import { pool } from '../database/db';
import { Staff, CreateStaffDTO } from '../models/types';

const ROLE_PREFIX: Record<string, string> = {
  doctor:       'DOC',
  admin:        'ADM',
  receptionist: 'REC',
  radiologist:  'RAD',
};

export class StaffService {

  private async generateStaffCode(role: string): Promise<string> {
    const prefix = ROLE_PREFIX[role] || 'STF';
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM staff WHERE staff_code LIKE $1`,
      [`${prefix}-%`]
    );
    const next = parseInt(result.rows[0].count, 10) + 1;
    return `${prefix}-${String(next).padStart(3, '0')}`;
  }

  async createStaff(data: CreateStaffDTO): Promise<Staff> {
    const staffCode = await this.generateStaffCode(data.role);
    const defaultPinHash = await bcrypt.hash('000000', 10);

    const result = await pool.query(
      `INSERT INTO staff (name, address, role, specialization, staff_code, pin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, address, role, specialization, staff_code, created_at`,
      [data.name, data.address, data.role, data.specialization, staffCode, defaultPinHash]
    );
    return result.rows[0] as Staff;
  }

  async getStaff(staffID: string): Promise<Staff | null> {
    const result = await pool.query(
      `SELECT id, name, address, role, specialization, staff_code, created_at FROM staff WHERE id = $1`,
      [staffID]
    );
    return result.rows[0] || null;
  }

  async verifyLogin(staffCode: string, pin: string): Promise<Staff | null> {
    const result = await pool.query(
      `SELECT * FROM staff WHERE staff_code = $1`,
      [staffCode]
    );
    const row = result.rows[0];
    if (!row || !row.pin) return null;

    const valid = await bcrypt.compare(pin, row.pin);
    if (!valid) return null;

    const { pin: _pin, ...staff } = row;
    return staff as Staff;
  }

  async resetPin(staffId: string, newPin: string): Promise<void> {
    const hash = await bcrypt.hash(newPin, 10);
    await pool.query(`UPDATE staff SET pin = $1 WHERE id = $2`, [hash, staffId]);
  }

  async isAdmin(staffId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT role FROM staff WHERE id = $1`,
      [staffId]
    );
    return result.rows[0]?.role === 'admin';
  }

  async listStaff(): Promise<Staff[]> {
    const result = await pool.query(
      `SELECT id, name, address, role, specialization, staff_code, created_at FROM staff ORDER BY created_at DESC`
    );
    return result.rows as Staff[];
  }

  async deleteStaff(staffID: string): Promise<void> {
    await pool.query(`DELETE FROM staff WHERE id = $1`, [staffID]);
  }
}

export const staffService = new StaffService();
