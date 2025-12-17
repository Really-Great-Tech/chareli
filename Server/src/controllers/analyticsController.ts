import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Analytics } from '../entities/Analytics';
import { ApiError } from '../middlewares/errorHandler';
import { Between, FindOptionsWhere } from 'typeorm';
import { cacheService } from '../services/cache.service';
import { queueService } from '../services/queue.service';
import logger from '../utils/logger';

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
    const {
      gameId,
      activityType,
      startTime,
      endTime,
      sessionCount,
      sessionId,
    } = req.body;

    // Get user ID from authenticated user (if logged in)
    const userId = req.user?.userId || null;

    // Require either userId or sessionId
    if (!userId && !sessionId) {
      return next(
        ApiError.badRequest('Either authentication or sessionId is required')
      );
    }

    // Enqueue analytics processing job
    await queueService.addAnalyticsProcessingJob({
      userId,
      sessionId: sessionId || null,
      gameId: gameId || null,
      activityType,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      sessionCount,
    });

    // Return 202 Accepted immediately (job queued)
    res.status(202).json({
      success: true,
      message: 'Analytics event queued for processing',
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
    const {
      userId,
      gameId,
      activityType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Try cache first - create cache key from filters
    const filterParts = [
      userId ? `user:${userId}` : '',
      gameId ? `game:${gameId}` : '',
      activityType ? `type:${activityType}` : '',
      startDate ? `start:${startDate}` : '',
      endDate ? `end:${endDate}` : '',
      `page:${pageNumber}`,
      `limit:${limitNumber}`,
    ].filter(Boolean);

    const cacheKey = filterParts.join(':') || 'all';
    const cached = await cacheService.getAnalytics('list', cacheKey);

    if (cached) {
      logger.debug(`Cache hit for analytics query: ${cacheKey}`);
      res.status(200).json(cached);
      return;
    }

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
      where: whereConditions,
    });

    // Get analytics entries with pagination
    const analytics = await analyticsRepository.find({
      where: whereConditions,
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      order: {
        startTime: 'DESC',
      },
      relations: ['user', 'game'],
    });

    const responseData = {
      success: true,
      count: analytics.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: analytics,
    };

    // Cache for 1 hour (3600s) - analytics data changes infrequently
    await cacheService.setAnalytics(
      'list',
      cacheKey,
      responseData,
      undefined,
      3600
    );
    logger.debug(`Cached analytics query: ${cacheKey}`);

    res.status(200).json(responseData);
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

    const analytics = await analyticsRepository.findOne({
      where: { id },
      relations: ['user', 'game'],
    });

    if (!analytics) {
      return next(ApiError.notFound(`Analytics entry with id ${id} not found`));
    }

    res.status(200).json({
      success: true,
      data: analytics,
    });
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
      where: { id },
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
      const duration = Math.floor(
        (analytics.endTime.getTime() - analytics.startTime.getTime()) / 1000
      );

      // For game sessions, only save if duration >= 30 seconds
      if (analytics.gameId && duration < 30) {
        // Delete the analytics record if it's a game session with duration < 30 seconds
        await analyticsRepository.remove(analytics);

        res.status(200).json({
          success: true,
          message:
            'Analytics entry removed due to insufficient duration (< 30 seconds)',
          data: null,
        });
        return;
      }
    }

    await analyticsRepository.save(analytics);

    res.status(200).json({
      success: true,
      data: analytics,
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
      where: { id },
    });

    if (!analytics) {
      return next(ApiError.notFound(`Analytics entry with id ${id} not found`));
    }

    analytics.endTime = new Date(endTime);

    // Calculate duration before saving
    if (analytics.startTime && analytics.endTime) {
      const duration = Math.floor(
        (analytics.endTime.getTime() - analytics.startTime.getTime()) / 1000
      );

      // For game sessions, only save if duration >= 30 seconds
      if (analytics.gameId && duration < 30) {
        // Delete the analytics record if it's a game session with duration < 30 seconds
        await analyticsRepository.remove(analytics);

        res.status(200).json({
          success: true,
          message:
            'Analytics entry removed due to insufficient duration (< 30 seconds)',
          data: null,
        });
        return;
      }
    }

    await analyticsRepository.save(analytics);

    res.status(200).json({
      success: true,
      data: analytics,
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
      where: { id },
    });

    if (!analytics) {
      return next(ApiError.notFound(`Analytics entry with id ${id} not found`));
    }

    await analyticsRepository.remove(analytics);

    res.status(200).json({
      success: true,
      message: 'Analytics entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
