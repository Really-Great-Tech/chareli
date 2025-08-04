import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Analytics } from '../entities/Analytics';
import { ApiError } from '../middlewares/errorHandler';
import { Between, FindOptionsWhere } from 'typeorm';
import redis from '../config/redisClient';

const analyticsRepository = AppDataSource.getRepository(Analytics);

/**
 * @swagger
 * /analytics:
 *   post:
 *     summary: Create a new analytics entry
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activityType
 *               - startTime
 *             properties:
 *               gameId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional for non-game activities like login/signup
 *               activityType:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               sessionCount:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *     responses:
 *       201:
 *         description: Analytics entry created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const createAnalytics = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const { gameId, activityType, startTime, endTime, sessionCount } = req.body;
    
    // Get user ID from authenticated user
    if (!req.user || !req.user.userId) {
      return next(ApiError.unauthorized('User not authenticated'));
    }
    
    const userId = req.user.userId;
    
    // Create a new analytics instance
    const analytics = new Analytics();
    analytics.userId = userId;
    
    // Only set gameId if provided (optional for login/signup activities)
    if (gameId) {
      analytics.gameId = gameId;
    }
    
    analytics.activityType = activityType;
    analytics.startTime = new Date(startTime);
    
    if (endTime) {
      analytics.endTime = new Date(endTime);
    }
    
    if (sessionCount) {
      analytics.sessionCount = sessionCount;
    }
    
    await analyticsRepository.save(analytics);
    
    // Invalidate all analytics cache (simple approach)
        // Invalidate all related cache (comprehensive cache invalidation)
        const cachePatterns = [
          'analytics:all:*',
          'admin:games-analytics:*', // Admin games show analytics data
          'admin:dashboard:*'        // Dashboard shows analytics summaries
        ];
        
        for (const pattern of cachePatterns) {
          const keys = await redis.keys(pattern);
          if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
          }
        }

    // Invalidate user stats cache for this user
    await redis.del(`users:stats:${userId}`);

    res.status(201).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /analytics:
 *   get:
 *     summary: Get all analytics entries
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: gameId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by game ID
 *       - in: query
 *         name: activityType
 *         schema:
 *           type: string
 *         description: Filter by activity type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (inclusive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of analytics entries
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getAllAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, gameId, activityType, startDate, endDate, page = 1, limit = 10 } = req.query;
    const cacheKey = `analytics:all:${JSON.stringify(req.query)}`;

    // Try to get cached data
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('[Redis] Cache HIT for getAllAnalytics:', cacheKey);
      res.status(200).json(JSON.parse(cached));
      return;
    }
    console.log('[Redis] Cache MISS for getAllAnalytics:', cacheKey);

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    // Build where conditions
    const whereConditions: FindOptionsWhere<Analytics> = {};
    
    if (userId) {
      whereConditions.userId = userId as string;
    }
    
    if (gameId) {
      whereConditions.gameId = gameId as string;
    }
    
    if (activityType) {
      whereConditions.activityType = activityType as string;
    }
    
    if (startDate && endDate) {
      whereConditions.startTime = Between(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else if (startDate) {
      whereConditions.startTime = Between(
        new Date(startDate as string),
        new Date()
      );
    }
    
    // Get total count for pagination
    const total = await analyticsRepository.count({
      where: whereConditions
    });
    
    // Get analytics entries with pagination
    const analytics = await analyticsRepository.find({
      where: whereConditions,
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      order: {
        startTime: 'DESC'
      },
      relations: ['user', 'game']
    });
    
    const response = {
      success: true,
      count: analytics.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: analytics
    };
    // Cache the result for 5 minutes
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /analytics/{id}:
 *   get:
 *     summary: Get analytics entry by ID
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Analytics entry ID
 *     responses:
 *       200:
 *         description: Analytics entry found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Analytics entry not found
 *       500:
 *         description: Internal server error
 */
export const getAnalyticsById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const cacheKey = `analytics:id:${id}`;
    // Try to get cached data
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('[Redis] Cache HIT for getAnalyticsById:', cacheKey);
      res.status(200).json(JSON.parse(cached));
      return;
    }
    console.log('[Redis] Cache MISS for getAnalyticsById:', cacheKey);
    
    const analytics = await analyticsRepository.findOne({
      where: { id },
      relations: ['user', 'game']
    });
    
    if (!analytics) {
      return next(ApiError.notFound(`Analytics entry with id ${id} not found`));
    }
    
    const response = {
      success: true,
      data: analytics
    };
    // Cache the result for 5 minutes
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /analytics/{id}:
 *   put:
 *     summary: Update analytics entry
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Analytics entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               sessionCount:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Analytics entry updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Analytics entry not found
 *       500:
 *         description: Internal server error
 */
