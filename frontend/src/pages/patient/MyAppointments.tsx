import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CalendarPlus, X } from 'lucide-react';
import { PatientLayout } from '../../components/PatientLayout';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useMyAppointments, usePatientCancelAppointment } from '../../hooks/usePatientPortal';

const STATUS_STYLES: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  Cancelled:  'bg-red-100 text-red-700',
  Completed:  'bg-blue-100 text-blue-700',
  Pending:    'bg-yellow-100 text-yellow-700',
};

export function MyAppointments() {
  const navigate = useNavigate();
  const { data: appointments, isLoading } = useMyAppointments();
  const cancelAppointment = usePatientCancelAppointment();

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    await cancelAppointment.mutateAsync(id);
  };

  const upcoming = appointments?.filter(a =>
    a.status !== 'Cancelled' && a.date >= new Date().toISOString().split('T')[0]
  ) ?? [];
  const past = appointments?.filter(a =>
    a.status === 'Cancelled' || a.date < new Date().toISOString().split('T')[0]
  ) ?? [];

  if (isLoading) return <PatientLayout><LoadingSpinner /></PatientLayout>;

  return (
    <PatientLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {upcoming.length} upcoming Â· {past.length} past
          </p>
        </div>
        <button
          onClick={() => navigate('/patient/book-appointment')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Book New
        </button>
      </div>

      {/* Upcoming */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No upcoming appointments.</p>
            <button
              onClick={() => navigate('/patient/book-appointment')}
              className="mt-3 text-emerald-600 hover:underline text-sm"
            >
              Book one now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onCancel={() => handleCancel(appt.id)}
                cancelling={cancelAppointment.isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past / Cancelled */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past & Cancelled</h2>
          <div className="space-y-3">
            {past.map(appt => (
              <AppointmentCard key={appt.id} appointment={appt} />
            ))}
          </div>
        </section>
      )}
    </PatientLayout>
  );
}

// â”€â”€ Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CardProps {
  appointment: {
    id: string;
    doctorName?: string;
    doctorSpecialty?: string;
    date: string;
    time: string;
    type: string;
    status: string;
    reason?: string;
  };
  onCancel?: () => void;
  cancelling?: boolean;
}

function AppointmentCard({ appointment: a, onCancel, cancelling }: CardProps) {
  const canCancel = onCancel && a.status !== 'Cancelled' && a.status !== 'Completed';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-gray-900">{a.doctorName || 'Doctor'}</span>
          {a.doctorSpecialty && (
            <span className="text-xs text-gray-400">{a.doctorSpecialty}</span>
          )}
          <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[a.status] || 'bg-gray-100 text-gray-600'}`}>
            {a.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />{a.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />{a.time}
          </span>
          <span className="text-gray-400">{a.type}</span>
        </div>
        {a.reason && (
          <p className="text-xs text-gray-400 mt-1">{a.reason}</p>
        )}
      </div>

      {canCancel && (
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
          title="Cancel appointment"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
