import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientClient } from '../api/patientClient';
import type { Appointment, Doctor, CreateAppointmentDTO } from '../types/appointments';
import type { APIResponse, Patient, MedicalImage, CostReport } from '../types';

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

export function usePatientAvailableSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['patient-slots', doctorId, date],
    queryFn: async (): Promise<{ slots: string[]; hasAvailability: boolean }> => {
      const res = await patientClient.get<APIResponse<{ slots: string[]; hasAvailability: boolean }>>(
        `/patient/appointments/slots/${doctorId}/${date}`
      );
      return res.data.data ?? { slots: [], hasAvailability: false };
    },
    staleTime: 1000 * 60,
    enabled: !!doctorId && !!date,
  });
}

export function usePatientProfile() {
  return useQuery({
    queryKey: ['patient-profile'],
    queryFn: async (): Promise<Patient> => {
      const res = await patientClient.get<APIResponse<Patient>>('/patient/data/profile');
      return res.data.data!;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePatientImageRecords() {
  return useQuery({
    queryKey: ['patient-image-records'],
    queryFn: async (): Promise<MedicalImage[]> => {
      const res = await patientClient.get<APIResponse<MedicalImage[]>>('/patient/data/images');
      return res.data.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePatientFinancial() {
  return useQuery({
    queryKey: ['patient-financial'],
    queryFn: async (): Promise<CostReport> => {
      const res = await patientClient.get<APIResponse<CostReport>>('/patient/data/financial');
      return res.data.data!;
    },
    staleTime: 1000 * 60 * 5,
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

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      phone?: string;
      address?: string;
      gender?: string;
      emergencyContactName?: string;
      emergencyContactRelationship?: string;
      emergencyContactPhone?: string;
      allergies?: Array<{ substance: string; reaction: string; severity: string }>;
    }): Promise<Patient> => {
      const res = await patientClient.put<APIResponse<Patient>>('/patient/data/profile', data);
      if (!res.data.success) throw new Error(res.data.error || 'Failed to update profile');
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
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
