import { pool } from '../database/db';
import { auditService } from './AuditService';
import { notificationService } from './NotificationService';

export interface Appointment {
  id: string;
  patientID: string;
  doctorID: string;
  doctorName?: string;
  doctorSpecialty?: string;
  date: string;
  time: string;
  type: string;
  status: string;
  reason?: string;
  createdAt: Date;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  availableDays: string[];
  createdAt: Date;
}

export interface CreateAppointmentDTO {
  patientID: string;
  doctorID: string;
  date: string;
  time: string;
  type?: string;
  reason?: string;
}

interface AppointmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string | null;
  doctor_specialty: string | null;
  date: string;
  time: string;
  type: string;
  status: string;
  reason: string | null;
  created_at: string;
}

export interface AvailabilitySlot {
  dayOfWeek: number;  // 0 = Sunday … 6 = Saturday
  startTime: string;  // 'HH:MM'
  endTime: string;    // 'HH:MM'
}

export interface AvailableSlotsResult {
  slots: string[];
  hasAvailability: boolean;
}

// Valid outgoing transitions per status. Terminal states have empty arrays.
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Pending:   ['Confirmed', 'Cancelled'],
  Confirmed: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export function assertTransition(current: string, next: string): void {
  const allowed = ALLOWED_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(
      `Cannot transition appointment from '${current}' to '${next}'. ` +
      (allowed.length ? `Allowed: ${allowed.join(', ')}` : 'No further transitions allowed.')
    );
  }
}

const DEFAULT_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '11:30', '14:00', '14:30', '15:00', '15:30', '16:00',
];

export function parseLocalDayOfWeek(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur < end) {
    slots.push(
      `${Math.floor(cur / 60).toString().padStart(2, '0')}:${(cur % 60).toString().padStart(2, '0')}`
    );
    cur += 30;
  }
  return slots;
}

export class AppointmentService {

  private transformAppointment(row: AppointmentRow): Appointment {
    return {
      id: row.id,
      patientID: row.patient_id,
      doctorID: row.doctor_id,
      doctorName: row.doctor_name ?? undefined,
      doctorSpecialty: row.doctor_specialty ?? undefined,
      date: row.date,
      time: row.time,
      type: row.type,
      status: row.status,
      reason: row.reason ?? undefined,
      createdAt: new Date(row.created_at),
    };
  }

  async createAppointment(data: CreateAppointmentDTO, staffId = ''): Promise<Appointment> {
    const todayStr = new Date().toLocaleDateString('en-CA');
    if (data.date < todayStr) throw new Error('Appointment date cannot be in the past');

    // Validate against doctor availability if configured
    const availability = await this.getDoctorAvailability(data.doctorID);
    if (availability.length > 0) {
      const dayOfWeek = parseLocalDayOfWeek(data.date);
      const daySlot = availability.find(a => a.dayOfWeek === dayOfWeek);
      if (!daySlot) throw new Error('Doctor is not available on this day');
      const [reqH, reqM] = data.time.split(':').map(Number);
      const reqMin = reqH * 60 + reqM;
      const [sh, sm] = daySlot.startTime.split(':').map(Number);
      const [eh, em] = daySlot.endTime.split(':').map(Number);
      if (reqMin < sh * 60 + sm || reqMin >= eh * 60 + em) {
        throw new Error(`Doctor is not available at this time (working hours: ${daySlot.startTime}–${daySlot.endTime})`);
      }
    }

    let result;
    try {
      result = await pool.query(
        `INSERT INTO appointments (patient_id, doctor_id, date, time, type, status, reason)
         VALUES ($1, $2, $3, $4, $5, 'Confirmed', $6)
         RETURNING *`,
        [data.patientID, data.doctorID, data.date, data.time, data.type || 'In-Person', data.reason || null]
      );
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') throw new Error('This time slot is already booked');
      throw err;
    }
    const appt = this.transformAppointment(result.rows[0]);
    await auditService.logAction({
      staffId,
      action: 'CREATE',
      entityType: 'appointment',
      entityId: appt.id,
      description: `Booked ${appt.type} appointment on ${appt.date} at ${appt.time}`,
    });

    const patientRow = await pool.query(`SELECT name FROM patients WHERE id = $1`, [data.patientID]);
    const patientName = patientRow.rows[0]?.name || 'A patient';
    notificationService.notifyDoctor(
      data.doctorID,
      `New appointment: ${patientName} on ${appt.date} at ${appt.time}`,
      'info', 'appointment', appt.id
    );

    return appt;
  }

