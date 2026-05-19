import { pool } from '../database/db';
import { Patient, CreatePatientDTO } from '../models/types';

export class PatientService {

  // METHOD 1: Create a new patient
  async createPatient(data: CreatePatientDTO): Promise<Patient> {
    const { name, address, conditions } = data;

    const result = await pool.query(
      `INSERT INTO patients (name, address, conditions, diagnosis, "totalCost", "medicalHistory", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [name, address, conditions || [], '', 0, []]
    );

    return result.rows[0] as Patient;
  }

  // METHOD 2: Get a patient by their ID
  async getPatient(patientID: string): Promise<Patient | null> {
    const result = await pool.query(
      `SELECT * FROM patients WHERE id = $1`,
      [patientID]
    );

    return result.rows[0] || null;
  }

  // METHOD 3: Get ALL patients
  async listPatients(): Promise<Patient[]> {
    const result = await pool.query(
      `SELECT * FROM patients ORDER BY "createdAt" DESC`
    );

    return result.rows as Patient[];
  }

  // METHOD 4: Delete a patient
  async deletePatient(patientID: string): Promise<void> {
    await pool.query(
      `DELETE FROM patients WHERE id = $1`,
      [patientID]
    );
  }

  // METHOD 5: Update diagnosis
  async updateDiagnosis(patientID: string, diagnosis: string): Promise<Patient> {
    const result = await pool.query(
      `UPDATE patients SET diagnosis = $1 WHERE id = $2 RETURNING *`,
      [diagnosis, patientID]
    );

    if (!result.rows[0]) throw new Error('Patient not found');
    return result.rows[0] as Patient;
  }

  // METHOD 6: Get total cost for a patient
  async getTotalCost(patientID: string): Promise<number> {
    const patient = await this.getPatient(patientID);
    return patient?.totalCost || 0;
  }

  // METHOD 7: Update total cost (called by FinancialService)
  async updateTotalCost(patientID: string, newTotal: number): Promise<void> {
    await pool.query(
      `UPDATE patients SET "totalCost" = $1 WHERE id = $2`,
      [newTotal, patientID]
    );
  }

  // METHOD 8: Count total patients
  async getTotalPatientCount(): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) FROM patients`
    );

    return parseInt(result.rows[0].count, 10);
  }
}

export const patientService = new PatientService();
