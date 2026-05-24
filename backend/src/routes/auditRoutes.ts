import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { auditService } from '../services/AuditService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

function parsePaginationParams(query: Record<string, string>): { page: number; limit: number } | { error: string } {
  const page  = parseInt(query.page  || '1',  10);
  const limit = parseInt(query.limit || '50', 10);
  if (!Number.isInteger(page)  || page  < 1)                   return { error: 'page must be a positive integer' };
  if (!Number.isInteger(limit) || limit < 1 || limit > 200)    return { error: 'limit must be between 1 and 200' };
  return { page, limit };
}

// GET /api/audit — admin only
router.get('/', requireRole('admin'), asyncHandler(async (req, res) => {
    const { entityType, action } = req.query as Record<string, string>;
    const pagination = parsePaginationParams(req.query as Record<string, string>);
    if ('error' in pagination) return res.status(400).json({ success: false, error: pagination.error });
    const result = await auditService.getLogs({ entityType, action }, pagination.page, pagination.limit);
    res.json({ success: true, data: result });
}));

// GET /api/audit/staff/:staffId — admin only
router.get('/staff/:staffId', requireRole('admin'), asyncHandler(async (req, res) => {
    const pagination = parsePaginationParams(req.query as Record<string, string>);
    if ('error' in pagination) return res.status(400).json({ success: false, error: pagination.error });
    const result = await auditService.getLogsByStaff(req.params.staffId, pagination.page, pagination.limit);
    res.json({ success: true, data: result });
}));

export default router;