  async listAppointments(staffId = ''): Promise<Appointment[]> {
    const result = await pool.query(
      `SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty
       FROM appointments a
       LEFT JOIN doctors d ON a.doctor_id = d.id
       ORDER BY a.date ASC, a.time ASC`
    );
    if (staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'appointment',
        description: `Listed all appointments (${result.rows.length} records)`,
      });
    }
    return result.rows.map(row => this.transformAppointment(row));
  }

  async listAppointmentsPaginated(
    page: number,
    limit: number,
    search: string,
    staffId = ''
  ): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    totalPages: number;
    counts: { active: number; confirmed: number; cancelled: number };
  }> {
    const offset = (page - 1) * limit;
    const [dataResult, countsResult] = await Promise.all([
      pool.query(
        `SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty,
                COUNT(*) OVER() AS total_count
         FROM appointments a
         LEFT JOIN doctors d ON a.doctor_id = d.id
         LEFT JOIN patients pt ON a.patient_id = pt.id
         WHERE ($1 = '' OR (
           COALESCE(pt.name, '') ILIKE '%' || $1 || '%'
           OR COALESCE(d.name, '') ILIKE '%' || $1 || '%'
           OR COALESCE(d.specialty, '') ILIKE '%' || $1 || '%'
           OR a.date::text ILIKE '%' || $1 || '%'
           OR a.time ILIKE '%' || $1 || '%'
           OR a.status ILIKE '%' || $1 || '%'
           OR a.type ILIKE '%' || $1 || '%'
           OR COALESCE(a.reason, '') ILIKE '%' || $1 || '%'
         ))
         ORDER BY a.date ASC, a.time ASC
         LIMIT $2 OFFSET $3`,
        [search, limit, offset]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status != 'Cancelled') AS active,
           COUNT(*) FILTER (WHERE status = 'Confirmed')  AS confirmed,
           COUNT(*) FILTER (WHERE status = 'Cancelled')  AS cancelled
         FROM appointments`
      ),
    ]);
    const total = dataResult.rows.length > 0 ? parseInt(dataResult.rows[0].total_count, 10) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const c = countsResult.rows[0];
    if (staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'appointment',
        description: `Listed appointments page ${page}${search ? ` (search: "${search}")` : ''} — ${total} total`,
      });
    }
    return {
      data: dataResult.rows.map(({ total_count: _tc, ...row }) => this.transformAppointment(row)),
      total,
      page,
      totalPages,
      counts: {
        active:    parseInt(c.active,    10),
        confirmed: parseInt(c.confirmed, 10),
        cancelled: parseInt(c.cancelled, 10),
      },
    };
  }

  async getAppointmentsByPatient(patientID: string, staffId = ''): Promise<Appointment[]> {
    const result = await pool.query(
      `SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty
       FROM appointments a
       LEFT JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = $1
       ORDER BY a.date ASC, a.time ASC`,
      [patientID]
    );
    if (staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'appointment',
        entityId: patientID,
        description: `Viewed appointments for patient ${patientID}`,
      });
    }
    return result.rows.map(row => this.transformAppointment(row));
  }

  async getAppointment(appointmentID: string, staffId = ''): Promise<Appointment | null> {
    const result = await pool.query(
      `SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty
       FROM appointments a
       LEFT JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [appointmentID]
    );
    const appt = result.rows[0] ? this.transformAppointment(result.rows[0]) : null;
    if (appt && staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'appointment',
        entityId: appointmentID,
        description: `Viewed appointment on ${appt.date} at ${appt.time}`,
      });
    }
    return appt;
  }

  async rescheduleAppointment(appointmentID: string, date: string, time: string, staffId = ''): Promise<Appointment> {
    const existing = await this.getAppointment(appointmentID);
    if (!existing) throw new Error('Appointment not found');

    if (!['Confirmed', 'Pending'].includes(existing.status)) {
      throw new Error(`Cannot reschedule a ${existing.status} appointment`);
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    if (date < todayStr) throw new Error('Appointment date cannot be in the past');

    let result;
    try {
      result = await pool.query(
        `UPDATE appointments SET date = $1, time = $2, status = 'Confirmed' WHERE id = $3 RETURNING *`,
        [date, time, appointmentID]
      );
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') throw new Error('This time slot is already booked');
      throw err;
    }
    const appt = this.transformAppointment(result.rows[0]);
    await auditService.logAction({
      staffId,
      action: 'UPDATE',
      entityType: 'appointment',
      entityId: appointmentID,
      description: `Rescheduled appointment to ${date} at ${time}`,
    });
    return appt;
  }

  async cancelAppointment(appointmentID: string, staffId = ''): Promise<void> {
    const existing = await this.getAppointment(appointmentID);
    if (!existing) throw new Error('Appointment not found');
    assertTransition(existing.status, 'Cancelled');

    await pool.query(`UPDATE appointments SET status = 'Cancelled' WHERE id = $1`, [appointmentID]);
    await auditService.logAction({
      staffId,
      action: 'UPDATE',
      entityType: 'appointment',
      entityId: appointmentID,
      description: `Cancelled appointment ${appointmentID}`,
    });

    if (existing) {
      const patientRow = await pool.query(`SELECT name FROM patients WHERE id = $1`, [existing.patientID]);
      const patientName = patientRow.rows[0]?.name || 'A patient';
      notificationService.notifyDoctor(
        existing.doctorID,
        `Appointment cancelled: ${patientName} on ${existing.date} at ${existing.time}`,
        'warning', 'appointment', appointmentID
      );
    }
  }

  async listDoctors(): Promise<Doctor[]> {
    const result = await pool.query(`SELECT * FROM doctors WHERE deleted_at IS NULL ORDER BY name ASC`);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty,
      availableDays: row.available_days,
      createdAt: new Date(row.created_at),
    }));
  }

  async getBookedSlots(doctorID: string, date: string): Promise<string[]> {
    const result = await pool.query(
      `SELECT time FROM appointments WHERE doctor_id = $1 AND date = $2 AND status != 'Cancelled'`,
      [doctorID, date]
    );
    return result.rows.map(row => row.time);
  }

  async completeAppointment(appointmentID: string, staffId = ''): Promise<void> {
    const existing = await this.getAppointment(appointmentID);
    if (!existing) throw new Error('Appointment not found');
    assertTransition(existing.status, 'Completed');

    await pool.query(`UPDATE appointments SET status = 'Completed' WHERE id = $1`, [appointmentID]);
    await auditService.logAction({
      staffId,
      action: 'UPDATE',
      entityType: 'appointment',
      entityId: appointmentID,
      description: `Marked appointment ${appointmentID} as Completed`,
    });
  }

  async getTotalAppointmentCount(): Promise<number> {
    const result = await pool.query(`SELECT COUNT(*) FROM appointments WHERE status != 'Cancelled'`);
    return parseInt(result.rows[0].count, 10);
  }

  async getDoctorAvailability(doctorId: string): Promise<AvailabilitySlot[]> {
    const result = await pool.query(
      `SELECT day_of_week, start_time, end_time FROM doctor_availability WHERE doctor_id = $1 ORDER BY day_of_week`,
      [doctorId]
    );
    return result.rows.map(row => ({
      dayOfWeek: row.day_of_week as number,
      startTime: row.start_time as string,
      endTime:   row.end_time   as string,
    }));
  }

  async setDoctorAvailability(doctorId: string, slots: AvailabilitySlot[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM doctor_availability WHERE doctor_id = $1`, [doctorId]);
      for (const slot of slots) {
        await client.query(
          `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)`,
          [doctorId, slot.dayOfWeek, slot.startTime, slot.endTime]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getAvailableSlots(doctorId: string, date: string): Promise<AvailableSlotsResult> {
    const availability = await this.getDoctorAvailability(doctorId);
    const booked = await this.getBookedSlots(doctorId, date);

    if (availability.length === 0) {
      return { slots: DEFAULT_SLOTS.filter(s => !booked.includes(s)), hasAvailability: false };
    }

    const dayOfWeek = parseLocalDayOfWeek(date);
    const todaySlot = availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!todaySlot) {
      return { slots: [], hasAvailability: true };
    }

    const generated = generateSlots(todaySlot.startTime, todaySlot.endTime);
    return { slots: generated.filter(s => !booked.includes(s)), hasAvailability: true };
  }
}

export const appointmentService = new AppointmentService();
