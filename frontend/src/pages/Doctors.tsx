import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDoctors, useCreateDoctor, useUpdateDoctor, useDeleteDoctor, useDoctorAvailability, useSetDoctorAvailability, useDeletedDoctors, useRestoreDoctor } from '../hooks/useDoctors';
import { SkeletonPersonCard } from '../components/Skeleton';
import { Trash2, Pencil, X, Stethoscope, Clock, RotateCcw, Eye } from 'lucide-react';
import type { Doctor, AvailabilitySlot } from '../types/appointments';
import type { Staff } from '../types';
import { apiClient } from '../api/client';
import type { APIResponse } from '../types';

// day_of_week 0=Sun … 6=Sat; displayed Mon–Sun
const WEEK_DAYS: { label: string; value: number }[] = [
  { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Availability editor ────────────────────────────────────────────────────────

type DayConfig = { startTime: string; endTime: string };

function AvailabilityEditor({ doctorId, onClose }: { doctorId: string; onClose: () => void }) {
  const { data: current = [], isLoading } = useDoctorAvailability(doctorId);
  const save = useSetDoctorAvailability();

  const toMap = (slots: AvailabilitySlot[]) => {
    const m: Record<number, DayConfig> = {};
    for (const s of slots) m[s.dayOfWeek] = { startTime: s.startTime, endTime: s.endTime };
    return m;
  };

  const [config, setConfig] = useState<Record<number, DayConfig | null>>(() => {
    const m: Record<number, DayConfig | null> = {};
    for (const d of WEEK_DAYS) m[d.value] = null;
    return m;
  });
  const [initialised, setInitialised] = useState(false);

  if (!isLoading && !initialised) {
    const loaded = toMap(current);
    const next: Record<number, DayConfig | null> = {};
    for (const d of WEEK_DAYS) next[d.value] = loaded[d.value] ?? null;
    setConfig(next);
    setInitialised(true);
  }

  const toggle = (val: number) =>
    setConfig(c => ({ ...c, [val]: c[val] ? null : { startTime: '09:00', endTime: '17:00' } }));

  const update = (val: number, field: keyof DayConfig, v: string) =>
    setConfig(c => ({ ...c, [val]: { ...(c[val] as DayConfig), [field]: v } }));

  const handleSave = async () => {
    const slots: AvailabilitySlot[] = WEEK_DAYS
      .filter(d => config[d.value] !== null)
      .map(d => ({ dayOfWeek: d.value, ...(config[d.value] as DayConfig) }));
    await save.mutateAsync({ doctorId, slots });
    onClose();
  };

  if (isLoading) return <p className="text-xs text-gray-400 py-2 animate-pulse">Loading availability…</p>;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Working Hours</p>
      <div className="space-y-1.5">
        {WEEK_DAYS.map(d => {
          const active = config[d.value] !== null;
          return (
            <div key={d.value} className="flex items-center gap-2">
              <label className={`flex items-center gap-1.5 w-10 cursor-pointer select-none text-xs font-medium ${active ? 'text-emerald-700' : 'text-gray-400'}`}>
                <input type="checkbox" checked={active} onChange={() => toggle(d.value)} className="sr-only" />
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                  {active && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                {d.label}
              </label>
              {active ? (
                <>
                  <input type="time" value={(config[d.value] as DayConfig).startTime}
                    onChange={e => update(d.value, 'startTime', e.target.value)}
                    className="border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                  <span className="text-xs text-gray-400">to</span>
                  <input type="time" value={(config[d.value] as DayConfig).endTime}
                    onChange={e => update(d.value, 'endTime', e.target.value)}
                    className="border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                </>
              ) : (
                <span className="text-xs text-gray-300">Not working</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSave}
          disabled={save.isPending}
          className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
        >
          {save.isPending ? 'Saving…' : 'Save Hours'}
        </button>
        <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}

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
  const { data: deletedDoctors, isLoading: deletedLoading } = useDeletedDoctors();
  const restoreDoctor = useRestoreDoctor();
  const [showDeleted, setShowDeleted] = useState(false);

  const { data: allStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await apiClient.get<APIResponse<Staff[]>>('/staff');
      return res.data.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
  const doctorStaff = (allStaff || []).filter(s => s.role === 'doctor');

  const [editingDoctor, setEditingDoctor]     = useState<Doctor | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState<string | null>(null);
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

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 animate-pulse bg-gray-200 rounded-xl" />
          <div className="space-y-2">
            <div className="h-8 w-32 animate-pulse bg-gray-200 rounded" />
            <div className="h-4 w-64 animate-pulse bg-gray-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card p-6 space-y-4">
            <div className="h-6 w-28 animate-pulse bg-gray-200 rounded mb-6" />
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
            {Array.from({ length: 5 }).map((_, i) => <SkeletonPersonCard key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );

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
              <button
                onClick={() => setShowDeleted(v => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-medium transition-colors ${showDeleted ? 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                <Eye className="w-3.5 h-3.5" />
                {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
                {deletedDoctors && deletedDoctors.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{deletedDoctors.length > 9 ? '9+' : deletedDoctors.length}</span>
                )}
              </button>
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
                        <button
                          onClick={() => setAvailabilityOpen(availabilityOpen === doctor.id ? null : doctor.id)}
                          className={`p-1.5 rounded transition-colors ${availabilityOpen === doctor.id ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title="Set working hours"
                        >
                          <Clock size={15} />
                        </button>
                        <button onClick={() => startEdit(doctor)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteDoctor.mutate(doctor.id)} disabled={deleteDoctor.isPending} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {availabilityOpen === doctor.id && (
                      <AvailabilityEditor
                        doctorId={doctor.id}
                        onClose={() => setAvailabilityOpen(null)}
                      />
                    )}
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

            {/* Deleted doctors panel */}
            {showDeleted && (
              <div className="mt-6 border border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
                  <h3 className="text-sm font-semibold text-amber-800">Deleted Doctors</h3>
                  <p className="text-xs text-amber-600 mt-0.5">These doctors have been soft-deleted and can be restored.</p>
                </div>
                {deletedLoading ? (
                  <div className="p-4 text-sm text-gray-400 animate-pulse">Loading deleted doctors…</div>
                ) : !deletedDoctors || deletedDoctors.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">No deleted doctors</div>
                ) : (
                  <div className="divide-y divide-amber-50">
                    {deletedDoctors.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-amber-50/30 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                          <p className="text-xs text-gray-400">{doc.specialty}</p>
                        </div>
                        <button
                          onClick={() => restoreDoctor.mutate(doc.id)}
                          disabled={restoreDoctor.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
