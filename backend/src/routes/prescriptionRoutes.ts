import { Router, Request, Response } from 'express';
import { prescriptionService } from '../services/PrescriptionService';

const router = Router();

// Bootstrap table on module load
prescriptionService.ensureTable().catch(console.error);

// GET /api/prescriptions/patient/:patientId
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const prescriptions = await prescriptionService.getByPatient(
      req.params.patientId,
      req.staffID
    );
    res.json({ success: true, data: prescriptions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prescriptions
router.post('/', async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/prescriptions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prescriptionService.delete(req.params.id, req.staffID ?? '');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
