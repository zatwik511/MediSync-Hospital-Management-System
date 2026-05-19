import { pool } from '../database/db';
import { Task, RecordTaskDTO, CostReport } from '../models/types';
import { patientService } from './PatientService';

export class FinancialService {

  // Method 1: Record a new task/charge
  async recordTask(data: RecordTaskDTO): Promise<Task> {
    const result = await pool.query(
      `INSERT INTO tasks (patient_id, description, cost, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [data.patientID, data.description, data.cost]
    );

    const newTask = result.rows[0] as Task;

    // Sync the total cost to the Patient service
    await this.updatePatientTotalCost(data.patientID);
    return newTask;
  }

  // Method 2: Calculate total cost using a database query
  async calculateTotalCost(patientID: string): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(cost), 0) as total FROM tasks WHERE patient_id = $1`,
      [patientID]
    );

    return parseFloat(result.rows[0].total);
  }

  // Method 3: Generate report from live database data
  async generateCostReport(patientID: string): Promise<CostReport> {
    const result = await pool.query(
      `SELECT * FROM tasks WHERE patient_id = $1`,
      [patientID]
    );

    const tasks = result.rows as Task[];
    const totalCost = tasks.reduce((sum, t) => sum + Number(t.cost), 0);

    return {
      patientID,
      tasks,
      totalCost,
      generatedAt: new Date(),
    };
  }

  private async updatePatientTotalCost(patientID: string): Promise<void> {
    const totalCost = await this.calculateTotalCost(patientID);
    await patientService.updateTotalCost(patientID, totalCost);
  }
}

export const financialService = new FinancialService();
