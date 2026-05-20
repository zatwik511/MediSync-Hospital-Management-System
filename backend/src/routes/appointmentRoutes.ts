import express, { Request, Response } from 'express';
import { appointmentService } from '../services/AppointmentService';

const router = express.Router();

// GET /api/appointments
router.get('/', async (req: Request, res: Response) => {
  try {
    const appointments = await appointmentService.listAppointments(req.staffID);
    res.json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/appointments/count
router.get('/count', async (req: Request, res: Response) => {
  try {
    const count = await appointmentService.getTotalAppointmentCount();
    res.json({ success: true, data: count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/appointments/doctors
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const doctors = await appointmentService.listDoctors();
    res.json({ success: true, data: doctors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/appointments/slots/:doctorID/:date
router.get('/slots/:doctorID/:date', async (req: Request, res: Response) => {
  try {
    const bookedSlots = await appointmentService.getBookedSlots(req.params.doctorID, req.params.date);
    res.json({ success: true, data: bookedSlots });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/appointments/patient/:patientID
router.get('/patient/:patientID', async (req: Request, res: Response) => {
  try {
    const appointments = await appointmentService.getAppointmentsByPatient(
      req.params.patientID, req.staffID
    );
    res.json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const appointment = await appointmentService.getAppointment(req.params.id, req.staffID);
    if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/appointments
router.post('/', async (req: Request, res: Response) => {
  try {
    const { patientID, doctorID, date, time, type, reason } = req.body;
    if (!patientID || !doctorID || !date || !time) {
      return res.status(400).json({ success: false, error: 'patientID, doctorID, date and time are required' });
    }
    const appointment = await appointmentService.createAppointment(
      { patientID, doctorID, date, time, type, reason },
      req.staffID
    );
    res.status(201).json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(error.message.includes('already booked') ? 409 : 500).json({
      success: false, error: error.message,
    });
  }
});

// PUT /api/appointments/:id/reschedule
router.put('/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) return res.status(400).json({ success: false, error: 'New date and time are required' });
    const appointment = await appointmentService.rescheduleAppointment(
      req.params.id, date, time, req.staffID
    );
    res.json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(error.message.includes('already booked') ? 409 : 500).json({
      success: false, error: error.message,
    });
  }
});

// PUT /api/appointments/:id/cancel
router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    await appointmentService.cancelAppointment(req.params.id, req.staffID);
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
