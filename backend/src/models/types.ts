// ✅ IMPORTANT: All interfaces must have 'export' keyword!

// User Models (Base type for everyone)
export interface User {
  id: string;              // Unique identifier (auto-generated)
  name: string;            // Person's name
  address: string;         // Where they live
  createdAt: Date;         // When record was created
}

// Patient Model (extends User - has everything User has PLUS more)
export interface Patient extends User {
  conditions: string[];    // Array of conditions (e.g., ["Diabetes", "Hypertension"])
  diagnosis: string;       // Current diagnosis
  totalCost: number;       // Total money spent on this patient
  medicalHistory: Task[];  // All tasks/costs for this patient
}

// Staff Model (Doctor, Radiologist, Admin)
export interface Staff extends User {
  role: 'radiologist' | 'doctor' | 'admin' | 'receptionist';
  specialization: string;
  certifications: string[];
  staff_code: string;
  pin?: string;
  last_seen?: Date;
}

// Medical Image Model
export interface MedicalImage {
  id: string;
  patientID: string;           // Which patient is this for
  uploadedAt: Date;            // When it was uploaded
  uploadedBy: string;          // Which staff member uploaded it
  type: 'MRI' | 'CT' | 'Xray'; // What type of scan
  diseaseClassification: string; // What disease does it show
  imageUrl?: string;         // URL to access the image
}

// Task Model (A unit of work that costs money)
export interface Task {
  id: string;
  patientID: string;    // Which patient
  description: string;  // What was done (e.g., "MRI Scan")
  cost: number;         // How much it costs (in pounds)
  timestamp: Date;      // When it happened
}

// API Response (Standard format for all responses)
export interface APIResponse<T> {
  success: boolean;     // Did it work?
  data?: T;            // The actual data (if success is true)
  error?: string;      // Error message (if success is false)
}

// DTO (Data Transfer Object) for creating patients
export interface CreatePatientDTO {
  name: string;
  address: string;
  conditions: string[];
}

// DTO for creating staff
export interface CreateStaffDTO {
  name: string;
  address: string;
  role: 'radiologist' | 'doctor' | 'admin' | 'receptionist';
  specialization: string;
}

// DTO for uploading images
export interface UploadImageDTO {
  patientID: string;
  imageType: 'MRI' | 'CT' | 'Xray' | 'DICOM';
  diseaseType: string;
  fileName: string;
  imageUrl?: string;
}

// DTO for recording tasks
export interface RecordTaskDTO {
  patientID: string;
  description: string;
  cost: number;
}

// Cost Report
export interface CostReport {
  patientID: string;
  tasks: Task[];
  totalCost: number;
  generatedAt: Date;
}

// Patient History
export interface PatientHistory {
  patient: Patient | null;
  medicalImages: MedicalImage[];
  financialHistory: Task[];
  totalCost: number;
}

// Diagnostic Report
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
