import { usePatients } from '../hooks/usePatients';
import { usePatientHistory } from '../hooks/useReports';
import { useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DiagnosticReports } from '../components/DiagnosticReports';

export function Reports() {
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const { data: history, isLoading: historyLoading } = usePatientHistory(selectedPatientId);

  if (patientsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Medical Reports</h1>

        <div className="card p-6 mb-8">
          <label htmlFor="patient-select" className="block text-sm font-medium mb-2">
            Select Patient to View Reports
          </label>
          <select
            id="patient-select"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="">-- Choose a patient --</option>
            {patients?.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>

        {selectedPatientId && (
          <div className="space-y-8">
            {historyLoading ? (
              <LoadingSpinner />
            ) : history ? (
              <>
                {/* Diagnostic Report */}
                <DiagnosticReports patientId={selectedPatientId} />

                {/* Patient History */}
                <div className="card p-6">
                  <h2 className="text-2xl font-bold mb-6">Patient History</h2>

                  <section className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Medical Images</h3>
                    {history.medicalImages.length > 0 ? (
                      <div className="space-y-2">
                        {history.medicalImages.map((image) => (
                          <div
                            key={image.id}
                            className="flex justify-between py-2 border-b border-gray-100"
                          >
                            <span>{image.type}</span>
                            <span className="text-gray-600">{image.diseaseClassification}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No medical images</p>
                    )}
                  </section>

                  <section>
                    <h3 className="font-semibold text-lg mb-3">Financial Summary</h3>
                    <div className="space-y-2">
                      {history.financialHistory.length > 0 ? (
                        <>
                          {history.financialHistory.map((task) => (
                            <div
                              key={task.id}
                              className="flex justify-between py-2 border-b border-gray-100"
                            >
                              <span>{task.description}</span>
                              <span className="font-medium">
                                £{Number(task.cost).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between py-3 font-bold text-lg">
                            <span>Total Cost</span>
                            <span className="text-primary-500">
                              £{Number(history.totalCost).toFixed(2)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500">No financial records</p>
                      )}
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <div className="card p-6 text-center text-gray-500">
                No history available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}