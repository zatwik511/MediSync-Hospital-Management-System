// User Models
export interface User {
  id: string;
  name: string;
  address: string;
  createdAt: Date;
}

export interface Patient extends User {
  conditions: string[];
  diagnosis: string;
  totalCost: number;
  medicalHistory: Task[];
}

export interface Staff extends User {
  role: 'radiologist' | 'doctor' | 'admin' | 'receptionist';
  specialization: string;
  certifications: string[];
  staff_code?: string;
  last_seen?: string;
}

// Image Models
export interface MedicalImage {
  id: string;
  patientID: string;
  uploadedAt: Date;
  uploadedBy: string;
  type: 'MRI' | 'CT' | 'Xray' | 'DICOM';
  diseaseClassification: string;
  filePath: string;
  imageUrl?: string;
}

// Task & Cost Tracking
export interface Task {
  id: string;
  patientID: string;
  description: string;
  cost: number;
  timestamp: Date;
}

// Financial Models
export interface CostReport {
  patientID: string;
  tasks: Task[];
  totalCost: number;
  generatedAt: Date;
}

// Report Models
export interface PatientHistory {
  patient: Patient;
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

// API Request DTOs
export interface CreatePatientDTO {
  name: string;
  address: string;
  conditions: string[];
}

export interface UpdatePatientDTO {
  name?: string;
  address?: string;
  diagnosis?: string;
  conditions?: string[];
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
  file: File;
}

export interface RecordTaskDTO {
  patientID: string;
  description: string;
  cost: number;
}

// API Response Wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: Date;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Error Response
export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: Date;
}
