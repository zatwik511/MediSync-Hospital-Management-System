import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionApi } from '../api/prescriptionApi';
import type { CreatePrescriptionDTO } from '../api/prescriptionApi';

const key = (patientId: string) => ['prescriptions', patientId];

export function usePatientPrescriptions(patientId: string) {
  return useQuery({
    queryKey: key(patientId),
    queryFn: () => prescriptionApi.getByPatient(patientId),
    staleTime: 1000 * 60 * 2,
    enabled: !!patientId,
  });
}

export function useCreatePrescription(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePrescriptionDTO) => prescriptionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key(patientId) });
    },
  });
}

export function useDeletePrescription(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key(patientId) });
    },
  });
}
