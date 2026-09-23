import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

// Adds req.userId so controllers know who is calling
declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export function protect(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Not authorized, token missing', 401));
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], env.jwtSecret) as { id: string };
    req.userId = decoded.id;
    next();
  } catch {
    next(new AppError('Not authorized, token invalid or expired', 401));
  }
}
