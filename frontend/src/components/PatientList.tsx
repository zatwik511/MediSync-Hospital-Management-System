import { useState, useEffect } from 'react';
import { usePaginatedPatients, useDeletePatient, useCreatePatient } from '../hooks/usePatients';
import { SkeletonTableRow } from './Skeleton';
import { Pagination } from './Pagination';
import { Trash2, Download, UserPlus, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { downloadCsv } from '../utils/exportCsv';

function calcAge(dob?: string | null): string {
  if (!dob) return '—';
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return String(age);
}

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  name: '', address: '', phone: '', dateOfBirth: '', gender: '', bloodType: '',
  conditionInput: '', conditions: [] as string[],
};

export function PatientList() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiSearch, setApiSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const deletePatient = useDeletePatient();
  const createPatient = useCreatePatient();
  const navigate = useNavigate();

  // Debounce search — reset to page 1 and fire new request after 350 ms idle
  useEffect(() => {
    const timer = setTimeout(() => {
      setApiSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: result, isLoading, error } = usePaginatedPatients(page, apiSearch);
  const patients = result?.data || [];

  function addCondition() {
    const tag = form.conditionInput.trim();
    if (!tag || form.conditions.includes(tag)) return;
    setForm((f) => ({ ...f, conditions: [...f.conditions, tag], conditionInput: '' }));
  }

  function removeCondition(tag: string) {
    setForm((f) => ({ ...f, conditions: f.conditions.filter((c) => c !== tag) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.address.trim()) { setFormError('Address is required.'); return; }
    setFormError('');
    try {
      await createPatient.mutateAsync({
        name: form.name.trim(),
        address: form.address.trim(),
        conditions: form.conditions,
        phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodType: form.bloodType || undefined,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create patient.');
    }
  }

  if (isLoading && !result) return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="h-7 w-28 animate-pulse bg-gray-200 rounded" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-44 animate-pulse bg-gray-200 rounded" />
          <div className="h-9 w-28 animate-pulse bg-gray-200 rounded" />
          <div className="h-9 w-28 animate-pulse bg-gray-200 rounded" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['Patient', 'Age', 'Gender', 'Conditions', 'Registered', 'Total Cost', ''].map(h => (
                <th key={h} className="text-left py-3 px-4 font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Error loading patients: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="section-heading mb-0">Patients</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-xs"
          />
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm whitespace-nowrap font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Add Patient
          </button>
          <button
            onClick={() =>
              downloadCsv(
                `patients-${new Date().toLocaleDateString('en-CA')}.csv`,
                ['Name', 'Age', 'Gender', 'Conditions', 'Diagnosis', 'Total Cost (£)', 'Registered'],
                patients.map((p) => [
                  p.name,
                  calcAge((p as any).date_of_birth || (p as any).dateOfBirth),
                  (p as any).gender || '',
                  p.conditions.join('; '),
                  p.diagnosis || '',
                  Number(p.totalCost).toFixed(2),
                  new Date(p.createdAt).toLocaleDateString('en-GB'),
                ])
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {apiSearch ? `No patients match "${apiSearch}"` : 'No patients found'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Age</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Gender</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Conditions</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Registered</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Cost</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="border-b border-gray-100 hover:bg-emerald-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-700 hover:underline">
                        {patient.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 tabular-nums">
                      {calcAge((patient as any).date_of_birth || (patient as any).dateOfBirth)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {(patient as any).gender || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {patient.conditions.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {patient.conditions.slice(0, 2).map((condition) => (
                            <span key={condition} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {condition}
                            </span>
                          ))}
                          {patient.conditions.length > 2 && (
                            <span className="text-xs text-gray-400">+{patient.conditions.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(patient.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-gray-900">
                      £{Number(patient.totalCost).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePatient.mutate(patient.id); }}
                        disabled={deletePatient.isPending}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete patient"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={result?.totalPages ?? 1}
            total={result?.total ?? 0}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add New Patient</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. 14 Oak Street, London"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="input-field">
                    <option value="">Select…</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. 07700 900123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                  <select value={form.bloodType} onChange={(e) => setForm((f) => ({ ...f, bloodType: e.target.value }))} className="input-field">
                    <option value="">Unknown</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt}>{bt}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.conditionInput}
                    onChange={(e) => setForm((f) => ({ ...f, conditionInput: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCondition(); } }}
                    className="input-field"
                    placeholder="Type a condition and press Enter"
                  />
                  <button type="button" onClick={addCondition} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.conditions.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                        {c}
                        <button type="button" onClick={() => removeCondition(c)} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(''); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createPatient.isPending} className="btn-primary disabled:opacity-50">
                  {createPatient.isPending ? 'Saving...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
