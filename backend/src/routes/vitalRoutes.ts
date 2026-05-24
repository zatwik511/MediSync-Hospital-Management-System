import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { vitalService } from '../services/VitalService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/vitals/:patientId — all roles
router.get('/:patientId', asyncHandler(async (req, res) => {
    const vitals = await vitalService.getVitals(req.params.patientId);
    res.json({ success: true, data: vitals });
}));

// POST /api/vitals — admin, doctor, receptionist
router.post('/', requireRole('admin', 'doctor', 'receptionist'), asyncHandler(async (req, res) => {
    const { patientId, recordedBy, ...rest } = req.body;
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }
    const vital = await vitalService.recordVitals({ patientId, recordedBy: recordedBy || req.staffID || '', ...rest });
    res.status(201).json({ success: true, data: vital });
}));

// DELETE /api/vitals/:id — admin, doctor
router.delete('/:id', requireRole('admin', 'doctor'), asyncHandler(async (req, res) => {
    await vitalService.deleteVital(req.params.id);
    res.json({ success: true, message: 'Vital record deleted' });
}));

export default router;
