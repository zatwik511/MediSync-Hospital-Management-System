import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDoctors, useCreateDoctor, useUpdateDoctor, useDeleteDoctor } from '../hooks/useDoctors';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Trash2, Pencil, X, Stethoscope } from 'lucide-react';
import type { Doctor } from '../types/appointments';
import type { Staff } from '../types';
import { apiClient } from '../api/client';
import type { APIResponse } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SPECIALTIES = [
  'General Practice', 'Cardiology', 'Neurology', 'Orthopaedics', 'Radiology',
  'Oncology', 'Paediatrics', 'Psychiatry', 'Dermatology', 'Gastroenterology',
  'Endocrinology', 'Nephrology', 'Pulmonology', 'Rheumatology', 'Urology',
  'Ophthalmology', 'ENT', 'Emergency Medicine', 'Anaesthesiology', 'Pathology',
];

export function Doctors() {
  const { data: doctors, isLoading } = useDoctors();
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();
  const deleteDoctor = useDeleteDoctor();

  const { data: allStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await apiClient.get<APIResponse<Staff[]>>('/staff');
      return res.data.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
  const doctorStaff = (allStaff || []).filter(s => s.role === 'doctor');

  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ name: '', specialty: '', availableDays: [] as string[], staffId: '' });
  const [errors, setErrors] = useState({ name: '', specialty: '' });
  const [submitted, setSubmitted] = useState(false);

  const toggleDay = (day: string) =>
    setForm(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));

  const startEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setForm({ name: doc.name, specialty: doc.specialty, availableDays: doc.availableDays, staffId: doc.staffId || '' });
    setErrors({ name: '', specialty: '' });
    setSubmitted(false);
  };

  const cancelEdit = () => {
    setEditingDoctor(null);
    setForm({ name: '', specialty: '', availableDays: [], staffId: '' });
    setErrors({ name: '', specialty: '' });
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = {
      name:      !form.name.trim()      ? 'Name is required'      : '',
      specialty: !form.specialty.trim() ? 'Specialty is required' : '',
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    try {
      const payload = { ...form, staffId: form.staffId || null };
      if (editingDoctor) {
        await updateDoctor.mutateAsync({ id: editingDoctor.id, data: payload });
        cancelEdit();
      } else {
        await createDoctor.mutateAsync(payload);
        setForm({ name: '', specialty: '', availableDays: [], staffId: '' });
        setSubmitted(false);
      }
    } catch (err) {
      console.error('Failed to save doctor:', err);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage doctors and their appointment availability</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Form ─────────────────────────────────────────────────────── */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDoctor ? 'Edit Doctor' : 'Add Doctor'}
              </h2>
              {editingDoctor && (
                <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`input-field ${submitted && errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Dr. Jane Smith"
                />
                {submitted && errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty *</label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  list="specialty-suggestions"
                  className={`input-field ${submitted && errors.specialty ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g., Cardiology"
                />
                <datalist id="specialty-suggestions">
                  {SPECIALTIES.map(s => <option key={s} value={s} />)}
                </datalist>
                {submitted && errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Linked Staff Account <span className="text-gray-400 font-normal">(optional)</span></label>
                <select
                  value={form.staffId}
                  onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">— None —</option>
                  {doctorStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.staff_code})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Links this doctor profile to a staff account for notifications.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DAYS.map(day => (
                    <label
                      key={day}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded border cursor-pointer text-sm select-none transition-colors ${
                        form.availableDays.includes(day)
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <input type="checkbox" checked={form.availableDays.includes(day)} onChange={() => toggleDay(day)} className="sr-only" />
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${form.availableDays.includes(day) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                        {form.availableDays.includes(day) && (
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

              <div className="flex gap-3 pt-1">
                {editingDoctor && (
                  <button type="button" onClick={cancelEdit} className="flex-1 btn-secondary">Cancel</button>
                )}
                <button type="submit" disabled={createDoctor.isPending || updateDoctor.isPending} className="btn-primary flex-1 disabled:opacity-50">
                  {createDoctor.isPending || updateDoctor.isPending
                    ? 'Saving…'
                    : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>

          {/* ── Doctor list ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Current Doctors
                {doctors && doctors.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">{doctors.length} total</span>
                )}
              </h2>
            </div>

            {doctors && doctors.length > 0 ? (
              <div className="space-y-3">
                {doctors.map(doctor => (
                  <div
                    key={doctor.id}
                    className={`card p-4 transition-all ${editingDoctor?.id === doctor.id ? 'ring-2 ring-emerald-400' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            {doctor.specialty}
                          </span>
                        </div>
                        {doctor.availableDays && doctor.availableDays.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doctor.availableDays.map(day => (
                              <span key={day} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {day.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1.5">No availability set</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => startEdit(doctor)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteDoctor.mutate(doctor.id)} disabled={deleteDoctor.isPending} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-10 text-center">
                <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No doctors yet</p>
                <p className="text-gray-400 text-sm mt-1">Add your first doctor using the form on the left.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
