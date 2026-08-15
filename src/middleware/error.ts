import { Request, Response, NextFunction } from 'express';

/** 404 handler for unmatched routes. */
export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
};

/** Central error handler so controllers can simply `next(err)`. */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Duplicate key (e.g. email already registered).
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'Resource already exists', keyValue: err.keyValue });
  }
  // Mongoose validation errors.
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};
