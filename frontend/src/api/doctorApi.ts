import { apiClient } from './client';
import type { APIResponse } from '../types';
import type { Doctor } from '../types/appointments';

export interface CreateDoctorDTO {
  name: string;
  specialty: string;
  availableDays: string[];
  staffId?: string | null;
}

export const doctorApi = {
  async listDoctors(): Promise<Doctor[]> {
    const response = await apiClient.get<APIResponse<Doctor[]>>('/doctors');
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch doctors');
    return response.data.data || [];
  },

  async createDoctor(data: CreateDoctorDTO): Promise<Doctor> {
    const response = await apiClient.post<APIResponse<Doctor>>('/doctors', data);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to create doctor');
    return response.data.data!;
  },

  async updateDoctor(id: string, data: CreateDoctorDTO): Promise<Doctor> {
    const response = await apiClient.put<APIResponse<Doctor>>(`/doctors/${id}`, data);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to update doctor');
    return response.data.data!;
  },

  async deleteDoctor(id: string): Promise<void> {
    const response = await apiClient.delete<APIResponse<null>>(`/doctors/${id}`);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to delete doctor');
  },
};
