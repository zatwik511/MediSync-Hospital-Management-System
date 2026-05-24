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

export interface AvailabilitySlot {
  dayOfWeek: number;  // 0 = Sunday … 6 = Saturday
  startTime: string;  // 'HH:MM'
  endTime: string;    // 'HH:MM'
}

export interface AvailableSlotsResult {
  slots: string[];
  hasAvailability: boolean;
}
