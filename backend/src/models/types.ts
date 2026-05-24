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
  // Demographics
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  bloodType?: string;
  email?: string;
  // Clinical
  allergies: Allergy[];
  // Emergency contact
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  updatedAt?: string;
}

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

export interface Staff extends User {
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
}

export interface Task {
  id: string;
  patientID: string;
  description: string;
  cost: number;
  timestamp: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
  updatedAt?: string; // optimistic lock version
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
  role: 'radiologist' | 'doctor' | 'admin' | 'receptionist';
  specialization: string;
}

export interface UploadImageDTO {
  patientID: string;
  imageType: 'MRI' | 'CT' | 'Xray' | 'DICOM';
  diseaseType: string;
  fileName: string;
  imageUrl?: string;
}

export interface RecordTaskDTO {
  patientID: string;
  description: string;
  cost: number;
}

export interface CostReport {
  patientID: string;
  tasks: Task[];
  totalCost: number;
  generatedAt: Date;
}

export interface PatientHistory {
  patient: Patient | null;
  medicalImages: MedicalImage[];
  financialHistory: Task[];
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
