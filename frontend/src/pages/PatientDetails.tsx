import { useParams, Link } from 'react-router-dom';
import { usePatient, useUpdateDiagnosis, useUpdatePatient } from '../hooks/usePatients';
import { useVitals, useCreateVital, useDeleteVital } from '../hooks/useVitals';
import { useRecordTask, useCostReport } from '../hooks/useFinancial';
import { usePatientAppointments } from '../hooks/useAppointments';
import { usePatientPrescriptions } from '../hooks/usePrescriptions';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PatientImageViewer } from '../components/PatientImageViewer';
import { ImageUploader } from '../components/ImageUploader';
import { PrescriptionSection } from '../components/PrescriptionSection';
import { DiagnosticReports } from '../components/DiagnosticReports';
import {
  ArrowLeft, Pencil, Check, X, PlusCircle, FileDown,
  Plus, Trash2, Activity, Loader2,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Allergy, UpdatePatientDTO } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  'Mild':             'bg-yellow-100 text-yellow-800',
  'Moderate':         'bg-orange-100 text-orange-800',
  'Severe':           'bg-red-100 text-red-800',
  'Life-threatening': 'bg-red-200 text-red-900 font-semibold',
};

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDatetime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const EDIT_MODAL_EMPTY = (p: any): UpdatePatientDTO => ({
  name:                        p?.name || '',
  address:                     p?.address || '',
  phone:                       p?.phone || '',
  dateOfBirth:                 p?.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
  gender:                      p?.gender || '',
  bloodType:                   p?.bloodType || '',
  email:                       p?.email || '',
  emergencyContactName:        p?.emergencyContactName || '',
  emergencyContactRelationship:p?.emergencyContactRelationship || '',
  emergencyContactPhone:       p?.emergencyContactPhone || '',
});

const VITALS_EMPTY = {
  bloodPressureSystolic: '', bloodPressureDiastolic: '',
  heartRate: '', temperature: '', oxygenSaturation: '',
  weight: '', height: '', notes: '',
};

const ALLERGY_EMPTY = { substance: '', reaction: '', severity: 'Mild' as Allergy['severity'] };

// ─── component ──────────────────────────────────────────────────────────────

