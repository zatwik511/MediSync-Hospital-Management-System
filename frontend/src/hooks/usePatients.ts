import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import type {
  
  CreatePatientDTO,
  UpdatePatientDTO,
} from '../types';
import { patientApi } from '../api/patientApi';

const PATIENTS_QUERY_KEY = ['patients'];
const PATIENT_QUERY_KEY = (id: string) => ['patient', id];

// Query hook for fetching all patients
export function usePatients() {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEY,
    queryFn: () => patientApi.listPatients(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

// Query hook for fetching single patient
export function usePatient(patientId: string) {
  return useQuery({
    queryKey: PATIENT_QUERY_KEY(patientId),
    queryFn: () => patientApi.getPatient(patientId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!patientId,
  });
}

// Mutation hook for creating patient
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientDTO) => patientApi.createPatient(data),
    onSuccess: (newPatient) => {
      // Invalidate patients list to refetch
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
      // Add new patient to cache
      queryClient.setQueryData(
        PATIENT_QUERY_KEY(newPatient.id),
        newPatient
      );
    },
    onError: (error) => {
      console.error('Failed to create patient:', error);
    },
  });
}

// Mutation hook for updating patient
export function useUpdatePatient(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePatientDTO) =>
      patientApi.updatePatient(patientId, data),
    onSuccess: (updatedPatient) => {
      // Update cache
      queryClient.setQueryData(
        PATIENT_QUERY_KEY(patientId),
        updatedPatient
      );
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to update patient:', error);
    },
  });
}

// Mutation hook for updating diagnosis
export function useUpdateDiagnosis(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (diagnosis: string) =>
      patientApi.updateDiagnosis(patientId, diagnosis),
    onSuccess: (updatedPatient) => {
      queryClient.setQueryData(
        PATIENT_QUERY_KEY(patientId),
        updatedPatient
      );
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to update diagnosis:', error);
    },
  });
}

// Mutation hook for deleting patient
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId: string) => patientApi.deletePatient(patientId),
    onSuccess: () => {
      // Invalidate patients list
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to delete patient:', error);
    },
  });
}

// Paginated query hook — for the patient list page (does not affect other usePatients callers)
export function usePaginatedPatients(page: number, search: string) {
  return useQuery({
    queryKey: ['patients', 'paginated', page, search],
    queryFn: () => patientApi.listPatientsPaginated(page, 20, search),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}

// Query hook for patient cost
export function usePatientCost(patientId: string) {
  return useQuery({
    queryKey: ['patient-cost', patientId],
    queryFn: () => patientApi.getPatientCost(patientId),
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5,
    enabled: !!patientId,
  });
}
