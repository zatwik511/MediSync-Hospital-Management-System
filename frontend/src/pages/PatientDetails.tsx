import { useParams, Link } from 'react-router-dom';
import { usePatient, useUpdateDiagnosis } from '../hooks/usePatients';
import { useRecordTask, useCostReport } from '../hooks/useFinancial';
import { usePatientAppointments } from '../hooks/useAppointments';
import { usePatientPrescriptions } from '../hooks/usePrescriptions';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PatientImageViewer } from '../components/PatientImageViewer';
import { ImageUploader } from '../components/ImageUploader';
import { PrescriptionSection } from '../components/PrescriptionSection';
import { ArrowLeft, Pencil, Check, X, PlusCircle, FileDown } from 'lucide-react';
import { useState } from 'react';

export function PatientDetails() {
  const { patientId } = useParams<{ patientId: string }>();
  const { data: patient, isLoading, error } = usePatient(patientId!);
  const updateDiagnosis = useUpdateDiagnosis(patientId!);
  const recordTask = useRecordTask();
  const { data: costReport } = useCostReport(patientId!);
  const { data: appointments = [] } = usePatientAppointments(patientId!);
  const { data: prescriptions = [] } = usePatientPrescriptions(patientId!);

  // Local cost state — starts null, gets set when a task is saved
  const [displayCost, setDisplayCost] = useState<number | null>(null);

  // Diagnosis editing state
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [diagnosisInput, setDiagnosisInput] = useState('');

  // Task recording state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCost, setTaskCost] = useState('');
  const [taskErrors, setTaskErrors] = useState({ description: '', cost: '' });
  const [taskSubmitted, setTaskSubmitted] = useState(false);

  const handleEditClick = () => {
    setDiagnosisInput(patient?.diagnosis || '');
    setIsEditingDiagnosis(true);
  };

  const handleSaveDiagnosis = async () => {
    if (!diagnosisInput.trim()) return;
    await updateDiagnosis.mutateAsync(diagnosisInput.trim());
    setIsEditingDiagnosis(false);
  };

  const handleCancelDiagnosis = () => {
    setIsEditingDiagnosis(false);
    setDiagnosisInput('');
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

    await recordTask.mutateAsync({
      patientID: patientId!,
      description: taskDescription.trim(),
      cost: costValue,
    });
    setDisplayCost(prev => (prev ?? Number(patient?.totalCost ?? 0)) + costValue);
    setTaskDescription('');
    setTaskCost('');
    setTaskErrors({ description: '', cost: '' });
    setTaskSubmitted(false);
    setIsAddingTask(false);
  };

  const handleCancelTask = () => {
    setIsAddingTask(false);
    setTaskDescription('');
    setTaskCost('');
    setTaskErrors({ description: '', cost: '' });
    setTaskSubmitted(false);
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        Error loading patient: {error.message}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md">
        Patient not found
      </div>
    );
  }

  // Use local state if a task has been added, otherwise use patient data
  const currentCost = displayCost ?? Number(patient.totalCost);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Print styles — only active when window.print() is called */}
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; margin: 0; }
          @page { margin: 20mm; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Back Button */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patients
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
        >
          <FileDown className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{patient.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Address:</span>
            <p className="text-gray-900">{patient.address}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Total Cost:</span>
            <p className="text-gray-900 text-lg font-semibold">
              £{currentCost.toFixed(2)}
            </p>
          </div>

          {/* Diagnosis — editable */}
          <div>
            <span className="text-sm font-medium text-gray-700">Diagnosis:</span>
            {isEditingDiagnosis ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={diagnosisInput}
                  onChange={(e) => setDiagnosisInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDiagnosis();
                    if (e.key === 'Escape') handleCancelDiagnosis();
                  }}
                  placeholder="Enter diagnosis..."
                  autoFocus
                  className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveDiagnosis}
                  disabled={updateDiagnosis.isPending || !diagnosisInput.trim()}
                  className="p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
                  title="Save diagnosis"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelDiagnosis}
                  className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-gray-900">
                  {patient.diagnosis || (
                    <span className="text-gray-400 italic">Not diagnosed yet</span>
                  )}
                </p>
                <button
                  onClick={handleEditClick}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                  title="Edit diagnosis"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Conditions:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {patient.conditions.length > 0 ? (
                patient.conditions.map((condition, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {condition}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No conditions listed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Section */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Financial Records</h2>
          {!isAddingTask && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Record Task
            </button>
          )}
        </div>

        {isAddingTask && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">New Task / Charge</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Description *</label>
                <input
                  type="text"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="e.g. MRI Scan, Consultation, Blood Test"
                  autoFocus
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${taskSubmitted && taskErrors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                {taskSubmitted && taskErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{taskErrors.description}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cost (£) *</label>
                <input
                  type="number"
                  value={taskCost}
                  onChange={(e) => setTaskCost(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${taskSubmitted && taskErrors.cost ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                {taskSubmitted && taskErrors.cost && (
                  <p className="text-red-500 text-xs mt-1">{taskErrors.cost}</p>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveTask}
                  disabled={recordTask.isPending}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {recordTask.isPending ? 'Saving...' : 'Save Task'}
                </button>
                <button
                  onClick={handleCancelTask}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">Total cost for this patient</span>
          <span className="text-xl font-bold text-gray-900">
            £{currentCost.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Prescription & Medication Section */}
      <PrescriptionSection patientId={patient.id} />

      {/* Image Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <ImageUploader patientId={patient.id} />
      </div>

      {/* Image Viewer Section */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <PatientImageViewer patientId={patient.id} />
      </div>

      {/* ── Print-only PDF report ───────────────────────────────────── */}
      <div className="print-only" style={{ fontFamily: 'Georgia, serif', color: '#111' }}>
        {/* Report header */}
        <div style={{ borderBottom: '2px solid #1d4ed8', paddingBottom: '12px', marginBottom: '24px' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1d4ed8' }}>IMS Healthcare</div>
          <div style={{ fontSize: '16px', marginTop: '4px' }}>Patient Health Report</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Patient info */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Information</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              {[
                ['Full Name', patient.name],
                ['Address', patient.address || '—'],
                ['Current Diagnosis', patient.diagnosis || 'None recorded'],
                ['Conditions', patient.conditions.length > 0 ? patient.conditions.join(', ') : 'None'],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: '6px 12px 6px 0', fontWeight: 'bold', color: '#6b7280', width: '160px', verticalAlign: 'top' }}>{label}</td>
                  <td style={{ padding: '6px 0', color: '#111' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial summary */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Summary</div>
          {costReport && costReport.tasks.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 'bold', color: '#374151' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 'bold', color: '#374151' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {costReport.tasks.map((task) => (
                  <tr key={task.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 8px', color: '#374151' }}>{task.description}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>£{Number(task.cost).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 'bold' }}>
                  <td style={{ padding: '8px 8px' }}>Total</td>
                  <td style={{ padding: '8px 8px', textAlign: 'right' }}>£{Number(costReport.totalCost).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>No financial records.</p>
          )}
        </div>

        {/* Prescriptions */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prescriptions & Medication</div>
          {prescriptions.length > 0 ? prescriptions.map((rx, rxIdx) => (
            <div key={rx.id} style={{ marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#f9fafb', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' }}>
                <strong style={{ color: '#374151' }}>Prescription {rxIdx + 1}</strong>
                {rx.prescribedByName && <> · {rx.prescribedByName}</>}
                {' · '}{new Date(rx.prescribedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    {['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 'bold', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rx.medications.map((med, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 'bold' }}>{med.name}</td>
                      <td style={{ padding: '6px 10px' }}>{med.dosage || '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{med.frequency || '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{med.duration || '—'}</td>
                      <td style={{ padding: '6px 10px', color: '#6b7280', fontStyle: 'italic' }}>{med.instructions || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rx.advice && (
                <div style={{ padding: '8px 12px', background: '#eff6ff', borderTop: '1px solid #bfdbfe' }}>
                  <strong style={{ fontSize: '11px', color: '#1e40af' }}>Doctor's Advice: </strong>
                  <span style={{ fontSize: '12px', color: '#1e3a8a' }}>{rx.advice}</span>
                </div>
              )}
            </div>
          )) : (
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>No prescriptions on record.</p>
          )}
        </div>

        {/* Appointment history */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Appointment History</div>
          {appointments.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 'bold', color: '#374151' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 'bold', color: '#374151' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 'bold', color: '#374151' }}>Doctor</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 'bold', color: '#374151' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 'bold', color: '#374151' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...appointments]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((appt) => (
                    <tr key={appt.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px 8px' }}>{new Date(appt.date).toLocaleDateString('en-GB')}</td>
                      <td style={{ padding: '6px 8px' }}>{appt.time}</td>
                      <td style={{ padding: '6px 8px' }}>{appt.doctorName || '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{appt.type}</td>
                      <td style={{ padding: '6px 8px' }}>{appt.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>No appointments on record.</p>
          )}
        </div>
      </div>
    </div>
  );
}