import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

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

  logger.error({
    method: req.method,
    url: req.originalUrl,
    status,
    err: err instanceof Error ? { message: err.message, stack: err.stack } : { message },
  }, 'Request error');

  res.status(status).json({ success: false, error: message });
};
