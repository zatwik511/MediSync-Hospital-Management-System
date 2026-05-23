import { Link } from 'react-router-dom';
import { CalendarDays, Users, CalendarPlus, CalendarRange } from 'lucide-react';
import { useAppointments, useCancelAppointment } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { formatRelativeTime } from '../../utils/time';
import { ScheduleSection } from './ScheduleSection';
import type { AuthUser } from '../../hooks/useAuth';

export function ReceptionistDashboard({ user }: { user: AuthUser }) {
  const { data: allAppointments = [], isLoading } = useAppointments();
  const { data: patients = [] }  = usePatients();
  const cancelMutation           = useCancelAppointment();

  const cancellingId = cancelMutation.isPending ? (cancelMutation.variables ?? null) : null;

  const lastLoginIso  = localStorage.getItem('lastLogin');
  const lastLoginText = lastLoginIso ? formatRelativeTime(lastLoginIso) : null;

  const today = new Date().toLocaleDateString('en-CA');
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toLocaleDateString('en-CA');

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const next7 = in7Days.toLocaleDateString('en-CA');

  const todayLabel    = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const tomorrowLabel = tomorrowDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const todaySchedule = allAppointments
    .filter(a => a.date.split('T')[0] === today && a.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  const tomorrowSchedule = allAppointments
    .filter(a => a.date.split('T')[0] === tomorrow && a.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcomingCount = allAppointments.filter(
    a => a.date > today && a.date <= next7 && a.status !== 'Cancelled'
  ).length;

  const checkedInCount = new Set(
    todaySchedule.map(a => a.patientID)
  ).size;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reception Dashboard</h1>
            {lastLoginText && (
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user.name}. Last login: {lastLoginText}
              </p>
            )}
          </div>
          <Link
            to="/appointments"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            Book Appointment
          </Link>
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
            <p className="text-gray-600 text-sm font-medium">Patients Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 font-display tabular-nums">{isLoading ? '—' : checkedInCount}</p>
          </div>
          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-purple-100 text-purple-600">
              <CalendarRange size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Upcoming (7 days)</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 font-display tabular-nums">{isLoading ? '—' : upcomingCount}</p>
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
