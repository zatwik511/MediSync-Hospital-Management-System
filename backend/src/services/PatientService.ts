import { pool } from '../database/db';
import { Patient, CreatePatientDTO } from '../models/types';
import { auditService } from './AuditService';

export class PatientService {

  async createPatient(data: CreatePatientDTO, staffId = ''): Promise<Patient> {
    const { name, address, conditions } = data;
    const result = await pool.query(
      `INSERT INTO patients (name, address, conditions, diagnosis, "totalCost", "medicalHistory", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [name, address, conditions || [], '', 0, []]
    );
    const patient = result.rows[0] as Patient;
    await auditService.logAction({
      staffId,
      action: 'CREATE',
      entityType: 'patient',
      entityId: patient.id,
      description: `Created patient record for ${name}`,
    });
    return patient;
  }

  async getPatient(patientID: string, staffId = ''): Promise<Patient | null> {
    const result = await pool.query(`SELECT * FROM patients WHERE id = $1`, [patientID]);
    const patient = result.rows[0] || null;
    if (patient && staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'patient',
        entityId: patientID,
        description: `Viewed patient record for ${patient.name}`,
      });
    }
    return patient;
  }

  async listPatients(staffId = ''): Promise<Patient[]> {
    const result = await pool.query(`SELECT * FROM patients ORDER BY "createdAt" DESC`);
    if (staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'patient',
        description: `Listed all patients (${result.rows.length} records)`,
      });
    }
    return result.rows as Patient[];
  }

  async deletePatient(patientID: string, staffId = ''): Promise<void> {
    const patient = await pool.query(`SELECT name FROM patients WHERE id = $1`, [patientID]);
    const name = patient.rows[0]?.name || patientID;
    await pool.query(`DELETE FROM patients WHERE id = $1`, [patientID]);
    await auditService.logAction({
      staffId,
      action: 'DELETE',
      entityType: 'patient',
      entityId: patientID,
      description: `Deleted patient record for ${name}`,
    });
  }

  async updateDiagnosis(patientID: string, diagnosis: string, staffId = ''): Promise<Patient> {
    const result = await pool.query(
      `UPDATE patients SET diagnosis = $1 WHERE id = $2 RETURNING *`,
      [diagnosis, patientID]
    );
    if (!result.rows[0]) throw new Error('Patient not found');
    const patient = result.rows[0] as Patient;
    await auditService.logAction({
      staffId,
      action: 'UPDATE',
      entityType: 'patient',
      entityId: patientID,
      description: `Updated diagnosis for ${patient.name}: "${diagnosis}"`,
    });
    return patient;
  }

  async getTotalCost(patientID: string): Promise<number> {
    const patient = await this.getPatient(patientID);
    return patient?.totalCost || 0;
  }

  async updateTotalCost(patientID: string, newTotal: number): Promise<void> {
    await pool.query(`UPDATE patients SET "totalCost" = $1 WHERE id = $2`, [newTotal, patientID]);
  }

  async getTotalPatientCount(): Promise<number> {
    const result = await pool.query(`SELECT COUNT(*) FROM patients`);
    return parseInt(result.rows[0].count, 10);
  }
}

export const patientService = new PatientService();
