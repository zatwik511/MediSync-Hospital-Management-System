import express, { Request, Response } from 'express';
import { staffService } from '../services/StaffService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// POST /api/staff — admin only
router.post('/', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { name, address, role, specialization } = req.body;
    if (!name || !address || !role) {
      return res.status(400).json({ success: false, error: 'Name, address, and role are required' });
    }
    if (name.length > 255)                               return res.status(400).json({ success: false, error: 'Name must be 255 characters or fewer' });
    if (address.length > 500)                            return res.status(400).json({ success: false, error: 'Address must be 500 characters or fewer' });
    if (specialization && specialization.length > 255)   return res.status(400).json({ success: false, error: 'Specialization must be 255 characters or fewer' });
    const staff = await staffService.createStaff(
      { name, address, role, specialization: specialization || '' },
      req.staffID
    );
    res.status(201).json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/staff — all roles
router.get('/', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.listStaff(req.staffID);
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/staff/:id — all roles
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const staff = await staffService.getStaff(req.params.id);
    if (!staff) return res.status(404).json({ success: false, error: 'Staff not found' });
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/staff/:id/reset-pin — admin only
router.post('/:id/reset-pin', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { newPin } = req.body;
    if (!newPin || !/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ success: false, error: 'PIN must be exactly 6 digits' });
    }
    await staffService.resetPin(req.params.id, newPin, req.staffID);
    res.json({ success: true, message: 'PIN reset successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/staff/:id — admin only
router.delete('/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    await staffService.deleteStaff(req.params.id, req.staffID);
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
