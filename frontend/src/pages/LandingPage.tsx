import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Stethoscope, ChevronRight, Activity } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('staffId')) {
      navigate('/dashboard', { replace: true });
    } else if (localStorage.getItem('patientId')) {
      navigate('/patient/appointments', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Subtle background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Logo + wordmark */}
      <div className="text-center mb-12 relative">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">MediSync</h1>
        </div>
        <p className="text-zinc-400 text-base">Hospital Management System</p>
        <p className="text-zinc-600 text-sm mt-1">Please select how you'd like to sign in</p>
      </div>

      {/* Sign-in cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg relative">

        {/* Patient */}
        <button
          onClick={() => navigate('/patient-login')}
          className="flex-1 group bg-zinc-800 border border-zinc-700 hover:border-emerald-500/60 hover:bg-zinc-800/80 rounded-2xl p-7 text-left transition-all duration-200 shadow-lg"
        >
          <div className="w-11 h-11 rounded-xl bg-zinc-700 group-hover:bg-emerald-500/20 border border-zinc-600 group-hover:border-emerald-500/40 flex items-center justify-center mb-5 transition-all duration-200">
            <UserRound className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400 transition-colors duration-200" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Patient</h2>
          <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
            Book appointments and view your medical records
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 group-hover:text-emerald-400 group-hover:gap-2 transition-all duration-200">
            Continue <ChevronRight className="w-4 h-4" />
          </span>
        </button>

        {/* Staff */}
        <button
          onClick={() => navigate('/login')}
          className="flex-1 group bg-zinc-800 border border-zinc-700 hover:border-emerald-500/60 hover:bg-zinc-800/80 rounded-2xl p-7 text-left transition-all duration-200 shadow-lg"
        >
          <div className="w-11 h-11 rounded-xl bg-zinc-700 group-hover:bg-emerald-500/20 border border-zinc-600 group-hover:border-emerald-500/40 flex items-center justify-center mb-5 transition-all duration-200">
            <Stethoscope className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400 transition-colors duration-200" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Staff</h2>
          <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
            Access patient records, images, and clinical tools
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 group-hover:text-emerald-400 group-hover:gap-2 transition-all duration-200">
            Continue <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>

      <p className="mt-10 text-zinc-700 text-xs">Â© 2025 MediSync Hospital Management System</p>
    </div>
  );
}
