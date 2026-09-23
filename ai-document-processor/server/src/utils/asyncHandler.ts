import { NextFunction, Request, RequestHandler, Response } from 'express';

// Wraps async controllers so any thrown error goes to the error-handling middleware
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
