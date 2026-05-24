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

// GET /api/audit/export — admin only, streams a CSV of all matching log entries
router.get('/export', requireRole('admin'), asyncHandler(async (req, res) => {
    const { entityType, action } = req.query as Record<string, string>;
    const logs = await auditService.getAllLogsForExport({ entityType, action });

    await auditService.logAction({
      staffId: req.staffID ?? '',
      action: 'EXPORT',
      entityType: 'audit',
      description: `Exported ${logs.length} audit log entries to CSV`,
    });

    const escape = (val: string | null | undefined): string => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = ['Timestamp', 'Staff Name', 'Action', 'Entity Type', 'Entity ID', 'Description', 'IP Address'];
    const rows = logs.map(l => [
      new Date(l.created_at).toISOString(),
      l.staff_name,
      l.action,
      l.entity_type,
      l.entity_id ?? '',
      l.description,
      l.ip_address ?? '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
    const filename = `audit-logs-${new Date().toLocaleDateString('en-CA')}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
}));

// GET /api/audit/staff/:staffId — admin only
router.get('/staff/:staffId', requireRole('admin'), asyncHandler(async (req, res) => {
    const pagination = parsePaginationParams(req.query as Record<string, string>);
    if ('error' in pagination) return res.status(400).json({ success: false, error: pagination.error });
    const result = await auditService.getLogsByStaff(req.params.staffId, pagination.page, pagination.limit);
    res.json({ success: true, data: result });
}));

export default router;
