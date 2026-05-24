import { pool } from '../database/db';
import { Patient, CreatePatientDTO, UpdatePatientDTO, Allergy } from '../models/types';
import { auditService } from './AuditService';
import { notificationService } from './NotificationService';

const VALID_SEVERITIES = new Set<string>(['Mild', 'Moderate', 'Severe', 'Life-threatening']);

export class PatientService {

  private validateConditions(conditions: string[]): void {
    if (!Array.isArray(conditions)) throw new Error('conditions must be an array');
    for (const c of conditions) {
      if (typeof c !== 'string' || c.trim() === '') throw new Error('Each condition must be a non-empty string');
      if (c.length > 255) throw new Error('Each condition must be 255 characters or fewer');
    }
  }

  private validateAllergies(allergies: Allergy[]): void {
    if (!Array.isArray(allergies)) throw new Error('allergies must be an array');
    for (const a of allergies) {
      if (typeof a.substance !== 'string' || a.substance.trim() === '') throw new Error('Each allergy must have a non-empty substance');
      if (a.substance.length > 255) throw new Error('Allergy substance must be 255 characters or fewer');
      if (typeof a.reaction !== 'string' || a.reaction.trim() === '') throw new Error('Each allergy must have a non-empty reaction');
      if (a.reaction.length > 500) throw new Error('Allergy reaction must be 500 characters or fewer');
      if (!VALID_SEVERITIES.has(a.severity)) throw new Error(`Allergy severity must be one of: ${[...VALID_SEVERITIES].join(', ')}`);
    }
  }

  async createPatient(data: CreatePatientDTO, staffId = ''): Promise<Patient> {
    const {
      name, address, conditions,
      dateOfBirth, gender, phone, bloodType, allergies,
      emergencyContactName, emergencyContactRelationship, emergencyContactPhone,
    } = data;

    this.validateConditions(conditions || []);
    this.validateAllergies(allergies || []);

    const result = await pool.query(
      `INSERT INTO patients (
         name, address, conditions, diagnosis, "totalCost", "medicalHistory",
         date_of_birth, gender, phone, blood_type, allergies,
         emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
         "createdAt"
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
       RETURNING *`,
      [
        name, address, conditions || [], '', 0, [],
        dateOfBirth || null, gender || null, phone || null, bloodType || null,
        JSON.stringify(allergies || []),
        emergencyContactName || null, emergencyContactRelationship || null, emergencyContactPhone || null,
      ]
    );
    const patient = result.rows[0] as Patient;

    await auditService.logAction({
      staffId,
      action: 'CREATE',
      entityType: 'patient',
      entityId: patient.id,
      description: `Created patient record for ${name}`,
    });

    notificationService.notifyAllAdmins(
      `New patient registered: ${name}`,
      'success', 'patient', patient.id
    );

    return patient;
  }

  async updatePatient(patientID: string, data: UpdatePatientDTO, staffId = ''): Promise<Patient> {
    if (data.conditions !== undefined) this.validateConditions(data.conditions);
    if (data.allergies !== undefined)  this.validateAllergies(data.allergies);

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined)      { updates.push(`name = $${idx++}`);      values.push(data.name); }
    if (data.address !== undefined)   { updates.push(`address = $${idx++}`);   values.push(data.address); }
    if (data.diagnosis !== undefined) { updates.push(`diagnosis = $${idx++}`); values.push(data.diagnosis); }
    if (data.conditions !== undefined){ updates.push(`conditions = $${idx++}`);values.push(data.conditions); }
    if (data.dateOfBirth !== undefined)  { updates.push(`date_of_birth = $${idx++}`); values.push(data.dateOfBirth || null); }
    if (data.gender !== undefined)       { updates.push(`gender = $${idx++}`);        values.push(data.gender || null); }
    if (data.phone !== undefined)        { updates.push(`phone = $${idx++}`);         values.push(data.phone || null); }
    if (data.bloodType !== undefined)    { updates.push(`blood_type = $${idx++}`);    values.push(data.bloodType || null); }
    if (data.allergies !== undefined)    { updates.push(`allergies = $${idx++}`);     values.push(JSON.stringify(data.allergies)); }
    if (data.emergencyContactName !== undefined)         { updates.push(`emergency_contact_name = $${idx++}`);         values.push(data.emergencyContactName || null); }
    if (data.emergencyContactRelationship !== undefined) { updates.push(`emergency_contact_relationship = $${idx++}`); values.push(data.emergencyContactRelationship || null); }
    if (data.emergencyContactPhone !== undefined)        { updates.push(`emergency_contact_phone = $${idx++}`);        values.push(data.emergencyContactPhone || null); }

