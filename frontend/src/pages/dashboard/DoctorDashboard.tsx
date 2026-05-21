import { Link } from 'react-router-dom';
import { CalendarDays, Users, Clock, CalendarPlus } from 'lucide-react';
import { useAppointments, useDoctors } from '../../hooks/useAppointments';
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
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          Patient #{appt.patientID.slice(-6)}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date(appt.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          {' '}at {appt.time}
          {appt.type && ` · ${appt.type}`}
        </p>
        {appt.reason && (
          <p className="text-xs text-gray-400 italic mt-0.5 truncate">"{appt.reason}"</p>
        )}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOUR[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
        {appt.status}
      </span>
    </div>
  );
}

export function DoctorDashboard({ user }: { user: AuthUser }) {
  const { data: allAppointments = [], isLoading } = useAppointments();
  const { data: doctors = [] } = useDoctors();

  const lastLoginIso  = localStorage.getItem('lastLogin');
  const lastLoginText = lastLoginIso ? formatRelativeTime(lastLoginIso) : null;

  // Match this staff member to their doctor record by name
  const matchedDoctor = doctors.find(
    (d) => d.name.toLowerCase() === user.name.toLowerCase()
  );
  const doctorID = matchedDoctor?.id;

  // All appointments for this doctor
  const myAppointments = doctorID
    ? allAppointments.filter((a) => a.doctorID === doctorID)
    : [];

  const today = new Date().toISOString().split('T')[0];

  const todayAppointments = myAppointments.filter(
    (a) => a.date === today && a.status !== 'Cancelled'
  );

  const uniquePatients = new Set(
    myAppointments
      .filter((a) => a.status !== 'Cancelled')
      .map((a) => a.patientID)
  ).size;

  const recentAppointments = [...myAppointments]
    .sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      return d !== 0 ? d : b.time.localeCompare(a.time);
    })
    .slice(0, 8);

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
            <p className="text-gray-600 text-sm font-medium">Patients Seen</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '—' : uniquePatients}</p>
          </div>
          <div className="card p-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-indigo-100 text-indigo-600">
              <Clock size={24} />
            </div>
            <p className="text-gray-600 text-sm font-medium">Total Appointments</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{isLoading ? '—' : myAppointments.filter(a => a.status !== 'Cancelled').length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's schedule */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Today's Schedule
              {!isLoading && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              )}
            </h2>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <p className="text-sm text-gray-400">No appointments scheduled for today.</p>
            ) : (
              <div>
                {[...todayAppointments]
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appt) => <AppointmentRow key={appt.id} appt={appt} />)}
              </div>
            )}
          </div>

          {/* Recent appointments */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Recent Appointments</h2>
              <Link to="/appointments" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : recentAppointments.length === 0 ? (
              <p className="text-sm text-gray-400">No appointments yet.</p>
            ) : (
              <div>
                {recentAppointments.map((appt) => <AppointmentRow key={appt.id} appt={appt} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
