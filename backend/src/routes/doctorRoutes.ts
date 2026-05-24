import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { pool } from '../database/db';
import { auditService } from '../services/AuditService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

interface DoctorRow {
  id: string;
  name: string;
  specialty: string;
  available_days: string[];
  staff_id: string | null;
  created_at: string;
}

function transformRow(row: DoctorRow) {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    availableDays: row.available_days,
    staffId: row.staff_id || null,
    createdAt: row.created_at,
  };
}

// GET /api/doctors/deleted — admin only, list soft-deleted doctors
router.get('/deleted', requireRole('admin'), asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT * FROM doctors WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`
    );
    res.json({ success: true, data: result.rows.map(transformRow) });
}));

// GET /api/doctors — all roles, excludes soft-deleted
router.get('/', asyncHandler(async (req, res) => {
    const result = await pool.query(`SELECT * FROM doctors WHERE deleted_at IS NULL ORDER BY name ASC`);
    res.json({ success: true, data: result.rows.map(transformRow) });
}));

// POST /api/doctors — admin only
router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
    const { name, specialty, availableDays, staffId } = req.body;
    if (!name?.trim() || !specialty?.trim()) {
      return res.status(400).json({ success: false, error: 'Name and specialty are required' });
    }
    if (name.length > 255)      return res.status(400).json({ success: false, error: 'Name must be 255 characters or fewer' });
    if (specialty.length > 255) return res.status(400).json({ success: false, error: 'Specialty must be 255 characters or fewer' });
    const days = Array.isArray(availableDays) ? availableDays : [];
    const result = await pool.query(
      `INSERT INTO doctors (name, specialty, available_days, staff_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), specialty.trim(), days, staffId || null]
    );
    const doctor = transformRow(result.rows[0]);
    await auditService.logAction({
      staffId: req.staffID ?? '',
      action: 'CREATE',
      entityType: 'doctor',
      entityId: doctor.id,
      description: `Created doctor ${name} (${specialty})`,
    });
    res.status(201).json({ success: true, data: doctor });
}));

// PUT /api/doctors/:id — admin only
router.put('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
    const { name, specialty, availableDays, staffId } = req.body;
    if (!name?.trim() || !specialty?.trim()) {
      return res.status(400).json({ success: false, error: 'Name and specialty are required' });
    }
    if (name.length > 255)      return res.status(400).json({ success: false, error: 'Name must be 255 characters or fewer' });
    if (specialty.length > 255) return res.status(400).json({ success: false, error: 'Specialty must be 255 characters or fewer' });
    const days = Array.isArray(availableDays) ? availableDays : [];
    const result = await pool.query(
      `UPDATE doctors SET name = $1, specialty = $2, available_days = $3, staff_id = $4 WHERE id = $5 RETURNING *`,
      [name.trim(), specialty.trim(), days, staffId || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    const doctor = transformRow(result.rows[0]);
    await auditService.logAction({
      staffId: req.staffID ?? '',
      action: 'UPDATE',
      entityType: 'doctor',
      entityId: doctor.id,
      description: `Updated doctor ${name}`,
    });
    res.json({ success: true, data: doctor });
}));

// DELETE /api/doctors/:id — admin only (soft delete)
router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
    const result = await pool.query(
      `UPDATE doctors SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING name`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    await auditService.logAction({
      staffId: req.staffID ?? '',
      action: 'DELETE',
      entityType: 'doctor',
      entityId: req.params.id,
      description: `Soft-deleted doctor ${result.rows[0].name}`,
    });
    res.json({ success: true, message: 'Doctor deleted successfully' });
}));

// POST /api/doctors/:id/restore — admin only
router.post('/:id/restore', requireRole('admin'), asyncHandler(async (req, res) => {
    const result = await pool.query(
      `UPDATE doctors SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor not found or is not deleted' });
    }
    const doctor = transformRow(result.rows[0]);
    await auditService.logAction({
      staffId: req.staffID ?? '',
      action: 'UPDATE',
      entityType: 'doctor',
      entityId: req.params.id,
      description: `Restored doctor ${doctor.name}`,
    });
    res.json({ success: true, data: doctor });
}));

export default router;
