import express, { Request, Response } from 'express';
import { reportService } from '../services/ReportService';
import { pool } from '../database/db';

const router = express.Router();

// GET /api/reports/patient/:patientID - Generate patient history
router.get('/patient/:patientID', async (req: Request, res: Response) => {
  try {
    const patientID = req.params.patientID as string;
    const report = await reportService.generatePatientHistory(patientID);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/diagnostic/:patientID - Generate diagnostic report
router.get('/diagnostic/:patientID', async (req: Request, res: Response) => {
  try {
    const patientID = req.params.patientID as string;
    const report = await reportService.generateDiagnosticReport(patientID);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/appointment-analytics - Appointment stats for analytics tab
router.get('/appointment-analytics', async (req: Request, res: Response) => {
  try {
    // Total counts by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM appointments
      GROUP BY status
      ORDER BY count DESC
    `);

    // Total counts by type
    const typeResult = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM appointments
      GROUP BY type
      ORDER BY count DESC
    `);

    // Appointments per doctor
    const doctorResult = await pool.query(`
      SELECT d.name as doctor_name, d.specialty, COUNT(a.id) as count
      FROM doctors d
      LEFT JOIN appointments a ON a.doctor_id = d.id AND a.status != 'Cancelled'
      GROUP BY d.id, d.name, d.specialty
      ORDER BY count DESC
    `);

    // Appointments per month (last 6 months)
    const monthlyResult = await pool.query(`
      SELECT
        TO_CHAR(date, 'Mon YYYY') as month,
        TO_CHAR(date, 'YYYY-MM') as month_key,
        COUNT(*) as count
      FROM appointments
      WHERE date >= NOW() - INTERVAL '6 months'
      GROUP BY month, month_key
      ORDER BY month_key ASC
    `);

    // Cancellation rate
    const totalResult = await pool.query(`SELECT COUNT(*) as total FROM appointments`);
    const cancelledResult = await pool.query(`SELECT COUNT(*) as total FROM appointments WHERE status = 'Cancelled'`);

    const total = parseInt(totalResult.rows[0].total, 10);
    const cancelled = parseInt(cancelledResult.rows[0].total, 10);
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    const fulfilmentRate = 100 - cancellationRate;

    res.json({
      success: true,
      data: {
        totalAppointments: total,
        fulfilmentRate,
        cancellationRate,
        byStatus: statusResult.rows.map(r => ({ label: r.status, count: parseInt(r.count, 10) })),
        byType: typeResult.rows.map(r => ({ label: r.type, count: parseInt(r.count, 10) })),
        byDoctor: doctorResult.rows.map(r => ({
          name: r.doctor_name,
          specialty: r.specialty,
          count: parseInt(r.count, 10),
        })),
        monthly: monthlyResult.rows.map(r => ({
          month: r.month,
          count: parseInt(r.count, 10),
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;