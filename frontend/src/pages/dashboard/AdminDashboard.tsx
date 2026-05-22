import { Link } from 'react-router-dom';
import { Users, Calendar, UserCog, Image, Wallet, ShieldCheck } from 'lucide-react';
import { usePatients } from '../../hooks/usePatients';
import { useAppointments, useCancelAppointment } from '../../hooks/useAppointments';
import { useStaff } from '../../hooks/useStaff';
import { useTotalImageCount } from '../../hooks/useImages';
import { useAuditLogs } from '../../hooks/useAudit';
import { formatRelativeTime } from '../../utils/time';
import { ScheduleSection } from './ScheduleSection';
import type { AuthUser } from '../../hooks/useAuth';

const ACTION_COLOUR: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN:  'bg-gray-100 text-gray-600',
  LOGOUT: 'bg-gray-100 text-gray-600',
  READ:   'bg-yellow-100 text-yellow-700',
  EXPORT: 'bg-purple-100 text-purple-700',
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  colour: string;
  to?: string;
}

function StatCard({ icon, label, value, colour, to }: StatCardProps) {
  const inner = (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colour}`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export function AdminDashboard({ user }: { user: AuthUser }) {
  const { data: patients = [] }         = usePatients();
  const { data: appointments = [], isLoading } = useAppointments();
  const { data: staff = [] }            = useStaff();
  const { data: totalImages = 0 }       = useTotalImageCount();
  const { data: auditLogs = [] }        = useAuditLogs();
  const cancelMutation                  = useCancelAppointment();

  const cancellingId = cancelMutation.isPending ? (cancelMutation.variables ?? null) : null;

  const today = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const todayLabel    = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const tomorrowLabel = tomorrowDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const todaySchedule = appointments
    .filter(a => a.date === today && a.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  const tomorrowSchedule = appointments
    .filter(a => a.date === tomorrow && a.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  const totalRevenue = patients.reduce((sum, p) => sum + Number(p.totalCost), 0);
  const totalActive  = appointments.filter(a => a.status !== 'Cancelled').length;
  const recentAudit  = [...auditLogs].slice(0, 5);

  const lastLoginIso  = localStorage.getItem('lastLogin');
  const lastLoginText = lastLoginIso ? formatRelativeTime(lastLoginIso) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          {lastLoginText && (
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, {user.name}. Last login: {lastLoginText}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Users size={24} />}   label="Total Patients"    value={patients.length}            colour="bg-blue-100 text-blue-600"   to="/patients" />
          <StatCard icon={<Calendar size={24} />} label="Total Appointments" value={totalActive}               colour="bg-indigo-100 text-indigo-600" to="/appointments" />
          <StatCard icon={<UserCog size={24} />}  label="Total Staff"        value={staff.length}               colour="bg-teal-100 text-teal-600"   to="/staff" />
          <StatCard icon={<Image size={24} />}    label="Medical Images"     value={totalImages}                colour="bg-orange-100 text-orange-600" to="/images" />
          <StatCard icon={<Wallet size={24} />}   label="Total Revenue"      value={`£${totalRevenue.toFixed(2)}`} colour="bg-green-100 text-green-600" />
        </div>

        {/* Today's Schedule + Upcoming Tomorrow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

        {/* Recent Audit Log */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <Link to="/audit" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {recentAudit.length === 0 ? (
            <p className="text-sm text-gray-400">No activity recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentAudit.map((log) => (
                <div key={log.id} className="py-3 flex items-start gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${ACTION_COLOUR[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {log.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 truncate">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {log.staff_name} · {formatRelativeTime(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
