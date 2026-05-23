import { usePatients } from '../hooks/usePatients';
import { usePatientImages } from '../hooks/useImages';
import { useState } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Trash2 } from 'lucide-react';
import { useDeleteImage } from '../hooks/useImages';

export function ImageManagement() {
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const { data: images, isLoading: imagesLoading } = usePatientImages(selectedPatientId);
  const deleteImage = useDeleteImage();

  if (patientsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Medical Images</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Uploader */}
          <div>
            <div className="card p-6 mb-6">
              <label htmlFor="patient-select" className="block text-sm font-medium mb-2">
                Select Patient
              </label>
              <select
                id="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choose a patient --</option>
                {patients?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatientId && <ImageUploader patientId={selectedPatientId} />}
          </div>

          {/* Images List */}
          <div className="lg:col-span-2">
            {!selectedPatientId ? (
              <div className="card p-6 text-center text-gray-500">
                Select a patient to view images
              </div>
            ) : imagesLoading ? (
              <LoadingSpinner />
            ) : images && images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="card p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{image.type}</h4>
                        <p className="text-sm text-gray-600">
                          {image.diseaseClassification}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteImage.mutate(image.id)}
                        disabled={deleteImage.isPending}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center text-gray-500">
                No images for this patient
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
