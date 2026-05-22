import { useState, useRef } from 'react';
import { useUploadImage } from '../hooks/useImages';
import { LoadingSpinnerInline } from './LoadingSpinner';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  patientId: string;
}

export function ImageUploader({ patientId }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<'MRI' | 'CT' | 'Xray' | 'DICOM'>('MRI');
  const [diseaseType, setDiseaseType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadImage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type - accept standard images and DICOM files
      const isValidImage = selectedFile.type.startsWith('image/');
      const fileName = selectedFile.name.toLowerCase();
      
      const isDicom = fileName.endsWith('.dcm') ||
                     fileName.endsWith('.dicom') ||
                     fileName.endsWith('.dic') ||
                     selectedFile.type === 'application/dicom';

      if (!isValidImage && !isDicom) {
        setError('Please select a valid image file or DICOM file (.dcm, .dicom, .dic)');
        setFile(null);
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
      
      // Auto-select DICOM type if DICOM file is uploaded
      if (isDicom && !isValidImage) {
        setImageType('DICOM');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!file || !diseaseType.trim()) {
      setError('Please select a file and enter disease type');
      return;
    }

    try {
      await uploadImage.mutateAsync({
        patientID: patientId,
        imageType,
        diseaseType: diseaseType.trim(),
        file,
      });
      setSuccess(true);
      setFile(null);
      setDiseaseType('');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to upload image'
      );
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Upload Medical Image</h3>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md">
          Image uploaded successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Image Type</label>
        <select
          value={imageType}
          onChange={(e) => setImageType(e.target.value as 'MRI' | 'CT' | 'Xray' | 'DICOM')}
          className="input-field"
        >
          <option value="MRI">MRI</option>
          <option value="CT">CT Scan</option>
          <option value="Xray">X-ray</option>
          <option value="DICOM">DICOM</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Disease Type *</label>
        <input
          type="text"
          value={diseaseType}
          onChange={(e) => setDiseaseType(e.target.value)}
          className="input-field"
          placeholder="e.g., Pneumonia, Fracture"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Image File *</label>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept="image/*,.dcm,.dicom,.dic,application/dicom"
          className="hidden"
        />
        <div
          onClick={handleClickUpload}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Click to select an image or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">Supports: JPG, PNG, GIF, BMP and DICOM (.dcm, .dicom, .dic) - Max file size: 10MB</p>
            </>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={uploadImage.isPending}
        className="btn-primary w-full"
      >
        {uploadImage.isPending && <LoadingSpinnerInline />}
        {uploadImage.isPending ? 'Uploading...' : 'Upload Image'}
      </button>
    </form>
  );
}
