import { PatientLayout } from '../../components/PatientLayout';
import { usePatientProfile, usePatientImageRecords, usePatientFinancial, useMyAppointments } from '../../hooks/usePatientPortal';
import { FileText, Image, DollarSign, Calendar } from 'lucide-react';

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-blue-600">{icon}</span>
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

export function MyRecords() {
  const { data: profile, isLoading: profileLoading } = usePatientProfile();
  const { data: images = [], isLoading: imagesLoading } = usePatientImageRecords();
  const { data: financial, isLoading: financialLoading } = usePatientFinancial();
  const { data: appointments = [], isLoading: apptLoading } = useMyAppointments();

  const anyLoading = profileLoading || imagesLoading || financialLoading || apptLoading;

  if (anyLoading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
          <SectionHeader icon={<FileText className="w-4 h-4" />} title="Personal Details" />
          {profile ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Full Name</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{profile.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{profile.address || '—'}</dd>
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
                        <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">None recorded</span>
                  )}
                </dd>
              </div>
            </dl>
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
