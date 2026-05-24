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

export interface PaginatedAuditResult {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export const auditApi = {
  async getLogs(
    filters?: { entityType?: string; action?: string },
    page = 1,
    limit = 50,
  ): Promise<PaginatedAuditResult> {
    const params = new URLSearchParams();
    if (filters?.entityType) params.set('entityType', filters.entityType);
    if (filters?.action) params.set('action', filters.action);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const response = await apiClient.get<APIResponse<PaginatedAuditResult>>(`/audit?${params.toString()}`);
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch audit logs');
    return response.data.data || { items: [], total: 0, page, limit };
  },

  async getLogsByStaff(staffId: string, page = 1, limit = 50): Promise<PaginatedAuditResult> {
    const response = await apiClient.get<APIResponse<PaginatedAuditResult>>(
      `/audit/staff/${staffId}?page=${page}&limit=${limit}`,
    );
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch staff logs');
    return response.data.data || { items: [], total: 0, page, limit };
  },
};
