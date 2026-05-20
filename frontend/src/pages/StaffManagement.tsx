import { useState } from 'react';
import { useStaff, useCreateStaff, useDeleteStaff, useResetPin } from '../hooks/useStaff';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Trash2, Key } from 'lucide-react';

export function StaffManagement() {
  const { data: staff, isLoading } = useStaff();
  const createStaff = useCreateStaff();
  const deleteStaff = useDeleteStaff();
  const resetPin = useResetPin();
  const auth = useAuth();
  const isAdmin = auth?.role === 'admin';

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    role: 'doctor' as 'radiologist' | 'doctor' | 'admin' | 'receptionist',
    specialization: '',
  });

  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPin, setNewPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStaff.mutateAsync(formData);
      setFormData({ name: '', address: '', role: 'doctor', specialization: '' });
    } catch (error) {
      console.error('Failed to create staff:', error);
    }
  };

  const openResetDialog = (id: string, name: string) => {
    setResetTarget({ id, name });
    setNewPin('');
    setResetError('');
    setResetSuccess(false);
  };

  const handleResetPin = async () => {
    if (!/^\d{6}$/.test(newPin)) {
      setResetError('PIN must be exactly 6 digits');
      return;
    }
    try {
      await resetPin.mutateAsync({ staffId: resetTarget!.id, newPin });
      setResetSuccess(true);
      setTimeout(() => setResetTarget(null), 1200);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset PIN');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Staff Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Staff Form */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-6">Add Staff Member</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label htmlFor="name" className="block text-sm font-medium mb-2">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address" className="block text-sm font-medium mb-2">Address *</label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role" className="block text-sm font-medium mb-2">Role *</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'radiologist' | 'doctor' | 'admin' | 'receptionist',
                    })
                  }
                  className="input-field"
                >
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="radiologist">Radiologist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="specialization" className="block text-sm font-medium mb-2">
                  Specialization
                </label>
                <input
                  id="specialization"
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="input-field"
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                {createStaff.isPending ? 'Adding...' : 'Add Staff Member'}
              </button>
              <p className="text-xs text-gray-500 text-center">Default PIN: 000000</p>
            </form>
          </div>

          {/* Staff List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Current Staff</h2>

            {staff && staff.length > 0 ? (
              <div className="space-y-4">
                {staff.map((member) => (
                  <div key={member.id} className="card p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          {member.staff_code && (
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {member.staff_code}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{member.address}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Role:</span>{' '}
                            <span className="capitalize bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              {member.role}
                            </span>
                          </p>
                          {member.specialization && (
                            <p className="text-sm">
                              <span className="font-medium">Specialization:</span>{' '}
                              {member.specialization}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => openResetDialog(member.id, member.name)}
                            title="Reset PIN"
                            className="p-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          >
                            <Key size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteStaff.mutate(member.id)}
                          disabled={deleteStaff.isPending}
                          className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center text-gray-500">No staff members yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Reset PIN Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-1">Reset PIN</h3>
            <p className="text-sm text-gray-500 mb-4">{resetTarget.name}</p>

            {resetSuccess ? (
              <p className="text-green-600 text-sm font-medium text-center py-2">PIN reset successfully!</p>
            ) : (
              <>
                {resetError && (
                  <p className="text-red-600 text-sm mb-3">{resetError}</p>
                )}
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="New 6-digit PIN"
                  maxLength={6}
                  inputMode="numeric"
                  className="input-field w-full mb-4"
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setResetTarget(null)}
                    className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPin}
                    disabled={resetPin.isPending}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {resetPin.isPending ? 'Resetting...' : 'Reset PIN'}
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
