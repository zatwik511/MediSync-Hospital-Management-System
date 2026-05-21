import { Router, Request, Response } from 'express';
import { patientService } from '../services/PatientService';
import { imageService } from '../services/ImageService';
import { financialService } from '../services/FinancialService';

const router = Router();

// GET /api/patient/data/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const patient = await patientService.getPatient(req.patientID!);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/patient/data/images
router.get('/images', async (req: Request, res: Response) => {
  try {
    const images = await imageService.getImagesByPatient(req.patientID!);
    res.json({ success: true, data: images });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/patient/data/financial
router.get('/financial', async (req: Request, res: Response) => {
  try {
    const report = await financialService.generateCostReport(req.patientID!);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
