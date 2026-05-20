import { Router, Request, Response } from 'express';
import { patientAuthService } from '../services/PatientAuthService';

const router = Router();

// POST /api/patient-auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, pin } = req.body;

  if (!name || !email || !pin) {
    return res.status(400).json({ success: false, error: 'Name, email, and PIN are required' });
  }

  try {
    const patient = await patientAuthService.register(name.trim(), email.trim(), pin);
    return res.status(201).json({ success: true, data: patient });
  } catch (err: any) {
    const status = err.message.includes('already exists') ? 409 : 400;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// POST /api/patient-auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, pin } = req.body;

  if (!email || !pin) {
    return res.status(400).json({ success: false, error: 'Email and PIN are required' });
  }

  try {
    const patient = await patientAuthService.login(email.trim(), pin);
    if (!patient) {
      return res.status(401).json({ success: false, error: 'Invalid email or PIN' });
    }
    return res.json({ success: true, data: patient });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
