import { pool } from '../database/db';

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT';

export interface AuditLog {
  id: string;
  staff_id: string;
  staff_name: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  description: string;
  ip_address: string | null;
  created_at: Date;
}

interface LogParams {
  staffId: string;
  staffName?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
}

class AuditService {
  async logAction(params: LogParams): Promise<void> {
    try {
      let staffName = params.staffName || 'Unknown';
      if (!params.staffName && params.staffId) {
        const r = await pool.query(`SELECT name FROM staff WHERE id = $1`, [params.staffId]);
        if (r.rows[0]) staffName = r.rows[0].name;
      }

      await pool.query(
        `INSERT INTO audit_logs (staff_id, staff_name, action, entity_type, entity_id, description, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          params.staffId,
          staffName,
          params.action,
          params.entityType,
          params.entityId ?? null,
          params.description,
          params.ipAddress ?? null,
        ]
      );
    } catch (err) {
      console.error('[AuditService] Failed to write log:', err);
    }
  }

  async getLogs(filters?: { entityType?: string; action?: string }): Promise<AuditLog[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters?.entityType) {
      values.push(filters.entityType);
      conditions.push(`entity_type = $${values.length}`);
    }
    if (filters?.action) {
      values.push(filters.action);
      conditions.push(`action = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT 1000`,
      values
    );
    return result.rows as AuditLog[];
  }

  async getLogsByStaff(staffId: string): Promise<AuditLog[]> {
    const result = await pool.query(
      `SELECT * FROM audit_logs WHERE staff_id = $1 ORDER BY created_at DESC LIMIT 500`,
      [staffId]
    );
    return result.rows as AuditLog[];
  }
}

export const auditService = new AuditService();
