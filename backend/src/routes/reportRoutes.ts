import express, { Request, Response } from 'express';
import { reportService } from '../services/ReportService';
import { pool } from '../database/db';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/reports/patient/:patientID — all roles
router.get('/patient/:patientID', async (req: Request, res: Response) => {
  try {
    const patientID = req.params.patientID as string;
    const report = await reportService.generatePatientHistory(patientID);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/diagnostic/:patientID — admin, doctor, radiologist
router.get('/diagnostic/:patientID', requireRole('admin', 'doctor', 'radiologist'), async (req: Request, res: Response) => {
  try {
    const patientID = req.params.patientID as string;
    const report = await reportService.generateDiagnosticReport(patientID);
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/appointment-analytics — admin only
router.get('/appointment-analytics', requireRole('admin'), async (req: Request, res: Response) => {
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

// GET /api/reports/appointment-analytics/advanced — admin only
router.get('/appointment-analytics/advanced', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    // Busiest day of week (0=Sun … 6=Sat), non-cancelled only
    const dowResult = await pool.query(`
      SELECT
        EXTRACT(DOW FROM date::date)::int AS day_of_week,
        COUNT(*) AS count
      FROM appointments
      WHERE status != 'Cancelled'
      GROUP BY day_of_week
      ORDER BY day_of_week
    `);

    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const busiestDays = dowResult.rows.map(r => ({
      day: r.day_of_week,
      dayName: DAY_NAMES[r.day_of_week] ?? `Day ${r.day_of_week}`,
      count: parseInt(r.count, 10),
    }));

    // Busiest time slot
    const slotResult = await pool.query(`
      SELECT time, COUNT(*) AS count
      FROM appointments
      WHERE status != 'Cancelled'
      GROUP BY time
      ORDER BY count DESC
    `);
    const busiestSlots = slotResult.rows.map(r => ({
      time: r.time,
      count: parseInt(r.count, 10),
    }));

    // Average appointments per week over last 3 months (~13 weeks)
    const avgResult = await pool.query(`
      SELECT COUNT(*) AS total
      FROM appointments
      WHERE date >= NOW() - INTERVAL '3 months'
        AND status != 'Cancelled'
    `);
    const avgPerWeek = parseFloat((parseInt(avgResult.rows[0].total, 10) / 13).toFixed(1));

    // Top 5 most common reasons (non-null/empty)
    const reasonResult = await pool.query(`
      SELECT reason, COUNT(*) AS count
      FROM appointments
      WHERE reason IS NOT NULL AND TRIM(reason) != ''
        AND status != 'Cancelled'
      GROUP BY reason
      ORDER BY count DESC
      LIMIT 5
    `);
    const topReasons = reasonResult.rows.map(r => ({
      reason: r.reason,
      count: parseInt(r.count, 10),
    }));

    // Month-over-month trend
    const trendResult = await pool.query(`
      SELECT
        COUNT(CASE WHEN TO_CHAR(date::date, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM') THEN 1 END)::int AS this_month,
        COUNT(CASE WHEN TO_CHAR(date::date, 'YYYY-MM') = TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM') THEN 1 END)::int AS last_month
      FROM appointments
      WHERE date::date >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        AND status != 'Cancelled'
    `);
    const thisMonth = trendResult.rows[0].this_month;
    const lastMonth = trendResult.rows[0].last_month;
    const changePercent = lastMonth > 0
      ? parseFloat((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1))
      : null;

    // Heatmap: count by (day_of_week, time) for grid rendering
    const heatmapResult = await pool.query(`
      SELECT
        EXTRACT(DOW FROM date::date)::int AS day_of_week,
        time,
        COUNT(*) AS count
      FROM appointments
      WHERE status != 'Cancelled'
      GROUP BY day_of_week, time
      ORDER BY day_of_week, time
    `);
    const heatmap = heatmapResult.rows.map(r => ({
      day: r.day_of_week,
      time: r.time,
      count: parseInt(r.count, 10),
    }));

    res.json({
      success: true,
      data: {
        busiestDays,
        busiestSlots,
        avgPerWeek,
        topReasons,
        trend: { thisMonth, lastMonth, changePercent },
        heatmap,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;