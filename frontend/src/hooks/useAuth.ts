// Hook to access current logged-in staff info anywhere in the app

export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'doctor' | 'receptionist' | string;
}

export function useAuth(): AuthUser | null {
  const id = localStorage.getItem('staffId');
  const name = localStorage.getItem('staffName');
  const role = localStorage.getItem('staffRole');

  if (!id || !role) return null;

  return { id, name: name || 'Staff', role };
}

// Permission helpers
export function canAccess(role: string, module: string): boolean {
  const permissions: Record<string, string[]> = {
    admin: ['dashboard', 'patients', 'appointments', 'images', 'staff', 'doctors', 'financial', 'audit'],
    doctor: ['dashboard', 'my-schedule', 'patients', 'images'],
    receptionist: ['dashboard', 'patients', 'appointments'],
  };

  const allowed = permissions[role] || [];
  return allowed.includes(module);
}
