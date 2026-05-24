import nodemailer from 'nodemailer';
import { pool } from '../database/db';
import { auditService } from './AuditService';

interface AppointmentReminder {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
}

class ReminderService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter | null {
    if (!process.env.SMTP_HOST) return null;
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  private async getDueTomorrow(): Promise<AppointmentReminder[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA');

    const result = await pool.query(
      `SELECT a.id AS appointment_id, a.patient_id, p.name AS patient_name, p.email AS patient_email,
              d.name AS doctor_name, a.date, a.time, a.type
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       WHERE a.date = $1
         AND a.status NOT IN ('Cancelled', 'Completed')
         AND p.email IS NOT NULL`,
      [tomorrowStr]
    );

    return result.rows.map(row => ({
      appointmentId: row.appointment_id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientEmail: row.patient_email,
      doctorName: row.doctor_name ?? 'your doctor',
      date: row.date,
      time: row.time,
      type: row.type,
    }));
  }

  private buildEmail(r: AppointmentReminder): { subject: string; html: string; text: string } {
    const dateLabel = new Date(r.date).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const subject = `Appointment Reminder — Tomorrow at ${r.time}`;
    const text = [
      `Hi ${r.patientName},`,
      '',
      `This is a reminder for your ${r.type} appointment with ${r.doctorName} tomorrow (${dateLabel}) at ${r.time}.`,
      '',
      'If you need to cancel, please log in to the patient portal.',
      '',
      'MediSync Hospital Management System',
    ].join('\n');
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
        <h2 style="color:#059669;">Appointment Reminder</h2>
        <p>Hi <strong>${r.patientName}</strong>,</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="padding:8px;color:#6b7280;width:120px;">Doctor</td><td style="padding:8px;font-weight:600;">${r.doctorName}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Date</td><td style="padding:8px;">${dateLabel}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;">Time</td><td style="padding:8px;">${r.time}</td></tr>
          <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Type</td><td style="padding:8px;">${r.type}</td></tr>
        </table>
        <p>If you need to cancel or reschedule, please log in to the patient portal.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px;">MediSync Hospital Management System</p>
      </div>`;
    return { subject, html, text };
  }

  async sendReminders(): Promise<{ sent: number; failed: number; skipped: boolean }> {
    const transport = this.getTransporter();
    if (!transport) {
      console.log('[ReminderService] SMTP not configured — skipping appointment reminders');
      return { sent: 0, failed: 0, skipped: true };
    }

    const reminders = await this.getDueTomorrow();
    if (reminders.length === 0) {
      console.log('[ReminderService] No appointment reminders to send today');
      return { sent: 0, failed: 0, skipped: false };
    }

    let sent = 0;
    let failed = 0;

    for (const reminder of reminders) {
      const { subject, html, text } = this.buildEmail(reminder);
      try {
        await transport.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: reminder.patientEmail,
          subject,
          text,
          html,
        });
        sent++;
      } catch (err) {
        console.error(`[ReminderService] Failed to email ${reminder.patientEmail}:`, err);
        failed++;
      }
    }

    await auditService.logAction({
      staffId: 'system',
      action: 'CREATE',
      entityType: 'notification',
      description: `Daily appointment reminders: ${sent} sent, ${failed} failed`,
    });

    console.log(`[ReminderService] Reminders: ${sent} sent, ${failed} failed`);
    return { sent, failed, skipped: false };
  }
}

export const reminderService = new ReminderService();