    if (updates.length === 0) throw new Error('No fields to update');

    updates.push(`"updatedAt" = NOW()`);
    values.push(patientID);

    let whereClause = `id = $${idx++}`;
    if (data.updatedAt) {
      whereClause += ` AND "updatedAt" = $${idx++}`;
      values.push(data.updatedAt);
    }

    const result = await pool.query(
      `UPDATE patients SET ${updates.join(', ')} WHERE ${whereClause} RETURNING *`,
      values
    );
    if (!result.rows[0]) {
      if (data.updatedAt) {
        throw Object.assign(
          new Error('This record was modified by another user. Please reload and try again.'),
          { code: 'CONFLICT' }
        );
      }
      throw new Error('Patient not found');
    }
    const patient = result.rows[0] as Patient;

    await auditService.logAction({
      staffId,
      action: 'UPDATE',
      entityType: 'patient',
      entityId: patientID,
      description: `Updated profile for ${patient.name}`,
    });

    return patient;
  }

  async getPatient(patientID: string, staffId = ''): Promise<Patient | null> {
    const result = await pool.query(`SELECT * FROM patients WHERE id = $1 AND deleted_at IS NULL`, [patientID]);
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
    const result = await pool.query(`SELECT * FROM patients WHERE deleted_at IS NULL ORDER BY "createdAt" DESC`);
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

  async listPatientsPaginated(
    page: number,
    limit: number,
    search: string,
    staffId = ''
  ): Promise<{ data: Patient[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM patients
       WHERE deleted_at IS NULL
         AND ($1 = '' OR name ILIKE '%' || $1 || '%' OR address ILIKE '%' || $1 || '%')
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [search, limit, offset]
    );
    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const data = result.rows.map(({ total_count: _tc, ...row }) => row as Patient);
    if (staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'patient',
        description: `Listed patients page ${page}${search ? ` (search: "${search}")` : ''} — ${total} total`,
      });
    }
    return { data, total, page, totalPages };
  }

  async deletePatient(patientID: string, staffId = ''): Promise<void> {
    const patientRow = await pool.query(
      `SELECT name FROM patients WHERE id = $1 AND deleted_at IS NULL`, [patientID]
    );
    if (!patientRow.rows[0]) throw new Error('Patient not found');
    const name = patientRow.rows[0].name;

    await pool.query(
      `UPDATE patients SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, [patientID]
    );
    await auditService.logAction({
      staffId,
      action: 'DELETE',
      entityType: 'patient',
      entityId: patientID,
      description: `Soft-deleted patient record for ${name}`,
    });
  }

  async restorePatient(patientID: string, staffId = ''): Promise<Patient> {
    const result = await pool.query(
      `UPDATE patients SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
      [patientID]
    );
    if (!result.rows[0]) throw new Error('Patient not found or is not deleted');
    const patient = result.rows[0] as Patient;
    await auditService.logAction({
      staffId,
      action: 'UPDATE',
      entityType: 'patient',
      entityId: patientID,
      description: `Restored patient record for ${patient.name}`,
    });
    return patient;
  }

  async listDeletedPatients(): Promise<Patient[]> {
    const result = await pool.query(
      `SELECT * FROM patients WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`
    );
    return result.rows as Patient[];
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
    const result = await pool.query(`SELECT COUNT(*) FROM patients WHERE deleted_at IS NULL`);
    return parseInt(result.rows[0].count, 10);
  }
}

export const patientService = new PatientService();
