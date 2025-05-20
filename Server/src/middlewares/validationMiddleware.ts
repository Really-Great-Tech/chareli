import { Request, Response, NextFunction } from 'express';
import { Schema, ValidationError } from 'yup';
import { ApiError } from './errorHandler';

type ValidationErrors = Record<string, string>;

/**
 * Validate request body against schema
 * @param schema Yup schema to validate against
 */
export const validateBody = (schema: Schema) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request body against schema
    await schema.validate(req.body, { abortEarly: false });
    return next();
  } catch (error) {
    if (error instanceof ValidationError) {
      // Format validation errors
      const errors: ValidationErrors = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      
      return next(ApiError.badRequest('Validation error', errors));
    }
    return next(error);
  }
};

/**
 * Validate request params against schema
 * @param schema Yup schema to validate against
 */
export const validateParams = (schema: Schema) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request params against schema
    await schema.validate(req.params, { abortEarly: false });
    return next();
  } catch (error) {
    if (error instanceof ValidationError) {
      // Format validation errors
      const errors: ValidationErrors = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      
      return next(ApiError.badRequest('Validation error', errors));
    }
    return next(error);
  }
};

/**
 * Validate request query against schema
 * @param schema Yup schema to validate against
 */
export const validateQuery = (schema: Schema) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate request query against schema
    await schema.validate(req.query, { abortEarly: false });
    return next();
  } catch (error) {
    if (error instanceof ValidationError) {
      // Format validation errors
      const errors: ValidationErrors = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      
      return next(ApiError.badRequest('Validation error', errors));
    }
    return next(error);
  }
};
