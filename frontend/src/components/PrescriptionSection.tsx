import { useState } from 'react';
import { PlusCircle, Trash2, Pill, ChevronDown, ChevronUp, X, ClipboardList } from 'lucide-react';
import { usePatientPrescriptions, useCreatePrescription, useDeletePrescription } from '../hooks/usePrescriptions';
import type { Medication } from '../api/prescriptionApi';

interface Props {
  patientId: string;
}

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'Before meals',
  'After meals',
  'With meals',
  'At bedtime',
  'As needed',
];

const EMPTY_MED: Medication = {
  name: '',
  dosage: '',
  frequency: 'Once daily',
  duration: '',
  instructions: '',
};

export function PrescriptionSection({ patientId }: Props) {
  const { data: prescriptions = [], isLoading } = usePatientPrescriptions(patientId);
  const createPrescription = useCreatePrescription(patientId);
  const deletePrescription = useDeletePrescription(patientId);

  const [isAdding, setIsAdding]       = useState(false);
  const [medications, setMedications] = useState<Medication[]>([{ ...EMPTY_MED }]);
  const [advice, setAdvice]           = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  // â”€â”€ Form helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const updateMed = (index: number, field: keyof Medication, value: string) => {
    setMedications(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const addMedRow = () => setMedications(prev => [...prev, { ...EMPTY_MED }]);

  const removeMedRow = (index: number) =>
    setMedications(prev => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setMedications([{ ...EMPTY_MED }]);
    setAdvice('');
    setSubmitted(false);
    setIsAdding(false);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const hasEmpty = medications.some(m => !m.name.trim());
    if (hasEmpty) return;

    await createPrescription.mutateAsync({
      patientId,
      medications: medications.map(m => ({
        ...m,
        name:         m.name.trim(),
        dosage:       m.dosage.trim(),
        duration:     m.duration.trim(),
        instructions: m.instructions?.trim() || '',
      })),
      advice: advice.trim() || undefined,
    });
    resetForm();
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="bg-white rounded-lg shadow-md p-6 no-print">

      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200">
            <Pill size={16} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Prescriptions & Medication</h2>
          {prescriptions.length > 0 && (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {prescriptions.length}
            </span>
          )}
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors"
          >
            <PlusCircle size={15} />
            New Prescription
          </button>
        )}
      </div>

      {/* â”€â”€ Add Prescription Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isAdding && (
        <div className="border border-emerald-200 rounded-xl bg-emerald-50/30 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">New Prescription</h3>
            <button
              onClick={resetForm}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Medication rows */}
          <div className="space-y-3 mb-4">
            {medications.map((med, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Medication {i + 1}
                  </span>
                  {medications.length > 1 && (
                    <button
                      onClick={() => removeMedRow(i)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Remove medication"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Medicine Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={e => updateMed(i, 'name', e.target.value)}
                      placeholder="e.g. Amoxicillin"
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        submitted && !med.name.trim()
                          ? 'border-red-400 focus:ring-red-400'
                          : 'border-gray-300 focus:ring-emerald-500'
                      }`}
                    />
                    {submitted && !med.name.trim() && (
                      <p className="text-red-500 text-xs mt-1">Required</p>
                    )}
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={e => updateMed(i, 'dosage', e.target.value)}
                      placeholder="e.g. 500mg, 10ml"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                    <select
                      value={med.frequency}
                      onChange={e => updateMed(i, 'frequency', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {FREQUENCY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={e => updateMed(i, 'duration', e.target.value)}
                      placeholder="e.g. 7 days, 2 weeks"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Special Instructions
                    </label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={e => updateMed(i, 'instructions', e.target.value)}
                      placeholder="e.g. Take with food, Avoid alcohol"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addMedRow}
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 font-medium mb-5 transition-colors"
          >
            <PlusCircle size={15} />
            Add Another Medication
          </button>

          {/* Doctor's advice */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <ClipboardList size={15} className="text-blue-500" />
              Doctor's Advice & Guidance
            </label>
            <textarea
              value={advice}
              onChange={e => setAdvice(e.target.value)}
              rows={4}
              placeholder="e.g. Take proper rest for 3 days, drink at least 2 litres of water daily, avoid spicy foods, avoid strenuous exercise..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Form actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={createPrescription.isPending}
              className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {createPrescription.isPending ? 'Saving…' : 'Save Prescription'}
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Prescription List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <Pill size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-sm">No prescriptions recorded yet</p>
          <p className="text-gray-400 text-xs mt-1">Add the first prescription using the button above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map(rx => {
            const isExpanded = expandedId === rx.id;
            return (
              <div key={rx.id} className="border border-gray-200 rounded-xl overflow-hidden">

                {/* Card header â€” always visible */}
                <div
                  className="flex items-center justify-between px-4 py-3.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rx.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 shrink-0">
                      <Pill size={15} className="text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {rx.medications.length} medication{rx.medications.length !== 1 ? 's' : ''}
                        {rx.prescribedByName && (
                          <span className="font-normal text-gray-500"> · {rx.prescribedByName}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(rx.prescribedAt).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(rx.prescribedAt).toLocaleTimeString([], {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (window.confirm('Delete this prescription?')) {
                          deletePrescription.mutate(rx.id);
                        }
                      }}
                      disabled={deletePrescription.isPending}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                      title="Delete prescription"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isExpanded
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 py-4 space-y-4">

                    {/* Medications table */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Medications
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-600 text-xs">Medicine</th>
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-600 text-xs">Dosage</th>
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-600 text-xs">Frequency</th>
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-600 text-xs">Duration</th>
                              <th className="text-left py-2.5 px-3 font-semibold text-gray-600 text-xs">Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rx.medications.map((med, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="py-2.5 px-3 font-medium text-gray-900">{med.name}</td>
                                <td className="py-2.5 px-3 text-gray-700">{med.dosage || 'â€”'}</td>
                                <td className="py-2.5 px-3 text-gray-700">{med.frequency || 'â€”'}</td>
                                <td className="py-2.5 px-3 text-gray-700">{med.duration || 'â€”'}</td>
                                <td className="py-2.5 px-3 text-gray-500 italic text-xs">
                                  {med.instructions || 'â€”'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Doctor's advice */}
                    {rx.advice && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Doctor's Advice
                        </p>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                          <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">
                            {rx.advice}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
