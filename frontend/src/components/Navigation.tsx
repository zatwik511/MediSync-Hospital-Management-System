import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import { useAuth, canAccess } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotifications';
import type { Notification } from '../api/notificationApi';

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

const TYPE_STYLES: Record<string, { dot: string; bg: string }> = {
  info:    { dot: 'bg-blue-500',  bg: 'hover:bg-blue-50' },
  success: { dot: 'bg-green-500', bg: 'hover:bg-green-50' },
  warning: { dot: 'bg-amber-500', bg: 'hover:bg-amber-50' },
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationItem({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: string) => void;
}) {
  const styles = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
  return (
    <button
      onClick={() => onRead(notif.id)}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${styles.bg}`}
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.createdAt)}</p>
      </div>
    </button>
  );
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];

  function handleRead(id: string) {
    markRead.mutate(id);
  }

  function handleMarkAll() {
    markAll.mutate();
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">Notifications</span>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-xs text-primary-500 hover:text-primary-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No new notifications</p>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notif={n} onRead={handleRead} />
          ))
        )}
      </div>
    </div>
  );
}

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuth();
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  const isActive = (path: string) => location.pathname === path;

  const navItems = ALL_NAV_ITEMS.filter(item =>
    user ? canAccess(user.role, item.module) : false
  );

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [notifOpen]);

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

          {/* Desktop nav links */}
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

          {/* Right side: bell + user info + logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-1.5 rounded-full text-gray-500 hover:text-primary-500 hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
            </div>

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
