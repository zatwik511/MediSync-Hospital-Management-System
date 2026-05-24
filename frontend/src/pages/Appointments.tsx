import { useState, useEffect } from 'react';
import { usePatients } from '../hooks/usePatients';
import {
  usePaginatedAppointments,
  useDoctors,
  useBookedSlots,
  useCreateAppointment,
  useRescheduleAppointment,
  useCancelAppointment,
} from '../hooks/useAppointments';
import { useAppointmentAnalytics, useAdvancedAppointmentAnalytics } from '../hooks/useReports';
import { SkeletonTableRow, SkeletonStatCard } from '../components/Skeleton';
import { Pagination } from '../components/Pagination';
import {
  Calendar, Clock, User, Plus, X, RefreshCw, Search, Download,
  TrendingUp, BarChart2, MessageSquare, ArrowUpRight, ArrowDownRight, Minus,
  CheckCircle, XCircle, Users,
} from 'lucide-react';
import type { Appointment } from '../types/appointments';
import { downloadCsv } from '../utils/exportCsv';

const ALL_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '11:30', '14:00', '14:30', '15:00', '15:30', '16:00',
];

const DAYS = [
  { dow: 1, label: 'Mon' },
  { dow: 2, label: 'Tue' },
  { dow: 3, label: 'Wed' },
  { dow: 4, label: 'Thu' },
  { dow: 5, label: 'Fri' },
  { dow: 6, label: 'Sat' },
  { dow: 0, label: 'Sun' },
];

const STATUS_STYLES: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

const PAGE_SIZE = 20;

