import express, { Request, Response } from 'express';
import { financialService } from '../services/FinancialService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// POST /api/financial/task — admin only
router.post('/task', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { patientID, description, cost } = req.body;
    if (!patientID || !description || cost === undefined) {
      return res.status(400).json({ success: false, error: 'patientID, description, and cost are required' });
    }
    const costNum = Math.round(Number(cost) * 100) / 100;
    if (isNaN(costNum) || costNum <= 0) {
      return res.status(400).json({ success: false, error: 'Cost must be a positive number greater than zero' });
    }
    const task = await financialService.recordTask(
      { patientID, description, cost: costNum },
      req.staffID
    );
    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/financial/cost/:patientID — admin only
router.get('/cost/:patientID', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const totalCost = await financialService.calculateTotalCost(req.params.patientID);
    res.json({ success: true, data: totalCost });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/financial/report/:patientID — admin only
router.get('/report/:patientID', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const report = await financialService.generateCostReport(req.params.patientID, req.staffID);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
