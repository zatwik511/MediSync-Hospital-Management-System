import { useState } from 'react';
import { useStaff, useCreateStaff, useDeleteStaff, useResetPin } from '../hooks/useStaff';
import { useDoctors, useCreateDoctor, useUpdateDoctor, useDeleteDoctor } from '../hooks/useDoctors';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatRelativeTime } from '../utils/time';
import { Trash2, Key, Pencil, X } from 'lucide-react';
import type { Doctor } from '../types/appointments';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function StaffManagement() {
  const { data: staff, isLoading: staffLoading } = useStaff();
  const { data: doctors, isLoading: doctorsLoading } = useDoctors();
  const createStaff = useCreateStaff();
  const deleteStaff = useDeleteStaff();
  const resetPin = useResetPin();
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();
  const deleteDoctor = useDeleteDoctor();
  const auth = useAuth();
  const isAdmin = auth?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'staff' | 'doctors'>('staff');

  // ── Staff form ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    role: 'doctor' as 'radiologist' | 'doctor' | 'admin' | 'receptionist',
    specialization: '',
  });
  const [formErrors, setFormErrors] = useState({ name: '', role: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [newPin, setNewPin] = useState('');
  const [resetError, setResetError] = useState('');
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
      setFormData({ name: '', address: '', role: 'doctor', specialization: '' });
      setFormErrors({ name: '', role: '' });
      setFormSubmitted(false);
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

  // ── Doctor form ─────────────────────────────────────────────────────────────
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialty: '',
    availableDays: [] as string[],
  });
  const [doctorErrors, setDoctorErrors] = useState({ name: '', specialty: '' });
  const [doctorSubmitted, setDoctorSubmitted] = useState(false);

  const toggleDay = (day: string) => {
    setDoctorForm(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const startEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({ name: doctor.name, specialty: doctor.specialty, availableDays: doctor.availableDays });
    setDoctorErrors({ name: '', specialty: '' });
    setDoctorSubmitted(false);
  };

  const cancelEditDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm({ name: '', specialty: '', availableDays: [] });
    setDoctorErrors({ name: '', specialty: '' });
    setDoctorSubmitted(false);
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorSubmitted(true);

    const errs = {
      name:      !doctorForm.name.trim()      ? 'Name is required'      : '',
      specialty: !doctorForm.specialty.trim() ? 'Specialty is required' : '',
    };
    setDoctorErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    try {
      if (editingDoctor) {
        await updateDoctor.mutateAsync({ id: editingDoctor.id, data: doctorForm });
        cancelEditDoctor();
      } else {
        await createDoctor.mutateAsync(doctorForm);
        setDoctorForm({ name: '', specialty: '', availableDays: [] });
        setDoctorSubmitted(false);
      }
    } catch (error) {
      console.error('Failed to save doctor:', error);
    }
  };

  if (staffLoading || doctorsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Staff Management</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t transition-colors ${
              activeTab === 'staff'
                ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Staff Members
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-5 py-2.5 text-sm font-medium rounded-t transition-colors ${
                activeTab === 'doctors'
                  ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Doctors
            </button>
          )}
        </div>

        {/* ── Staff tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'staff' && (
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
                    className={`input-field${formSubmitted && formErrors.name ? ' border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formSubmitted && formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="block text-sm font-medium mb-2">Address</label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field"
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
                    className={`input-field${formSubmitted && formErrors.role ? ' border-red-500 focus:ring-red-500' : ''}`}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="radiologist">Radiologist</option>
                    <option value="admin">Admin</option>
                  </select>
                  {formSubmitted && formErrors.role && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>
                  )}
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
                            <p className="text-xs text-gray-400 mt-1">
                              Last seen:{' '}
                              {member.last_seen
                                ? formatRelativeTime(member.last_seen)
                                : 'Never logged in'}
                            </p>
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
        )}

        {/* ── Doctors tab (admin only) ────────────────────────────────────────── */}
        {activeTab === 'doctors' && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add / Edit Doctor Form */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingDoctor ? 'Edit Doctor' : 'Add Doctor'}
                </h2>
                {editingDoctor && (
                  <button
                    onClick={cancelEditDoctor}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    title="Cancel edit"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <form onSubmit={handleDoctorSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="d-name" className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    id="d-name"
                    type="text"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    className={`input-field${doctorSubmitted && doctorErrors.name ? ' border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Dr. Jane Smith"
                  />
                  {doctorSubmitted && doctorErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{doctorErrors.name}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="d-specialty" className="block text-sm font-medium mb-2">Specialty *</label>
                  <input
                    id="d-specialty"
                    type="text"
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                    className={`input-field${doctorSubmitted && doctorErrors.specialty ? ' border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., Cardiology"
                  />
                  {doctorSubmitted && doctorErrors.specialty && (
                    <p className="text-red-500 text-xs mt-1">{doctorErrors.specialty}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium mb-2">Available Days</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DAYS.map((day) => (
                      <label
                        key={day}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded border cursor-pointer text-sm select-none transition-colors ${
                          doctorForm.availableDays.includes(day)
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={doctorForm.availableDays.includes(day)}
                          onChange={() => toggleDay(day)}
                          className="sr-only"
                        />
                        <span
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            doctorForm.availableDays.includes(day)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {doctorForm.availableDays.includes(day) && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  {editingDoctor && (
                    <button
                      type="button"
                      onClick={cancelEditDoctor}
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={createDoctor.isPending || updateDoctor.isPending}
                    className="btn-primary flex-1"
                  >
                    {(createDoctor.isPending || updateDoctor.isPending)
                      ? 'Saving...'
                      : editingDoctor
                        ? 'Update Doctor'
                        : 'Add Doctor'}
                  </button>
                </div>
              </form>
            </div>

            {/* Doctor List */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Current Doctors</h2>

              {doctors && doctors.length > 0 ? (
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`card p-4 transition-colors ${editingDoctor?.id === doctor.id ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">{doctor.name}</h3>
                          <p className="text-sm text-gray-600">{doctor.specialty}</p>
                          {doctor.availableDays && doctor.availableDays.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doctor.availableDays.map((day) => (
                                <span
                                  key={day}
                                  className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                                >
                                  {day.slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-2">No availability set</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => startEditDoctor(doctor)}
                            title="Edit doctor"
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => deleteDoctor.mutate(doctor.id)}
                            disabled={deleteDoctor.isPending}
                            title="Delete doctor"
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
                <div className="card p-6 text-center text-gray-500">No doctors yet</div>
              )}
            </div>
          </div>
        )}
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
