import { CalendarDays, Users, Clock } from 'lucide-react';
import { useAppointments, useDoctors, useCancelAppointment } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { formatRelativeTime } from '../../utils/time';
import { ScheduleSection } from './ScheduleSection';
import type { AuthUser } from '../../hooks/useAuth';

export function DoctorDashboard({ user }: { user: AuthUser }) {
  const { data: allAppointments = [], isLoading } = useAppointments();
  const { data: doctors = [] }   = useDoctors();
  const { data: patients = [] }  = usePatients();
  const cancelMutation           = useCancelAppointment();

  const cancellingId = cancelMutation.isPending ? (cancelMutation.variables ?? null) : null;

  const lastLoginIso  = localStorage.getItem('lastLogin');
  const lastLoginText = lastLoginIso ? formatRelativeTime(lastLoginIso) : null;

  const matchedDoctor = doctors.find(
    d => d.name.toLowerCase() === user.name.toLowerCase()
  );
  const doctorID = matchedDoctor?.id;

  const myAppointments = doctorID
    ? allAppointments.filter(a => a.doctorID === doctorID)
    : [];

  const today = new Date().toLocaleDateString('en-CA');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toLocaleDateString('en-CA');

  const todayLabel    = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const tomorrowLabel = tomorrowDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const todaySchedule = myAppointments
    .filter(a => a.date.split('T')[0] === today && a.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  const tomorrowSchedule = myAppointments
    .filter(a => a.date.split('T')[0] === tomorrow && a.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  const uniquePatients = new Set(
    myAppointments.filter(a => a.status !== 'Cancelled').map(a => a.patientID)
  ).size;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            {lastLoginText && (
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user.name}. Last login: {lastLoginText}
              </p>
            )}
            {matchedDoctor && (
              <p className="text-sm text-gray-400 mt-0.5">{matchedDoctor.specialty}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-blue-100 text-blue-600">
              <CalendarDays size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Appointments Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 font-display tabular-nums">{isLoading ? '—' : todaySchedule.length}</p>
          </div>
          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-teal-100 text-teal-600">
              <Users size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Patients Seen</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 font-display tabular-nums">{isLoading ? '—' : uniquePatients}</p>
          </div>
          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-indigo-100 text-indigo-600">
              <Clock size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Appointments</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 font-display tabular-nums">{isLoading ? '—' : myAppointments.filter(a => a.status !== 'Cancelled').length}</p>
          </div>
        </div>

        {/* Today's Schedule + Upcoming Tomorrow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScheduleSection
            title="Today's Schedule"
            dateLabel={todayLabel}
            appointments={todaySchedule}
            patients={patients}
            onCancel={id => cancelMutation.mutate(id)}
            cancellingId={cancellingId}
            isLoading={isLoading}
            emptyMessage="No appointments scheduled for today."
          />
          <ScheduleSection
            title="Upcoming Tomorrow"
            dateLabel={tomorrowLabel}
            appointments={tomorrowSchedule}
            patients={patients}
            onCancel={id => cancelMutation.mutate(id)}
            cancellingId={cancellingId}
            isLoading={isLoading}
            emptyMessage="No appointments scheduled for tomorrow."
          />
        </div>
      </div>
    </div>
  );
}
