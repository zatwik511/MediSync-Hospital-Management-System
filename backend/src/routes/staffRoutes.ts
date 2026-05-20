import express, { Request, Response } from 'express';
import { staffService } from '../services/StaffService';

const router = express.Router();

// POST /api/staff - Create staff member
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, address, role, specialization } = req.body;

    if (!name || !address || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, address, and role are required',
      });
    }

    const staff = await staffService.createStaff({
      name,
      address,
      role,
      specialization: specialization || '',
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/staff - List all staff
router.get('/', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.listStaff();
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/staff/:id - Get staff by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.getStaff(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/staff/:id/reset-pin - Admin-only PIN reset
router.post('/:id/reset-pin', async (req: Request, res: Response) => {
  try {
    const requestingId = req.staffID as string;
    const adminOk = await staffService.isAdmin(requestingId);
    if (!adminOk) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { newPin } = req.body;
    if (!newPin || !/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ success: false, error: 'PIN must be exactly 6 digits' });
    }

    await staffService.resetPin(req.params.id, newPin);
    res.json({ success: true, message: 'PIN reset successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/staff/:id - Delete staff
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await staffService.deleteStaff(req.params.id);
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
