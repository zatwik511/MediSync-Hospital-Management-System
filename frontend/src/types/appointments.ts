export interface Appointment {
  id: string;
  patientID: string;
  doctorID: string;
  doctorName?: string;
  doctorSpecialty?: string;
  date: string;
  time: string;
  type: string;
  status: 'Confirmed' | 'Cancelled' | 'Completed' | 'Pending';
  reason?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  availableDays: string[];
  staffId?: string | null;
  createdAt: string;
}

export interface CreateAppointmentDTO {
  patientID: string;
  doctorID: string;
  date: string;
  time: string;
  type?: string;
  reason?: string;
}

export interface AppointmentPage {
  data: Appointment[];
  total: number;
  page: number;
  totalPages: number;
  counts: { active: number; confirmed: number; cancelled: number };
}
