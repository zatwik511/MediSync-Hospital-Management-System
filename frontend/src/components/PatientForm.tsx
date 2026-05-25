import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCreatePatient, usePatients } from '../hooks/usePatients';
import { LoadingSpinnerInline } from './LoadingSpinner';

interface FormErrors {
  name: string;
  address: string;
  conditions: string;
  phone: string;
  email: string;
}

function err(msg: string) {
  return <p className="text-red-500 text-xs mt-1">{msg}</p>;
}

const inputCls = (hasError: boolean) =>
  `input-field${hasError ? ' border-red-500 focus:ring-red-500' : ''}`;

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function PatientForm() {
  const [name, setName]           = useState('');
  const [address, setAddress]     = useState('');
  const [conditions, setConditions] = useState('');
  const [phone, setPhone]         = useState('');
  const [dob, setDob]             = useState('');
  const [gender, setGender]       = useState('');
  const [bloodType, setBloodType] = useState('');
  const [email, setEmail]         = useState('');
  const [errors, setErrors]       = useState<FormErrors>({ name: '', address: '', conditions: '', phone: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [apiError, setApiError]   = useState('');

  const createPatient = useCreatePatient();
  const { data: existingPatients = [] } = usePatients();

  const duplicateWarning =
    name.trim().length > 0 &&
    existingPatients.some(
      p => p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

  function validate(): FormErrors {
    const condList = conditions.split(',').map(c => c.trim()).filter(Boolean);
    const phoneVal = phone.trim();
    const emailVal = email.trim();
    return {
      name:       !name.trim()       ? 'Full name is required'                      : '',
      address:    !address.trim()    ? 'Address is required'                        : '',
      conditions: condList.length === 0 ? 'At least one medical condition is required' : '',
      phone:      phoneVal && !/^[\d\s\+\-\(\)]{7,20}$/.test(phoneVal) ? 'Enter a valid phone number' : '',
      email:      emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) ? 'Enter a valid email address' : '',
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
        phone:     phone.trim()     || undefined,
        dateOfBirth: dob            || undefined,
        gender:    gender           || undefined,
        bloodType: bloodType        || undefined,
        email:     email.trim()     || undefined,
      });

      setSuccess(true);
      setName('');
      setAddress('');
      setConditions('');
      setPhone('');
      setDob('');
      setGender('');
      setBloodType('');
      setEmail('');
      setErrors({ name: '', address: '', conditions: '', phone: '', email: '' });
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

      {/* Phone + DOB row */}
      <div className="form-group grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className={inputCls(submitted && !!errors.phone)}
            placeholder="+44 7700 000000"
          />
          {submitted && errors.phone && err(errors.phone)}
        </div>
        <div>
          <label htmlFor="dob" className="block text-sm font-medium mb-2">Date of Birth</label>
          <input
            id="dob"
            type="date"
            value={dob}
            onChange={e => setDob(e.target.value)}
            className="input-field"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Gender + Blood Type row */}
      <div className="form-group grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-2">Gender</label>
          <select
            id="gender"
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="input-field"
          >
            <option value="">Select…</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="bloodType" className="block text-sm font-medium mb-2">Blood Type</label>
          <select
            id="bloodType"
            value={bloodType}
            onChange={e => setBloodType(e.target.value)}
            className="input-field"
          >
            <option value="">Select…</option>
            {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
          </select>
        </div>
      </div>

      {/* Email */}
      <div className="form-group">
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email <span className="text-gray-400 font-normal">(for patient portal access)</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputCls(submitted && !!errors.email)}
          placeholder="patient@example.com"
          autoComplete="email"
        />
        {submitted && errors.email && err(errors.email)}
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
