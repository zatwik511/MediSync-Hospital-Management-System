import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, X, AlertCircle } from 'lucide-react';
import { useAppointments, useDoctors, useCancelAppointment } from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Appointment } from '../types/appointments';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_STYLES: Record<string, string> = {
  Confirmed: 'bg-emerald-100 text-emerald-700',
  Pending:   'bg-amber-100 text-amber-700',
  Completed: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-red-100 text-red-700',
};

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

interface AppointmentCardProps {
  appt: Appointment;
  patientName: string;
  patientId: string;
  onCancel: (id: string) => void;
  cancelling: boolean;
}

function AppointmentCard({ appt, patientName, patientId, onCancel, cancelling }: AppointmentCardProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (appt.status === 'Cancelled') return null;

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm text-xs group">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="font-bold text-gray-800 tabular-nums">{appt.time}</span>
        <button
          onClick={() => setConfirmCancel(true)}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-all"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <Link
        to={`/patients/${patientId}`}
        className="font-semibold text-gray-800 hover:text-emerald-600 block truncate"
        title={patientName}
      >
        {patientName}
      </Link>
      {appt.reason && (
        <p className="text-gray-400 truncate mt-0.5" title={appt.reason}>{appt.reason}</p>
      )}
      <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[appt.status] ?? 'bg-gray-100 text-gray-500'}`}>
        {appt.status}
      </span>

      {confirmCancel && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-gray-600 mb-1.5">Cancel this appointment?</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => { onCancel(appt.id); setConfirmCancel(false); }}
              disabled={cancelling}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1 text-[10px] font-medium disabled:opacity-50 transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Yes, cancel'}
            </button>
            <button
              onClick={() => setConfirmCancel(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded px-2 py-1 text-[10px] font-medium transition-colors"
            >
              Keep
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MySchedule() {
  const user = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: allAppointments = [], isLoading: loadingAppts } = useAppointments();
  const { data: doctors = [], isLoading: loadingDoctors } = useDoctors();
  const { data: patients = [] } = usePatients();
  const cancelMutation = useCancelAppointment();

  const isLoading = loadingAppts || loadingDoctors;

  const matchedDoctor = doctors.find(
    d => d.name.toLowerCase() === (user?.name || '').toLowerCase()
  );
  const doctorID = matchedDoctor?.id;

  const myAppointments = doctorID
    ? allAppointments.filter(a => a.doctorID === doctorID && a.status !== 'Cancelled')
    : [];

  const baseMonday = getMondayOf(new Date());
  const monday = new Date(baseMonday);
  monday.setDate(monday.getDate() + weekOffset * 7);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const today = new Date().toLocaleDateString('en-CA');
  const cancellingId = cancelMutation.isPending ? (cancelMutation.variables ?? null) : null;

  const weekLabel = (() => {
    const start = weekDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const end = weekDates[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${start} - ${end}`;
  })();

  const weekApptCount = myAppointments.filter(a => {
    const d = a.date.split('T')[0];
    const weekStart = weekDates[0].toLocaleDateString('en-CA');
    const weekEnd = weekDates[6].toLocaleDateString('en-CA');
    return d >= weekStart && d <= weekEnd;
  }).length;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
              {matchedDoctor && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {matchedDoctor.specialty}
                  {weekApptCount > 0 && (
                    <span className="ml-2 text-emerald-600 font-medium">{weekApptCount} appointment{weekApptCount !== 1 ? 's' : ''} this week</span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:border-gray-300 disabled:opacity-40 disabled:cursor-default transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">{weekLabel}</span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!matchedDoctor ? (
          <div className="card p-10 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Account not linked to a doctor profile</p>
            <p className="text-gray-400 text-sm mt-1">Your account name does not match any doctor on record. Contact an administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, idx) => {
              const dateStr = date.toLocaleDateString('en-CA');
              const isToday = dateStr === today;
              const dayAppts = myAppointments
                .filter(a => a.date.split('T')[0] === dateStr)
                .sort((a, b) => a.time.localeCompare(b.time));

              return (
                <div key={dateStr} className="flex flex-col min-w-0">
                  <div className={`mb-2 text-center rounded-xl py-2.5 ${isToday ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-white border border-gray-100'}`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? 'text-emerald-100' : 'text-gray-400'}`}>
                      {DAY_SHORT[idx]}
                    </p>
                    <p className={`text-xl font-bold mt-0.5 leading-none ${isToday ? 'text-white' : 'text-gray-800'}`}>
                      {date.getDate()}
                    </p>
                    {dayAppts.length > 0 && (
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isToday ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                        {dayAppts.length}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1">
                    {dayAppts.length === 0 ? (
                      <div className="flex-1 flex items-start justify-center pt-4">
                        <p className="text-[11px] text-gray-300 text-center leading-tight">Free</p>
                      </div>
                    ) : (
                      dayAppts.map(appt => {
                        const patient = patients.find(p => p.id === appt.patientID);
                        return (
                          <AppointmentCard
                            key={appt.id}
                            appt={appt}
                            patientName={patient?.name ?? 'Unknown Patient'}
                            patientId={appt.patientID}
                            onCancel={id => cancelMutation.mutate(id)}
                            cancelling={cancellingId === appt.id}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
