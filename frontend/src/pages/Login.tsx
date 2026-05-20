// frontend/src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { LoadingSpinnerInline } from '../components/LoadingSpinner';

export function Login() {
  const [staffCode, setStaffCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        staff_code: staffCode.trim().toUpperCase(),
        pin,
      });

      if (response.data.success) {
        const { id, name, role, staff_code, last_login } = response.data.data;
        localStorage.setItem('staffId', id);
        localStorage.setItem('staffName', name);
        localStorage.setItem('staffRole', role);
        localStorage.setItem('staffCode', staff_code);
        // Store previous login time for dashboard display
        if (last_login) {
          localStorage.setItem('lastLogin', last_login);
        } else {
          localStorage.removeItem('lastLogin');
        }
        // Initialise activity clock so the 30-min timer starts from now
        localStorage.setItem('lastActivity', String(Date.now()));
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid staff code or PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">IMS Healthcare</h1>
          <p className="text-gray-600 mt-2">Staff Portal Login</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Staff Code
            </label>
            <input
              type="text"
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="e.g., ADM-001"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="6-digit PIN"
              maxLength={6}
              inputMode="numeric"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex justify-center items-center py-2.5"
          >
            {loading ? <LoadingSpinnerInline /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-3 bg-gray-50 rounded-md text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600 mb-2">Default PIN for all accounts: 000000</p>
          <p>ADM-001 — Admin User (full access)</p>
          <p>DOC-001 — Dr. Sarah Chen (doctor)</p>
          <p>REC-001 — Emma Clarke (receptionist)</p>
        </div>
      </div>
    </div>
  );
}
