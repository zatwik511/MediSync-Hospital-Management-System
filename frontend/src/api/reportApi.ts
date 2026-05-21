import { apiClient } from './client';
import type {
  PatientHistory,
  DiagnosticReport,
  APIResponse,
} from '../types';

export interface AppointmentAnalytics {
  totalAppointments: number;
  fulfilmentRate: number;
  cancellationRate: number;
  byStatus: { label: string; count: number }[];
  byType: { label: string; count: number }[];
  byDoctor: { name: string; specialty: string; count: number }[];
  monthly: { month: string; count: number }[];
}

export interface AdvancedAppointmentAnalytics {
  busiestDays: { day: number; dayName: string; count: number }[];
  busiestSlots: { time: string; count: number }[];
  avgPerWeek: number;
  topReasons: { reason: string; count: number }[];
  trend: { thisMonth: number; lastMonth: number; changePercent: number | null };
  heatmap: { day: number; time: string; count: number }[];
}

export const reportApi = {
  // Generate patient history report
  async generatePatientHistory(patientId: string): Promise<PatientHistory> {
    const response = await apiClient.get<APIResponse<PatientHistory>>(
      `/reports/patient/${patientId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate patient history');
    }
    return response.data.data!;
  },

  // Generate diagnostic report
  async generateDiagnosticReport(patientId: string): Promise<DiagnosticReport> {
    const response = await apiClient.get<APIResponse<DiagnosticReport>>(
      `/reports/diagnostic/${patientId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to generate diagnostic report');
    }
    return response.data.data!;
  },

  // Get appointment analytics
  async getAppointmentAnalytics(): Promise<AppointmentAnalytics> {
    const response = await apiClient.get<APIResponse<AppointmentAnalytics>>(
      '/reports/appointment-analytics'
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch analytics');
    }
    return response.data.data!;
  },

  async getAdvancedAnalytics(): Promise<AdvancedAppointmentAnalytics> {
    const response = await apiClient.get<APIResponse<AdvancedAppointmentAnalytics>>(
      '/reports/appointment-analytics/advanced'
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch advanced analytics');
    }
    return response.data.data!;
  },
};