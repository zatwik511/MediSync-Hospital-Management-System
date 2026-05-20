import { Navigate } from 'react-router-dom';

interface PatientRouteProps {
  children: React.ReactElement;
}

export function PatientRoute({ children }: PatientRouteProps) {
  const patientId = localStorage.getItem('patientId');
  if (!patientId) {
    return <Navigate to="/patient-login" replace />;
  }
  return children;
}
