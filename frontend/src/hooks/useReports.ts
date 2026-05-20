import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';

export function usePatientHistory(patientId: string) {
  return useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: () => reportApi.generatePatientHistory(patientId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!patientId,
  });
}

export function useDiagnosticReport(patientId: string) {
  return useQuery({
    queryKey: ['diagnostic-report', patientId],
    queryFn: () => reportApi.generateDiagnosticReport(patientId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!patientId,
  });
}

export function useAppointmentAnalytics() {
  return useQuery({
    queryKey: ['appointment-analytics'],
    queryFn: () => reportApi.getAppointmentAnalytics(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}