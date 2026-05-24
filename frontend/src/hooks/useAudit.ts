import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/auditApi';

export function useAuditLogs(
  filters?: { entityType?: string; action?: string },
  page = 1,
  limit = 50,
) {
  return useQuery({
    queryKey: ['audit', filters, page, limit],
    queryFn: () => auditApi.getLogs(filters, page, limit),
    staleTime: 1000 * 30,
  });
}

export function useStaffAuditLogs(staffId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['audit', 'staff', staffId, page, limit],
    queryFn: () => auditApi.getLogsByStaff(staffId, page, limit),
    enabled: !!staffId,
    staleTime: 1000 * 30,
  });
}
