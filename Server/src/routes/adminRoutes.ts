import { Router } from 'express';
import { cacheService } from '../services/cache.service';
import { authenticate, isAdmin } from '../middlewares/authMiddleware';
import {
  getDashboardAnalytics,
  getGamesWithAnalytics,
  getUsersWithAnalytics,
  getGameAnalyticsById,
  getUserAnalyticsById,
  getGamesPopularityMetrics,
  runInactiveUsersCheck,
  getUserActivityLog,
} from '../controllers/adminDashboardController';

const router = Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticate, isAdmin);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 */
router.get('/dashboard', getDashboardAnalytics);

/**
 * @swagger
 * /admin/games-popularity:
 *   get:
 *     summary: Get popularity metrics for all games
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Games popularity metrics retrieved successfully
 */
router.get('/games-popularity', getGamesPopularityMetrics);

/**
 * @swagger
 * /admin/games-analytics:
 *   get:
 *     summary: Get all games with their analytics
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Games with analytics retrieved successfully
 */
router.get('/games-analytics', getGamesWithAnalytics);

/**
 * @swagger
 * /admin/users-analytics:
 *   get:
 *     summary: Get all users with their analytics
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by (e.g., createdAt, lastLoggedIn)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Users with analytics retrieved successfully
 */
router.get('/users-analytics', getUsersWithAnalytics);

/**
 * @swagger
 * /admin/games/{id}/analytics:
 *   get:
 *     summary: Get analytics for a specific game
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game analytics retrieved successfully
 */
router.get('/games/:id/analytics', getGameAnalyticsById);

/**
 * @swagger
 * /admin/users/{id}/analytics:
 *   get:
 *     summary: Get analytics for a specific user
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 */
router.get('/users/:id/analytics', getUserAnalyticsById);

/**
 * @swagger
 * /admin/user-activity-log:
 *   get:
 *     summary: Get user activity log
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User activity log retrieved successfully
 */
router.get('/user-activity-log', getUserActivityLog);

/**
 * @swagger
 * /admin/check-inactive-users:
 *   post:
 *     summary: Manually trigger the check for inactive users
 *     tags: [Admin - System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inactive users check completed successfully
 */
router.post('/check-inactive-users', runInactiveUsersCheck);

// Cache Routes
/**
 * @swagger
 * /admin/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: Retrieve Redis cache statistics including hit rate, memory usage, and key count
 *     tags: [Admin - Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     hits:
 *                       type: number
 *                     misses:
 *                       type: number
 *                     hitRate:
 *                       type: number
 *                     keys:
 *                       type: number
 *                     memoryUsed:
 *                       type: string
 *                     evictions:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/cache/stats', async (req, res, next) => {
  try {
    const stats = await cacheService.getStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin/cache/clear:
 *   post:
 *     summary: Clear all cache
 *     description: Clear all cached data from Redis. Use with caution!
 *     tags: [Admin - Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/cache/clear', async (req, res, next) => {
  try {
    await cacheService.clearAll();

    res.status(200).json({
      success: true,
      message: 'All cache cleared successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin/cache/clear/games:
 *   post:
 *     summary: Clear games cache
 *     description: Clear all game-related cached data
 *     tags: [Admin - Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Games cache cleared successfully
 */
router.post('/cache/clear/games', async (req, res, next) => {
  try {
    await cacheService.invalidateAllGames();

    res.status(200).json({
      success: true,
      message: 'Games cache cleared successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /admin/cache/clear/categories:
 *   post:
 *     summary: Clear categories cache
 *     description: Clear all category-related cached data
 *     tags: [Admin - Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories cache cleared successfully
 */
router.post('/cache/clear/categories', async (req, res, next) => {
  try {
    await cacheService.invalidateCategories();

    res.status(200).json({
      success: true,
      message: 'Categories cache cleared successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
