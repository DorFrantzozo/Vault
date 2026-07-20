import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[ERROR] ${err.name}: ${err.message}`);
  if (!isProduction && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: statusCode >= 400 && statusCode < 500 ? 'fail' : 'error',
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
