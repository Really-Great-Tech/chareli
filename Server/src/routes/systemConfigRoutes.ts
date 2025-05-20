import { Router } from 'express';
import {
  getAllSystemConfigs,
  getSystemConfigByKey,
  getFormattedSystemConfigs,
  createSystemConfig,
  updateSystemConfig,
  deleteSystemConfig
} from '../controllers/systemConfigController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware';
import { apiLimiter } from '../middlewares/rateLimitMiddleware';
import {
  createSystemConfigSchema,
  updateSystemConfigSchema,
  systemConfigKeyParamSchema,
  systemConfigQuerySchema
} from '../validation';

const router = Router();

// Public routes
router.get('/formatted', getFormattedSystemConfigs);
router.get('/:key', validateParams(systemConfigKeyParamSchema), getSystemConfigByKey);

// Admin-only routes
router.use(authenticate);
router.use(isAdmin);
router.use(apiLimiter);

router.get('/', validateQuery(systemConfigQuerySchema), getAllSystemConfigs);
router.post('/', validateBody(createSystemConfigSchema), createSystemConfig);
router.put('/:key', validateParams(systemConfigKeyParamSchema), validateBody(updateSystemConfigSchema), updateSystemConfig);
router.delete('/:key', validateParams(systemConfigKeyParamSchema), deleteSystemConfig);

export default router;
