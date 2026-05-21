import { useState } from 'react';
import { usePatients } from '../hooks/usePatients';
import {
  useAppointments,
  useDoctors,
  useBookedSlots,
  useCreateAppointment,
  useRescheduleAppointment,
  useCancelAppointment,
} from '../hooks/useAppointments';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Calendar, Clock, User, Plus, X, RefreshCw, Search, Download } from 'lucide-react';
import type { Appointment } from '../types/appointments';
import { downloadCsv } from '../utils/exportCsv';

const ALL_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '11:30', '14:00', '14:30', '15:00', '15:30', '16:00',
];

const STATUS_STYLES: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

export function Appointments() {
  const { data: appointments, isLoading } = useAppointments();
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();
  const createAppointment = useCreateAppointment();
  const rescheduleAppointment = useRescheduleAppointment();
  const cancelAppointment = useCancelAppointment();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Book modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookPatientID, setBookPatientID] = useState('');
  const [bookDoctorID, setBookDoctorID] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookType, setBookType] = useState('In-Person');
  const [bookReason, setBookReason] = useState('');
  const [bookError, setBookError] = useState('');

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleID, setRescheduleID] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  // Fetch booked slots for selected doctor/date
  const { data: bookedSlots = [] } = useBookedSlots(bookDoctorID, bookDate);
  const { data: rescheduleBookedSlots = [] } = useBookedSlots(
    appointments?.find(a => a.id === rescheduleID)?.doctorID || '',
    rescheduleDate
  );

  // Filter appointments based on search term
  const filtered = appointments?.filter(a => {
    const patient = patients?.find(p => p.id === a.patientID);
    const search = searchTerm.toLowerCase();
    return (
      (patient?.name || '').toLowerCase().includes(search) ||
      (a.doctorName || '').toLowerCase().includes(search) ||
      (a.doctorSpecialty || '').toLowerCase().includes(search) ||
      a.date.includes(search) ||
      a.time.includes(search) ||
      a.status.toLowerCase().includes(search) ||
      a.type.toLowerCase().includes(search) ||
      (a.reason || '').toLowerCase().includes(search)
    );
  }) || [];

  const handleBook = async () => {
    setBookError('');
    if (!bookPatientID || !bookDoctorID || !bookDate || !bookTime) {
      setBookError('Please fill in all required fields and select a time slot');
      return;
    }
    try {
      await createAppointment.mutateAsync({
        patientID: bookPatientID,
        doctorID: bookDoctorID,
        date: bookDate,
        time: bookTime,
        type: bookType,
        reason: bookReason,
      });
      setShowBookModal(false);
      resetBookForm();
    } catch (err: any) {
      setBookError(err.message || 'Failed to book appointment');
    }
  };

  const handleReschedule = async () => {
    setRescheduleError('');
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Please select a new date and time slot');
      return;
    }
    try {
      await rescheduleAppointment.mutateAsync({
        id: rescheduleID,
        date: rescheduleDate,
        time: rescheduleTime,
      });
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleTime('');
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    await cancelAppointment.mutateAsync(id);
  };

  const openReschedule = (appointment: Appointment) => {
    setRescheduleID(appointment.id);
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleError('');
    setShowRescheduleModal(true);
  };

  const resetBookForm = () => {
    setBookPatientID('');
    setBookDoctorID('');
    setBookDate('');
    setBookTime('');
    setBookType('In-Person');
    setBookReason('');
    setBookError('');
  };

  const handleExportCsv = () => {
    downloadCsv(
      `appointments-${new Date().toISOString().split('T')[0]}.csv`,
      ['Patient', 'Doctor', 'Specialty', 'Date', 'Time', 'Type', 'Status', 'Reason'],
      filtered.map((a) => {
        const patient = patients?.find((p) => p.id === a.patientID);
        return [
          patient?.name || a.patientID,
          a.doctorName || '',
          a.doctorSpecialty || '',
          a.date,
          a.time,
          a.type,
          a.status,
          a.reason || '',
        ];
      })
    );
  };

  if (isLoading) return <LoadingSpinner />;

  const active = appointments?.filter(a => a.status !== 'Cancelled') || [];
  const cancelled = appointments?.filter(a => a.status === 'Cancelled') || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage patient appointments and scheduling</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => { resetBookForm(); setShowBookModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{active.length}</p>
          <p className="text-sm text-gray-500 mt-1">Active Appointments</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">
            {appointments?.filter(a => a.status === 'Confirmed').length || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Confirmed</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-red-400">
          <p className="text-2xl font-bold text-red-500">{cancelled.length}</p>
          <p className="text-sm text-gray-500 mt-1">Cancelled</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient, doctor, date, status or reason..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 border border-gray-300 rounded-md py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-gray-400 mt-2">
            Showing {filtered.length} of {appointments?.length || 0} appointments
          </p>
        )}
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Appointments</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{searchTerm ? `No appointments match "${searchTerm}"` : 'No appointments yet. Book the first one!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 uppercase text-xs">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 uppercase text-xs">Doctor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 uppercase text-xs">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 uppercase text-xs">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 uppercase text-xs">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 uppercase text-xs">Reason</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500 uppercase text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appointment) => {
                  const patient = patients?.find(p => p.id === appointment.patientID);
                  return (
                    <tr key={appointment.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{patient?.name || appointment.patientID.slice(0, 8) + '...'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{appointment.doctorName || '—'}</p>
                          <p className="text-xs text-gray-400">{appointment.doctorSpecialty}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{appointment.date}</span>
                          <Clock className="w-3.5 h-3.5 text-gray-400 ml-1" />
                          <span>{appointment.time}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{appointment.type}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[appointment.status] || 'bg-gray-100 text-gray-600'}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{appointment.reason || '—'}</td>
                      <td className="py-3 px-4">
                        {appointment.status !== 'Cancelled' && (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openReschedule(appointment)}
                              className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                              title="Reschedule"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCancel(appointment.id)}
                              className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Book Appointment</h2>
              <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Patient *</label>
                <select
                  value={bookPatientID}
                  onChange={e => setBookPatientID(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a patient</option>
                  {patients?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Doctor *</label>
                <select
                  value={bookDoctorID}
                  onChange={e => { setBookDoctorID(e.target.value); setBookTime(''); }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a doctor</option>
                  {doctors?.map(d => (
                    <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date *</label>
                <input
                  type="date"
                  value={bookDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setBookDate(e.target.value); setBookTime(''); }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {bookDoctorID && bookDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Time Slot *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_SLOTS.map(slot => {
                      const taken = bookedSlots.includes(slot);
                      const selected = bookTime === slot;
                      return (
                        <button
                          key={slot}
                          disabled={taken}
                          onClick={() => setBookTime(slot)}
                          className={`py-2 px-1 text-xs rounded-md border transition-colors ${
                            taken
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through border-gray-200'
                              : selected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Appointment Type</label>
                <select
                  value={bookType}
                  onChange={e => setBookType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>In-Person</option>
                  <option>Video Call</option>
                  <option>Phone Call</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={bookReason}
                  onChange={e => setBookReason(e.target.value)}
                  placeholder="e.g. Annual checkup, Follow-up"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {bookError && <p className="text-red-600 text-xs">{bookError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBook}
                  disabled={createAppointment.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {createAppointment.isPending ? 'Booking...' : 'Confirm Booking'}
                </button>
                <button
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Reschedule Appointment</h2>
              <button onClick={() => setShowRescheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">New Date *</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => { setRescheduleDate(e.target.value); setRescheduleTime(''); }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {rescheduleDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select New Time Slot *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_SLOTS.map(slot => {
                      const taken = rescheduleBookedSlots.includes(slot);
                      const selected = rescheduleTime === slot;
                      return (
                        <button
                          key={slot}
                          disabled={taken}
                          onClick={() => setRescheduleTime(slot)}
                          className={`py-2 px-1 text-xs rounded-md border transition-colors ${
                            taken
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through border-gray-200'
                              : selected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {rescheduleError && <p className="text-red-600 text-xs">{rescheduleError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReschedule}
                  disabled={rescheduleAppointment.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {rescheduleAppointment.isPending ? 'Saving...' : 'Confirm Reschedule'}
                </button>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}