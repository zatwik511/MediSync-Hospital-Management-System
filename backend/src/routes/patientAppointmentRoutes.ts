import { Router, Request, Response } from 'express';
import { appointmentService } from '../services/AppointmentService';
import { notificationService } from '../services/NotificationService';
import { pool } from '../database/db';

const router = Router();

// GET /api/patient/appointments/doctors  — public list of doctors
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const doctors = await appointmentService.listDoctors();
    res.json({ success: true, data: doctors });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// GET /api/patient/appointments/slots/:doctorID/:date  — available slots
router.get('/slots/:doctorID/:date', async (req: Request, res: Response) => {
  try {
    const slots = await appointmentService.getBookedSlots(req.params.doctorID, req.params.date);
    res.json({ success: true, data: slots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// GET /api/patient/appointments  — own appointments only (patientID from middleware)
router.get('/', async (req: Request, res: Response) => {
  try {
    const appointments = await appointmentService.getAppointmentsByPatient(req.patientID!);
    res.json({ success: true, data: appointments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// POST /api/patient/appointments  — book; patientID locked to authenticated patient
router.post('/', async (req: Request, res: Response) => {
  const { doctorID, date, time, type, reason } = req.body;

  if (!doctorID || !date || !time) {
    return res.status(400).json({ success: false, error: 'doctorID, date and time are required' });
  }

  try {
    const appointment = await appointmentService.createAppointment({
      patientID: req.patientID!,
      doctorID,
      date,
      time,
      type,
      reason,
    });
    res.status(201).json({ success: true, data: appointment });
  } catch (err: any) {
    const status = err.message.includes('already booked') ? 409 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

// PUT /api/patient/appointments/:id/cancel  — cancel own appointment only
router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    // Ownership check pushed into SQL — patient_id must match the authenticated patient
    const result = await pool.query(
      `UPDATE appointments SET status = 'Cancelled'
       WHERE id = $1 AND patient_id = $2 AND status != 'Cancelled'
       RETURNING doctor_id, date, time`,
      [req.params.id, req.patientID]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Appointment not found or access denied' });
    }

    const { doctor_id, date, time } = result.rows[0];
    const patientRow = await pool.query(`SELECT name FROM patients WHERE id = $1`, [req.patientID]);
    const patientName = patientRow.rows[0]?.name || 'A patient';
    notificationService.notifyDoctor(
      doctor_id,
      `Appointment cancelled: ${patientName} on ${date} at ${time}`,
      'warning', 'appointment', req.params.id
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

export default router;
