import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi, type CreateDoctorDTO } from '../api/doctorApi';
import { appointmentApi } from '../api/appointmentApi';
import type { AvailabilitySlot } from '../types/appointments';

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

export function useDoctorAvailability(doctorId: string) {
  return useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn: () => appointmentApi.getDoctorAvailability(doctorId),
    enabled: !!doctorId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetDoctorAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, slots }: { doctorId: string; slots: AvailabilitySlot[] }) =>
      appointmentApi.setDoctorAvailability(doctorId, slots),
    onSuccess: (_data, { doctorId }) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability', doctorId] });
    },
  });
}
