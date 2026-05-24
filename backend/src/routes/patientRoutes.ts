import express, { Request, Response } from 'express';
import { patientService } from '../services/PatientService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// POST /api/patients — admin, receptionist
router.post('/', requireRole('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { name, address, conditions } = req.body;
    if (!name || !address) {
      return res.status(400).json({ success: false, error: 'Name and address are required' });
    }
    if (name.length > 255)    return res.status(400).json({ success: false, error: 'Name must be 255 characters or fewer' });
    if (address.length > 500) return res.status(400).json({ success: false, error: 'Address must be 500 characters or fewer' });
    const patient = await patientService.createPatient(
      { name, address, conditions: conditions || [] },
      req.staffID
    );
    res.status(201).json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/patients/:id — all roles
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const patient = await patientService.getPatient(req.params.id, req.staffID);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/patients — all roles
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, limit, search = '' } = req.query as Record<string, string>;
    if (page) {
      const pageNum  = parseInt(page, 10);
      const limitNum = parseInt(limit || '20', 10);
      if (!Number.isInteger(pageNum)  || pageNum  < 1)         return res.status(400).json({ success: false, error: 'page must be a positive integer' });
      if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) return res.status(400).json({ success: false, error: 'limit must be between 1 and 100' });
      const result = await patientService.listPatientsPaginated(pageNum, limitNum, search, req.staffID);
      return res.json({ success: true, data: result });
    }
    const patients = await patientService.listPatients(req.staffID);
    res.json({ success: true, data: patients });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/patients/:id — admin only
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await patientService.deletePatient(req.params.id, req.staffID);
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/patients/:id — admin, receptionist
router.put('/:id', requireRole('admin', 'receptionist'), async (req: Request, res: Response) => {
  try {
    const { name, address, diagnosis } = req.body;
    if (name      !== undefined && name.length      > 255)  return res.status(400).json({ success: false, error: 'Name must be 255 characters or fewer' });
    if (address   !== undefined && address.length   > 500)  return res.status(400).json({ success: false, error: 'Address must be 500 characters or fewer' });
    if (diagnosis !== undefined && diagnosis.length > 2000) return res.status(400).json({ success: false, error: 'Diagnosis must be 2000 characters or fewer' });
    const patient = await patientService.updatePatient(req.params.id, req.body, req.staffID);
    res.json({ success: true, data: patient });
  } catch (error: any) {
    const status = error.code === 'CONFLICT' ? 409 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// PUT /api/patients/:id/diagnosis — admin, doctor
router.put('/:id/diagnosis', requireRole('admin', 'doctor'), async (req: Request, res: Response) => {
  try {
    const { diagnosis } = req.body;
    if (!diagnosis) return res.status(400).json({ success: false, error: 'Diagnosis is required' });
    if (diagnosis.length > 2000) return res.status(400).json({ success: false, error: 'Diagnosis must be 2000 characters or fewer' });
    const patient = await patientService.updateDiagnosis(req.params.id, diagnosis, req.staffID);
    res.json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
