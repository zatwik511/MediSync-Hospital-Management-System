import { Link } from 'react-router-dom';
import { CalendarDays, Users, CalendarPlus, CalendarRange } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { formatRelativeTime } from '../../utils/time';
import type { AuthUser } from '../../hooks/useAuth';
import type { Appointment } from '../../types/appointments';

const STATUS_COLOUR: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  Cancelled:  'bg-red-100 text-red-700',
  Completed:  'bg-blue-100 text-blue-700',
  Pending:    'bg-yellow-100 text-yellow-700',
};

function AppointmentRow({ appt }: { appt: Appointment }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-800">{appt.time}</span>
          {appt.doctorName && (
            <span className="text-xs text-gray-500">{appt.doctorName}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          Patient #{appt.patientID.slice(-6)}
          {appt.type && ` · ${appt.type}`}
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOUR[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
        {appt.status}
      </span>
    </div>
  );
}

function UpcomingRow({ appt }: { appt: Appointment }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">
          {new Date(appt.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          <span className="text-gray-400 font-normal"> at {appt.time}</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {appt.doctorName ?? 'Doctor'}
          {appt.doctorSpecialty && ` · ${appt.doctorSpecialty}`}
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOUR[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
        {appt.status}
      </span>
    </div>
  );
}

export function ReceptionistDashboard({ user }: { user: AuthUser }) {
  const { data: allAppointments = [], isLoading } = useAppointments();

  const lastLoginIso  = localStorage.getItem('lastLogin');
  const lastLoginText = lastLoginIso ? formatRelativeTime(lastLoginIso) : null;

  const today = new Date().toISOString().split('T')[0];

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const next7 = in7Days.toISOString().split('T')[0];

  const todayAppointments = allAppointments
    .filter((a) => a.date === today && a.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  // "Checked in" = non-cancelled appointment today (proxy for checked-in patients)
  const checkedInCount = new Set(
    allAppointments
      .filter((a) => a.date === today && a.status !== 'Cancelled')
      .map((a) => a.patientID)
  ).size;

  const upcomingAppointments = allAppointments
    .filter((a) => a.date > today && a.date <= next7 && a.status !== 'Cancelled')
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.time.localeCompare(b.time);
    });

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
            <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '—' : todayAppointments.length}</p>
          </div>
          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-teal-100 text-teal-600">
              <Users size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Patients Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '—' : checkedInCount}</p>
          </div>
          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-purple-100 text-purple-600">
              <CalendarRange size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Upcoming (7 days)</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '—' : upcomingAppointments.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's appointments */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Today's Appointments
              <span className="ml-2 text-xs font-normal text-gray-400">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </h2>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <p className="text-sm text-gray-400">No appointments scheduled for today.</p>
            ) : (
              <div>
                {todayAppointments.map((appt) => <AppointmentRow key={appt.id} appt={appt} />)}
              </div>
            )}
          </div>

          {/* Next 7 days */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Next 7 Days</h2>
              <Link to="/appointments" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming appointments in the next 7 days.</p>
            ) : (
              <div>
                {upcomingAppointments.map((appt) => <UpcomingRow key={appt.id} appt={appt} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
