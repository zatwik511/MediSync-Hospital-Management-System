import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, CalendarPlus, FileText, LogOut } from 'lucide-react';

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
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900 text-base">MediSync Patient Portal</span>
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
            <span className="text-sm text-gray-500">{name}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
