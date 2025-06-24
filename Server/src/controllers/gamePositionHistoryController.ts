import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { GamePositionHistory } from '../entities/GamePositionHistory';
import { Game } from '../entities/Games';
import { ApiError } from '../middlewares/errorHandler';
import { s3Service } from '../services/s3.service';

const gamePositionHistoryRepository = AppDataSource.getRepository(GamePositionHistory);
const gameRepository = AppDataSource.getRepository(Game);

/**
 * @swagger
 * /game-position-history/{gameId}:
 *   get:
 *     summary: Get position history for a specific game
 *     description: Retrieve the complete position history for a game, including all positions it has occupied and click counts.
 *     tags: [Game Position History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game to get position history for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Position history retrieved successfully
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export const getGamePositionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gameId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    // Check if game exists
    const game = await gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      return next(ApiError.notFound(`Game with id ${gameId} not found`));
    }
    
    // Get position history with pagination
    const [history, total] = await gamePositionHistoryRepository.findAndCount({
      where: { gameId },
      order: { createdAt: 'DESC' },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      relations: ['game']
    });
    
    res.status(200).json({
      success: true,
      count: history.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /game-position-history/{gameId}/click:
 *   post:
 *     summary: Record a click event for a game
 *     description: Increment the click count for the game's current position.
 *     tags: [Game Position History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game that was clicked
 *     responses:
 *       200:
 *         description: Click recorded successfully
 *       404:
 *         description: Game not found or no active position record
 *       500:
 *         description: Internal server error
 */
export const recordGameClick = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gameId } = req.params;
    
    // Get the game's current position
    const game = await gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      return next(ApiError.notFound(`Game with id ${gameId} not found`));
    }
    
    if (!game.position) {
      return next(ApiError.badRequest(`Game ${gameId} does not have a position assigned`));
    }
    
    // Find or create position history record for current position
    let positionHistory = await gamePositionHistoryRepository.findOne({
      where: { gameId, position: game.position }
    });
    
    if (!positionHistory) {
      // Create new position history record if it doesn't exist
      positionHistory = gamePositionHistoryRepository.create({
        gameId,
        position: game.position,
        clickCount: 1
      });
    } else {
      // Increment click count
      positionHistory.clickCount += 1;
    }
    
    await gamePositionHistoryRepository.save(positionHistory);
    
    res.status(200).json({
      success: true,
      message: 'Click recorded successfully',
      data: {
        gameId,
        position: positionHistory.position,
        clickCount: positionHistory.clickCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /game-position-history/analytics:
 *   get:
 *     summary: Get click analytics and position performance
 *     description: Retrieve analytics data showing position performance across all games.
 *     tags: [Game Position History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       500:
 *         description: Internal server error
 */
export const getClickAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get position performance analytics
    const positionPerformance = await gamePositionHistoryRepository
      .createQueryBuilder('history')
      .select([
        'history.position as position',
        'COUNT(history.id) as totalRecords',
        'SUM(history.clickCount) as totalClicks',
        'AVG(history.clickCount) as avgClicksPerGame',
        'MAX(history.clickCount) as maxClicks',
        'MIN(history.clickCount) as minClicks'
      ])
      .groupBy('history.position')
      .orderBy('history.position', 'ASC')
      .getRawMany();
    
    // Get most clicked positions
    const mostClickedPositions = await gamePositionHistoryRepository
      .createQueryBuilder('history')
      .select([
        'history.position as position',
        'SUM(history.clickCount) as totalClicks'
      ])
      .groupBy('history.position')
      .orderBy('SUM(history.clickCount)', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Get recent activity
    const recentActivity = await gamePositionHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.game', 'game')
      .where('history.updatedAt >= :date', { 
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      })
      .orderBy('history.updatedAt', 'DESC')
      .limit(20)
      .getMany();
    
    res.status(200).json({
      success: true,
      data: {
        positionPerformance,
        mostClickedPositions,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /game-position-history:
 *   get:
 *     summary: Get all position history (Admin only)
 *     description: Retrieve position history for all games with filtering options.
 *     tags: [Game Position History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: position
 *         schema:
 *           type: integer
 *         description: Filter by position
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Position history retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export const getAllPositionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      position, 
      isActive 
    } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    let queryBuilder = gamePositionHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.game', 'game')
      .leftJoinAndSelect('game.thumbnailFile', 'thumbnailFile')
      .leftJoinAndSelect('game.gameFile', 'gameFile');
    
    // Apply filters
    if (position) {
      queryBuilder.andWhere('history.position = :position', { position });
    }
    
    // Get total count
    const total = await queryBuilder.getCount();
    
    // Apply pagination and ordering
    const history = await queryBuilder
      .orderBy('history.createdAt', 'DESC')
      .skip((pageNumber - 1) * limitNumber)
      .take(limitNumber)
      .getMany();

    // Transform game file and thumbnail URLs to direct S3 URLs
    history.forEach(historyItem => {
      if (historyItem.game) {
        if (historyItem.game.gameFile) {
          const s3Key = historyItem.game.gameFile.s3Key;
          const baseUrl = s3Service.getBaseUrl();
          historyItem.game.gameFile.s3Key = `${baseUrl}/${s3Key}`;
        }
        if (historyItem.game.thumbnailFile) {
          const s3Key = historyItem.game.thumbnailFile.s3Key;
          const baseUrl = s3Service.getBaseUrl();
          historyItem.game.thumbnailFile.s3Key = `${baseUrl}/${s3Key}`;
        }
      }
    });
    
    res.status(200).json({
      success: true,
      count: history.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /game-position-history/performance:
 *   get:
 *     summary: Get position performance metrics
 *     description: Get detailed performance metrics for each position.
 *     tags: [Game Position History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *       500:
 *         description: Internal server error
 */
export const getPositionPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get simplified position performance metrics
    const performance = await gamePositionHistoryRepository
      .createQueryBuilder('history')
      .select([
        'history.position as position',
        'COUNT(history.id) as gamesAtPosition',
        'SUM(history.clickCount) as totalClicks',
        'AVG(history.clickCount) as avgClicks',
        'MAX(history.clickCount) as maxClicks',
        'MIN(history.clickCount) as minClicks'
      ])
      .groupBy('history.position')
      .orderBy('history.position', 'ASC')
      .getRawMany();
    
    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
};
