export type {
  User,
  Allergy,
  Patient,
  Task,
  CostReport,
  APIResponse,
  CreatePatientDTO,
  UpdatePatientDTO,
  CreateVitalDTO,
  CreateStaffDTO,
  RecordTaskDTO,
} from '@medisync/shared';

export interface Vital {
  id: string;
  patientId: string;
  recordedAt: Date;
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

export interface Staff {
  id: string;
  name: string;
  address: string;
  createdAt: Date;
  role: 'radiologist' | 'doctor' | 'admin' | 'receptionist';
  specialization: string;
  certifications: string[];
  staff_code: string;
  pin?: string;
  last_seen?: Date;
}

export interface MedicalImage {
  id: string;
  patientID: string;
  uploadedAt: Date;
  uploadedBy: string;
  type: 'MRI' | 'CT' | 'Xray';
  diseaseClassification: string;
  imageUrl?: string;
  notes?: string;
}

export interface UploadImageDTO {
  patientID: string;
  imageType: 'MRI' | 'CT' | 'Xray' | 'DICOM';
  diseaseType: string;
  fileName: string;
  imageUrl?: string;
}

export interface PatientHistory {
  patient: import('@medisync/shared').Patient | null;
  medicalImages: MedicalImage[];
  financialHistory: import('@medisync/shared').Task[];
  totalCost: number;
}

export interface DiagnosticReport {
  patientName: string;
  patientID: string;
  conditions: string[];
  diagnosis: string;
  diseaseClassifications: Record<string, number>;
  imagingTests: MedicalImage[];
  reportGeneratedAt: Date;
  generatedBy: string;
}
