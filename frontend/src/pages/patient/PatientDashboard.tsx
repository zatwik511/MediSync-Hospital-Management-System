import { PatientLayout } from '../../components/PatientLayout';
import { usePatientProfile, usePatientImageRecords, usePatientFinancial, useMyAppointments } from '../../hooks/usePatientPortal';
import { Calendar, Image, DollarSign, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  colour: string;
  to?: string;
}

function SummaryCard({ icon, label, value, sub, colour, to }: SummaryCardProps) {
  const inner = (
    <div className={`bg-white rounded-lg border border-gray-200 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow`}>
      <div className={`p-2.5 rounded-lg ${colour}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );

  return to ? <Link to={to}>{inner}</Link> : inner;
}

export function PatientDashboard() {
  const { data: profile, isLoading: profileLoading } = usePatientProfile();
  const { data: images = [], isLoading: imagesLoading } = usePatientImageRecords();
  const { data: financial, isLoading: financialLoading } = usePatientFinancial();
  const { data: appointments = [], isLoading: apptLoading } = useMyAppointments();

  const today = new Date().toISOString().split('T')[0];
  const upcomingCount = appointments.filter(
    (a) => a.status !== 'Cancelled' && a.status !== 'Completed' && a.date >= today
  ).length;

  const nextAppt = appointments
    .filter((a) => a.status !== 'Cancelled' && a.status !== 'Completed' && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const nextApptLabel = nextAppt
    ? new Date(nextAppt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : undefined;

  const anyLoading = profileLoading || imagesLoading || financialLoading || apptLoading;
  const patientName = localStorage.getItem('patientName') || 'Patient';

  return (
    <PatientLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Welcome back, {patientName.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">Here's a summary of your health records.</p>
        </div>

        {anyLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 h-24 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-7 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SummaryCard
              icon={<Calendar className="w-5 h-5 text-emerald-600" />}
              label="Upcoming Appointments"
              value={upcomingCount}
              sub={nextApptLabel ? `Next: ${nextApptLabel}` : 'No upcoming appointments'}
              colour="bg-emerald-50"
              to="/patient/appointments"
            />
            <SummaryCard
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              label="Total Cost"
              value={`Â£${Number(financial?.totalCost ?? 0).toFixed(2)}`}
              sub={financial && financial.tasks.length > 0 ? `${financial.tasks.length} charge${financial.tasks.length !== 1 ? 's' : ''}` : 'No charges recorded'}
              colour="bg-emerald-50"
              to="/patient/records"
            />
            <SummaryCard
              icon={<Image className="w-5 h-5 text-purple-600" />}
              label="Medical Images"
              value={images.length}
              sub={images.length > 0 ? `Latest: ${images[0]?.type}` : 'No images on file'}
              colour="bg-purple-50"
              to="/patient/records"
            />
            <SummaryCard
              icon={<Activity className="w-5 h-5 text-orange-600" />}
              label="Current Diagnosis"
              value={profile?.diagnosis ? (
                <span className="text-lg leading-tight break-words">{profile.diagnosis}</span>
              ) : (
                <span className="text-base text-gray-400 font-normal">None recorded</span>
              )}
              sub={profile?.conditions && profile.conditions.length > 0
                ? profile.conditions.join(', ')
                : undefined}
              colour="bg-orange-50"
              to="/patient/records"
            />
          </div>
        )}

        <div className="mt-8 bg-emerald-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800">Need an appointment?</p>
            <p className="text-xs text-emerald-600 mt-0.5">Book with one of our doctors today.</p>
          </div>
          <Link
            to="/patient/book-appointment"
            className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
          >
            Book Now
          </Link>
        </div>
      </div>
    </PatientLayout>
  );
}
