import bcrypt from 'bcryptjs';
import { pool } from '../database/db';
import { Staff, CreateStaffDTO } from '../models/types';
import { auditService } from './AuditService';
import { AccountLockedError } from './PatientAuthService';
import { ROLE_PREFIX, ROLE_PREFIX_DEFAULT } from '../constants';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export class StaffService {

  async ensureColumns(): Promise<void> {
    await pool.query(`
      ALTER TABLE staff
        ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ
    `);
  }

  private async generateStaffCode(role: string): Promise<string> {
    const prefix = ROLE_PREFIX[role] || ROLE_PREFIX_DEFAULT;
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM staff WHERE staff_code LIKE $1`,
      [`${prefix}-%`]
    );
    const next = parseInt(result.rows[0].count, 10) + 1;
    return `${prefix}-${String(next).padStart(3, '0')}`;
  }

  async createStaff(data: CreateStaffDTO, actorStaffId = ''): Promise<Staff> {
    const staffCode = await this.generateStaffCode(data.role);
    const defaultPinHash = await bcrypt.hash('000000', 10);

    const result = await pool.query(
      `INSERT INTO staff (name, address, role, specialization, staff_code, pin, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, address, role, specialization, staff_code, last_seen, created_at`,
      [data.name, data.address, data.role, data.specialization, staffCode, defaultPinHash]
    );
    const staff = result.rows[0] as Staff;
    await auditService.logAction({
      staffId: actorStaffId,
      action: 'CREATE',
      entityType: 'staff',
      entityId: staff.id,
      description: `Created staff member ${data.name} (${staffCode}) with role ${data.role}`,
    });
    return staff;
  }

  async getStaff(staffID: string): Promise<Staff | null> {
    const result = await pool.query(
      `SELECT id, name, address, role, specialization, staff_code, last_seen, created_at FROM staff WHERE id = $1`,
      [staffID]
    );
    return result.rows[0] || null;
  }

  // Sets last_seen to NOW() and returns the previous value (for "last login" display)
  async touchLastSeen(staffId: string): Promise<Date | null> {
    const prev = await pool.query(`SELECT last_seen FROM staff WHERE id = $1`, [staffId]);
    await pool.query(`UPDATE staff SET last_seen = NOW() WHERE id = $1`, [staffId]);
    return prev.rows[0]?.last_seen ?? null;
  }

  async verifyLogin(staffCode: string, pin: string): Promise<Staff | null> {
    const result = await pool.query(
      `SELECT * FROM staff WHERE staff_code = $1`,
      [staffCode]
    );
    const row = result.rows[0];
    if (!row || !row.pin) return null;

    if (row.locked_until && new Date(row.locked_until) > new Date()) {
      throw new AccountLockedError();
    }

    const valid = await bcrypt.compare(pin, row.pin);

    if (!valid) {
      const attempts = (row.failed_pin_attempts ?? 0) + 1;
      const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null;
      await pool.query(
        `UPDATE staff SET failed_pin_attempts = $1, locked_until = $2 WHERE id = $3`,
        [attempts, lockedUntil, row.id]
      );
      return null;
    }

    // Successful login — reset counters
    await pool.query(
      `UPDATE staff SET failed_pin_attempts = 0, locked_until = NULL WHERE id = $1`,
      [row.id]
    );

    const { pin: _pin, failed_pin_attempts: _fa, locked_until: _lu, ...staff } = row;
    return staff as Staff;
  }

  async resetPin(targetId: string, newPin: string, actorStaffId = ''): Promise<void> {
    const hash = await bcrypt.hash(newPin, 10);
    await pool.query(`UPDATE staff SET pin = $1 WHERE id = $2`, [hash, targetId]);
    const target = await this.getStaff(targetId);
    await auditService.logAction({
      staffId: actorStaffId,
      action: 'UPDATE',
      entityType: 'staff',
      entityId: targetId,
      description: `Reset PIN for staff member ${target?.name || targetId}`,
    });
  }

  async isAdmin(staffId: string): Promise<boolean> {
    const result = await pool.query(`SELECT role FROM staff WHERE id = $1`, [staffId]);
    return result.rows[0]?.role === 'admin';
  }

  async listStaff(staffId = ''): Promise<Staff[]> {
    const result = await pool.query(
      `SELECT id, name, address, role, specialization, staff_code, last_seen, created_at FROM staff ORDER BY created_at DESC`
    );
    if (staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'staff',
        description: `Listed all staff members (${result.rows.length} records)`,
      });
    }
    return result.rows as Staff[];
  }

  async deleteStaff(staffID: string, actorStaffId = ''): Promise<void> {
    const target = await this.getStaff(staffID);
    await pool.query(`DELETE FROM staff WHERE id = $1`, [staffID]);
    await auditService.logAction({
      staffId: actorStaffId,
      action: 'DELETE',
      entityType: 'staff',
      entityId: staffID,
      description: `Deleted staff member ${target?.name || staffID} (${target?.staff_code || ''})`,
    });
  }
}

export const staffService = new StaffService();
