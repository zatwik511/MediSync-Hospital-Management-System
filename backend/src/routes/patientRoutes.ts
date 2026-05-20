import express, { Request, Response } from 'express';
import { patientService } from '../services/PatientService';

const router = express.Router();

// POST /api/patients
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, address, conditions } = req.body;
    if (!name || !address) {
      return res.status(400).json({ success: false, error: 'Name and address are required' });
    }
    const patient = await patientService.createPatient(
      { name, address, conditions: conditions || [] },
      req.staffID
    );
    res.status(201).json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/patients/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const patient = await patientService.getPatient(req.params.id, req.staffID);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/patients
router.get('/', async (req: Request, res: Response) => {
  try {
    const patients = await patientService.listPatients(req.staffID);
    res.json({ success: true, data: patients });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await patientService.deletePatient(req.params.id, req.staffID);
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/patients/:id/diagnosis
router.put('/:id/diagnosis', async (req: Request, res: Response) => {
  try {
    const { diagnosis } = req.body;
    if (!diagnosis) return res.status(400).json({ success: false, error: 'Diagnosis is required' });
    const patient = await patientService.updateDiagnosis(req.params.id, diagnosis, req.staffID);
    res.json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
