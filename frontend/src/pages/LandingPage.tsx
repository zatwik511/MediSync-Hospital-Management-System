import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Stethoscope, ChevronRight } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  // If already authenticated, skip the landing page
  useEffect(() => {
    if (localStorage.getItem('staffId')) {
      navigate('/dashboard', { replace: true });
    } else if (localStorage.getItem('patientId')) {
      navigate('/patient/appointments', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">IMS Healthcare</h1>
        <p className="text-gray-500 text-lg">Please select how you'd like to sign in</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl">
        {/* Patient card */}
        <button
          onClick={() => navigate('/patient-login')}
          className="flex-1 group bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 p-8 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5 group-hover:bg-blue-600 transition-colors duration-200">
            <UserRound className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-200" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Patient</h2>
          <p className="text-sm text-gray-500 mb-6">
            Book appointments and view your medical records
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
            Continue <ChevronRight className="w-4 h-4" />
          </span>
        </button>

        {/* Staff card */}
        <button
          onClick={() => navigate('/login')}
          className="flex-1 group bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all duration-200 p-8 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-5 group-hover:bg-teal-600 transition-colors duration-200">
            <Stethoscope className="w-6 h-6 text-teal-600 group-hover:text-white transition-colors duration-200" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Staff</h2>
          <p className="text-sm text-gray-500 mb-6">
            Access patient records, images, and clinical tools
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 group-hover:gap-2 transition-all">
            Continue <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
