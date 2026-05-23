import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vitalApi } from '../api/vitalApi';
import type { CreateVitalDTO } from '../types';

const VITALS_KEY = (patientId: string) => ['vitals', patientId];

export function useVitals(patientId: string) {
  return useQuery({
    queryKey: VITALS_KEY(patientId),
    queryFn: () => vitalApi.getVitals(patientId),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateVital(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVitalDTO) => vitalApi.recordVitals(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VITALS_KEY(patientId) });
    },
  });
}

export function useDeleteVital(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vitalApi.deleteVital(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VITALS_KEY(patientId) });
    },
  });
}
