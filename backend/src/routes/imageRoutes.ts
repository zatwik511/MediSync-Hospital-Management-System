import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { imageService } from '../services/ImageService';
import { requireRole } from '../middleware/authMiddleware';

const router = express.Router();

function sanitizeDiseaseType(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  if (str.length > 255) return null; // too long
  if (/[<>]/.test(str)) return null; // HTML injection characters
  return str;
}

const ALLOWED_IMAGE_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
]);

const DICOM_EXT = /\.(dcm|dicom|dic)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // DICOM: validate by extension only — MIME type is unreliable (often application/octet-stream)
    if (DICOM_EXT.test(ext)) return cb(null, true);

    // Images: require both a valid extension AND a recognised MIME type
    const validExt = /\.(jpeg|jpg|png|gif|bmp|tiff|webp)$/i.test(ext);
    const validMime = ALLOWED_IMAGE_MIMETYPES.has(file.mimetype);
    if (validExt && validMime) return cb(null, true);

    cb(new Error('Only image and DICOM files are allowed'));
  },
});

// GET /api/images/count — all roles
router.get('/count', asyncHandler(async (req, res) => {
    const count = await imageService.getTotalImageCount();
    res.json({ success: true, data: count });
}));

// POST /api/images/upload — admin, doctor, radiologist
router.post('/upload', requireRole('admin', 'doctor', 'radiologist'), upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    // Secondary MIME type check — defence in depth in case fileFilter is bypassed
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!DICOM_EXT.test(ext) && !ALLOWED_IMAGE_MIMETYPES.has(req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, error: 'Invalid file type' });
    }

    const { patientID, imageType, diseaseType: rawDiseaseType } = req.body;
    const uploadedBy = req.staffID || 'unknown';

    if (!patientID || !imageType) {
      return res.status(400).json({ success: false, error: 'patientID and imageType are required' });
    }

    const diseaseType = sanitizeDiseaseType(rawDiseaseType);
    if (rawDiseaseType && diseaseType === null) {
      fs.unlink(req.file!.path, () => {});
      return res.status(400).json({ success: false, error: 'Invalid diseaseType: must be 255 characters or fewer and contain no HTML' });
    }

    const image = await imageService.uploadImage(
      { patientID, imageType, diseaseType: diseaseType || 'unclassified', fileName: req.file!.filename },
      uploadedBy
    );
    res.status(201).json({ success: true, data: image });
}));

// GET /api/images/patient/:patientId — all roles
router.get('/patient/:patientId', asyncHandler(async (req, res) => {
    const images = await imageService.getImagesByPatient(req.params.patientId, req.staffID);
    res.json({ success: true, data: images });
}));

// PUT /api/images/:id/classify — admin, doctor, radiologist
router.put('/:id/classify', requireRole('admin', 'doctor', 'radiologist'), asyncHandler(async (req, res) => {
    const { imageType, diseaseType: rawDiseaseType } = req.body;
    const diseaseType = sanitizeDiseaseType(rawDiseaseType);
    if (rawDiseaseType && diseaseType === null) {
      return res.status(400).json({ success: false, error: 'Invalid diseaseType: must be 255 characters or fewer and contain no HTML' });
    }
    const image = await imageService.classifyImage(req.params.id, imageType, diseaseType || '', req.staffID);
    if (!image) return res.status(404).json({ success: false, error: 'Image not found' });
    res.json({ success: true, data: image });
}));

// DELETE /api/images/:id — admin, radiologist
router.delete('/:id', requireRole('admin', 'radiologist'), asyncHandler(async (req, res) => {
    await imageService.deleteImage(req.params.id, req.staffID);
    res.json({ success: true });
}));

export default router;
