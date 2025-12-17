import { Router } from 'express';
import {
  createAnalytics,
  getAllAnalytics,
  getAnalyticsById,
  updateAnalytics,
  deleteAnalytics,
  updateAnalyticsEndTime,
} from '../controllers/analyticsController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validationMiddleware';
import {
  createAnalyticsSchema,
  updateAnalyticsSchema,
  analyticsQuerySchema,
  analyticsIdParamSchema,
} from '../validation/analytics.schema';
import { paginationMiddleware } from '../middlewares/pagination.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Create analytics entry - accessible by all authenticated users
router.post('/', validateBody(createAnalyticsSchema), createAnalytics);

// Get all analytics entries - admin only
router.get(
  '/',
  isAdmin,
  paginationMiddleware({ defaultLimit: 50, maxLimit: 100 }),
  validateQuery(analyticsQuerySchema),
  getAllAnalytics
);

// Get analytics entry by ID - admin only
router.get(
  '/:id',
  isAdmin,
  validateParams(analyticsIdParamSchema),
  getAnalyticsById
);

// Update analytics entry - admin only
router.put(
  '/:id',
  validateParams(analyticsIdParamSchema),
  validateBody(updateAnalyticsSchema),
  updateAnalytics
);

// Delete analytics entry - admin only
// Update analytics end time - accessible by all authenticated users
router.post(
  '/:id/end',
  validateParams(analyticsIdParamSchema),
  updateAnalyticsEndTime
);

router.delete(
  '/:id',
  isAdmin,
  validateParams(analyticsIdParamSchema),
  deleteAnalytics
);

export default router;
