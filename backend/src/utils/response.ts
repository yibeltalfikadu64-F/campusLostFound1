import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operation completed successfully',
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {})
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors: any[] = []
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    errors
  };
  return res.status(statusCode).json(response);
}
