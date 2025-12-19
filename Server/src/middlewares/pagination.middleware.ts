import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include pagination
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        skip: number;
      };
    }
  }
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Middleware to enforce pagination limits and prevent unbounded queries
 * Defaults: limit=20, max=100
 */
export const paginationMiddleware = (options: PaginationOptions = {}) => {
  const defaultLimit = options.defaultLimit || 20;
  const maxLimit = options.maxLimit || 100;

  return (req: Request, res: Response, next: NextFunction) => {
    // Parse page parameter (default to 1)
    let page = parseInt(req.query.page as string, 10);
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    // Parse limit parameter (default to defaultLimit, cap at maxLimit)
    let limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : defaultLimit;

    if (isNaN(limit) || limit < 1) {
      limit = defaultLimit;
    }

    // Enforce maximum limit to prevent memory exhaustion
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    // Calculate skip for database queries
    const skip = (page - 1) * limit;

    // Attach to request object
    req.pagination = {
      page,
      limit,
      skip,
    };

    next();
  };
};
