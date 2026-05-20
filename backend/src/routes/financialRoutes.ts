import express, { Request, Response } from 'express';
import { financialService } from '../services/FinancialService';

const router = express.Router();

// POST /api/financial/task
router.post('/task', async (req: Request, res: Response) => {
  try {
    const { patientID, description, cost } = req.body;
    if (!patientID || !description || cost === undefined) {
      return res.status(400).json({ success: false, error: 'patientID, description, and cost are required' });
    }
    if (isNaN(Number(cost)) || Number(cost) < 0) {
      return res.status(400).json({ success: false, error: 'Cost must be a positive number' });
    }
    const task = await financialService.recordTask(
      { patientID, description, cost: Number(cost) },
      req.staffID
    );
    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/financial/cost/:patientID
router.get('/cost/:patientID', async (req: Request, res: Response) => {
  try {
    const totalCost = await financialService.calculateTotalCost(req.params.patientID);
    res.json({ success: true, data: totalCost });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/financial/report/:patientID
router.get('/report/:patientID', async (req: Request, res: Response) => {
  try {
    const report = await financialService.generateCostReport(req.params.patientID, req.staffID);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