export function PatientDetails() {
  const { patientId } = useParams<{ patientId: string }>();
  const { data: patient, isLoading, error } = usePatient(patientId!);
  const updateDiagnosis = useUpdateDiagnosis(patientId!);
  const updatePatient   = useUpdatePatient(patientId!);
  const { data: vitals = [] }       = useVitals(patientId!);
  const createVital = useCreateVital(patientId!);
  const deleteVital = useDeleteVital(patientId!);
  const recordTask = useRecordTask();
  const { data: costReport }        = useCostReport(patientId!);
  const { data: appointments = [] } = usePatientAppointments(patientId!);
  const { data: prescriptions = [] }= usePatientPrescriptions(patientId!);

  // cost
  const [displayCost, setDisplayCost] = useState<number | null>(null);

  // diagnosis edit
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [diagnosisInput, setDiagnosisInput]         = useState('');

  // task form
  const [isAddingTask, setIsAddingTask]     = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCost, setTaskCost]             = useState('');
  const [taskErrors, setTaskErrors]         = useState({ description: '', cost: '' });
  const [taskSubmitted, setTaskSubmitted]   = useState(false);

  // edit profile modal
  const editModalRef = useRef<HTMLDivElement>(null);
  const [showEditModal, setShowEditModal]   = useState(false);
  useFocusTrap(editModalRef, showEditModal);
  const [editForm, setEditForm]             = useState<UpdatePatientDTO>({});
  const [editError, setEditError]           = useState('');
  const [editSaving, setEditSaving]         = useState(false);

  // vitals form
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vitalsForm, setVitalsForm]         = useState(VITALS_EMPTY);

  // allergy form
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [allergyForm, setAllergyForm]         = useState(ALLERGY_EMPTY);
  const [allergyError, setAllergyError]       = useState('');

  // ── handlers ──
  const handleEditClick = () => {
    setDiagnosisInput(patient?.diagnosis || '');
    setIsEditingDiagnosis(true);
  };
  const handleSaveDiagnosis = async () => {
    if (!diagnosisInput.trim()) return;
    await updateDiagnosis.mutateAsync(diagnosisInput.trim());
    setIsEditingDiagnosis(false);
  };

  const handleSaveTask = async () => {
    setTaskSubmitted(true);
    const costValue = parseFloat(taskCost);
    const errs = {
      description: !taskDescription.trim() ? 'Description is required' : '',
      cost: taskCost === '' ? 'Cost is required'
            : isNaN(costValue) || costValue <= 0 ? 'Cost must be a positive number' : '',
    };
    setTaskErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    await recordTask.mutateAsync({ patientID: patientId!, description: taskDescription.trim(), cost: costValue });
    setDisplayCost(prev => (prev ?? Number(patient?.totalCost ?? 0)) + costValue);
    setTaskDescription(''); setTaskCost('');
    setTaskErrors({ description: '', cost: '' });
    setTaskSubmitted(false); setIsAddingTask(false);
  };

  const openEditModal = () => {
    setEditForm(EDIT_MODAL_EMPTY(patient));
    setEditError('');
    setShowEditModal(true);
  };
  const handleSaveProfile = async () => {
    if (!editForm.name?.trim()) { setEditError('Name is required.'); return; }
    if (!editForm.address?.trim()) { setEditError('Address is required.'); return; }
    setEditError(''); setEditSaving(true);
    try {
      await updatePatient.mutateAsync({ ...editForm, updatedAt: patient?.updatedAt });
      setShowEditModal(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleRecordVitals = async () => {
    const staffName = localStorage.getItem('staffName') || localStorage.getItem('staffId') || '';
    const payload: Record<string, any> = { patientId: patientId!, recordedBy: staffName };
    if (vitalsForm.bloodPressureSystolic)  payload.bloodPressureSystolic  = Number(vitalsForm.bloodPressureSystolic);
    if (vitalsForm.bloodPressureDiastolic) payload.bloodPressureDiastolic = Number(vitalsForm.bloodPressureDiastolic);
    if (vitalsForm.heartRate)              payload.heartRate              = Number(vitalsForm.heartRate);
    if (vitalsForm.temperature)            payload.temperature            = Number(vitalsForm.temperature);
    if (vitalsForm.oxygenSaturation)       payload.oxygenSaturation       = Number(vitalsForm.oxygenSaturation);
    if (vitalsForm.weight)                 payload.weight                 = Number(vitalsForm.weight);
    if (vitalsForm.height)                 payload.height                 = Number(vitalsForm.height);
    if (vitalsForm.notes.trim())           payload.notes                  = vitalsForm.notes.trim();
    await createVital.mutateAsync(payload as any);
    setVitalsForm(VITALS_EMPTY);
    setShowVitalsForm(false);
  };

  const handleAddAllergy = async () => {
    if (!allergyForm.substance.trim()) { setAllergyError('Substance is required.'); return; }
    if (!allergyForm.reaction.trim())  { setAllergyError('Reaction is required.');  return; }
    setAllergyError('');
    const current = patient?.allergies || [];
    await updatePatient.mutateAsync({ allergies: [...current, { ...allergyForm, substance: allergyForm.substance.trim(), reaction: allergyForm.reaction.trim() }], updatedAt: patient?.updatedAt });
    setAllergyForm(ALLERGY_EMPTY);
    setShowAllergyForm(false);
  };

  const handleRemoveAllergy = async (index: number) => {
    const current = patient?.allergies || [];
    await updatePatient.mutateAsync({ allergies: current.filter((_, i) => i !== index), updatedAt: patient?.updatedAt });
  };

  // ── loading / error states ──
  if (isLoading) return <LoadingSpinner />;
  if (error)     return <div className="bg-red-50 text-red-600 p-4 rounded-md">Error loading patient: {error.message}</div>;
  if (!patient)  return <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md">Patient not found</div>;

  const currentCost = displayCost ?? Number(patient.totalCost);

  // ── render ──
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; margin: 0; }
          @page { margin: 20mm; }
        }
        .print-only { display: none; }
      `}</style>

      {/* ── Nav bar ── */}
      <div className="flex items-center justify-between no-print">
        <Link to="/patients" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
          <FileDown className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* ══ 1. PATIENT PROFILE CARD ══════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
            {patient.bloodType && (
              <span className="mt-1 inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded">
                {patient.bloodType}
              </span>
            )}
          </div>
          <button onClick={openEditModal} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          <Field label="Address"       value={patient.address} />
          <Field label="Phone"         value={patient.phone} />
          <Field label="Date of Birth" value={fmtDate(patient.dateOfBirth)} />
          <Field label="Gender"        value={patient.gender} />
          <Field label="Email"         value={patient.email} />
          <Field label="Total Cost"    value={`£${currentCost.toFixed(2)}`} bold />

          {/* Diagnosis — editable */}
          <div className="sm:col-span-2 lg:col-span-1">
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Diagnosis</span>
            {isEditingDiagnosis ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={diagnosisInput}
                  onChange={(e) => setDiagnosisInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDiagnosis(); if (e.key === 'Escape') setIsEditingDiagnosis(false); }}
                  autoFocus
                  className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button onClick={handleSaveDiagnosis} disabled={updateDiagnosis.isPending} aria-label="Save diagnosis" className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"><Check className="w-4 h-4" /></button>
                <button onClick={() => setIsEditingDiagnosis(false)} aria-label="Cancel edit" className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-gray-900 text-sm">{patient.diagnosis || <span className="text-gray-400 italic">Not set</span>}</p>
                <button onClick={handleEditClick} aria-label="Edit diagnosis" className="p-1 text-gray-400 hover:text-emerald-600"><Pencil className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="sm:col-span-2">
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Conditions</span>
            <div className="flex flex-wrap gap-2">
              {patient.conditions.length > 0
                ? patient.conditions.map((c, i) => <span key={i} className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-sm">{c}</span>)
                : <span className="text-gray-400 text-sm">None recorded</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ══ 2. EMERGENCY CONTACT ═════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Emergency Contact</h2>
          <button onClick={openEditModal} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Edit</button>
        </div>
        {patient.emergencyContactName ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Name"         value={patient.emergencyContactName} />
            <Field label="Relationship" value={patient.emergencyContactRelationship} />
            <Field label="Phone"        value={patient.emergencyContactPhone} />
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No emergency contact on file. <button onClick={openEditModal} className="text-emerald-600 hover:underline">Add one</button></p>
        )}
      </div>

      {/* ══ 3. ALLERGIES ═════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Allergies & Intolerances</h2>
          {!showAllergyForm && (
            <button onClick={() => setShowAllergyForm(true)} className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              <Plus className="w-4 h-4" /> Add Allergy
            </button>
          )}
        </div>

        {showAllergyForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 space-y-3">
            {allergyError && <p className="text-sm text-red-600">{allergyError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Substance *</label>
                <input type="text" value={allergyForm.substance} onChange={e => setAllergyForm(f => ({ ...f, substance: e.target.value }))} className="input-field" placeholder="e.g. Penicillin" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Reaction *</label>
                <input type="text" value={allergyForm.reaction} onChange={e => setAllergyForm(f => ({ ...f, reaction: e.target.value }))} className="input-field" placeholder="e.g. Anaphylaxis" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Severity</label>
                <select value={allergyForm.severity} onChange={e => setAllergyForm(f => ({ ...f, severity: e.target.value as Allergy['severity'] }))} className="input-field">
                  <option>Mild</option><option>Moderate</option><option>Severe</option><option>Life-threatening</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddAllergy} disabled={updatePatient.isPending} className="btn-primary text-sm disabled:opacity-50">Save</button>
              <button onClick={() => { setShowAllergyForm(false); setAllergyForm(ALLERGY_EMPTY); setAllergyError(''); }} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        {(patient.allergies || []).length > 0 ? (
          <div className="space-y-2">
            {patient.allergies.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{a.substance}</span>
                  <span className="text-gray-500 text-sm">→ {a.reaction}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_STYLES[a.severity] || 'bg-gray-100 text-gray-700'}`}>{a.severity}</span>
                </div>
                <button onClick={() => handleRemoveAllergy(i)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        ) : (
          !showAllergyForm && <p className="text-gray-400 text-sm">No known allergies recorded.</p>
        )}
      </div>

      {/* ══ 4. VITALS ════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Vital Signs</h2>
          </div>
          {!showVitalsForm && (
            <button onClick={() => setShowVitalsForm(true)} className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              <Plus className="w-4 h-4" /> Record Vitals
            </button>
          )}
        </div>

        {showVitalsForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">New Vitals Reading</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <VitalInput label="BP Systolic (mmHg)"  value={vitalsForm.bloodPressureSystolic}  onChange={v => setVitalsForm(f => ({ ...f, bloodPressureSystolic: v }))}  placeholder="e.g. 120" />
              <VitalInput label="BP Diastolic (mmHg)" value={vitalsForm.bloodPressureDiastolic} onChange={v => setVitalsForm(f => ({ ...f, bloodPressureDiastolic: v }))} placeholder="e.g. 80"  />
              <VitalInput label="Heart Rate (bpm)"    value={vitalsForm.heartRate}              onChange={v => setVitalsForm(f => ({ ...f, heartRate: v }))}              placeholder="e.g. 72"  />
              <VitalInput label="SpO₂ (%)"            value={vitalsForm.oxygenSaturation}       onChange={v => setVitalsForm(f => ({ ...f, oxygenSaturation: v }))}       placeholder="e.g. 98"  />
              <VitalInput label="Temperature (°C)"    value={vitalsForm.temperature}            onChange={v => setVitalsForm(f => ({ ...f, temperature: v }))}            placeholder="e.g. 36.6"/>
              <VitalInput label="Weight (kg)"         value={vitalsForm.weight}                 onChange={v => setVitalsForm(f => ({ ...f, weight: v }))}                 placeholder="e.g. 72"  />
              <VitalInput label="Height (cm)"         value={vitalsForm.height}                 onChange={v => setVitalsForm(f => ({ ...f, height: v }))}                 placeholder="e.g. 175" />
              <div className="sm:col-span-1">
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <input type="text" value={vitalsForm.notes} onChange={e => setVitalsForm(f => ({ ...f, notes: e.target.value }))} className="input-field" placeholder="Optional notes" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleRecordVitals} disabled={createVital.isPending} className="btn-primary text-sm disabled:opacity-50">
                {createVital.isPending ? 'Saving…' : 'Save Reading'}
              </button>
              <button onClick={() => { setShowVitalsForm(false); setVitalsForm(VITALS_EMPTY); }} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        {vitals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Date', 'BP', 'HR', 'SpO₂', 'Temp', 'Weight', 'Height', 'Recorded By', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vitals.map(v => (
                  <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{fmtDatetime(v.recordedAt)}</td>
                    <td className="py-2 px-3 tabular-nums">
                      {v.bloodPressureSystolic && v.bloodPressureDiastolic
                        ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                        : '—'}
                    </td>
                    <td className="py-2 px-3 tabular-nums">{v.heartRate ?? '—'}</td>
                    <td className="py-2 px-3 tabular-nums">{v.oxygenSaturation != null ? `${v.oxygenSaturation}%` : '—'}</td>
                    <td className="py-2 px-3 tabular-nums">{v.temperature != null ? `${v.temperature}°C` : '—'}</td>
                    <td className="py-2 px-3 tabular-nums">{v.weight != null ? `${v.weight} kg` : '—'}</td>
                    <td className="py-2 px-3 tabular-nums">{v.height != null ? `${v.height} cm` : '—'}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{v.recordedBy}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => deleteVital.mutate(v.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !showVitalsForm && <p className="text-gray-400 text-sm">No vitals recorded yet.</p>
        )}
      </div>

      {/* ══ 5. PRESCRIPTIONS ═════════════════════════════════════════════════ */}
      <PrescriptionSection patientId={patient.id} />

      {/* ══ 6. DIAGNOSTIC REPORT ═════════════════════════════════════════════ */}
      <DiagnosticReports patientId={patient.id} />

      {/* ══ 7. MEDICAL IMAGES ════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <ImageUploader patientId={patient.id} />
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <PatientImageViewer patientId={patient.id} />
      </div>

      {/* ══ 8. FINANCIAL RECORDS ═════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Financial Records</h2>
          {!isAddingTask && (
            <button onClick={() => setIsAddingTask(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700">
              <PlusCircle className="w-4 h-4" /> Record Task
            </button>
          )}
        </div>

        {isAddingTask && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">New Task / Charge</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description *</label>
                <input type="text" value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="e.g. MRI Scan, Consultation" autoFocus
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${taskSubmitted && taskErrors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}`}
                />
                {taskSubmitted && taskErrors.description && <p className="text-red-500 text-xs mt-1">{taskErrors.description}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cost (£) *</label>
                <input type="number" value={taskCost} onChange={e => setTaskCost(e.target.value)} placeholder="0.00" min="0.01" step="0.01"
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${taskSubmitted && taskErrors.cost ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'}`}
                />
                {taskSubmitted && taskErrors.cost && <p className="text-red-500 text-xs mt-1">{taskErrors.cost}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveTask} disabled={recordTask.isPending} className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50">
                  {recordTask.isPending ? 'Saving...' : 'Save Task'}
                </button>
                <button onClick={() => { setIsAddingTask(false); setTaskDescription(''); setTaskCost(''); setTaskErrors({ description: '', cost: '' }); setTaskSubmitted(false); }} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">Total cost for this patient</span>
          <span className="text-xl font-bold text-gray-900">£{currentCost.toFixed(2)}</span>
        </div>
      </div>

      {/* ══ EDIT PROFILE MODAL ═══════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 overflow-y-auto">
          <div
            ref={editModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 id="edit-profile-title" className="text-lg font-semibold text-gray-900">Edit Patient Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>}

              <Section title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Full Name *">
                    <input type="text" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
                  </FormField>
                  <FormField label="Address *">
                    <input type="text" value={editForm.address || ''} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="input-field" />
                  </FormField>
                  <FormField label="Date of Birth">
                    <input type="date" value={editForm.dateOfBirth || ''} onChange={e => setEditForm(f => ({ ...f, dateOfBirth: e.target.value }))} className="input-field" />
                  </FormField>
                  <FormField label="Gender">
                    <select value={editForm.gender || ''} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))} className="input-field">
                      <option value="">Select…</option>
                      {['Male','Female','Non-binary','Other','Prefer not to say'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Phone">
                    <input type="tel" value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="e.g. 07700 900123" />
                  </FormField>
                  <FormField label="Blood Type">
                    <select value={editForm.bloodType || ''} onChange={e => setEditForm(f => ({ ...f, bloodType: e.target.value }))} className="input-field">
                      <option value="">Unknown</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt}>{bt}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Email">
                    <input type="email" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="patient@example.com" autoComplete="email" />
                  </FormField>
                </div>
              </Section>

              <Section title="Emergency Contact">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="Full Name">
                    <input type="text" value={editForm.emergencyContactName || ''} onChange={e => setEditForm(f => ({ ...f, emergencyContactName: e.target.value }))} className="input-field" placeholder="e.g. Jane Smith" />
                  </FormField>
                  <FormField label="Relationship">
                    <input type="text" value={editForm.emergencyContactRelationship || ''} onChange={e => setEditForm(f => ({ ...f, emergencyContactRelationship: e.target.value }))} className="input-field" placeholder="e.g. Spouse" />
                  </FormField>
                  <FormField label="Phone">
                    <input type="tel" value={editForm.emergencyContactPhone || ''} onChange={e => setEditForm(f => ({ ...f, emergencyContactPhone: e.target.value }))} className="input-field" placeholder="e.g. 07700 900456" />
                  </FormField>
                </div>
              </Section>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveProfile} disabled={editSaving} className="btn-primary flex items-center gap-1.5 disabled:opacity-50">
                {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Print-only report ─────────────────────────────────────────────── */}
      <div className="print-only" style={{ fontFamily: 'Georgia, serif', color: '#111' }}>
        <div style={{ borderBottom: '2px solid #059669', paddingBottom: '12px', marginBottom: '24px' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#059669' }}>MediSync</div>
          <div style={{ fontSize: '16px', marginTop: '4px' }}>Patient Health Report</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <SectionPrint title="Patient Information">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {[
                  ['Full Name',      patient.name],
                  ['Date of Birth',  fmtDate(patient.dateOfBirth)],
                  ['Gender',         patient.gender || '—'],
                  ['Phone',          patient.phone || '—'],
                  ['Blood Type',     patient.bloodType || '—'],
                  ['Address',        patient.address || '—'],
                  ['Diagnosis',      patient.diagnosis || 'None recorded'],
                  ['Conditions',     patient.conditions.length > 0 ? patient.conditions.join(', ') : 'None'],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ padding: '5px 12px 5px 0', fontWeight: 'bold', color: '#6b7280', width: '140px', verticalAlign: 'top' }}>{label}</td>
                    <td style={{ padding: '5px 0', color: '#111' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionPrint>
        </div>

        {(patient.allergies || []).length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <SectionPrint title="Allergies">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {['Substance','Reaction','Severity'].map(h => <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: '#374151' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {patient.allergies.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{a.substance}</td>
                      <td style={{ padding: '5px 8px' }}>{a.reaction}</td>
                      <td style={{ padding: '5px 8px' }}>{a.severity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionPrint>
          </div>
        )}

        {vitals.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <SectionPrint title="Vital Signs History">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead><tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  {['Date','BP','HR','SpO₂','Temp','Weight','Height'].map(h => <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: '#374151' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {vitals.slice(0, 10).map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px' }}>{fmtDatetime(v.recordedAt)}</td>
                      <td style={{ padding: '5px 8px' }}>{v.bloodPressureSystolic && v.bloodPressureDiastolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{v.heartRate ?? '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{v.oxygenSaturation != null ? `${v.oxygenSaturation}%` : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{v.temperature != null ? `${v.temperature}°C` : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{v.weight != null ? `${v.weight} kg` : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{v.height != null ? `${v.height} cm` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionPrint>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <SectionPrint title="Financial Summary">
            {costReport && costReport.tasks.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px', color: '#374151' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '5px 8px', color: '#374151' }}>Cost</th>
                </tr></thead>
                <tbody>
                  {costReport.tasks.map(task => (
                    <tr key={task.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 8px' }}>{task.description}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>£{Number(task.cost).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 'bold' }}>
                    <td style={{ padding: '7px 8px' }}>Total</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>£{Number(costReport.totalCost).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            ) : <p style={{ fontSize: '13px', color: '#9ca3af' }}>No financial records.</p>}
          </SectionPrint>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <SectionPrint title="Prescriptions & Medication">
            {prescriptions.length > 0 ? prescriptions.map((rx, rxIdx) => (
              <div key={rx.id} style={{ marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#f9fafb', padding: '7px 12px', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
                  <strong style={{ color: '#374151' }}>Prescription {rxIdx + 1}</strong>
                  {rx.prescribedByName && <> · {rx.prescribedByName}</>}
                  {' · '}{new Date(rx.prescribedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ background: '#f3f4f6' }}>
                    {['Medicine','Dosage','Frequency','Duration','Instructions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '5px 10px', fontWeight: 'bold', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {rx.medications.map((med, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '5px 10px', fontWeight: 'bold' }}>{med.name}</td>
                        <td style={{ padding: '5px 10px' }}>{med.dosage || '—'}</td>
                        <td style={{ padding: '5px 10px' }}>{med.frequency || '—'}</td>
                        <td style={{ padding: '5px 10px' }}>{med.duration || '—'}</td>
                        <td style={{ padding: '5px 10px', color: '#6b7280', fontStyle: 'italic' }}>{med.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )) : <p style={{ fontSize: '13px', color: '#9ca3af' }}>No prescriptions on record.</p>}
          </SectionPrint>
        </div>

        <SectionPrint title="Appointment History">
          {appointments.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Date','Time','Doctor','Type','Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: '#374151' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[...appointments].sort((a, b) => b.date.localeCompare(a.date)).map(appt => (
                  <tr key={appt.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '5px 8px' }}>{new Date(appt.date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '5px 8px' }}>{appt.time}</td>
                    <td style={{ padding: '5px 8px' }}>{appt.doctorName || '—'}</td>
                    <td style={{ padding: '5px 8px' }}>{appt.type}</td>
                    <td style={{ padding: '5px 8px' }}>{appt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ fontSize: '13px', color: '#9ca3af' }}>No appointments on record.</p>}
        </SectionPrint>
      </div>
    </div>
  );
}

// ─── small reusable sub-components ──────────────────────────────────────────

function Field({ label, value, bold }: { label: string; value?: string | null; bold?: boolean }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</span>
      <p className={`text-sm ${bold ? 'font-bold text-lg text-gray-900' : 'text-gray-900'}`}>{value || '—'}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function VitalInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} step="any" className="input-field" />
    </div>
  );
}

function SectionPrint({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      {children}
    </>
  );
}
