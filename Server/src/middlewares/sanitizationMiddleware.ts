import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to sanitize request body, query, and params
 * Prevents XSS attacks and other injection attacks
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  // Skip sanitization for upload endpoints to preserve file paths
  if (req.path.includes('/upload/')) {
    return next();
  }
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Sanitize string values
        req.body[key] = sanitizeString(req.body[key]);
      } else if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        // Recursively sanitize nested objects
        req.body[key] = sanitizeObject(req.body[key]);
      }
    });
  }

  // Sanitize request query
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Sanitize string values
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    });
  }

  // Sanitize request params
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        // Sanitize string values
        req.params[key] = sanitizeString(req.params[key]);
      }
    });
  }

  next();
};

/**
 * Sanitize a string value
 * @param value String to sanitize
 * @returns Sanitized string
 */
const sanitizeString = (value: string): string => {
  // Remove script tags
  value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove HTML tags
  value = value.replace(/<[^>]*>/g, '');
  
  // Replace potentially dangerous characters
  value = value.replace(/[&<>"'`=\/]/g, (match) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;',
      '=': '&#x3D;',
      '/': '&#x2F;'
    };
    return replacements[match];
  });
  
  return value;
};

/**
 * Recursively sanitize an object
 * @param obj Object to sanitize
 * @returns Sanitized object
 */
const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      // Sanitize string values
      result[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursively sanitize nested objects
      result[key] = sanitizeObject(obj[key]);
    } else {
      // Keep other types as is
      result[key] = obj[key];
    }
  });
  
  return result;
};
