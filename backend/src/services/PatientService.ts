import { pool } from '../database/db';
import { Patient, CreatePatientDTO, UpdatePatientDTO } from '../models/types';
import { auditService } from './AuditService';
import { notificationService } from './NotificationService';

export class PatientService {

  async createPatient(data: CreatePatientDTO, staffId = ''): Promise<Patient> {
    const {
      name, address, conditions,
      dateOfBirth, gender, phone, bloodType, allergies,
      emergencyContactName, emergencyContactRelationship, emergencyContactPhone,
    } = data;

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

    values.push(patientID);
    const result = await pool.query(
      `UPDATE patients SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (!result.rows[0]) throw new Error('Patient not found');
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

  async listPatientsPaginated(
    page: number,
    limit: number,
    search: string,
    staffId = ''
  ): Promise<{ data: Patient[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM patients
         WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR address ILIKE '%' || $1 || '%')`,
        [search]
      ),
      pool.query(
        `SELECT * FROM patients
         WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR address ILIKE '%' || $1 || '%')
         ORDER BY "createdAt" DESC
         LIMIT $2 OFFSET $3`,
        [search, limit, offset]
      ),
    ]);
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'patient',
        description: `Listed patients page ${page}${search ? ` (search: "${search}")` : ''} — ${total} total`,
      });
    }
    return { data: dataResult.rows as Patient[], total, page, totalPages };
  }

  async deletePatient(patientID: string, staffId = ''): Promise<void> {
    const patient = await pool.query(`SELECT name FROM patients WHERE id = $1`, [patientID]);
    const name = patient.rows[0]?.name || patientID;

    const [imgRes, taskRes, apptRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM medical_images WHERE patient_id = $1`, [patientID]),
      pool.query(`SELECT COUNT(*) FROM tasks          WHERE patient_id = $1`, [patientID]),
      pool.query(`SELECT COUNT(*) FROM appointments   WHERE patient_id = $1`, [patientID]),
    ]);
    const images = parseInt(imgRes.rows[0].count, 10);
    const tasks  = parseInt(taskRes.rows[0].count, 10);
    const appts  = parseInt(apptRes.rows[0].count, 10);

    if (images + tasks + appts > 0) {
      console.warn(
        `[PatientService] Deleting patient "${name}" (${patientID}) will cascade-delete: ` +
        `${images} image(s), ${tasks} task(s), ${appts} appointment(s).`
      );
    }

    await pool.query(`DELETE FROM patients WHERE id = $1`, [patientID]);
    await auditService.logAction({
      staffId,
      action: 'DELETE',
      entityType: 'patient',
      entityId: patientID,
      description: `Deleted patient record for ${name} (cascaded: ${images} images, ${tasks} tasks, ${appts} appointments)`,
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
