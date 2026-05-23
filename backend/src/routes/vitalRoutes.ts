import express, { Request, Response } from 'express';
import { vitalService } from '../services/VitalService';

const router = express.Router();

// GET /api/vitals/:patientId
router.get('/:patientId', async (req: Request, res: Response) => {
  try {
    const vitals = await vitalService.getVitals(req.params.patientId);
    res.json({ success: true, data: vitals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vitals
router.post('/', async (req: Request, res: Response) => {
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

// DELETE /api/vitals/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await vitalService.deleteVital(req.params.id);
    res.json({ success: true, message: 'Vital record deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
