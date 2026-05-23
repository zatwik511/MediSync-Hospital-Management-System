import { pool } from '../database/db';
import { Vital, CreateVitalDTO } from '../models/types';

function rowToVital(row: any): Vital {
  return {
    id: row.id,
    patientId: row.patient_id,
    recordedAt: row.recorded_at,
    recordedBy: row.recorded_by,
    bloodPressureSystolic: row.blood_pressure_systolic ?? undefined,
    bloodPressureDiastolic: row.blood_pressure_diastolic ?? undefined,
    heartRate: row.heart_rate ?? undefined,
    temperature: row.temperature != null ? Number(row.temperature) : undefined,
    oxygenSaturation: row.oxygen_saturation != null ? Number(row.oxygen_saturation) : undefined,
    weight: row.weight != null ? Number(row.weight) : undefined,
    height: row.height != null ? Number(row.height) : undefined,
    notes: row.notes || undefined,
  };
}

export class VitalService {
  async recordVitals(data: CreateVitalDTO): Promise<Vital> {
    const result = await pool.query(
      `INSERT INTO vitals (
         patient_id, recorded_by,
         blood_pressure_systolic, blood_pressure_diastolic,
         heart_rate, temperature, oxygen_saturation,
         weight, height, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        data.patientId, data.recordedBy,
        data.bloodPressureSystolic ?? null, data.bloodPressureDiastolic ?? null,
        data.heartRate ?? null, data.temperature ?? null, data.oxygenSaturation ?? null,
        data.weight ?? null, data.height ?? null, data.notes ?? '',
      ]
    );
    return rowToVital(result.rows[0]);
  }

  async getVitals(patientId: string): Promise<Vital[]> {
    const result = await pool.query(
      `SELECT * FROM vitals WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 50`,
      [patientId]
    );
    return result.rows.map(rowToVital);
  }

  async deleteVital(id: string): Promise<void> {
    await pool.query(`DELETE FROM vitals WHERE id = $1`, [id]);
  }
}

export const vitalService = new VitalService();
