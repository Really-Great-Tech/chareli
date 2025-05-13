import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/auth.service';
import { ApiError } from './errorHandler';
import { RoleType } from '../entities/Role';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Attach user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (roles: RoleType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role as RoleType)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }

    next();
  };
};

/**
 * Middleware to check if user is a superadmin
 */
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.user.role !== RoleType.SUPERADMIN) {
    return next(ApiError.forbidden('Superadmin access required'));
  }

  next();
};

/**
 * Middleware to check if user is an admin or superadmin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (req.user.role !== RoleType.ADMIN && req.user.role !== RoleType.SUPERADMIN) {
    return next(ApiError.forbidden('Admin access required'));
  }

  next();
};

/**
 * Middleware to check if user is an editor, admin, or superadmin
 */
export const isEditor = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (
    req.user.role !== RoleType.EDITOR && 
    req.user.role !== RoleType.ADMIN && 
    req.user.role !== RoleType.SUPERADMIN
  ) {
    return next(ApiError.forbidden('Editor access required'));
  }

  next();
};

/**
 * Middleware to check if user is accessing their own resource or has admin privileges
 */
export const isOwnerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  const resourceUserId = req.params.id;
  
  // Allow if user is accessing their own resource
  if (req.user.userId === resourceUserId) {
    return next();
  }
  
  // Allow if user is admin or superadmin
  if (req.user.role === RoleType.ADMIN || req.user.role === RoleType.SUPERADMIN) {
    return next();
  }
  
  return next(ApiError.forbidden('You do not have permission to access this resource'));
};
