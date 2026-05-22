import fs from 'fs';
import path from 'path';
import { pool } from '../database/db';
import { MedicalImage, UploadImageDTO } from '../models/types';
import { auditService } from './AuditService';

export class ImageService {

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

  // uploadedBy doubles as staffId for audit purposes
  async uploadImage(data: UploadImageDTO, uploadedBy: string): Promise<MedicalImage> {
    const result = await pool.query(
      `INSERT INTO medical_images (patient_id, uploaded_at, uploaded_by, type, disease_classification, image_url)
       VALUES ($1, NOW(), $2, $3, $4, $5)
       RETURNING *`,
      [data.patientID, uploadedBy, data.imageType, data.diseaseType || null, `/uploads/${data.fileName}`]
    );
    const image = this.transformToMedicalImage(result.rows[0]);
    await auditService.logAction({
      staffId: uploadedBy,
      action: 'CREATE',
      entityType: 'image',
      entityId: image.id,
      description: `Uploaded ${data.imageType} image for patient ${data.patientID}`,
    });
    return image;
  }

  async getImagesByPatient(patientID: string, staffId = ''): Promise<MedicalImage[]> {
    const result = await pool.query(
      `SELECT * FROM medical_images WHERE patient_id = $1 ORDER BY uploaded_at DESC`,
      [patientID]
    );
    if (staffId) {
      await auditService.logAction({
        staffId,
        action: 'READ',
        entityType: 'image',
        entityId: patientID,
        description: `Viewed medical images for patient ${patientID} (${result.rows.length} images)`,
      });
    }
    return result.rows.map(row => this.transformToMedicalImage(row));
  }

  async classifyImage(imageID: string, imageType: string, diseaseType: string, staffId = ''): Promise<MedicalImage | null> {
    const result = await pool.query(
      `UPDATE medical_images SET type = $1, disease_classification = $2 WHERE id = $3 RETURNING *`,
      [imageType, diseaseType, imageID]
    );
    const image = result.rows[0] ? this.transformToMedicalImage(result.rows[0]) : null;
    if (image && staffId) {
      await auditService.logAction({
        staffId,
        action: 'UPDATE',
        entityType: 'image',
        entityId: imageID,
        description: `Classified image as ${imageType} / ${diseaseType}`,
      });
    }
    return image;
  }

  async getImageByID(imageID: string): Promise<MedicalImage | null> {
    const result = await pool.query(`SELECT * FROM medical_images WHERE id = $1`, [imageID]);
    return result.rows[0] ? this.transformToMedicalImage(result.rows[0]) : null;
  }

  async deleteImage(imageID: string, staffId = ''): Promise<void> {
    const fileResult = await pool.query(
      `SELECT image_url FROM medical_images WHERE id = $1`,
      [imageID]
    );
    const imageUrl: string | undefined = fileResult.rows[0]?.image_url;

    await pool.query(`DELETE FROM medical_images WHERE id = $1`, [imageID]);

    if (imageUrl) {
      const relativePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      const absolutePath = path.join(process.cwd(), relativePath);
      fs.unlink(absolutePath, (err) => {
        if (err) console.error(`Could not delete file ${absolutePath}:`, err.message);
      });
    }

    await auditService.logAction({
      staffId,
      action: 'DELETE',
      entityType: 'image',
      entityId: imageID,
      description: `Deleted medical image ${imageID}`,
    });
  }

  async getTotalImageCount(): Promise<number> {
    const result = await pool.query(`SELECT COUNT(*) FROM medical_images`);
    return parseInt(result.rows[0].count, 10);
  }
}

export const imageService = new ImageService();
