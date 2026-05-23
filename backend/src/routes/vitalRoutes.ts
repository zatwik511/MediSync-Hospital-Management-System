import express, { Request, Response } from 'express';
import { vitalService } from '../services/VitalService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/vitals/:patientId — all roles
router.get('/:patientId', async (req: Request, res: Response) => {
  try {
    const vitals = await vitalService.getVitals(req.params.patientId);
    res.json({ success: true, data: vitals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vitals — admin, doctor, receptionist
router.post('/', requireRole('admin', 'doctor', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { patientId, recordedBy, ...rest } = req.body;
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId is required' });
    }
    const vital = await vitalService.recordVitals({ patientId, recordedBy: recordedBy || req.staffID || '', ...rest });
    res.status(201).json({ success: true, data: vital });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/vitals/:id — admin, doctor
router.delete('/:id', requireRole('admin', 'doctor'), async (req: Request, res: Response) => {
  try {
    await vitalService.deleteVital(req.params.id);
    res.json({ success: true, message: 'Vital record deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
