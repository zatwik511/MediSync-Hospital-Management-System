import { Router, Request, Response } from 'express';
import { appointmentService } from '../services/AppointmentService';
import { pool } from '../database/db';

const router = Router();

// GET /api/patient/appointments/doctors  — public list of doctors
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const doctors = await appointmentService.listDoctors();
    res.json({ success: true, data: doctors });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/patient/appointments/slots/:doctorID/:date  — available slots
router.get('/slots/:doctorID/:date', async (req: Request, res: Response) => {
  try {
    const slots = await appointmentService.getBookedSlots(req.params.doctorID, req.params.date);
    res.json({ success: true, data: slots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/patient/appointments  — own appointments (patientID from middleware)
router.get('/', async (req: Request, res: Response) => {
  try {
    const appointments = await appointmentService.getAppointmentsByPatient(req.patientID!);
    res.json({ success: true, data: appointments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    const row = await pool.query(
      `SELECT patient_id FROM appointments WHERE id = $1`,
      [req.params.id]
    );
    if (!row.rows[0]) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    if (row.rows[0].patient_id !== req.patientID) {
      return res.status(403).json({ success: false, error: 'Cannot cancel another patient\'s appointment' });
    }
    await appointmentService.cancelAppointment(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
