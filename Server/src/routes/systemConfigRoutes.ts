import { Router } from 'express';
import {
  getAllSystemConfigs,
  getSystemConfigByKey,
  getFormattedSystemConfigs,
  createSystemConfig,
  updateSystemConfig,
  deleteSystemConfig,
  uploadTermsFile
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
router.post('/', 
  (req, res, next) => {
    // Skip validation for file uploads
    if (req.get('content-type')?.includes('multipart/form-data')) {
      return next();
    }
    return validateBody(createSystemConfigSchema)(req, res, next);
  },
  uploadTermsFile,
  createSystemConfig
);
router.put('/:key', validateParams(systemConfigKeyParamSchema), validateBody(updateSystemConfigSchema), updateSystemConfig);
router.delete('/:key', validateParams(systemConfigKeyParamSchema), deleteSystemConfig);

export default router;
