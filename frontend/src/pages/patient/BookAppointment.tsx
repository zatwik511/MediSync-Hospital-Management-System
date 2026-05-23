import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { PatientLayout } from '../../components/PatientLayout';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  usePatientDoctors,
  usePatientBookedSlots,
  usePatientCreateAppointment,
} from '../../hooks/usePatientPortal';

const ALL_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '11:30', '14:00', '14:30', '15:00', '15:30', '16:00',
];

export function BookAppointment() {
  const navigate = useNavigate();
  const { data: doctors, isLoading: loadingDoctors } = usePatientDoctors();
  const createAppointment = usePatientCreateAppointment();

  const [doctorID, setDoctorID] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('In-Person');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const { data: bookedSlots = [] } = usePatientBookedSlots(doctorID, date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!doctorID || !date || !time) {
      setError('Please select a doctor, date, and time slot.');
      return;
    }
    try {
      await createAppointment.mutateAsync({ doctorID, date, time, type, reason });
      navigate('/patient/appointments');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to book appointment.');
    }
  };

  if (loadingDoctors) return <PatientLayout><LoadingSpinner /></PatientLayout>;

  const today = new Date().toISOString().split('T')[0];

  return (
    <PatientLayout>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <CalendarPlus className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
              <select
                value={doctorID}
                onChange={e => { setDoctorID(e.target.value); setTime(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select a doctor</option>
                {doctors?.map(d => (
                  <option key={d.id} value={d.id}>{d.name} â€” {d.specialty}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={e => { setDate(e.target.value); setTime(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Time slots */}
            {doctorID && date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slot *
                  {bookedSlots.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      ({ALL_SLOTS.length - bookedSlots.length} available)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_SLOTS.map(slot => {
                    const taken = bookedSlots.includes(slot);
                    const selected = time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={taken}
                        onClick={() => setTime(slot)}
                        className={`py-2 text-xs rounded-lg border transition-colors ${
                          taken
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through border-gray-200'
                            : selected
                            ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                            : 'border-gray-300 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>In-Person</option>
                <option>Video Call</option>
                <option>Phone Call</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Annual checkup, follow-up visit"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={createAppointment.isPending || !time}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {createAppointment.isPending ? 'Bookingâ€¦' : 'Confirm Booking'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/patient/appointments')}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </PatientLayout>
  );
}
