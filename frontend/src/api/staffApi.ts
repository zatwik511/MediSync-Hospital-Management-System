import { apiClient } from './client';
import type { Staff, CreateStaffDTO, APIResponse } from '../types';

export const staffApi = {
  async createStaff(data: CreateStaffDTO): Promise<Staff> {
    const response = await apiClient.post<APIResponse<Staff>>('/staff', data);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to create staff');
    return response.data.data!;
  },

  async listStaff(): Promise<Staff[]> {
    const response = await apiClient.get<APIResponse<Staff[]>>('/staff');
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch staff');
    return response.data.data || [];
  },

  async getStaff(staffId: string): Promise<Staff> {
    const response = await apiClient.get<APIResponse<Staff>>(`/staff/${staffId}`);
    if (!response.data.success) throw new Error(response.data.error || 'Staff member not found');
    return response.data.data!;
  },

  async deleteStaff(staffId: string): Promise<void> {
    const response = await apiClient.delete<APIResponse<null>>(`/staff/${staffId}`);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to delete staff');
  },

  async resetPin(staffId: string, newPin: string): Promise<void> {
    const response = await apiClient.post<APIResponse<null>>(`/staff/${staffId}/reset-pin`, { newPin });
    if (!response.data.success) throw new Error(response.data.error || 'Failed to reset PIN');
  },
};
