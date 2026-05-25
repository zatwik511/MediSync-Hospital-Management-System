import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, ZoomIn, ZoomOut, RotateCw, Maximize2,
  ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface LightboxImage {
  src: string;
  alt: string;
  downloadUrl?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [index, setIndex]       = useState(initialIndex);
  const [zoom, setZoom]         = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan]           = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const isPanning    = useRef(false);
  const lastPos      = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef    = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  const image   = images[index];
  const canPrev = index > 0;
  const canNext = index < images.length - 1;

  const prev = useCallback(() => setIndex(i => i - 1), []);
  const next = useCallback(() => setIndex(i => i + 1), []);

  // Reset transforms whenever the displayed image changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, [index]);

  // Keyboard: Esc / ← / →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft'  && canPrev) prev();
      if (e.key === 'ArrowRight' && canNext) next();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, canPrev, canNext, prev, next]);

  // Mouse-wheel zoom — must be non-passive to call preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setZoom(z => Math.max(0.5, Math.min(8, z + delta)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleZoomIn  = () => setZoom(z => Math.min(8, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleRotate  = () => setRotation(r => (r + 90) % 360);
  const handleReset   = () => { setZoom(1); setRotation(0); setPan({ x: 0, y: 0 }); };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isPanning.current = true;
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const stopPan = useCallback(() => {
    isPanning.current = false;
    setDragging(false);
  }, []);

  const toolBtn    = 'flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-xs font-semibold';
  const separator  = 'w-px h-6 bg-gray-700 mx-1 self-end mb-1';
  const groupLabel = 'text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1 text-center';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer — ${image.alt}`}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'rgba(0,0,0,0.93)' }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900/80 border-b border-white/10 shrink-0">
        <p className="text-white text-sm font-medium truncate min-w-0 mr-4">
          {image.alt}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          {images.length > 1 && (
            <span className="text-gray-500 text-xs font-medium bg-gray-800 px-2.5 py-1 rounded-full">
              {index + 1} / {images.length}
            </span>
          )}
          {image.downloadUrl && (
            <a
              href={image.downloadUrl}
              download
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              title="Download image"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Download</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            title="Close (Esc)"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex items-end gap-0.5 px-4 py-2.5 bg-gray-800/50 border-b border-white/10 shrink-0 flex-wrap">

        <div className="flex flex-col items-center gap-0.5">
          <p className={groupLabel}>Zoom</p>
          <div className="flex gap-0.5">
            <button onClick={handleZoomIn}  className={toolBtn} title="Zoom in (scroll up)"><ZoomIn  size={14} /></button>
            <button onClick={handleZoomOut} className={toolBtn} title="Zoom out (scroll down)"><ZoomOut size={14} /></button>
          </div>
        </div>

        <div className={separator} />

        <div className="flex flex-col items-center gap-0.5">
          <p className={groupLabel}>Transform</p>
          <div className="flex gap-0.5">
            <button onClick={handleRotate} className={toolBtn} title="Rotate 90°"><RotateCw size={14} /></button>
            <button onClick={handleReset}  className={toolBtn} title="Reset view"><Maximize2 size={14} /></button>
          </div>
        </div>

        {/* Zoom level indicator */}
        <div className="flex flex-col items-center gap-0.5 ml-2">
          <p className={groupLabel}>Level</p>
          <span className="text-xs text-gray-500 font-mono w-12 text-center leading-8">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <p className="text-[11px] text-gray-700 ml-auto self-end pb-0.5 hidden lg:block select-none">
          Scroll to zoom · Drag to pan · ← → to navigate · Esc to close
        </p>
      </div>

      {/* ── Image area ────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden"
        style={{ cursor: dragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
      >
        <img
          src={image.src}
          alt={image.alt}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          }}
          draggable={false}
        />

        {/* ← Previous */}
        {canPrev && (
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 border border-white/15 text-white hover:bg-black/80 hover:border-white/30 transition-all"
            title="Previous (←)"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* → Next */}
        {canNext && (
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 border border-white/15 text-white hover:bg-black/80 hover:border-white/30 transition-all"
            title="Next (→)"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* ── Thumbnail strip (multi-image only) ────────────────── */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900/80 border-t border-white/10 overflow-x-auto shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
                i === index
                  ? 'border-blue-500 opacity-100'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
              title={img.alt}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
