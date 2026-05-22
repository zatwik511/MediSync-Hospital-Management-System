import { apiClient } from './client';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  prescribedBy: string | null;
  prescribedByName: string | null;
  medications: Medication[];
  advice: string | null;
  prescribedAt: string;
}

export interface CreatePrescriptionDTO {
  patientId: string;
  medications: Medication[];
  advice?: string;
}

export const prescriptionApi = {
  async getByPatient(patientId: string): Promise<Prescription[]> {
    const res = await apiClient.get(`/prescriptions/patient/${patientId}`);
    return res.data.data;
  },

  async create(data: CreatePrescriptionDTO): Promise<Prescription> {
    const res = await apiClient.post('/prescriptions', data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/prescriptions/${id}`);
  },
};
