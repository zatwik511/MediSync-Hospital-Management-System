import { pool } from '../database/db';

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

export class AppointmentService {

  // Helper to transform raw database row to Appointment object
  private transformAppointment(row: any): Appointment {
    return {
      id: row.id,
      patientID: row.patient_id,
      doctorID: row.doctor_id,
      doctorName: row.doctor_name,
      doctorSpecialty: row.doctor_specialty,
      date: row.date,
      time: row.time,
      type: row.type,
      status: row.status,
      reason: row.reason,
      createdAt: new Date(row.created_at),
    };
  }

  // METHOD 1: Book a new appointment
  async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    // Check the slot isn't already taken
    const conflict = await pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1 AND date = $2 AND time = $3
       AND status != 'Cancelled'`,
      [data.doctorID, data.date, data.time]
    );

    if (conflict.rows.length > 0) {
      throw new Error('This time slot is already booked');
    }

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, date, time, type, status, reason)
       VALUES ($1, $2, $3, $4, $5, 'Confirmed', $6)
       RETURNING *`,
      [data.patientID, data.doctorID, data.date, data.time, data.type || 'In-Person', data.reason || null]
    );

    return this.transformAppointment(result.rows[0]);
  }

  // METHOD 2: Get all appointments (with doctor name joined in)
  async listAppointments(): Promise<Appointment[]> {
    const result = await pool.query(
      `SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty
       FROM appointments a
       LEFT JOIN doctors d ON a.doctor_id = d.id
       ORDER BY a.date ASC, a.time ASC`
    );

    return result.rows.map(row => this.transformAppointment(row));
  }

  // METHOD 3: Get appointments for a specific patient
  async getAppointmentsByPatient(patientID: string): Promise<Appointment[]> {
    const result = await pool.query(
      `SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty
       FROM appointments a
       LEFT JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = $1
       ORDER BY a.date ASC, a.time ASC`,
      [patientID]
    );

    return result.rows.map(row => this.transformAppointment(row));
  }

  // METHOD 4: Get a single appointment by ID
  async getAppointment(appointmentID: string): Promise<Appointment | null> {
    const result = await pool.query(
      `SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty
       FROM appointments a
       LEFT JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [appointmentID]
    );

    return result.rows[0] ? this.transformAppointment(result.rows[0]) : null;
  }

  // METHOD 5: Reschedule an appointment
  async rescheduleAppointment(appointmentID: string, date: string, time: string): Promise<Appointment> {
    // Get the appointment to find the doctor
    const existing = await this.getAppointment(appointmentID);
    if (!existing) throw new Error('Appointment not found');

    // Check new slot isn't taken
    const conflict = await pool.query(
      `SELECT id FROM appointments
       WHERE doctor_id = $1 AND date = $2 AND time = $3
       AND status != 'Cancelled' AND id != $4`,
      [existing.doctorID, date, time, appointmentID]
    );

    if (conflict.rows.length > 0) {
      throw new Error('This time slot is already booked');
    }

    const result = await pool.query(
      `UPDATE appointments SET date = $1, time = $2, status = 'Confirmed'
       WHERE id = $3 RETURNING *`,
      [date, time, appointmentID]
    );

    return this.transformAppointment(result.rows[0]);
  }

  // METHOD 6: Cancel an appointment
  async cancelAppointment(appointmentID: string): Promise<void> {
    await pool.query(
      `UPDATE appointments SET status = 'Cancelled' WHERE id = $1`,
      [appointmentID]
    );
  }

  // METHOD 7: Get all doctors
  async listDoctors(): Promise<Doctor[]> {
    const result = await pool.query(
      `SELECT * FROM doctors ORDER BY name ASC`
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty,
      availableDays: row.available_days,
      createdAt: new Date(row.created_at),
    }));
  }

  // METHOD 8: Get booked slots for a doctor on a specific date
  async getBookedSlots(doctorID: string, date: string): Promise<string[]> {
    const result = await pool.query(
      `SELECT time FROM appointments
       WHERE doctor_id = $1 AND date = $2 AND status != 'Cancelled'`,
      [doctorID, date]
    );

    return result.rows.map(row => row.time);
  }

  // METHOD 9: Count total appointments
  async getTotalAppointmentCount(): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) FROM appointments WHERE status != 'Cancelled'`
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export const appointmentService = new AppointmentService();
