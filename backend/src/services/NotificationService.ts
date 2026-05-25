import { pool } from '../database/db';
import logger from '../logger';

export type NotificationType = 'info' | 'success' | 'warning';

export interface Notification {
  id: string;
  staffId: string;
  message: string;
  type: NotificationType;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date;
}

class NotificationService {
  async createNotification(params: {
    staffId: string;
    message: string;
    type?: NotificationType;
    entityType?: string;
    entityId?: string;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO notifications (staff_id, message, type, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          params.staffId,
          params.message,
          params.type || 'info',
          params.entityType || null,
          params.entityId || null,
        ]
      );
    } catch (err) {
      logger.error({ err }, 'NotificationService: failed to create notification');
    }
  }

  // Finds the staff member (role=doctor) whose name matches the doctor in doctors table
  async notifyDoctor(
    doctorId: string,
    message: string,
    type: NotificationType = 'info',
    entityType?: string,
    entityId?: string
  ): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT s.id FROM staff s
         JOIN doctors d ON s.id = d.staff_id
         WHERE d.id = $1`,
        [doctorId]
      );
      for (const row of result.rows) {
        await this.createNotification({ staffId: row.id, message, type, entityType, entityId });
      }
    } catch (err) {
      logger.error({ err }, 'NotificationService: failed to notify doctor');
    }
  }

  async notifyAllAdmins(
    message: string,
    type: NotificationType = 'info',
    entityType?: string,
    entityId?: string
  ): Promise<void> {
    try {
      const result = await pool.query(`SELECT id FROM staff WHERE role = 'admin'`);
      for (const row of result.rows) {
        await this.createNotification({ staffId: row.id, message, type, entityType, entityId });
      }
    } catch (err) {
      logger.error({ err }, 'NotificationService: failed to notify admins');
    }
  }

  async getUnread(staffId: string): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE staff_id = $1 AND is_read = FALSE
       ORDER BY created_at DESC
       LIMIT 10`,
      [staffId]
    );
    return result.rows.map(row => ({
      id: row.id,
      staffId: row.staff_id,
      message: row.message,
      type: row.type as NotificationType,
      entityType: row.entity_type,
      entityId: row.entity_id,
      isRead: row.is_read,
      createdAt: new Date(row.created_at),
    }));
  }

  async getUnreadCount(staffId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE staff_id = $1 AND is_read = FALSE`,
      [staffId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async markRead(notificationId: string, staffId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND staff_id = $2`,
      [notificationId, staffId]
    );
  }

  async markAllRead(staffId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE staff_id = $1 AND is_read = FALSE`,
      [staffId]
    );
  }
}

export const notificationService = new NotificationService();
