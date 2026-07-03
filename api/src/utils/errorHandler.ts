import { Request, Response, NextFunction } from 'express';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, any>;
  timestamp?: string;
  path?: string;
}

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleError = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', {
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const statusCode = err.statusCode || 500;
  const response: APIResponse = {
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
) => {
  const response: APIResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: Record<string, any>
) => {
  const response: APIResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const validateInput = <T>(schema: any, data: any): T | null => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new APIError(400, 'Validation failed', result.error.flatten().fieldErrors);
  }
  return result.data;
};
