import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import * as cornerstone from 'cornerstone-core';
import { config } from '../config';
import { initCornerstone } from '../lib/cornerstone';

initCornerstone();

interface DicomViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageInfo: {
    type: string;
    disease: string;
  };
}

export function DicomViewerModal({ isOpen, onClose, imageUrl, imageInfo }: DicomViewerModalProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const modalRef  = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useFocusTrap(modalRef, isOpen);

  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const element = viewerRef.current;
    if (!element) return;

    setIsLoading(true);
    setError('');

    try {
      cornerstone.enable(element);
      const imageId = `wadouri:${config.apiUrl}${imageUrl}`;

      cornerstone.loadImage(imageId)
        .then((image) => {
          cornerstone.displayImage(element, image);
          // requestAnimationFrame ensures the flex container has a settled pixel
          // height before Cornerstone measures it for fit-to-viewport
          requestAnimationFrame(() => {
            cornerstone.resize(element, true);
            setIsLoading(false);
          });
        })
        .catch((err) => {
          console.error('Error loading DICOM:', err);
          setError('Failed to load DICOM image');
          setIsLoading(false);
        });

      return () => {
        try { cornerstone.disable(element); } catch { /* already disabled */ }
      };
    } catch (err) {
      console.error('Error initializing viewer:', err);
      setError('Failed to initialize DICOM viewer');
      setIsLoading(false);
    }
  }, [isOpen, imageUrl]);

  const getViewport = () => {
    const element = viewerRef.current;
    if (!element) return null;
    try { return cornerstone.getViewport(element); } catch { return null; }
  };

  const handleZoomIn = () => {
    const element = viewerRef.current;
    const vp = getViewport();
    if (!element || !vp) return;
    vp.scale = Math.min(vp.scale + 0.25, 8);
    cornerstone.setViewport(element, vp);
  };

  const handleZoomOut = () => {
    const element = viewerRef.current;
    const vp = getViewport();
    if (!element || !vp) return;
    vp.scale = Math.max(vp.scale - 0.25, 0.25);
    cornerstone.setViewport(element, vp);
  };

  const handleRotate = () => {
    const element = viewerRef.current;
    const vp = getViewport();
    if (!element || !vp) return;
    vp.rotation = (vp.rotation + 90) % 360;
    cornerstone.setViewport(element, vp);
  };

  const handleReset = () => {
    const element = viewerRef.current;
    if (!element) return;
    try { cornerstone.reset(element); } catch { /* not ready */ }
  };

  const handleWindowWidth = (delta: number) => {
    const element = viewerRef.current;
    const vp = getViewport();
    if (!element || !vp) return;
    vp.voi.windowWidth = Math.max(1, vp.voi.windowWidth + delta);
    cornerstone.setViewport(element, vp);
  };

  const handleWindowCenter = (delta: number) => {
    const element = viewerRef.current;
    const vp = getViewport();
    if (!element || !vp) return;
    vp.voi.windowCenter += delta;
    cornerstone.setViewport(element, vp);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const element = viewerRef.current;
    const vp = getViewport();
    if (!element || !vp) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    vp.translation.x += dx / vp.scale;
    vp.translation.y += dy / vp.scale;
    cornerstone.setViewport(element, vp);
  }, []);

  const stopPan = useCallback(() => { isPanning.current = false; }, []);

  if (!isOpen) return null;

  const toolBtn =
    'flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-xs font-semibold';
  const separator = 'w-px h-6 bg-gray-700 mx-1 self-end mb-1';
  const groupLabel =
    'text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1 text-center';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dicom-modal-title"
        className="flex flex-col w-full max-w-5xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900"
      >

        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-900 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 shrink-0">
              <ImageIcon size={17} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <p id="dicom-modal-title" className="text-sm font-semibold text-white leading-tight">DICOM Viewer</p>
              <p className="text-xs mt-0.5 truncate">
                <span className="text-blue-400 font-medium">{imageInfo.type}</span>
                {imageInfo.disease && (
                  <span className="text-gray-500"> · {imageInfo.disease}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-4"
            title="Close (Esc)"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* â”€â”€ Toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-end gap-0.5 px-4 py-2.5 bg-gray-800/70 border-b border-white/10 shrink-0 flex-wrap">

          {/* Zoom */}
          <div className="flex flex-col items-center gap-0.5">
            <p className={groupLabel}>Zoom</p>
            <div className="flex gap-0.5">
              <button onClick={handleZoomIn}  className={toolBtn} title="Zoom in"><ZoomIn  size={14} /></button>
              <button onClick={handleZoomOut} className={toolBtn} title="Zoom out"><ZoomOut size={14} /></button>
            </div>
          </div>

          <div className={separator} />

          {/* Contrast â€” Window Width */}
          <div className="flex flex-col items-center gap-0.5">
            <p className={groupLabel}>Contrast</p>
            <div className="flex gap-0.5">
              <button
                onClick={() => handleWindowWidth(-100)}
                className={`${toolBtn} text-violet-400 hover:text-violet-200 hover:bg-violet-900/40`}
                title="Narrow window (sharper contrast)"
              >
                âˆ’W
              </button>
              <button
                onClick={() => handleWindowWidth(100)}
                className={`${toolBtn} text-violet-400 hover:text-violet-200 hover:bg-violet-900/40`}
                title="Widen window (softer contrast)"
              >
                +W
              </button>
            </div>
          </div>

          <div className={separator} />

          {/* Brightness â€” Window Level */}
          <div className="flex flex-col items-center gap-0.5">
            <p className={groupLabel}>Brightness</p>
            <div className="flex gap-0.5">
              <button
                onClick={() => handleWindowCenter(-100)}
                className={`${toolBtn} text-amber-400 hover:text-amber-200 hover:bg-amber-900/30`}
                title="Lower window level (darker)"
              >
                âˆ’L
              </button>
              <button
                onClick={() => handleWindowCenter(100)}
                className={`${toolBtn} text-amber-400 hover:text-amber-200 hover:bg-amber-900/30`}
                title="Raise window level (brighter)"
              >
                +L
              </button>
            </div>
          </div>

          <div className={separator} />

          {/* Transform */}
          <div className="flex flex-col items-center gap-0.5">
            <p className={groupLabel}>Transform</p>
            <div className="flex gap-0.5">
              <button onClick={handleRotate} className={toolBtn} title="Rotate 90°"><RotateCw size={14} /></button>
              <button onClick={handleReset}  className={toolBtn} title="Reset view"><Maximize2 size={14} /></button>
            </div>
          </div>

          <p className="text-[11px] text-gray-700 ml-auto self-end pb-0.5 hidden lg:block select-none">
            Drag to pan · Esc to close
          </p>
        </div>

        {/* â”€â”€ Viewer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="relative flex-1 min-h-0 bg-black overflow-hidden">
          <div
            ref={viewerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopPan}
            onMouseLeave={stopPan}
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <div className="w-11 h-11 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
              <p className="text-gray-400 text-sm tracking-wide">Loading DICOM image…</p>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-6 text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 mb-4">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <p className="text-red-300 text-sm font-semibold">{error}</p>
              <p className="text-gray-600 text-xs mt-1.5">Ensure the file is a valid DICOM (.dcm) file</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
