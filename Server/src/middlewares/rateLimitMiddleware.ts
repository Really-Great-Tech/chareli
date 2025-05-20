import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiError } from './errorHandler';

/**
 * Rate limiter for authentication endpoints
 * Limits login, registration, and OTP verification attempts
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 5 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new ApiError(429, 'Too many authentication attempts, please try again later');
  }
});

/**
 * Rate limiter for general API endpoints
 * Prevents abuse of the API
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new ApiError(429, 'Too many requests, please try again later');
  }
});

/**
 * Rate limiter for user creation endpoints
 * Prevents mass account creation
 */
export const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, _res: Response) => {
    throw new ApiError(429, 'Too many user creation attempts, please try again later');
  }
});
