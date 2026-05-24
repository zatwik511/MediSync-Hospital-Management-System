import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { financialService } from '../services/FinancialService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// POST /api/financial/task — admin only
router.post('/task', requireRole('admin'), asyncHandler(async (req, res) => {
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
}));

// GET /api/financial/cost/:patientID — admin only
router.get('/cost/:patientID', requireRole('admin'), asyncHandler(async (req, res) => {
    const totalCost = await financialService.calculateTotalCost(req.params.patientID);
    res.json({ success: true, data: totalCost });
}));

// GET /api/financial/report/:patientID — admin only
router.get('/report/:patientID', requireRole('admin'), asyncHandler(async (req, res) => {
    const report = await financialService.generateCostReport(req.params.patientID, req.staffID);
    res.json({ success: true, data: report });
}));

export default router;
