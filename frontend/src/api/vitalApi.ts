import { apiClient } from './client';
import type { Vital, CreateVitalDTO, APIResponse } from '../types';

export const vitalApi = {
  async getVitals(patientId: string): Promise<Vital[]> {
    const response = await apiClient.get<APIResponse<Vital[]>>(`/vitals/${patientId}`);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch vitals');
    return response.data.data || [];
  },

  async recordVitals(data: CreateVitalDTO): Promise<Vital> {
    const response = await apiClient.post<APIResponse<Vital>>('/vitals', data);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to record vitals');
    return response.data.data!;
  },

  async deleteVital(id: string): Promise<void> {
    const response = await apiClient.delete<APIResponse<null>>(`/vitals/${id}`);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to delete vital');
  },
};
