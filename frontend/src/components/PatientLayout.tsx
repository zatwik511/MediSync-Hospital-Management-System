import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, CalendarPlus, FileText, LogOut, Activity } from 'lucide-react';

interface PatientLayoutProps {
  children: React.ReactNode;
}

export function PatientLayout({ children }: PatientLayoutProps) {
  const name = localStorage.getItem('patientName') || 'Patient';
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('patientId');
    localStorage.removeItem('patientName');
    localStorage.removeItem('patientEmail');
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-500/15 text-emerald-400'
        : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-zinc-900 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white text-sm tracking-tight font-display">MediSync</span>
            </div>
            {/* Nav links */}
            <div className="flex items-center gap-1">
              <NavLink to="/patient/dashboard" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
              <NavLink to="/patient/appointments" className={linkClass}>
                <Calendar className="w-4 h-4" />
                My Appointments
              </NavLink>
              <NavLink to="/patient/book-appointment" className={linkClass}>
                <CalendarPlus className="w-4 h-4" />
                Book Appointment
              </NavLink>
              <NavLink to="/patient/records" className={linkClass}>
                <FileText className="w-4 h-4" />
                My Records
              </NavLink>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{name}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-red-400 px-2 py-1.5 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
