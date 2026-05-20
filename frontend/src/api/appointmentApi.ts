import { apiClient } from './client';
import type { APIResponse } from '../types';
import type { Appointment, Doctor, CreateAppointmentDTO } from '../types/appointments';

export const appointmentApi = {

  // Get all appointments
  async listAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<APIResponse<Appointment[]>>('/appointments');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch appointments');
    }
    return response.data.data || [];
  },

  // Get appointments for a specific patient
  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    const response = await apiClient.get<APIResponse<Appointment[]>>(
      `/appointments/patient/${patientId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch appointments');
    }
    return response.data.data || [];
  },

  // Get all doctors
  async listDoctors(): Promise<Doctor[]> {
    const response = await apiClient.get<APIResponse<Doctor[]>>('/appointments/doctors');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch doctors');
    }
    return response.data.data || [];
  },

  // Get booked slots for a doctor on a date
  async getBookedSlots(doctorId: string, date: string): Promise<string[]> {
    const response = await apiClient.get<APIResponse<string[]>>(
      `/appointments/slots/${doctorId}/${date}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch slots');
    }
    return response.data.data || [];
  },

  // Book a new appointment
  async createAppointment(data: CreateAppointmentDTO): Promise<Appointment> {
    const response = await apiClient.post<APIResponse<Appointment>>('/appointments', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to book appointment');
    }
    return response.data.data!;
  },

  // Reschedule an appointment
  async rescheduleAppointment(appointmentId: string, date: string, time: string): Promise<Appointment> {
    const response = await apiClient.put<APIResponse<Appointment>>(
      `/appointments/${appointmentId}/reschedule`,
      { date, time }
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to reschedule appointment');
    }
    return response.data.data!;
  },

  // Cancel an appointment
  async cancelAppointment(appointmentId: string): Promise<void> {
    const response = await apiClient.put<APIResponse<null>>(
      `/appointments/${appointmentId}/cancel`,
      {}
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to cancel appointment');
    }
  },

  // Get total appointment count for dashboard
  async getTotalAppointmentCount(): Promise<number> {
    const response = await apiClient.get<APIResponse<number>>('/appointments/count');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch count');
    }
    return response.data.data || 0;
  },
};
