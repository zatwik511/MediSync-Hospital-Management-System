import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 20 * 1000; // check every 20 seconds
export const LAST_ACTIVITY_KEY = 'lastActivity';

const ALL_STORAGE_KEYS = ['staffId', 'staffName', 'staffRole', 'staffCode', 'lastLogin', LAST_ACTIVITY_KEY];

export function useSessionTimeout() {
  const navigate = useNavigate();
  const location = useLocation();
  // Use a ref so the interval callback always sees the latest logout fn without re-registering
  const logoutRef = useRef<() => void>(() => {});

  const logout = useCallback(async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* best-effort audit log */ }
    ALL_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
    navigate('/login', { replace: true });
  }, [navigate]);

  // Keep ref current
  logoutRef.current = logout;

  const checkTimeout = useCallback(() => {
    if (!localStorage.getItem('staffId')) return;
    const last = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
    if (last && Date.now() - last > TIMEOUT_MS) {
      logoutRef.current();
    }
  }, []);

  const resetActivity = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  }, []);

  // Check on every route change
  useEffect(() => {
    checkTimeout();
  }, [location.pathname, checkTimeout]);

  // Activity listeners + interval
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }));
    const id = setInterval(checkTimeout, CHECK_INTERVAL_MS);
    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      clearInterval(id);
    };
  }, [checkTimeout, resetActivity]);
}
