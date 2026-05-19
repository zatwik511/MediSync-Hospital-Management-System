import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { imageService } from '../services/ImageService';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = /\.(jpeg|jpg|png|gif|bmp|tiff|webp)$/i.test(ext);
    const isDicom = /\.(dcm|dicom|dic)$/i.test(ext);
    if (isImage || isDicom) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (.jpg, .png, .gif, etc.) and DICOM files (.dcm, .dicom, .dic) are allowed!'));
    }
  }
});

// NEW: GET /api/images/count - Get total image count across all patients
router.get('/count', async (req: Request, res: Response) => {
  try {
    const count = await imageService.getTotalImageCount();
    res.json({
      success: true,
      data: count,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/images/upload - Upload image
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { patientID, imageType, diseaseType } = req.body;
    const uploadedBy = (req.headers['x-staff-id'] as string) || 'unknown';

    if (!patientID || !imageType) {
      return res.status(400).json({
        success: false,
        error: 'patientID and imageType are required',
      });
    }

    const image = await imageService.uploadImage(
      {
        patientID,
        imageType,
        diseaseType: diseaseType || 'unclassified',
        fileName: req.file.filename,
      },
      uploadedBy
    );

    res.status(201).json({
      success: true,
      data: image,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/images/patient/:patientID - Get patient's images
router.get('/patient/:patientID', async (req: Request, res: Response) => {
  try {
    const patientID = req.params.patientID as string;
    const images = await imageService.getImagesByPatient(patientID);
    res.json({
      success: true,
      data: images,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT /api/images/:id/classify - Classify image
router.put('/:id/classify', async (req: Request, res: Response) => {
  try {
    const { imageType, diseaseType } = req.body;
    const id = req.params.id as string;
    const image = await imageService.classifyImage(id, imageType, diseaseType);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    res.json({
      success: true,
      data: image,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /api/images/:id - Delete image
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await imageService.deleteImage(id);
    res.json({
      success: true,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;