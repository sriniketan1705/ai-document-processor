import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../utils/AppError';

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// Central error handler - every error in the app ends up here
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors as Record<string, { message: string }>)
      .map((e) => e.message)
      .join(', ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'Email is already registered';
  }

  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message });
}
