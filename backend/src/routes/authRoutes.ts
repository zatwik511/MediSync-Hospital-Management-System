import { Router, Request, Response } from 'express';
import { staffService } from '../services/StaffService';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { staff_code, pin } = req.body;

  if (!staff_code || !pin) {
    return res.status(400).json({ success: false, error: 'Staff code and PIN are required' });
  }

  try {
    const staff = await staffService.verifyLogin(staff_code, pin);

    if (!staff) {
      return res.status(401).json({ success: false, error: 'Invalid staff code or PIN' });
    }

    return res.json({
      success: true,
      data: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        staff_code: staff.staff_code,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
