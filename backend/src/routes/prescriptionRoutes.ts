import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { prescriptionService } from '../services/PrescriptionService';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

// Bootstrap table on module load
prescriptionService.ensureTable().catch(console.error);

// GET /api/prescriptions/patient/:patientId — all roles
router.get('/patient/:patientId', asyncHandler(async (req, res) => {
    const prescriptions = await prescriptionService.getByPatient(
      req.params.patientId,
      req.staffID
    );
    res.json({ success: true, data: prescriptions });
}));

// POST /api/prescriptions — admin, doctor
router.post('/', requireRole('admin', 'doctor'), asyncHandler(async (req, res) => {
    const { patientId, medications, advice } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }
    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one medication is required' });
    }
    for (const med of medications) {
      if (!med.name?.trim()) {
        return res.status(400).json({ success: false, error: 'Each medication must have a name' });
      }
    }

    const prescription = await prescriptionService.create(
      { patientId, medications, advice },
      req.staffID ?? ''
    );
    res.status(201).json({ success: true, data: prescription });
}));

// DELETE /api/prescriptions/:id — admin, doctor
router.delete('/:id', requireRole('admin', 'doctor'), asyncHandler(async (req, res) => {
    await prescriptionService.delete(req.params.id, req.staffID ?? '');
    res.json({ success: true });
}));

export default router;
