import { useState } from 'react';
import { useStaff, useCreateStaff, useDeleteStaff, useResetPin } from '../hooks/useStaff';
import { useAuth } from '../hooks/useAuth';
import { SkeletonPersonCard } from '../components/Skeleton';
import { formatRelativeTime } from '../utils/time';
import { Trash2, Key } from 'lucide-react';

type StaffRole = 'doctor' | 'receptionist' | 'radiologist' | 'admin' | 'nurse' | 'pharmacist' | 'physiotherapist' | 'lab_technician' | 'security' | 'porter';

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'nurse',           label: 'Nurse' },
  { value: 'doctor',          label: 'Doctor' },
  { value: 'receptionist',    label: 'Receptionist' },
  { value: 'radiologist',     label: 'Radiologist' },
  { value: 'pharmacist',      label: 'Pharmacist' },
  { value: 'physiotherapist', label: 'Physiotherapist' },
  { value: 'lab_technician',  label: 'Lab Technician' },
  { value: 'security',        label: 'Security' },
  { value: 'porter',          label: 'Porter' },
  { value: 'admin',           label: 'Admin' },
];

const ROLE_COLOURS: Record<string, string> = {
  doctor:          'bg-blue-100 text-blue-700',
  nurse:           'bg-pink-100 text-pink-700',
  receptionist:    'bg-purple-100 text-purple-700',
  radiologist:     'bg-indigo-100 text-indigo-700',
  pharmacist:      'bg-teal-100 text-teal-700',
  physiotherapist: 'bg-orange-100 text-orange-700',
  lab_technician:  'bg-yellow-100 text-yellow-800',
  security:        'bg-gray-200 text-gray-700',
  porter:          'bg-gray-100 text-gray-600',
  admin:           'bg-red-100 text-red-700',
};

function roleLabel(role: string) {
  return ROLE_OPTIONS.find(r => r.value === role)?.label ?? role;
}

export function StaffManagement() {
  const { data: staff, isLoading } = useStaff();
  const createStaff = useCreateStaff();
  const deleteStaff = useDeleteStaff();
  const resetPin    = useResetPin();
  const auth        = useAuth();
  const isAdmin     = auth?.role === 'admin';

  const [formData, setFormData] = useState({
    name: '', address: '', role: 'nurse' as StaffRole, specialization: '',
  });
  const [formErrors, setFormErrors]     = useState({ name: '', role: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPin, setNewPin]           = useState('');
  const [resetError, setResetError]   = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    const errs = {
      name: !formData.name.trim() ? 'Name is required' : '',
      role: !formData.role        ? 'Role is required'  : '',
    };
    setFormErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    try {
      await createStaff.mutateAsync(formData);
      setFormData({ name: '', address: '', role: 'nurse', specialization: '' });
      setFormErrors({ name: '', role: '' });
      setFormSubmitted(false);
    } catch (error) {
      console.error('Failed to create staff:', error);
    }
  };

  const openResetDialog = (id: string, name: string) => {
    setResetTarget({ id, name });
    setNewPin(''); setResetError(''); setResetSuccess(false);
  };

  const handleResetPin = async () => {
    if (!/^\d{6}$/.test(newPin)) { setResetError('PIN must be exactly 6 digits'); return; }
    try {
      await resetPin.mutateAsync({ staffId: resetTarget!.id, newPin });
      setResetSuccess(true);
      setTimeout(() => setResetTarget(null), 1200);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset PIN');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-10 w-56 animate-pulse bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card p-6 space-y-4">
            <div className="h-6 w-36 animate-pulse bg-gray-200 rounded mb-6" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 animate-pulse bg-gray-200 rounded" />
                <div className="h-9 animate-pulse bg-gray-200 rounded" />
              </div>
            ))}
            <div className="h-9 animate-pulse bg-gray-200 rounded mt-2" />
          </div>
          <div className="lg:col-span-2 space-y-3">
            <div className="h-6 w-40 animate-pulse bg-gray-200 rounded mb-6" />
            {Array.from({ length: 6 }).map((_, i) => <SkeletonPersonCard key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Staff Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Add Staff Form ─────────────────────────────────────────── */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Add Staff Member</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={`input-field ${formSubmitted && formErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g. Jane Smith"
                />
                {formSubmitted && formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as StaffRole })}
                  className={`input-field ${formSubmitted && formErrors.role ? 'border-red-500 focus:ring-red-500' : ''}`}
                >
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {formSubmitted && formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 14 Oak Street, London"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Cardiology"
                />
              </div>

              <button type="submit" disabled={createStaff.isPending} className="btn-primary w-full disabled:opacity-50">
                {createStaff.isPending ? 'Adding…' : 'Add Staff Member'}
              </button>
              <p className="text-xs text-gray-400 text-center">Default login PIN: 000000</p>
            </form>
          </div>

          {/* ── Staff List ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Current Staff
              {staff && staff.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">{staff.length} members</span>
              )}
            </h2>

            {staff && staff.length > 0 ? (
              <div className="space-y-3">
                {staff.map(member => (
                  <div key={member.id} className="card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{member.name}</h3>
                          {member.staff_code && (
                            <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                              {member.staff_code}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOURS[member.role] || 'bg-gray-100 text-gray-600'}`}>
                            {roleLabel(member.role)}
                          </span>
                        </div>
                        {member.specialization && (
                          <p className="text-sm text-gray-500 mt-0.5">{member.specialization}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Last seen: {member.last_seen ? formatRelativeTime(member.last_seen) : 'Never logged in'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isAdmin && (
                          <button
                            onClick={() => openResetDialog(member.id, member.name)}
                            title="Reset PIN"
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          >
                            <Key size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteStaff.mutate(member.id)}
                          disabled={deleteStaff.isPending}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center text-gray-500">No staff members yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Reset PIN Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-1">Reset PIN</h3>
            <p className="text-sm text-gray-500 mb-4">{resetTarget.name}</p>
            {resetSuccess ? (
              <p className="text-green-600 text-sm font-medium text-center py-2">PIN reset successfully!</p>
            ) : (
              <>
                {resetError && <p className="text-red-600 text-sm mb-3">{resetError}</p>}
                <input
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="New 6-digit PIN"
                  maxLength={6}
                  inputMode="numeric"
                  className="input-field w-full mb-4"
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setResetTarget(null)} className="btn-secondary text-sm">Cancel</button>
                  <button onClick={handleResetPin} disabled={resetPin.isPending} className="btn-primary text-sm disabled:opacity-50">
                    {resetPin.isPending ? 'Resetting…' : 'Reset PIN'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
