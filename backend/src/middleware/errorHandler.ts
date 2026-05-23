import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Full details logged server-side only
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
  });
};
