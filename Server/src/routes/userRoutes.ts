import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUserStats,
  sendHeartbeat,
  getOnlineStatus,
} from '../controllers/userController';
import {
  authenticate,
  isAdmin,
  isOwnerOrAdmin,
  optionalAuthenticate,
} from '../middlewares/authMiddleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validationMiddleware';
import {
  apiLimiter,
  createUserLimiter,
} from '../middlewares/rateLimitMiddleware';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  userQuerySchema,
} from '../validation';
import { paginationMiddleware } from '../middlewares/pagination.middleware';

const router = Router();

// router.use(apiLimiter);

router.post('/', validateBody(createUserSchema), createUser);
router.get('/me/stats', optionalAuthenticate, getCurrentUserStats);

// All user routes require authentication
router.use(authenticate);

// Heartbeat routes for online status
router.post('/heartbeat', sendHeartbeat);
router.get('/online-status', getOnlineStatus);

// Admin routes
router.get(
  '/',
  isAdmin,
  paginationMiddleware({ defaultLimit: 50, maxLimit: 100 }),
  validateQuery(userQuerySchema),
  getAllUsers
);

// Routes that require either admin access or ownership of the resource
router.get(
  '/:id',
  isOwnerOrAdmin,
  validateParams(userIdParamSchema),
  getUserById
);
router.put(
  '/:id',
  isOwnerOrAdmin,
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  updateUser
);
router.delete(
  '/:id',
  isOwnerOrAdmin,
  validateParams(userIdParamSchema),
  deleteUser
); // Users can delete their own accounts, admins can delete any account

export default router;
