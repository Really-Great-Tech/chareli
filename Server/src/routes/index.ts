import { Router } from 'express';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import { ApiError } from '../middlewares/errorHandler';
import { apiLimiter } from '../middlewares/rateLimitMiddleware';

const router = Router();

// Apply API rate limiter to all routes
router.use(apiLimiter);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Handle 404 errors for routes that don't exist
router.all('/:path', (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

export default router;
