import { Router } from 'express';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
import fileRoutes from './fileRoutes';
import gameRoutes from './gameRoutes';
import gamePositionHistoryRoutes from './gamePositionHistoryRoutes';
import systemConfigRoutes from './systemConfigRoutes';
import signupAnalyticsRoutes from './signupAnalyticsRoutes';
import analyticsRoutes from './analyticsRoutes';
import adminRoutes from './adminRoutes';
import envDebugRoutes from './envDebugRoutes';
import r2Test from './r2TestRoutes'
import { ApiError } from '../middlewares/errorHandler';
import redis from '../config/redisClient';
import logger from '../utils/logger';

const router = Router();

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

/**
 * @swagger
 * /health/redis:
 *   get:
 *     summary: Redis health check
 *     description: Check Redis connectivity and performance
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Redis is healthy
 *       503:
 *         description: Redis is unavailable
 */
router.get('/health/redis', async (_req, res) => {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    const pingResponse = await redis.ping();
    
    // Test set/get operations
    const testKey = `health_check_${Date.now()}`;
    const testValue = 'test_value';
    
    await redis.set(testKey, testValue, 'EX', 10); // Expire in 10 seconds
    const getValue = await redis.get(testKey);
    await redis.del(testKey); // Clean up
    
    const responseTime = Date.now() - startTime;
    
    if (pingResponse === 'PONG' && getValue === testValue) {
      res.status(200).json({
        status: 'healthy',
        message: 'Redis is working properly',
        timestamp: new Date().toISOString(),
        details: {
          ping: pingResponse,
          setGet: 'success',
          responseTime: `${responseTime}ms`,
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: process.env.REDIS_PORT || '6379'
        }
      });
    } else {
      throw new Error('Redis operations failed');
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Redis health check failed', { 
      error: (error as Error).message,
      responseTime: `${responseTime}ms`
    });
    
    res.status(503).json({
      status: 'unhealthy',
      message: 'Redis connection failed',
      timestamp: new Date().toISOString(),
      details: {
        error: (error as Error).message,
        responseTime: `${responseTime}ms`,
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || '6379'
      }
    });
  }
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/files', fileRoutes);
router.use('/games', gameRoutes);
router.use('/game-position-history', gamePositionHistoryRoutes);
router.use('/system-configs', systemConfigRoutes);
router.use('/signup-analytics', signupAnalyticsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/env-debug', envDebugRoutes);
router.use('/r2-test', r2Test)

// Handle 404 errors for routes that don't exist
router.all('/:path', (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

export default router;
