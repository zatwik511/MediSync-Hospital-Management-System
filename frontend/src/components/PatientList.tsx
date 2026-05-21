import { useState } from 'react';
import { usePatients, useDeletePatient } from '../hooks/usePatients';
import { LoadingSpinner } from './LoadingSpinner';
import { Trash2, Eye, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadCsv } from '../utils/exportCsv';

export function PatientList() {
  const { data: patients, isLoading, error } = usePatients();
  const deletePatient = useDeletePatient();
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Error loading patients: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const filteredPatients = patients?.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.address.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
            onClick={() =>
              downloadCsv(
                `patients-${new Date().toISOString().split('T')[0]}.csv`,
                ['Name', 'Address', 'Conditions', 'Diagnosis', 'Total Cost (£)', 'Created Date'],
                filteredPatients.map((p) => [
                  p.name,
                  p.address,
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

      {filteredPatients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No patients found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Address</th>
                <th className="text-left py-3 px-4 font-semibold">Conditions</th>
                <th className="text-right py-3 px-4 font-semibold">Total Cost</th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">{patient.name}</td>
                  <td className="py-3 px-4 text-gray-600">{patient.address}</td>
                  <td className="py-3 px-4">
                    {patient.conditions.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {patient.conditions.slice(0, 2).map((condition) => (
                          <span
                            key={condition}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {condition}
                          </span>
                        ))}
                        {patient.conditions.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{patient.conditions.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    £{Number(patient.totalCost).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="inline-block p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        title="View details"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => deletePatient.mutate(patient.id)}
                        disabled={deletePatient.isPending}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                        title="Delete patient"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}