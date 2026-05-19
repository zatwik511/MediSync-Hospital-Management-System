import { pool } from '../database/db';
import { MedicalImage, UploadImageDTO } from '../models/types';

export class ImageService {

  // Helper function to transform database rows to MedicalImage format
  private transformToMedicalImage(row: any): MedicalImage {
    return {
      id: row.id,
      patientID: row.patient_id,
      uploadedAt: new Date(row.uploaded_at),
      uploadedBy: row.uploaded_by,
      type: row.type,
      diseaseClassification: row.disease_classification,
      imageUrl: row.image_url,
    };
  }

  async uploadImage(data: UploadImageDTO, uploadedBy: string): Promise<MedicalImage> {
    const result = await pool.query(
      `INSERT INTO medical_images (patient_id, uploaded_at, uploaded_by, type, disease_classification, image_url)
       VALUES ($1, NOW(), $2, $3, $4, $5)
       RETURNING *`,
      [data.patientID, uploadedBy, data.imageType, data.diseaseType || null, `/uploads/${data.fileName}`]
    );

    return this.transformToMedicalImage(result.rows[0]);
  }

  async getImagesByPatient(patientID: string): Promise<MedicalImage[]> {
    const result = await pool.query(
      `SELECT * FROM medical_images WHERE patient_id = $1 ORDER BY uploaded_at DESC`,
      [patientID]
    );

    return result.rows.map(row => this.transformToMedicalImage(row));
  }

  async classifyImage(imageID: string, imageType: string, diseaseType: string): Promise<MedicalImage | null> {
    const result = await pool.query(
      `UPDATE medical_images SET type = $1, disease_classification = $2 WHERE id = $3 RETURNING *`,
      [imageType, diseaseType, imageID]
    );

    return result.rows[0] ? this.transformToMedicalImage(result.rows[0]) : null;
  }

  async getImageByID(imageID: string): Promise<MedicalImage | null> {
    const result = await pool.query(
      `SELECT * FROM medical_images WHERE id = $1`,
      [imageID]
    );

    return result.rows[0] ? this.transformToMedicalImage(result.rows[0]) : null;
  }

  async deleteImage(imageID: string): Promise<void> {
    await pool.query(
      `DELETE FROM medical_images WHERE id = $1`,
      [imageID]
    );
  }

  // NEW: Count total medical images across all patients
  async getTotalImageCount(): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) FROM medical_images`
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export const imageService = new ImageService();