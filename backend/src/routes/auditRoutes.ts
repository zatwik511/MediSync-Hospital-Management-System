import express, { Request, Response } from 'express';
import { auditService } from '../services/AuditService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/audit — admin only
router.get('/', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { entityType, action } = req.query as { entityType?: string; action?: string };
    const logs = await auditService.getLogs({ entityType, action });
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/audit/staff/:staffId — admin only
router.get('/staff/:staffId', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const logs = await auditService.getLogsByStaff(req.params.staffId);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
