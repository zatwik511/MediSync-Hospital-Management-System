import { useState } from 'react';
import { PatientLayout } from '../../components/PatientLayout';
import { usePatientProfile, usePatientImageRecords, usePatientFinancial, useMyAppointments, useUpdatePatientProfile } from '../../hooks/usePatientPortal';
import { FileText, Image, DollarSign, Calendar, Pencil, X, Plus, Check } from 'lucide-react';
import type { Patient } from '../../types';

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-emerald-600">{icon}</span>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    Confirmed: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    Completed: 'bg-blue-100 text-blue-700',
    Pending: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colours[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe', 'Life-threatening'] as const;
type Severity = typeof SEVERITY_OPTIONS[number];

interface AllergyEntry { substance: string; reaction: string; severity: Severity }

function ProfileEditor({ profile, onClose }: { profile: Patient; onClose: () => void }) {
  const update = useUpdatePatientProfile();

  const [form, setForm] = useState({
    address: (profile as any).address || '',
    phone: (profile as any).phone || '',
    gender: (profile as any).gender || '',
    emergencyContactName: (profile as any).emergency_contact_name || (profile as any).emergencyContactName || '',
    emergencyContactRelationship: (profile as any).emergency_contact_relationship || (profile as any).emergencyContactRelationship || '',
    emergencyContactPhone: (profile as any).emergency_contact_phone || (profile as any).emergencyContactPhone || '',
  });

  const rawAllergies: AllergyEntry[] = (() => {
    const raw = (profile as any).allergies;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
      return parsed.map((a: any) => ({
        substance: a.substance || '',
        reaction: a.reaction || '',
        severity: (SEVERITY_OPTIONS as readonly string[]).includes(a.severity) ? a.severity : 'Mild',
      }));
    } catch { return []; }
  })();

  const [allergies, setAllergies] = useState<AllergyEntry[]>(rawAllergies);
  const [newAllergy, setNewAllergy] = useState<AllergyEntry>({ substance: '', reaction: '', severity: 'Mild' });
  const [error, setError] = useState('');

  const addAllergy = () => {
    if (!newAllergy.substance.trim() || !newAllergy.reaction.trim()) return;
    setAllergies(a => [...a, { ...newAllergy }]);
    setNewAllergy({ substance: '', reaction: '', severity: 'Mild' });
  };

  const removeAllergy = (i: number) => setAllergies(a => a.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setError('');
    try {
      await update.mutateAsync({ ...form, allergies });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. 07700 900123" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
            <option value="">Prefer not to say</option>
            {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Emergency Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={form.emergencyContactName} onChange={e => setForm(f => ({ ...f, emergencyContactName: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Relationship</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={form.emergencyContactRelationship} onChange={e => setForm(f => ({ ...f, emergencyContactRelationship: e.target.value }))} placeholder="e.g. Spouse" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={form.emergencyContactPhone} onChange={e => setForm(f => ({ ...f, emergencyContactPhone: e.target.value }))} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Allergies</p>
        {allergies.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {allergies.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <span className="font-semibold text-amber-800">{a.substance}</span>
                <span className="text-amber-600">·</span>
                <span className="text-amber-700">{a.reaction}</span>
                <span className="text-amber-500 text-xs ml-auto shrink-0">{a.severity}</span>
                <button onClick={() => removeAllergy(i)} className="text-red-400 hover:text-red-600 ml-1"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <input placeholder="Substance" value={newAllergy.substance}
            onChange={e => setNewAllergy(a => ({ ...a, substance: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <input placeholder="Reaction" value={newAllergy.reaction}
            onChange={e => setNewAllergy(a => ({ ...a, reaction: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <select value={newAllergy.severity} onChange={e => setNewAllergy(a => ({ ...a, severity: e.target.value as Severity }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400">
            {SEVERITY_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={addAllergy}
            className="flex items-center gap-1 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={update.isPending}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium">
          <Check className="w-4 h-4" />
          {update.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export function MyRecords() {
  const { data: profile, isLoading: profileLoading } = usePatientProfile();
  const { data: images = [], isLoading: imagesLoading } = usePatientImageRecords();
  const { data: financial, isLoading: financialLoading } = usePatientFinancial();
  const { data: appointments = [], isLoading: apptLoading } = useMyAppointments();
  const [editingProfile, setEditingProfile] = useState(false);

  const anyLoading = profileLoading || imagesLoading || financialLoading || apptLoading;

  if (anyLoading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">My Health Records</h1>

        {/* Personal Details */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600"><FileText className="w-4 h-4" /></span>
              <h2 className="text-base font-semibold text-gray-800">Personal Details</h2>
            </div>
            {profile && !editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          {profile ? (
            editingProfile ? (
              <ProfileEditor profile={profile} onClose={() => setEditingProfile(false)} />
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Full Name</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{profile.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Address</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{(profile as any).address || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{(profile as any).phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Gender</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{(profile as any).gender || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Current Diagnosis</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{profile.diagnosis || 'None recorded'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Conditions</dt>
                  <dd className="mt-0.5">
                    {profile.conditions && profile.conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.conditions.map((c, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">None recorded</span>
                    )}
                  </dd>
                </div>
                {((profile as any).emergency_contact_name || (profile as any).emergencyContactName) && (
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">Emergency Contact</dt>
                    <dd className="font-medium text-gray-900 mt-0.5">
                      {(profile as any).emergency_contact_name || (profile as any).emergencyContactName}
                      {((profile as any).emergency_contact_relationship || (profile as any).emergencyContactRelationship) &&
                        ` · ${(profile as any).emergency_contact_relationship || (profile as any).emergencyContactRelationship}`}
                      {((profile as any).emergency_contact_phone || (profile as any).emergencyContactPhone) &&
                        ` · ${(profile as any).emergency_contact_phone || (profile as any).emergencyContactPhone}`}
                    </dd>
                  </div>
                )}
                {(() => {
                  const raw = (profile as any).allergies;
                  let allergyList: Array<{ substance: string; reaction: string; severity: string }> = [];
                  try { allergyList = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []); } catch {}
                  return allergyList.length > 0 ? (
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500 mb-1.5">Allergies</dt>
                      <dd>
                        <div className="flex flex-wrap gap-1.5">
                          {allergyList.map((a, i) => (
                            <span key={i} className="text-xs bg-amber-50 border border-amber-100 text-amber-800 px-2 py-1 rounded-lg">
                              <span className="font-semibold">{a.substance}</span>
                              {a.reaction && ` · ${a.reaction}`}
                              {a.severity && ` (${a.severity})`}
                            </span>
                          ))}
                        </div>
                      </dd>
                    </div>
                  ) : null;
                })()}
              </dl>
            )
          ) : (
            <p className="text-gray-400 text-sm">No profile data available.</p>
          )}
        </Card>

        {/* Medical Images */}
        <Card>
          <SectionHeader icon={<Image className="w-4 h-4" />} title="Medical Images" />
          {images.length === 0 ? (
            <p className="text-gray-400 text-sm">No medical images on file.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Classification</th>
                    <th className="pb-2 font-medium">Upload Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {images.map((img) => (
                    <>
                      <tr key={img.id}>
                        <td className="py-2.5 font-medium text-gray-800">{img.type}</td>
                        <td className="py-2.5 text-gray-600">
                          {img.diseaseClassification && img.diseaseClassification !== 'unclassified'
                            ? img.diseaseClassification
                            : <span className="text-gray-400">Unclassified</span>}
                        </td>
                        <td className="py-2.5 text-gray-500">
                          {new Date(img.uploadedAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                      </tr>
                      {img.notes && (
                        <tr key={`${img.id}-note`}>
                          <td colSpan={3} className="pb-2.5 pt-0">
                            <p className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
                              <span className="font-semibold text-blue-700 mr-1.5">Note:</span>
                              {img.notes}
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Financial History */}
        <Card>
          <SectionHeader icon={<DollarSign className="w-4 h-4" />} title="Financial History" />
          {!financial || financial.tasks.length === 0 ? (
            <p className="text-gray-400 text-sm">No charges recorded.</p>
          ) : (
            <>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {financial.tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="py-2.5 text-gray-700">{task.description}</td>
                        <td className="py-2.5 text-right font-medium text-gray-800">
                          £{Number(task.cost).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end border-t border-gray-200 pt-3">
                <span className="text-sm font-semibold text-gray-900">
                  Total: £{Number(financial.totalCost).toFixed(2)}
                </span>
              </div>
            </>
          )}
        </Card>

        {/* Appointment History */}
        <Card>
          <SectionHeader icon={<Calendar className="w-4 h-4" />} title="Appointment History" />
          {appointments.length === 0 ? (
            <p className="text-gray-400 text-sm">No appointments on record.</p>
          ) : (
            <div className="space-y-3">
              {[...appointments]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((appt) => (
                  <div key={appt.id} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {appt.doctorName ?? 'Doctor'}
                        {appt.doctorSpecialty && (
                          <span className="text-gray-400 font-normal"> · {appt.doctorSpecialty}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(appt.date).toLocaleDateString('en-GB', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                        })}{' '}
                        at {appt.time}
                        {appt.type && ` · ${appt.type}`}
                      </p>
                      {appt.reason && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">"{appt.reason}"</p>
                      )}
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </PatientLayout>
  );
}
