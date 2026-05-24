import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { appointmentService } from '../services/AppointmentService';
import { notificationService } from '../services/NotificationService';
import { pool } from '../database/db';

const router = Router();

// GET /api/patient/appointments/doctors  — public list of doctors
router.get('/doctors', asyncHandler(async (req, res) => {
    const doctors = await appointmentService.listDoctors();
    res.json({ success: true, data: doctors });
}));

// GET /api/patient/appointments/slots/:doctorID/:date  — available slots
router.get('/slots/:doctorID/:date', asyncHandler(async (req, res) => {
    const slots = await appointmentService.getBookedSlots(req.params.doctorID, req.params.date);
    res.json({ success: true, data: slots });
}));

// GET /api/patient/appointments  — own appointments only (patientID from middleware)
router.get('/', asyncHandler(async (req, res) => {
    const appointments = await appointmentService.getAppointmentsByPatient(req.patientID!);
    res.json({ success: true, data: appointments });
}));

// POST /api/patient/appointments  — book; patientID locked to authenticated patient
router.post('/', asyncHandler(async (req, res) => {
  const { doctorID, date, time, type, reason } = req.body;

  if (!doctorID || !date || !time) {
    return res.status(400).json({ success: false, error: 'doctorID, date and time are required' });
  }

  const appointment = await appointmentService.createAppointment({
    patientID: req.patientID!,
    doctorID,
    date,
    time,
    type,
    reason,
  });
  res.status(201).json({ success: true, data: appointment });
}));

// PUT /api/patient/appointments/:id/cancel  — cancel own appointment only
router.put('/:id/cancel', asyncHandler(async (req, res) => {
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
}));

export default router;
