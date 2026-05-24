import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { appointmentApi } from '../api/appointmentApi';
import type { CreateAppointmentDTO } from '../types/appointments';

const APPOINTMENTS_KEY = ['appointments'];

export function useAppointments() {
  return useQuery({
    queryKey: APPOINTMENTS_KEY,
    queryFn: () => appointmentApi.listAppointments(),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
}

export function usePatientAppointments(patientId: string) {
  return useQuery({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: () => appointmentApi.getAppointmentsByPatient(patientId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    enabled: !!patientId,
  });
}

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: () => appointmentApi.listDoctors(),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
  });
}

export function useBookedSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: () => appointmentApi.getAvailableSlots(doctorId, date),
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    enabled: !!doctorId && !!date,
  });
}

export function useTotalAppointmentCount() {
  return useQuery({
    queryKey: ['appointments-count'],
    queryFn: () => appointmentApi.getTotalAppointmentCount(),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
}

// Paginated hook — for the appointments page only
export function usePaginatedAppointments(page: number, search: string) {
  return useQuery({
    queryKey: ['appointments', 'paginated', page, search],
    queryFn: () => appointmentApi.listAppointmentsPaginated(page, 20, search),
    staleTime: 1000 * 60 * 1,
    placeholderData: keepPreviousData,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentDTO) => appointmentApi.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['appointments-count'] });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date, time }: { id: string; date: string; time: string }) =>
      appointmentApi.rescheduleAppointment(id, date, time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => appointmentApi.cancelAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['appointments-count'] });
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => appointmentApi.completeAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
    },
  });
}
