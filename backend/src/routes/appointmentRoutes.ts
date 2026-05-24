import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { appointmentService } from '../services/AppointmentService';
import type { AvailabilitySlot } from '../services/AppointmentService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/appointments — all roles
router.get('/', asyncHandler(async (req, res) => {
    const { page, limit, search = '' } = req.query as Record<string, string>;
    if (page) {
      const pageNum  = parseInt(page, 10);
      const limitNum = parseInt(limit || '20', 10);
      if (!Number.isInteger(pageNum)  || pageNum  < 1)         return res.status(400).json({ success: false, error: 'page must be a positive integer' });
      if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) return res.status(400).json({ success: false, error: 'limit must be between 1 and 100' });
      const result = await appointmentService.listAppointmentsPaginated(pageNum, limitNum, search, req.staffID);
      return res.json({ success: true, data: result });
    }
    const appointments = await appointmentService.listAppointments(req.staffID);
    res.json({ success: true, data: appointments });
}));

// GET /api/appointments/count — all roles
router.get('/count', asyncHandler(async (req, res) => {
    const count = await appointmentService.getTotalAppointmentCount();
    res.json({ success: true, data: count });
}));

// GET /api/appointments/doctors — all roles
router.get('/doctors', asyncHandler(async (req, res) => {
    const doctors = await appointmentService.listDoctors();
    res.json({ success: true, data: doctors });
}));

// GET /api/appointments/slots/:doctorId/:date — all roles, returns available (bookable) slots
router.get('/slots/:doctorId/:date', asyncHandler(async (req, res) => {
    const result = await appointmentService.getAvailableSlots(req.params.doctorId, req.params.date);
    res.json({ success: true, data: result });
}));

// GET /api/appointments/availability/:doctorId — all roles
router.get('/availability/:doctorId', asyncHandler(async (req, res) => {
    const slots = await appointmentService.getDoctorAvailability(req.params.doctorId);
    res.json({ success: true, data: slots });
}));

// PUT /api/appointments/availability/:doctorId — admin only
router.put('/availability/:doctorId', requireRole('admin'), asyncHandler(async (req, res) => {
    const { slots } = req.body as { slots: AvailabilitySlot[] };
    if (!Array.isArray(slots)) {
      return res.status(400).json({ success: false, error: 'slots must be an array' });
    }
    await appointmentService.setDoctorAvailability(req.params.doctorId, slots);
    res.json({ success: true });
}));

// GET /api/appointments/patient/:patientId — all roles
router.get('/patient/:patientId', asyncHandler(async (req, res) => {
    const appointments = await appointmentService.getAppointmentsByPatient(
      req.params.patientId, req.staffID
    );
    res.json({ success: true, data: appointments });
}));

// GET /api/appointments/:id — all roles
router.get('/:id', asyncHandler(async (req, res) => {
    const appointment = await appointmentService.getAppointment(req.params.id, req.staffID);
    if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });
    res.json({ success: true, data: appointment });
}));

// POST /api/appointments — admin, receptionist
router.post('/', requireRole('admin', 'receptionist'), asyncHandler(async (req, res) => {
    const { patientID, doctorID, date, time, type, reason } = req.body;
    if (!patientID || !doctorID || !date || !time) {
      return res.status(400).json({ success: false, error: 'patientID, doctorID, date and time are required' });
    }
    const appointment = await appointmentService.createAppointment(
      { patientID, doctorID, date, time, type, reason },
      req.staffID
    );
    res.status(201).json({ success: true, data: appointment });
}));

// PUT /api/appointments/:id/reschedule — admin, receptionist
router.put('/:id/reschedule', requireRole('admin', 'receptionist'), asyncHandler(async (req, res) => {
    const { date, time } = req.body;
    if (!date || !time) return res.status(400).json({ success: false, error: 'New date and time are required' });
    const appointment = await appointmentService.rescheduleAppointment(
      req.params.id, date, time, req.staffID
    );
    res.json({ success: true, data: appointment });
}));

// PUT /api/appointments/:id/cancel — admin, receptionist, doctor
router.put('/:id/cancel', requireRole('admin', 'receptionist', 'doctor'), asyncHandler(async (req, res) => {
    await appointmentService.cancelAppointment(req.params.id, req.staffID);
    res.json({ success: true, message: 'Appointment cancelled successfully' });
}));

export default router;