export function Appointments() {
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

  // Pagination & search state
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiSearch, setApiSearch] = useState('');

  // Debounce search â†' reset page on new search
  useEffect(() => {
    const timer = setTimeout(() => {
      setApiSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: result, isLoading } = usePaginatedAppointments(page, apiSearch);
  const appointments = result?.data || [];
  const counts = result?.counts ?? { active: 0, confirmed: 0, cancelled: 0 };

  const { data: doctors } = useDoctors();
  // Patients still fetched in full â€" used for the book modal dropdown and name lookup
  const { data: patients } = usePatients();
  const createAppointment = useCreateAppointment();
  const rescheduleAppointment = useRescheduleAppointment();
  const cancelAppointment = useCancelAppointment();

  const { data: analytics } = useAppointmentAnalytics();
  const { data: advanced } = useAdvancedAppointmentAnalytics();

  // Book modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookPatientID, setBookPatientID] = useState('');
  const [bookDoctorID, setBookDoctorID] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('');
  const [bookType, setBookType] = useState('In-Person');
  const [bookReason, setBookReason] = useState('');
  const [bookErrors, setBookErrors] = useState({ patient: '', doctor: '', date: '', time: '' });
  const [bookApiError, setBookApiError] = useState('');
  const [bookSubmitted, setBookSubmitted] = useState(false);

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleID, setRescheduleID] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  // Fetch available slots for selected doctor/date
  const { data: bookSlotsData } = useBookedSlots(bookDoctorID, bookDate);
  const availableBookSlots = bookSlotsData?.slots ?? [];
  const { data: rescheduleSlotsData } = useBookedSlots(
    appointments.find(a => a.id === rescheduleID)?.doctorID || '',
    rescheduleDate
  );
  const availableRescheduleSlots = rescheduleSlotsData?.slots ?? [];

  const handleBook = async () => {
    setBookSubmitted(true);
    setBookApiError('');

    const today = new Date().toLocaleDateString('en-CA');
    const errs = {
      patient: !bookPatientID ? 'Please select a patient' : '',
      doctor:  !bookDoctorID  ? 'Please select a doctor'  : '',
      date:    !bookDate      ? 'Please select a date'
               : bookDate < today ? 'Date cannot be in the past' : '',
      time:    !bookTime      ? 'Please select a time slot' : '',
    };
    setBookErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

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
      setBookApiError(err.message || 'Failed to book appointment');
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
    setBookErrors({ patient: '', doctor: '', date: '', time: '' });
    setBookApiError('');
    setBookSubmitted(false);
  };

  const handleExportCsv = () => {
    downloadCsv(
      `appointments-${new Date().toLocaleDateString('en-CA')}.csv`,
      ['Patient', 'Doctor', 'Specialty', 'Date', 'Time', 'Type', 'Status', 'Reason'],
      appointments.map((a) => {
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

  if (isLoading && !result) return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-52 animate-pulse bg-gray-200 rounded" />
          <div className="h-4 w-72 animate-pulse bg-gray-200 rounded" />
        </div>
      </div>
      <div className="h-10 w-64 animate-pulse bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Date', 'Patient', 'Doctor', 'Specialty', 'Time', 'Type', 'Status', ''].map(h => (
                <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} cols={8} />)}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage patient appointments and scheduling</p>
        </div>
        {activeTab === 'list' && (
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Book Appointment
            </button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1 w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Appointments
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analytics' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {activeTab === 'list' && (
      <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-emerald-500">
          <p className="text-2xl font-bold text-emerald-600">{counts.active}</p>
          <p className="text-sm text-gray-500 mt-1">Active Appointments</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{counts.confirmed}</p>
          <p className="text-sm text-gray-500 mt-1">Confirmed</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-red-400">
          <p className="text-2xl font-bold text-red-500">{counts.cancelled}</p>
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
            className="w-full pl-9 pr-4 border border-gray-300 rounded-md py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        {apiSearch && (
          <p className="text-xs text-gray-400 mt-2">
            {result?.total ?? 0} appointment{result?.total !== 1 ? 's' : ''} match "{apiSearch}"
          </p>
        )}
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Appointments</h2>
        </div>
        {appointments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{apiSearch ? `No appointments match "${apiSearch}"` : 'No appointments yet. Book the first one!'}</p>
          </div>
        ) : (
          <>
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
                  {appointments.map((appointment) => {
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
                            <p className="font-medium">{appointment.doctorName || '-'}</p>
                            <p className="text-xs text-gray-400">{appointment.doctorSpecialty}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{new Date(appointment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
                        <td className="py-3 px-4 text-gray-500 text-xs">{appointment.reason || '-'}</td>
                        <td className="py-3 px-4">
                          {appointment.status !== 'Cancelled' && (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => openReschedule(appointment)}
                                className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"
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
            <div className="px-5 pb-4">
              <Pagination
                page={page}
                totalPages={result?.totalPages ?? 1}
                total={result?.total ?? 0}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
      </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Appointment Analytics</h2>
          {!analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
            </div>
          )}
          {analytics && (<>

          {/* Top stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-emerald-500">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-500">Total Appointments</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{analytics.totalAppointments}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-green-500">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500">Fulfilment Rate</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{analytics.fulfilmentRate}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-red-400">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-500">Cancellation Rate</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{analytics.cancellationRate}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-purple-500">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-gray-500">Active Doctors</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{analytics.byDoctor.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly volume */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Volume (Last 6 Months)</h3>
              {analytics.monthly.length === 0 ? (
                <p className="text-gray-400 text-sm">No data yet</p>
              ) : (
                <div className="flex items-end gap-3 h-36 pt-4">
                  {analytics.monthly.map((m) => {
                    const max = Math.max(...analytics.monthly.map(x => x.count), 1);
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500 font-medium">{m.count}</span>
                        <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${Math.max((m.count / max) * 100, 4)}%` }} />
                        <span className="text-xs text-gray-400 text-center leading-tight">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* By status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">By Status</h3>
              <div className="space-y-3">
                {analytics.byStatus.map((s) => {
                  const pct = analytics.totalAppointments > 0 ? Math.round((s.count / analytics.totalAppointments) * 100) : 0;
                  const colours: Record<string, string> = { Confirmed: 'bg-green-500', Cancelled: 'bg-red-400', Completed: 'bg-blue-500', Pending: 'bg-yellow-400' };
                  return (
                    <div key={s.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{s.label}</span>
                        <span className="font-semibold">{s.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${colours[s.label] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By type */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">By Type</h3>
              <div className="space-y-3">
                {analytics.byType.map((t) => {
                  const pct = analytics.totalAppointments > 0 ? Math.round((t.count / analytics.totalAppointments) * 100) : 0;
                  return (
                    <div key={t.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{t.label}</span>
                        <span className="font-semibold">{t.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By doctor */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Per Doctor</h3>
              <div className="space-y-3">
                {analytics.byDoctor.map((d) => {
                  const max = Math.max(...analytics.byDoctor.map(x => x.count), 1);
                  const pct = Math.round((d.count / max) * 100);
                  return (
                    <div key={d.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <div>
                          <span className="text-gray-700 font-medium">{d.name}</span>
                          <span className="text-gray-400 text-xs ml-2">{d.specialty}</span>
                        </div>
                        <span className="font-semibold">{d.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Advanced insights */}
          {advanced && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Insights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-indigo-500">
                  <div className="flex items-center gap-2 mb-2"><BarChart2 className="w-4 h-4 text-indigo-500" /><span className="text-xs text-gray-500">Busiest Day</span></div>
                  {advanced.busiestDays.length > 0 ? (
                    <><p className="text-xl font-bold text-gray-900">{advanced.busiestDays.reduce((a, b) => a.count >= b.count ? a : b).dayName}</p><p className="text-xs text-gray-400 mt-0.5">{advanced.busiestDays.reduce((a, b) => a.count >= b.count ? a : b).count} appts</p></>
                  ) : <p className="text-sm text-gray-400">No data</p>}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-cyan-500">
                  <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-cyan-500" /><span className="text-xs text-gray-500">Busiest Slot</span></div>
                  {advanced.busiestSlots.length > 0 ? (
                    <><p className="text-xl font-bold text-gray-900">{advanced.busiestSlots[0].time}</p><p className="text-xs text-gray-400 mt-0.5">{advanced.busiestSlots[0].count} appts</p></>
                  ) : <p className="text-sm text-gray-400">No data</p>}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-amber-500">
                  <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-amber-500" /><span className="text-xs text-gray-500">Avg / Week</span></div>
                  <p className="text-xl font-bold text-gray-900">{advanced.avgPerWeek}</p>
                  <p className="text-xs text-gray-400 mt-0.5">last 3 months</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-rose-400">
                  <div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-rose-400" /><span className="text-xs text-gray-500">Top Reason</span></div>
                  {advanced.topReasons.length > 0 ? (
                    <><p className="text-sm font-bold text-gray-900 leading-tight">{advanced.topReasons[0].reason}</p><p className="text-xs text-gray-400 mt-0.5">{advanced.topReasons[0].count} appts</p></>
                  ) : <p className="text-sm text-gray-400">No reasons logged</p>}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5 border-t-4 border-emerald-500">
                  <div className="flex items-center gap-2 mb-2">
                    {advanced.trend.changePercent === null || advanced.trend.changePercent === 0
                      ? <Minus className="w-4 h-4 text-gray-400" />
                      : advanced.trend.changePercent > 0
                      ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                    <span className="text-xs text-gray-500">This Month</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{advanced.trend.thisMonth}</p>
                  <p className={`text-xs mt-0.5 font-medium ${advanced.trend.changePercent === null ? 'text-gray-400' : advanced.trend.changePercent > 0 ? 'text-emerald-600' : advanced.trend.changePercent < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {advanced.trend.changePercent === null ? 'No prior data' : advanced.trend.changePercent === 0 ? 'Same as last month' : `${advanced.trend.changePercent > 0 ? '+' : ''}${advanced.trend.changePercent}% vs last month`}
                  </p>
                </div>
              </div>

              {/* Heatmap + Top reasons */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 mb-1">Appointment Heatmap</h4>
                  <p className="text-xs text-gray-400 mb-4">Non-cancelled appointments by day and time slot</p>
                  {(() => {
                    const maxCell = Math.max(...advanced.heatmap.map(h => h.count), 1);
                    const cellMap = new Map(advanced.heatmap.map(h => [`${h.day}-${h.time}`, h.count]));
                    return (
                      <div className="overflow-x-auto">
                        <table className="text-xs w-full">
                          <thead>
                            <tr>
                              <th className="w-14 py-1 pr-2 text-right text-gray-400 font-normal">Slot</th>
                              {DAYS.map(d => <th key={d.dow} className="py-1 px-1 text-center text-gray-500 font-medium w-12">{d.label}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {ALL_SLOTS.map(slot => (
                              <tr key={slot}>
                                <td className="pr-2 py-0.5 text-right text-gray-400 font-mono">{slot}</td>
                                {DAYS.map(d => {
                                  const count = cellMap.get(`${d.dow}-${slot}`) ?? 0;
                                  const intensity = count / maxCell;
                                  return (
                                    <td key={d.dow} className="px-1 py-0.5">
                                      <div
                                        className="w-full h-7 rounded flex items-center justify-center text-xs font-medium"
                                        style={{
                                          backgroundColor: count === 0 ? '#f3f4f6' : `rgba(37,99,235,${0.12 + 0.88 * intensity})`,
                                          color: intensity > 0.55 ? '#fff' : intensity > 0 ? '#1e40af' : '#9ca3af',
                                        }}
                                        title={count > 0 ? `${d.label} ${slot}: ${count} appt${count !== 1 ? 's' : ''}` : undefined}
                                      >
                                        {count > 0 ? count : ''}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="flex items-center gap-2 mt-3 justify-end">
                          <span className="text-xs text-gray-400">Low</span>
                          {[0.12, 0.35, 0.55, 0.75, 1].map(a => (
                            <div key={a} className="w-5 h-4 rounded" style={{ backgroundColor: `rgba(37,99,235,${a})` }} />
                          ))}
                          <span className="text-xs text-gray-400">High</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 mb-1">Top Appointment Reasons</h4>
                  <p className="text-xs text-gray-400 mb-4">Most frequently recorded</p>
                  {advanced.topReasons.length === 0 ? (
                    <p className="text-sm text-gray-400">No reasons have been logged yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {advanced.topReasons.map((r, i) => {
                        const pct = Math.round((r.count / advanced.topReasons[0].count) * 100);
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 truncate max-w-[160px]" title={r.reason}>{r.reason}</span>
                              <span className="font-semibold ml-2 shrink-0">{r.count}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-rose-400" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </>)}
        </div>
      )}

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
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${bookSubmitted && bookErrors.patient ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}`}
                >
                  <option value="">Select a patient</option>
                  {patients?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {bookSubmitted && bookErrors.patient && <p className="text-red-500 text-xs mt-1">{bookErrors.patient}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Doctor *</label>
                <select
                  value={bookDoctorID}
                  onChange={e => { setBookDoctorID(e.target.value); setBookTime(''); }}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${bookSubmitted && bookErrors.doctor ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}`}
                >
                  <option value="">Select a doctor</option>
                  {doctors?.map(d => (
                    <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>
                  ))}
                </select>
                {bookSubmitted && bookErrors.doctor && <p className="text-red-500 text-xs mt-1">{bookErrors.doctor}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date *</label>
                <input
                  type="date"
                  value={bookDate}
                  min={new Date().toLocaleDateString('en-CA')}
                  onChange={e => { setBookDate(e.target.value); setBookTime(''); }}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${bookSubmitted && bookErrors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}`}
                />
                {bookSubmitted && bookErrors.date && <p className="text-red-500 text-xs mt-1">{bookErrors.date}</p>}
              </div>

              {bookDoctorID && bookDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                    Select Time Slot *
                    {availableBookSlots.length > 0 && (
                      <span className="ml-1 text-gray-400 font-normal normal-case">({availableBookSlots.length} available)</span>
                    )}
                  </label>
                  {bookSlotsData?.hasAvailability && availableBookSlots.length === 0 ? (
                    <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Doctor is not working on this day.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableBookSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setBookTime(slot)}
                          className={`py-2 px-1 text-xs rounded-md border transition-colors ${
                            bookTime === slot
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-gray-300 hover:border-emerald-400 hover:text-emerald-600'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                  {bookSubmitted && bookErrors.time && <p className="text-red-500 text-xs mt-1">{bookErrors.time}</p>}
                </div>
              )}
              {bookSubmitted && bookErrors.time && (!bookDoctorID || !bookDate) && (
                <p className="text-red-500 text-xs -mt-2">{bookErrors.time}</p>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Appointment Type</label>
                <select
                  value={bookType}
                  onChange={e => setBookType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {bookApiError && <p className="text-red-600 text-xs">{bookApiError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBook}
                  disabled={createAppointment.isPending}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors"
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
                  min={new Date().toLocaleDateString('en-CA')}
                  onChange={e => { setRescheduleDate(e.target.value); setRescheduleTime(''); }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {rescheduleDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select New Time Slot *</label>
                  {rescheduleSlotsData?.hasAvailability && availableRescheduleSlots.length === 0 ? (
                    <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Doctor is not working on this day.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableRescheduleSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setRescheduleTime(slot)}
                          className={`py-2 px-1 text-xs rounded-md border transition-colors ${
                            rescheduleTime === slot
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-gray-300 hover:border-emerald-400 hover:text-emerald-600'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {rescheduleError && <p className="text-red-600 text-xs">{rescheduleError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReschedule}
                  disabled={rescheduleAppointment.isPending}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors"
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
