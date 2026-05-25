import { useState } from 'react';
import { usePatientImages, useDeleteImage, useUpdateImageNote } from '../hooks/useImages';
import type { MedicalImage } from '../types';
import { Trash2, Eye, Image as ImageIcon, Pencil, X, Check, MessageSquare } from 'lucide-react';
import { DicomViewerModal } from './DicomViewerModal';
import { ImageLightbox } from './ImageLightbox';
import { config } from '../config';

interface PatientImageViewerProps {
  patientId: string;
}

const TYPE_STYLES: Record<string, string> = {
  MRI:   'bg-blue-100 text-blue-700',
  CT:    'bg-teal-100 text-teal-700',
  Xray:  'bg-slate-100 text-slate-600',
  DICOM: 'bg-violet-100 text-violet-700',
};

const isDicomFile = (url: string) => /\.(dcm|dicom|dic)$/i.test(url);

export function PatientImageViewer({ patientId }: PatientImageViewerProps) {
  const [viewerVisible, setViewerVisible]         = useState(false);
  const [activeIndex, setActiveIndex]             = useState(0);
  const [dicomViewerOpen, setDicomViewerOpen]     = useState(false);
  const [selectedDicom, setSelectedDicom]         = useState<MedicalImage | null>(null);
  const [editingNoteId, setEditingNoteId]         = useState<string | null>(null);
  const [noteText, setNoteText]                   = useState('');

  const { data: images, isLoading, error } = usePatientImages(patientId);
  const deleteImage   = useDeleteImage();
  const updateNote    = useUpdateImageNote();

  const startEditNote = (image: MedicalImage) => {
    setEditingNoteId(image.id);
    setNoteText(image.notes ?? '');
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  const saveNote = async (imageId: string) => {
    await updateNote.mutateAsync({ imageId, note: noteText });
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleView = (index: number) => {
    const image = images?.[index];
    if (!image) return;

    if (isDicomFile(image.imageUrl || '')) {
      setSelectedDicom(image);
      setDicomViewerOpen(true);
    } else {
      const regularImages = images?.filter(img => !isDicomFile(img.imageUrl || '')) || [];
      const regularIndex  = regularImages.findIndex(img => img.id === image.id);
      setActiveIndex(regularIndex >= 0 ? regularIndex : 0);
      setViewerVisible(true);
    }
  };

  const handleDelete = async (imageId: string, label: string) => {
    if (!window.confirm(`Delete image: ${label}?`)) return;
    try {
      await deleteImage.mutateAsync(imageId);
    } catch {
      alert('Failed to delete image. Please try again.');
    }
  };

  const viewerImages = images
    ?.filter(img => !isDicomFile(img.imageUrl || ''))
    .map(img => ({
      src:         `${config.apiUrl}${img.imageUrl || ''}`,
      alt:         `${img.type} – ${img.diseaseClassification}`,
      downloadUrl: `${config.apiUrl}${img.imageUrl || ''}`,
    })) || [];

  // ── Loading skeleton ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
            <div className="h-44 bg-gray-200" />
            <div className="p-4 space-y-2.5">
              <div className="h-4 bg-gray-200 rounded-full w-16" />
              <div className="h-4 bg-gray-200 rounded-full w-3/4" />
              <div className="h-3 bg-gray-100 rounded-full w-1/2" />
              <div className="h-8 bg-gray-100 rounded-lg mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-3">
          <ImageIcon size={22} className="text-red-400" />
        </div>
        <p className="text-red-600 text-sm font-medium">Failed to load images</p>
        <p className="text-gray-400 text-xs mt-1">{error.message}</p>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-700 font-medium">No medical images yet</p>
        <p className="text-gray-400 text-sm mt-1">Upload images using the form above</p>
      </div>
    );
  }

  // ── Gallery ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Medical Images
          <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {images.length}
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image, index) => {
          const isDicom = isDicomFile(image.imageUrl || '');
          const typeStyle = TYPE_STYLES[image.type] ?? 'bg-gray-100 text-gray-600';

          return (
            <div
              key={image.id}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* ── Image / DICOM preview ── */}
              <div className="relative h-44 overflow-hidden cursor-pointer" onClick={() => handleView(index)}>

                {isDicom ? (
                  /* DICOM dark placeholder */
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-2.5">
                      <ImageIcon size={26} className="text-violet-400" />
                    </div>
                    <p className="text-[11px] font-semibold text-violet-300 tracking-widest uppercase">DICOM File</p>
                  </div>
                ) : (
                  <img
                    src={`${config.apiUrl}${image.imageUrl || ''}`}
                    alt={image.type}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.classList.add('bg-gray-100');
                    }}
                  />
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white/20 border border-white/30 text-white text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm">
                    <Eye size={14} />
                    View
                  </div>
                </div>
              </div>

              {/* ── Info ── */}
              <div className="p-3.5">

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${typeStyle}`}>
                    {image.type}
                  </span>
                  {isDicom && (
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      DICOM
                    </span>
                  )}
                </div>

                {/* Disease */}
                <p
                  className="text-sm font-medium text-gray-900 truncate mb-2"
                  title={image.diseaseClassification || undefined}
                >
                  {image.diseaseClassification || (
                    <span className="text-gray-400 font-normal italic">No classification</span>
                  )}
                </p>

                {/* Notes section */}
                <div className="mb-2">
                  {editingNoteId === image.id ? (
                    <div className="space-y-1.5">
                      <textarea
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                        rows={3}
                        maxLength={1000}
                        placeholder="Add a clinical note…"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => saveNote(image.id)}
                          disabled={updateNote.isPending}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium transition-colors"
                        >
                          <Check size={11} /> Save
                        </button>
                        <button
                          onClick={cancelEditNote}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <X size={11} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group/note flex items-start gap-1.5">
                      {image.notes ? (
                        <div className="flex-1 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 leading-relaxed">
                          {image.notes}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center gap-1 text-xs text-gray-300 italic">
                          <MessageSquare size={11} /> No note
                        </div>
                      )}
                      <button
                        onClick={() => startEditNote(image)}
                        className="shrink-0 p-1 text-gray-300 hover:text-emerald-600 transition-colors"
                        title="Edit note"
                        aria-label="Edit clinical note"
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Date / uploader */}
                <div className="space-y-0.5 mb-3">
                  <p className="text-xs text-gray-400">
                    {new Date(image.uploadedAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}{' '}
                    ·{' '}
                    {new Date(image.uploadedAt).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-gray-400 truncate" title={image.uploadedBy}>
                    By:{' '}
                    <span className="text-gray-600">{image.uploadedBy}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(index)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200 transition-colors text-xs font-semibold"
                  >
                    <Eye size={13} />
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(image.id, `${image.type} – ${image.diseaseClassification}`)}
                    disabled={deleteImage.isPending}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200 transition-colors text-xs font-semibold disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regular image lightbox */}
      {viewerVisible && (
        <ImageLightbox
          images={viewerImages}
          initialIndex={activeIndex}
          onClose={() => setViewerVisible(false)}
        />
      )}

      {/* DICOM viewer modal */}
      {selectedDicom && (
        <DicomViewerModal
          isOpen={dicomViewerOpen}
          onClose={() => { setDicomViewerOpen(false); setSelectedDicom(null); }}
          imageUrl={selectedDicom.imageUrl || ''}
          imageInfo={{
            type:    selectedDicom.type,
            disease: selectedDicom.diseaseClassification || 'Unknown',
          }}
        />
      )}
    </div>
  );
}
