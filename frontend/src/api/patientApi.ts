import { apiClient } from './client';
import type {
  Patient,
  CreatePatientDTO,
  UpdatePatientDTO,
  APIResponse,
  PaginatedResponse,
} from '../types';

export const patientApi = {
  // Create a new patient
  async createPatient(data: CreatePatientDTO): Promise<Patient> {
    const response = await apiClient.post<APIResponse<Patient>>(
      '/patients',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create patient');
    }
    return response.data.data!;
  },

  // Get all patients
  async listPatients(): Promise<Patient[]> {
    const response = await apiClient.get<APIResponse<Patient[]>>('/patients');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch patients');
    }
    return response.data.data || [];
  },

  // Get paginated patients with optional search
  async listPatientsPaginated(page: number, limit = 20, search = ''): Promise<PaginatedResponse<Patient>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
    const response = await apiClient.get<APIResponse<PaginatedResponse<Patient>>>(`/patients?${params}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch patients');
    }
    return response.data.data!;
  },

  // Get single patient by ID
  async getPatient(patientId: string): Promise<Patient> {
    const response = await apiClient.get<APIResponse<Patient>>(
      `/patients/${patientId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Patient not found');
    }
    return response.data.data!;
  },

  // Update patient details
  async updatePatient(
    patientId: string,
    data: UpdatePatientDTO
  ): Promise<Patient> {
    try {
      const response = await apiClient.put<APIResponse<Patient>>(
        `/patients/${patientId}`,
        data
      );
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update patient');
      }
      return response.data.data!;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to update patient';
      throw new Error(msg);
    }
  },

  // Update patient diagnosis
  async updateDiagnosis(patientId: string, diagnosis: string): Promise<Patient> {
    const response = await apiClient.put<APIResponse<Patient>>(
      `/patients/${patientId}/diagnosis`,
      { diagnosis }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update diagnosis');
    }
    return response.data.data!;
  },

  // Delete patient (soft delete)
  async deletePatient(patientId: string): Promise<void> {
    const response = await apiClient.delete<APIResponse<null>>(
      `/patients/${patientId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete patient');
    }
  },

  // List soft-deleted patients (admin only)
  async listDeletedPatients(): Promise<Patient[]> {
    const response = await apiClient.get<APIResponse<Patient[]>>('/patients/deleted');
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch deleted patients');
    return response.data.data || [];
  },

  // Restore a soft-deleted patient (admin only)
  async restorePatient(patientId: string): Promise<Patient> {
    const response = await apiClient.post<APIResponse<Patient>>(`/patients/${patientId}/restore`, {});
    if (!response.data.success) throw new Error(response.data.error || 'Failed to restore patient');
    return response.data.data!;
  },

  // Get total cost for patient
  async getPatientCost(patientId: string): Promise<number> {
    const response = await apiClient.get<APIResponse<number>>(
      `/patients/${patientId}/cost`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch patient cost');
    }
    return response.data.data || 0;
  },
};
