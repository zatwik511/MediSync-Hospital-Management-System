import { pool } from '../database/db';
import logger from '../logger';

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

export interface PaginatedAuditResult {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
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
      logger.error({ err }, 'AuditService: failed to write log');
    }
  }

  async getLogs(
    filters?: { entityType?: string; action?: string },
    page = 1,
    limit = 50,
  ): Promise<PaginatedAuditResult> {
    const safeLimit = Math.min(limit, 200);
    const offset = (page - 1) * safeLimit;

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
    const limitParam  = values.length + 1;
    const offsetParam = values.length + 2;
    values.push(safeLimit, offset);

    const result = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM audit_logs ${where}
       ORDER BY created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values,
    );

    const total = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const items = result.rows.map(({ total_count: _tc, ...row }: Record<string, unknown>) => row as unknown as AuditLog);
    return { items, total, page, limit: safeLimit };
  }

  async getAllLogsForExport(filters?: { entityType?: string; action?: string }): Promise<AuditLog[]> {
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
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC`,
      values,
    );
    return result.rows as AuditLog[];
  }

  async getLogsByStaff(staffId: string, page = 1, limit = 50): Promise<PaginatedAuditResult> {
    const safeLimit = Math.min(limit, 200);
    const offset = (page - 1) * safeLimit;

    const result = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM audit_logs
       WHERE staff_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [staffId, safeLimit, offset],
    );

    const total = result.rows.length > 0 ? Number(result.rows[0].total_count) : 0;
    const items = result.rows.map(({ total_count: _tc, ...row }: Record<string, unknown>) => row as unknown as AuditLog);
    return { items, total, page, limit: safeLimit };
  }
}

export const auditService = new AuditService();
