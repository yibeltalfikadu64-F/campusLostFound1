import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors || []);
  }

  // Prisma Unique Constraint Violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      return sendError(res, `A record with this ${target.join(', ')} already exists`, 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Record not found in database', 404);
    }
  }

  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    return sendError(res, `File upload error: ${err.message}`, 400);
  }

  logger.error('Unhandled Server Error:', err);

  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : (err.message || 'Internal server error');

  return sendError(res, message, 500);
}
