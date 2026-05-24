export interface User {
  id: string;
  name: string;
  address: string;
  createdAt: Date;
}

export interface Allergy {
  substance: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening';
}

export interface Patient extends User {
  conditions: string[];
  diagnosis: string;
  totalCost: number;
  medicalHistory: Task[];
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  bloodType?: string;
  email?: string;
  allergies: Allergy[];
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  patientID: string;
  description: string;
  cost: number;
  timestamp: Date;
}

export interface CostReport {
  patientID: string;
  tasks: Task[];
  totalCost: number;
  generatedAt: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: Date;
}

export interface CreatePatientDTO {
  name: string;
  address: string;
  conditions: string[];
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  bloodType?: string;
  allergies?: Allergy[];
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
}

export interface UpdatePatientDTO {
  name?: string;
  address?: string;
  diagnosis?: string;
  conditions?: string[];
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  bloodType?: string;
  allergies?: Allergy[];
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  updatedAt?: string;
}

export interface CreateVitalDTO {
  patientId: string;
  recordedBy: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export interface CreateStaffDTO {
  name: string;
  address: string;
  role: string;
  specialization: string;
}

export interface RecordTaskDTO {
  patientID: string;
  description: string;
  cost: number;
}
