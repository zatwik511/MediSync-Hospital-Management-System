import { useAuth } from '../hooks/useAuth';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { DoctorDashboard } from './dashboard/DoctorDashboard';
import { ReceptionistDashboard } from './dashboard/ReceptionistDashboard';

export function Dashboard() {
  const user = useAuth();

  if (!user) return null;

  if (user.role === 'admin') return <AdminDashboard user={user} />;
  if (user.role === 'doctor') return <DoctorDashboard user={user} />;
  return <ReceptionistDashboard user={user} />;
}
