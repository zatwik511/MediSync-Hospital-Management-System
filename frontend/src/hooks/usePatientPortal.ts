import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientClient } from '../api/patientClient';
import type { Appointment, Doctor, CreateAppointmentDTO } from '../types/appointments';
import type { APIResponse } from '../types';

// ── Queries ───────────────────────────────────────────────────────────────────

export function useMyAppointments() {
  return useQuery({
    queryKey: ['patient-appointments'],
    queryFn: async (): Promise<Appointment[]> => {
      const res = await patientClient.get<APIResponse<Appointment[]>>('/patient/appointments');
      return res.data.data ?? [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function usePatientDoctors() {
  return useQuery({
    queryKey: ['patient-doctors'],
    queryFn: async (): Promise<Doctor[]> => {
      const res = await patientClient.get<APIResponse<Doctor[]>>('/patient/appointments/doctors');
      return res.data.data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function usePatientBookedSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['patient-slots', doctorId, date],
    queryFn: async (): Promise<string[]> => {
      const res = await patientClient.get<APIResponse<string[]>>(
        `/patient/appointments/slots/${doctorId}/${date}`
      );
      return res.data.data ?? [];
    },
    staleTime: 1000 * 60,
    enabled: !!doctorId && !!date,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function usePatientCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CreateAppointmentDTO, 'patientID'>): Promise<Appointment> => {
      const res = await patientClient.post<APIResponse<Appointment>>(
        '/patient/appointments',
        data
      );
      if (!res.data.success) throw new Error(res.data.error || 'Failed to book');
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
  });
}

export function usePatientCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string): Promise<void> => {
      const res = await patientClient.put<APIResponse<null>>(
        `/patient/appointments/${appointmentId}/cancel`,
        {}
      );
      if (!res.data.success) throw new Error(res.data.error || 'Failed to cancel');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
  });
}
