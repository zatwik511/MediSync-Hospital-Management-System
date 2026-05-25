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
  recordedAt: string;
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
  staff_code?: string;
  last_seen?: string;
}

export interface MedicalImage {
  id: string;
  patientID: string;
  uploadedAt: Date;
  uploadedBy: string;
  type: 'MRI' | 'CT' | 'Xray' | 'DICOM';
  diseaseClassification: string;
  filePath: string;
  imageUrl?: string;
  notes?: string;
}

export interface UploadImageDTO {
  patientID: string;
  imageType: 'MRI' | 'CT' | 'Xray' | 'DICOM';
  diseaseType: string;
  file: File;
}

export interface PatientHistory {
  patient: import('@medisync/shared').Patient;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: Date;
}
