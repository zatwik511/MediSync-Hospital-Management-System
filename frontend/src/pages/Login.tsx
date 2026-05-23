import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity } from 'lucide-react';
import { apiClient } from '../api/client';
import { LoadingSpinnerInline } from '../components/LoadingSpinner';

export function Login() {
  const [staffCode, setStaffCode] = useState('');
  const [pin, setPin]             = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
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
        const { name, role, staff_code, last_login } = response.data.data;
        localStorage.setItem('staffName', name);
        localStorage.setItem('staffRole', role);
        localStorage.setItem('staffCode', staff_code);
        if (last_login) localStorage.setItem('lastLogin', last_login);
        else            localStorage.removeItem('lastLogin');
        localStorage.setItem('lastActivity', String(Date.now()));
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid staff code or PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-zinc-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">MediSync</h1>
          <p className="text-emerald-400 text-sm font-medium mb-8">Hospital Management System</p>
          <div className="space-y-3 text-left max-w-xs">
            {['Patient records & medical imaging', 'Appointment scheduling', 'Prescriptions & medication', 'Staff management & audit logs'].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-zinc-400 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-8 -ml-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Staff Sign In</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your staff code and PIN to continue</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Staff Code</label>
              <input
                type="text"
                value={staffCode}
                onChange={e => setStaffCode(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-shadow"
                placeholder="e.g. ADM-001"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm transition-shadow"
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 flex justify-center items-center transition-colors text-sm"
            >
              {loading ? <LoadingSpinnerInline /> : 'Sign In'}
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-600 mb-2">Default PIN for all accounts: 000000</p>
              <p>ADM-001 - Admin User (full access)</p>
              <p>DOC-001 - Dr. Sarah Chen (doctor)</p>
              <p>REC-001 - Emma Clarke (receptionist)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
