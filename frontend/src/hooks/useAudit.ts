import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/auditApi';

export function useAuditLogs(filters?: { entityType?: string; action?: string }) {
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: () => auditApi.getLogs(filters),
    staleTime: 1000 * 30,
  });
}

export function useStaffAuditLogs(staffId: string) {
  return useQuery({
    queryKey: ['audit', 'staff', staffId],
    queryFn: () => auditApi.getLogsByStaff(staffId),
    enabled: !!staffId,
    staleTime: 1000 * 30,
  });
}
