import express, { Request, Response } from 'express';
import { pool } from '../database/db';
import { auditService } from '../services/AuditService';

const router = express.Router();

function transformRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    availableDays: row.available_days,
    createdAt: row.created_at,
  };
}

// GET /api/doctors
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM doctors ORDER BY name ASC`);
    res.json({ success: true, data: result.rows.map(transformRow) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/doctors
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, specialty, availableDays } = req.body;
    if (!name?.trim() || !specialty?.trim()) {
      return res.status(400).json({ success: false, error: 'Name and specialty are required' });
    }
    const days = Array.isArray(availableDays) ? availableDays : [];
    const result = await pool.query(
      `INSERT INTO doctors (name, specialty, available_days) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), specialty.trim(), days]
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/doctors/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, specialty, availableDays } = req.body;
    if (!name?.trim() || !specialty?.trim()) {
      return res.status(400).json({ success: false, error: 'Name and specialty are required' });
    }
    const days = Array.isArray(availableDays) ? availableDays : [];
    const result = await pool.query(
      `UPDATE doctors SET name = $1, specialty = $2, available_days = $3 WHERE id = $4 RETURNING *`,
      [name.trim(), specialty.trim(), days, req.params.id]
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/doctors/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `DELETE FROM doctors WHERE id = $1 RETURNING name`,
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
      description: `Deleted doctor ${result.rows[0].name}`,
    });
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
