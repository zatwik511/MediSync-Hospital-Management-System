import { Router, Request, Response } from 'express';
import { staffService } from '../services/StaffService';
import { auditService } from '../services/AuditService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { staff_code, pin } = req.body;
  const ip = req.ip;

  if (!staff_code || !pin) {
    return res.status(400).json({ success: false, error: 'Staff code and PIN are required' });
  }

  try {
    const staff = await staffService.verifyLogin(staff_code, pin);

    if (!staff) {
      return res.status(401).json({ success: false, error: 'Invalid staff code or PIN' });
    }

    // Record previous login time, then stamp last_seen = NOW()
    const lastLogin = await staffService.touchLastSeen(staff.id);

    await auditService.logAction({
      staffId: staff.id,
      staffName: staff.name,
      action: 'LOGIN',
      entityType: 'auth',
      description: `Logged in as ${staff.role} (${staff.staff_code})`,
      ipAddress: ip,
    });

    return res.json({
      success: true,
      data: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        staff_code: staff.staff_code,
        last_login: lastLogin ?? null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  const staffId = req.staffID as string;
  const ip = req.ip;

  await auditService.logAction({
    staffId,
    action: 'LOGOUT',
    entityType: 'auth',
    description: 'Logged out',
    ipAddress: ip,
  });

  res.json({ success: true });
});

export default router;
