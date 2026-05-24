import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) { next(err); return; }

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  const code    = (err as { code?: string }).code;

  let status = 500;
  if (code === 'CONFLICT') {
    status = 409;
  } else if (
    message.includes('already booked') ||
    message.includes('already exists') ||
    message.includes('already been taken')
  ) {
    status = 409;
  }

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
    message,
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(status).json({ success: false, error: message });
};
