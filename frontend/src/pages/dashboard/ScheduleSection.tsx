import { X } from 'lucide-react';
import type { Appointment } from '../../types/appointments';

interface SchedulePatient { id: string; name: string; }

const STATUS_COLOUR: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  Cancelled:  'bg-red-100 text-red-700',
  Completed:  'bg-blue-100 text-blue-700',
  Pending:    'bg-yellow-100 text-yellow-700',
};

function AppointmentCard({
  appt,
  patientName,
  onCancel,
  cancelling,
}: {
  appt: Appointment;
  patientName: string;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{appt.time}</span>
          <span className="text-sm text-gray-700">{patientName}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-xs text-gray-500">
          {appt.doctorName && <span>{appt.doctorName}</span>}
          {appt.doctorName && appt.type && <span>·</span>}
          {appt.type && <span>{appt.type}</span>}
        </div>
        {appt.reason && (
          <p className="text-xs text-gray-400 italic mt-0.5 truncate">"{appt.reason}"</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOUR[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {appt.status}
        </span>
        {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
          <button
            onClick={() => onCancel(appt.id)}
            disabled={cancelling}
            className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cancel appointment"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function ScheduleSection({
  title,
  dateLabel,
  appointments,
  patients,
  onCancel,
  cancellingId,
  isLoading,
  emptyMessage = 'No appointments scheduled.',
}: {
  title: string;
  dateLabel?: string;
  appointments: Appointment[];
  patients: SchedulePatient[];
  onCancel: (id: string) => void;
  cancellingId: string | null | undefined;
  isLoading: boolean;
  emptyMessage?: string;
}) {
  function getPatientName(patientID: string): string {
    const p = patients.find(pt => pt.id === patientID);
    return p?.name ?? `Patient #${patientID.slice(-6)}`;
  }

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-1">
        {title}
        {dateLabel && (
          <span className="ml-2 text-xs font-normal text-gray-400">{dateLabel}</span>
        )}
      </h2>
      {isLoading ? (
        <div className="space-y-3 mt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <p className="text-sm text-gray-400 mt-3">{emptyMessage}</p>
      ) : (
        <div className="mt-3">
          {appointments.map(appt => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              patientName={getPatientName(appt.patientID)}
              onCancel={onCancel}
              cancelling={cancellingId === appt.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
