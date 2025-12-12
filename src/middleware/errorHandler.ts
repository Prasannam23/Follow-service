import { Request, Response, NextFunction } from 'express';
import { AppError } from './../utils/errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  try {
    const serialized = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    console.error('Error (serialized):', serialized);
  } catch (e) {
    console.error('Error (toString):', String(err));
  }

  if (err instanceof Error && err.stack) {
    console.error('Stack:', err.stack);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
