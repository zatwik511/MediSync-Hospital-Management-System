import { apiClient } from './client';
import type { APIResponse } from '../types';

export interface AuditLog {
  id: string;
  staff_id: string;
  staff_name: string;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT';
  entity_type: string;
  entity_id: string | null;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export const auditApi = {
  async getLogs(filters?: { entityType?: string; action?: string }): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (filters?.entityType) params.set('entityType', filters.entityType);
    if (filters?.action) params.set('action', filters.action);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<APIResponse<AuditLog[]>>(`/audit${qs}`);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch audit logs');
    return response.data.data || [];
  },

  async getLogsByStaff(staffId: string): Promise<AuditLog[]> {
    const response = await apiClient.get<APIResponse<AuditLog[]>>(`/audit/staff/${staffId}`);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch staff logs');
    return response.data.data || [];
  },
};
