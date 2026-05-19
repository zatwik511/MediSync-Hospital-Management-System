import { pool } from '../database/db';
import { Staff, CreateStaffDTO } from '../models/types';

export class StaffService {

  async createStaff(data: CreateStaffDTO): Promise<Staff> {
    const result = await pool.query(
      `INSERT INTO staff (name, address, role, specialization, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [data.name, data.address, data.role, data.specialization]
    );

    return result.rows[0] as Staff;
  }

  async getStaff(staffID: string): Promise<Staff | null> {
    const result = await pool.query(
      `SELECT * FROM staff WHERE id = $1`,
      [staffID]
    );

    return result.rows[0] || null;
  }

  async authenticateStaff(staffID: string): Promise<Staff | null> {
    return await this.getStaff(staffID);
  }

  async listStaff(): Promise<Staff[]> {
    const result = await pool.query(
      `SELECT * FROM staff ORDER BY created_at DESC`
    );

    return result.rows as Staff[];
  }

  async deleteStaff(staffID: string): Promise<void> {
    await pool.query(
      `DELETE FROM staff WHERE id = $1`,
      [staffID]
    );
  }
}

export const staffService = new StaffService();
