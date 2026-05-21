import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth, canAccess } from '../hooks/useAuth';
import { apiClient } from '../api/client';

const ALL_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
  { label: 'Patients', path: '/patients', module: 'patients' },
  { label: 'Appointments', path: '/appointments', module: 'appointments' },
  { label: 'Images', path: '/images', module: 'images' },
  { label: 'Staff', path: '/staff', module: 'staff' },
  { label: 'Reports', path: '/reports', module: 'reports' },
  { label: 'Audit Log', path: '/audit', module: 'audit' },
];

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  doctor: 'bg-blue-100 text-blue-700',
  receptionist: 'bg-green-100 text-green-700',
};

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Filter nav items based on current user's role
  const navItems = ALL_NAV_ITEMS.filter(item =>
    user ? canAccess(user.role, item.module) : false
  );

  const handleLogout = async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('staffId');
    localStorage.removeItem('staffName');
    localStorage.removeItem('staffRole');
    localStorage.removeItem('staffCode');
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold text-primary-500">
              IMS Healthcare
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:text-primary-500'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User info + logout */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-600'}`}>
                  {user.role}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block py-2 px-4 rounded transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left py-2 px-4 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}