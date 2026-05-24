import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { patientService } from '../services/PatientService';
import { imageService } from '../services/ImageService';
import { financialService } from '../services/FinancialService';

const router = Router();

// GET /api/patient/data/profile
router.get('/profile', asyncHandler(async (req, res) => {
    const patient = await patientService.getPatient(req.patientID!);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
}));

// GET /api/patient/data/images
router.get('/images', asyncHandler(async (req, res) => {
    const images = await imageService.getImagesByPatient(req.patientID!);
    res.json({ success: true, data: images });
}));

// GET /api/patient/data/financial
router.get('/financial', asyncHandler(async (req, res) => {
    const report = await financialService.generateCostReport(req.patientID!);
    res.json({ success: true, data: report });
}));

export default router;
