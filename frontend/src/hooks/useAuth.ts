// Hook to access current logged-in staff info anywhere in the app

export interface AuthUser {
  name: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'radiologist' | string;
  staffCode: string;
}

export function useAuth(): AuthUser | null {
  const name = localStorage.getItem('staffName');
  const role = localStorage.getItem('staffRole');
  const staffCode = localStorage.getItem('staffCode') || '';

  if (!role) return null;

  return { name: name || 'Staff', role, staffCode };
}

// Permission helpers
export function canAccess(role: string, module: string): boolean {
  const permissions: Record<string, string[]> = {
    admin:        ['dashboard', 'patients', 'appointments', 'images', 'staff', 'doctors', 'financial', 'audit'],
    doctor:       ['dashboard', 'my-schedule', 'patients', 'images'],
    receptionist: ['dashboard', 'patients', 'appointments'],
    radiologist:  ['dashboard', 'patients', 'images'],
  };

  return (permissions[role] || []).includes(module);
}
