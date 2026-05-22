import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi, type CreateDoctorDTO } from '../api/doctorApi';

const DOCTORS_KEY = ['doctors'];

export function useDoctors() {
  return useQuery({
    queryKey: DOCTORS_KEY,
    queryFn: () => doctorApi.listDoctors(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDoctorDTO) => doctorApi.createDoctor(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCTORS_KEY }),
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateDoctorDTO }) =>
      doctorApi.updateDoctor(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCTORS_KEY }),
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => doctorApi.deleteDoctor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DOCTORS_KEY }),
  });
}
