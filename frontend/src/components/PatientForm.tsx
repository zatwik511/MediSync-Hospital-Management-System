import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCreatePatient, usePatients } from '../hooks/usePatients';
import { LoadingSpinnerInline } from './LoadingSpinner';

interface FormErrors {
  name: string;
  address: string;
  conditions: string;
}

function err(msg: string) {
  return <p className="text-red-500 text-xs mt-1">{msg}</p>;
}

const inputCls = (hasError: boolean) =>
  `input-field${hasError ? ' border-red-500 focus:ring-red-500' : ''}`;

export function PatientForm() {
  const [name, setName]           = useState('');
  const [address, setAddress]     = useState('');
  const [conditions, setConditions] = useState('');
  const [errors, setErrors]       = useState<FormErrors>({ name: '', address: '', conditions: '' });
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [apiError, setApiError]   = useState('');

  const createPatient = useCreatePatient();
  const { data: existingPatients = [] } = usePatients();

  // Reactive duplicate warning — shown as the user types, not blocking
  const duplicateWarning =
    name.trim().length > 0 &&
    existingPatients.some(
      p => p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

  function validate(): FormErrors {
    const condList = conditions.split(',').map(c => c.trim()).filter(Boolean);
    return {
      name:       !name.trim()       ? 'Full name is required'                      : '',
      address:    !address.trim()    ? 'Address is required'                        : '',
      conditions: condList.length === 0 ? 'At least one medical condition is required' : '',
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setApiError('');
    setSuccess(false);

    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    try {
      await createPatient.mutateAsync({
        name: name.trim(),
        address: address.trim(),
        conditions: conditions.split(',').map(c => c.trim()).filter(Boolean),
      });

      setSuccess(true);
      setName('');
      setAddress('');
      setConditions('');
      setErrors({ name: '', address: '', conditions: '' });
      setSubmitted(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to create patient');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Add New Patient</h2>

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {apiError}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Patient created successfully!
        </div>
      )}

      {/* Name */}
      <div className="form-group">
        <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputCls(submitted && !!errors.name)}
          placeholder="e.g., John Doe"
        />
        {submitted && errors.name && err(errors.name)}
        {duplicateWarning && (
          <div className="flex items-center gap-1.5 mt-1 text-amber-600 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            A patient with this name already exists — please verify this is not a duplicate.
          </div>
        )}
      </div>

      {/* Address */}
      <div className="form-group">
        <label htmlFor="address" className="block text-sm font-medium mb-2">Address *</label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          className={inputCls(submitted && !!errors.address)}
          placeholder="e.g., 123 Main Street, London"
        />
        {submitted && errors.address && err(errors.address)}
      </div>

      {/* Conditions */}
      <div className="form-group">
        <label htmlFor="conditions" className="block text-sm font-medium mb-2">
          Medical Conditions (comma-separated) *
        </label>
        <textarea
          id="conditions"
          value={conditions}
          onChange={e => setConditions(e.target.value)}
          className={inputCls(submitted && !!errors.conditions)}
          placeholder="e.g., Diabetes, Hypertension, Asthma"
          rows={3}
        />
        {submitted && errors.conditions && err(errors.conditions)}
      </div>

      <button
        type="submit"
        disabled={createPatient.isPending}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {createPatient.isPending && <LoadingSpinnerInline />}
        {createPatient.isPending ? 'Creating...' : 'Create Patient'}
      </button>
    </form>
  );
}
