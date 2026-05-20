import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// Components
import { Navigation } from './components/Navigation';

// Pages
import { Dashboard } from './pages/Dashboard';
import { PatientManagement } from './pages/PatientManagement';
import { PatientDetails } from './pages/PatientDetails';
import { ImageManagement } from './pages/ImageManagement';
import { StaffManagement } from './pages/StaffManagement';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { PatientLogin } from './pages/PatientLogin';
import { Appointments } from './pages/Appointments';
import { AuditLog } from './pages/AuditLog';

// Auth
import { canAccess } from './hooks/useAuth';
import { PatientRoute } from './components/PatientRoute';
import { useSessionTimeout } from './hooks/useSessionTimeout';

interface ProtectedRouteProps {
  children: React.ReactElement;
  module?: string;
}

// Protects route by login AND optionally by role
function ProtectedRoute({ children, module }: ProtectedRouteProps) {
  const staffId = localStorage.getItem('staffId');
  const role = localStorage.getItem('staffRole') || '';

  if (!staffId) {
    return <Navigate to="/login" replace />;
  }

  if (module && !canAccess(role, module)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-sm">
          <p className="text-4xl mb-4">🚫</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm">
            Your role ({role}) does not have permission to view this page.
          </p>
          <a href="/" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}

interface LayoutProps {
  children: React.ReactNode;
}

function ProtectedLayout({ children }: LayoutProps) {
  useSessionTimeout();
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}

function PatientPortalPlaceholder() {
  const name = localStorage.getItem('patientName') || 'Patient';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-sm w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome, {name}</h2>
        <p className="text-gray-500 text-sm mb-6">Patient portal coming soon.</p>
        <button
          onClick={() => {
            localStorage.removeItem('patientId');
            localStorage.removeItem('patientName');
            localStorage.removeItem('patientEmail');
            window.location.href = '/patient-login';
          }}
          className="text-sm text-red-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />
          <Route path="/patient-login" element={<PatientLogin />} />

          {/* PROTECTED — Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute module="dashboard">
                <ProtectedLayout><Dashboard /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* PROTECTED — Patients */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute module="patients">
                <ProtectedLayout><PatientManagement /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* PROTECTED — Patient Details */}
          <Route
            path="/patients/:patientId"
            element={
              <ProtectedRoute module="patients">
                <ProtectedLayout><PatientDetails /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* PROTECTED — Appointments */}
          <Route
            path="/appointments"
            element={
              <ProtectedRoute module="appointments">
                <ProtectedLayout><Appointments /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* PROTECTED — Images (admin + doctor only) */}
          <Route
            path="/images"
            element={
              <ProtectedRoute module="images">
                <ProtectedLayout><ImageManagement /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* PROTECTED — Staff (admin only) */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute module="staff">
                <ProtectedLayout><StaffManagement /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* PROTECTED — Reports (admin + doctor only) */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute module="reports">
                <ProtectedLayout><Reports /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* PROTECTED — Audit Log (admin only) */}
          <Route
            path="/audit"
            element={
              <ProtectedRoute module="audit">
                <ProtectedLayout><AuditLog /></ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* PATIENT PORTAL — protected by patientId in localStorage */}
          <Route
            path="/patient-portal"
            element={
              <PatientRoute>
                <PatientPortalPlaceholder />
              </PatientRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;