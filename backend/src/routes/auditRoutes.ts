import express, { Request, Response } from 'express';
import { auditService } from '../services/AuditService';
import { staffService } from '../services/StaffService';

const router = express.Router();

// GET /api/audit — all logs (admin only), supports ?entityType=&action= filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const adminOk = await staffService.isAdmin(req.staffID as string);
    if (!adminOk) return res.status(403).json({ success: false, error: 'Admin access required' });

    const { entityType, action } = req.query as { entityType?: string; action?: string };
    const logs = await auditService.getLogs({ entityType, action });
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/audit/staff/:staffId — logs for a specific staff member (admin only)
router.get('/staff/:staffId', async (req: Request, res: Response) => {
  try {
    const adminOk = await staffService.isAdmin(req.staffID as string);
    if (!adminOk) return res.status(403).json({ success: false, error: 'Admin access required' });

    const logs = await auditService.getLogsByStaff(req.params.staffId);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
