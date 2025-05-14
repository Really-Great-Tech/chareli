import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController';
import { authenticate, isAdmin, isOwnerOrAdmin } from '../middlewares/authMiddleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware';
import { apiLimiter, createUserLimiter } from '../middlewares/rateLimitMiddleware';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  userQuerySchema
} from '../validation';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Apply API rate limiter to all user routes
router.use(apiLimiter);

// Admin-only routes
router.get('/', isAdmin, validateQuery(userQuerySchema), getAllUsers);
router.post('/', isAdmin, createUserLimiter, validateBody(createUserSchema), createUser);

// Routes that require either admin access or ownership of the resource
router.get('/:id', isOwnerOrAdmin, validateParams(userIdParamSchema), getUserById);
router.put('/:id', isOwnerOrAdmin, validateParams(userIdParamSchema), validateBody(updateUserSchema), updateUser);
router.delete('/:id', isAdmin, validateParams(userIdParamSchema), deleteUser); // Only admins can delete users

export default router;
