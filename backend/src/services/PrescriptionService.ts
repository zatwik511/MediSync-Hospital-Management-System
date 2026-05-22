import { pool } from '../database/db';
import { auditService } from './AuditService';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  prescribedBy: string | null;
  prescribedByName: string | null;
  medications: Medication[];
  advice: string | null;
  prescribedAt: Date;
}

export interface CreatePrescriptionDTO {
  patientId: string;
  medications: Medication[];
  advice?: string;
}

export class PrescriptionService {

  async ensureTable(): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        prescribed_by    UUID REFERENCES staff(id) ON DELETE SET NULL,
        prescribed_by_name TEXT,
        medications      JSONB NOT NULL DEFAULT '[]',
        advice           TEXT,
        prescribed_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  private transform(row: any): Prescription {
    return {
      id:                row.id,
      patientId:         row.patient_id,
      prescribedBy:      row.prescribed_by,
      prescribedByName:  row.prescribed_by_name,
      medications:       Array.isArray(row.medications) ? row.medications : [],
      advice:            row.advice,
      prescribedAt:      row.prescribed_at,
    };
  }

  async getByPatient(patientId: string, staffId = ''): Promise<Prescription[]> {
    const result = await pool.query(
      `SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY prescribed_at DESC`,
      [patientId]
    );
    if (staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'prescription',
        entityId: patientId,
        description: `Viewed prescriptions for patient ${patientId}`,
      });
    }
    return result.rows.map(r => this.transform(r));
  }

  async create(data: CreatePrescriptionDTO, staffId: string): Promise<Prescription> {
    let staffName: string | null = null;
    if (staffId) {
      const s = await pool.query(`SELECT name FROM staff WHERE id = $1`, [staffId]);
      staffName = s.rows[0]?.name ?? null;
    }

    const result = await pool.query(
      `INSERT INTO prescriptions
         (patient_id, prescribed_by, prescribed_by_name, medications, advice, prescribed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        data.patientId,
        staffId || null,
        staffName,
        JSON.stringify(data.medications),
        data.advice?.trim() || null,
      ]
    );
    const prescription = this.transform(result.rows[0]);

    await auditService.logAction({
      staffId,
      action: 'CREATE',
      entityType: 'prescription',
      entityId: prescription.id,
      description: `Created prescription for patient ${data.patientId} (${data.medications.length} medication(s))`,
    });
    return prescription;
  }

  async delete(id: string, staffId: string): Promise<void> {
    await pool.query(`DELETE FROM prescriptions WHERE id = $1`, [id]);
    await auditService.logAction({
      staffId,
      action: 'DELETE',
      entityType: 'prescription',
      entityId: id,
      description: `Deleted prescription ${id}`,
    });
  }
}

export const prescriptionService = new PrescriptionService();
