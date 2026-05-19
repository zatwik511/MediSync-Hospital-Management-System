import { apiClient } from './client';
import type { MedicalImage, UploadImageDTO, APIResponse } from '../types';

export const imageApi = {
  // Upload image for a patient
  async uploadImage(data: UploadImageDTO): Promise<MedicalImage> {
    const formData = new FormData();
    formData.append('patientID', data.patientID);
    formData.append('imageType', data.imageType);
    formData.append('diseaseType', data.diseaseType);
    formData.append('file', data.file);

    const response = await apiClient.post<APIResponse<MedicalImage>>(
      '/images/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to upload image');
    }
    return response.data.data!;
  },

  // Get images for a patient
  async getImagesByPatient(patientId: string): Promise<MedicalImage[]> {
    const response = await apiClient.get<APIResponse<MedicalImage[]>>(
      `/images/patient/${patientId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch images');
    }
    return response.data.data || [];
  },

  // Classify image
  async classifyImage(
    imageId: string,
    imageType: string,
    diseaseType: string
  ): Promise<MedicalImage> {
    const response = await apiClient.put<APIResponse<MedicalImage>>(
      `/images/${imageId}/classify`,
      { imageType, diseaseType }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to classify image');
    }
    return response.data.data!;
  },

  // Delete image
  async deleteImage(imageId: string): Promise<void> {
    const response = await apiClient.delete<APIResponse<null>>(
      `/images/${imageId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete image');
    }
  },

  // NEW: Get total image count across all patients
  async getTotalImageCount(): Promise<number> {
    const response = await apiClient.get<APIResponse<number>>('/images/count');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch image count');
    }
    return response.data.data || 0;
  },
};