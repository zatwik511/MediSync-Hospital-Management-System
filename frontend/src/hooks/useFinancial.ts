import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { RecordTaskDTO } from '../types';
import { financialApi } from '../api/financialApi';

const COST_QUERY_KEY = (patientId: string) => ['cost', patientId];
const REPORT_QUERY_KEY = (patientId: string) => ['cost-report', patientId];

export function usePatientTotalCost(patientId: string) {
  return useQuery({
    queryKey: COST_QUERY_KEY(patientId),
    queryFn: () => financialApi.getTotalCost(patientId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    enabled: !!patientId,
  });
}

export function useCostReport(patientId: string) {
  return useQuery({
    queryKey: REPORT_QUERY_KEY(patientId),
    queryFn: () => financialApi.generateCostReport(patientId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!patientId,
  });
}

export function useRecordTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordTaskDTO) => financialApi.recordTask(data),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({
        queryKey: COST_QUERY_KEY(newTask.patientID),
      });
      queryClient.invalidateQueries({
        queryKey: REPORT_QUERY_KEY(newTask.patientID),
      });
      // Force immediate refetch so totalCost updates on screen without refresh
      queryClient.refetchQueries({
        queryKey: ['patient', newTask.patientID],
      });
      queryClient.refetchQueries({
        queryKey: ['patients'],
      });
    },
  });
}