export const updateAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { endTime, sessionCount } = req.body;
    
    const analytics = await analyticsRepository.findOne({
      where: { id }
    });
    
    if (!analytics) {
      return next(ApiError.notFound(`Analytics entry with id ${id} not found`));
    }
    
    // Update fields
    if (endTime !== undefined) {
      if (endTime) {
        analytics.endTime = new Date(endTime);
      }
    }
    
    if (sessionCount !== undefined) {
      analytics.sessionCount = sessionCount;
    }
    
    // Calculate duration before saving
    if (analytics.startTime && analytics.endTime) {
      const duration = Math.floor((analytics.endTime.getTime() - analytics.startTime.getTime()) / 1000);
      
      // For game sessions, only save if duration >= 30 seconds
      if (analytics.gameId && duration < 30) {
        // Delete the analytics record if it's a game session with duration < 30 seconds
        await analyticsRepository.remove(analytics);
        
    // Invalidate all related cache (comprehensive cache invalidation)
    const cachePatterns = [
      'analytics:all:*',
      'admin:games-analytics:*', // Admin games show analytics data
      'admin:dashboard:*'        // Dashboard shows analytics summaries
    ];
    
    for (const pattern of cachePatterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
        console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    }
    await redis.del(`analytics:id:${id}`);

        res.status(200).json({
          success: true,
          message: 'Analytics entry removed due to insufficient duration (< 30 seconds)',
          data: null
        });
        return;
      }
    }
    
    await analyticsRepository.save(analytics);
    
    // Invalidate all related cache (comprehensive cache invalidation)
    const cachePatterns = [
      'analytics:all:*',
      'admin:games-analytics:*', // Admin games show analytics data
      'admin:dashboard:*'        // Dashboard shows analytics summaries
    ];
    
    for (const pattern of cachePatterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
        console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    }
    await redis.del(`analytics:id:${id}`);
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /analytics/{id}:
 *   delete:
 *     summary: Delete analytics entry
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Analytics entry ID
 *     responses:
 *       200:
 *         description: Analytics entry deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Analytics entry not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /analytics/{id}/end:
 *   post:
 *     summary: Update analytics end time during page unload
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endTime
 *             properties:
 *               endTime:
 *                 type: string
 *                 format: date-time
 */
export const updateAnalyticsEndTime = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { endTime } = req.body;
    
    const analytics = await analyticsRepository.findOne({
      where: { id }
    });
    
    if (!analytics) {
      return next(ApiError.notFound(`Analytics entry with id ${id} not found`));
    }
    
    analytics.endTime = new Date(endTime);
    
    // Calculate duration before saving
    if (analytics.startTime && analytics.endTime) {
      const duration = Math.floor((analytics.endTime.getTime() - analytics.startTime.getTime()) / 1000);
      
      // For game sessions, only save if duration >= 30 seconds
      if (analytics.gameId && duration < 30) {
        // Delete the analytics record if it's a game session with duration < 30 seconds
        await analyticsRepository.remove(analytics);
        
        // Invalidate cache for this analytics and all lists
        await redis.del(`analytics:id:${id}`);
        const keys = await redis.keys('analytics:all:*');
        if (keys.length > 0) await redis.del(keys);

        res.status(200).json({
          success: true,
          message: 'Analytics entry removed due to insufficient duration (< 30 seconds)',
          data: null
        });
        return;
      }
    }
    
    await analyticsRepository.save(analytics);
    
    // Invalidate cache for this analytics and all lists
    await redis.del(`analytics:id:${id}`);
    const keys = await redis.keys('analytics:all:*');
    if (keys.length > 0) await redis.del(keys);
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const analytics = await analyticsRepository.findOne({
      where: { id }
    });
    
    if (!analytics) {
      return next(ApiError.notFound(`Analytics entry with id ${id} not found`));
    }
    
    await analyticsRepository.remove(analytics);
    
    // Invalidate cache for this analytics and all lists
    await redis.del(`analytics:id:${id}`);
    const keys = await redis.keys('analytics:all:*');
    if (keys.length > 0) await redis.del(keys);
    res.status(200).json({
      success: true,
      message: 'Analytics entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
