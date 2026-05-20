import { pool } from '../database/db';
import { Task, RecordTaskDTO, CostReport } from '../models/types';
import { patientService } from './PatientService';
import { auditService } from './AuditService';

export class FinancialService {

  async recordTask(data: RecordTaskDTO, staffId = ''): Promise<Task> {
    const result = await pool.query(
      `INSERT INTO tasks (patient_id, description, cost, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [data.patientID, data.description, data.cost]
    );
    const newTask = result.rows[0] as Task;
    await this.updatePatientTotalCost(data.patientID);
    await auditService.logAction({
      staffId,
      action: 'CREATE',
      entityType: 'financial',
      entityId: newTask.id,
      description: `Recorded charge "${data.description}" £${data.cost} for patient ${data.patientID}`,
    });
    return newTask;
  }

  async calculateTotalCost(patientID: string): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(cost), 0) as total FROM tasks WHERE patient_id = $1`,
      [patientID]
    );
    return parseFloat(result.rows[0].total);
  }

  async generateCostReport(patientID: string, staffId = ''): Promise<CostReport> {
    const result = await pool.query(`SELECT * FROM tasks WHERE patient_id = $1`, [patientID]);
    const tasks = result.rows as Task[];
    const totalCost = tasks.reduce((sum, t) => sum + Number(t.cost), 0);
    await auditService.logAction({
      staffId,
      action: 'EXPORT',
      entityType: 'financial',
      entityId: patientID,
      description: `Exported cost report for patient ${patientID} (total: £${totalCost.toFixed(2)})`,
    });
    return { patientID, tasks, totalCost, generatedAt: new Date() };
  }

  private async updatePatientTotalCost(patientID: string): Promise<void> {
    const totalCost = await this.calculateTotalCost(patientID);
    await patientService.updateTotalCost(patientID, totalCost);
  }
}

export const financialService = new FinancialService();
