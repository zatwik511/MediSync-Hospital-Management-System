import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity } from 'lucide-react';
import { apiClient } from '../api/client';
import { LoadingSpinnerInline } from '../components/LoadingSpinner';

type Mode = 'login' | 'register';

export function PatientLogin() {
  const [mode, setMode]       = useState<Mode>('login');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const switchMode = (next: Mode) => { setMode(next); setError(''); setPin(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/patient-auth/login' : '/patient-auth/register';
      const payload  = mode === 'login'
        ? { email: email.trim(), pin }
        : { name: name.trim(), email: email.trim(), pin };

      const response = await apiClient.post(endpoint, payload);
      if (response.data.success) {
        const { id, name: patientName, email: patientEmail } = response.data.data;
        localStorage.setItem('patientId',    id);
        localStorage.setItem('patientName',  patientName);
        localStorage.setItem('patientEmail', patientEmail);
        navigate('/patient-portal');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel â€” branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-zinc-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">MediSync</h1>
          <p className="text-emerald-400 text-sm font-medium mb-8">Patient Portal</p>
          <div className="space-y-3 text-left max-w-xs">
            {['View your appointments', 'Access medical records', 'Download health reports', 'Book new appointments'].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-zinc-400 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel â€” form */}
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
            <h2 className="text-2xl font-bold text-gray-900">Patient Portal</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to access your health records</p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6 bg-white">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                  mode === m
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                  placeholder="Your full name"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">6-Digit PIN</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                placeholder="6-digit PIN"
                maxLength={6}
                inputMode="numeric"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 flex justify-center items-center transition-colors text-sm mt-2"
            >
              {loading ? <LoadingSpinnerInline /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
