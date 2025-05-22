import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware';
import { apiLimiter } from '../middlewares/rateLimitMiddleware';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryQuerySchema
} from '../validation';

const router = Router();
router.get('/', validateQuery(categoryQuerySchema), getAllCategories);
router.get('/:id', validateParams(categoryIdParamSchema), getCategoryById);

// All category routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// Apply API rate limiter to all category routes
router.use(apiLimiter);

// Category routes
router.post('/', validateBody(createCategorySchema), createCategory);
router.put('/:id', validateParams(categoryIdParamSchema), validateBody(updateCategorySchema), updateCategory);
router.delete('/:id', validateParams(categoryIdParamSchema), deleteCategory);

export default router;
