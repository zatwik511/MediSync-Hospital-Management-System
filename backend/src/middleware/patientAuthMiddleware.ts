import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      patientID?: string;
    }
  }
}

export const patientAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const patientID = req.headers['x-patient-id'] as string;

  if (!patientID) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Patient ID required',
    });
  }

  req.patientID = patientID;
  next();
};
