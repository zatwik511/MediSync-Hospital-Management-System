import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { patientService } from '../services/PatientService';
import { imageService } from '../services/ImageService';
import { financialService } from '../services/FinancialService';
import { validateAllergies } from '../services/patientValidation';

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

// PUT /api/patient/data/profile — patients may update non-clinical personal fields only
router.put('/profile', asyncHandler(async (req, res) => {
    const { phone, address, gender, emergencyContactName, emergencyContactRelationship, emergencyContactPhone, allergies } = req.body;

    // Validate any submitted allergies before persisting
    if (allergies !== undefined) validateAllergies(allergies);

    // Length guards
    if (address !== undefined && address.length > 500) return res.status(400).json({ success: false, error: 'Address must be 500 characters or fewer' });
    if (phone !== undefined && phone.length > 50) return res.status(400).json({ success: false, error: 'Phone must be 50 characters or fewer' });

    const allowed: Record<string, unknown> = {};
    if (phone !== undefined)                       allowed.phone = phone || null;
    if (address !== undefined)                     allowed.address = address;
    if (gender !== undefined)                      allowed.gender = gender || null;
    if (emergencyContactName !== undefined)        allowed.emergencyContactName = emergencyContactName || null;
    if (emergencyContactRelationship !== undefined) allowed.emergencyContactRelationship = emergencyContactRelationship || null;
    if (emergencyContactPhone !== undefined)       allowed.emergencyContactPhone = emergencyContactPhone || null;
    if (allergies !== undefined)                   allowed.allergies = allergies;

    if (Object.keys(allowed).length === 0) return res.status(400).json({ success: false, error: 'No editable fields provided' });

    const patient = await patientService.updatePatient(req.patientID!, allowed as any);
    res.json({ success: true, data: patient });
}));

export default router;
