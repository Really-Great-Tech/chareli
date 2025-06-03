import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Game, GameStatus } from '../entities/Games';
import { Analytics } from '../entities/Analytics';
import { SignupAnalytics } from '../entities/SignupAnalytics';
import { ApiError } from '../middlewares/errorHandler';
import { Between, FindOptionsWhere, In, LessThan, IsNull, Not } from 'typeorm';
import { checkInactiveUsers } from '../jobs/userInactivityCheck';
import { s3Service } from '../services/s3.service';

const userRepository = AppDataSource.getRepository(User);
const gameRepository = AppDataSource.getRepository(Game);
const analyticsRepository = AppDataSource.getRepository(Analytics);
const signupAnalyticsRepository = AppDataSource.getRepository(SignupAnalytics);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export const getDashboardAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Get users who were active yesterday (24-48 hours ago)
    const yesterdayUsersResult = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(DISTINCT analytics.userId)', 'count')
      .where('analytics.createdAt BETWEEN :start AND :end', {
        start: fortyEightHoursAgo,
        end: twentyFourHoursAgo
      })
      .getRawOne();

    // Among those users, count how many returned in the last 24 hours
    const returningUsersResult = await analyticsRepository
      .createQueryBuilder('a1')
      .select('COUNT(DISTINCT a1.userId)', 'count')
      .innerJoin('analytics', 'a2', 'a1.userId = a2.userId')
      .where('a1.createdAt > :twentyFourHoursAgo', { twentyFourHoursAgo })
      .andWhere('a2.createdAt BETWEEN :start AND :end', {
        start: fortyEightHoursAgo,
        end: twentyFourHoursAgo
      })
      .getRawOne();

    const yesterdayUsers = parseInt(yesterdayUsersResult?.count) || 0;
    const returningUsers = parseInt(returningUsersResult?.count) || 0;
    const retentionRate = yesterdayUsers > 0 
      ? Number(((returningUsers / yesterdayUsers) * 100).toFixed(2))
      : 0;

    // 1. Total Users (unique visitors by IP)
    const [currentUniqueIPsResult, previousUniqueIPsResult, actualAppUser] = await Promise.all([
      signupAnalyticsRepository
        .createQueryBuilder('analytics')
        .select('COUNT(DISTINCT analytics.ipAddress)', 'count')
        .where('analytics.ipAddress IS NOT NULL')
        .andWhere('analytics.createdAt > :twentyFourHoursAgo', { twentyFourHoursAgo })
        .getRawOne(),
      signupAnalyticsRepository
        .createQueryBuilder('analytics')
        .select('COUNT(DISTINCT analytics.ipAddress)', 'count')
        .where('analytics.ipAddress IS NOT NULL')
        .andWhere('analytics.createdAt BETWEEN :start AND :end', {
          start: fortyEightHoursAgo,
          end: twentyFourHoursAgo
        })
        .getRawOne(),
      
      signupAnalyticsRepository.count({
        where: {ipAddress: Not(IsNull())}
      })
    ]);
    
    const currentTotalUsers = currentUniqueIPsResult?.count || 0;
    const previousTotalUsers = previousUniqueIPsResult?.count || 0;
    const totalUsersPercentageChange = previousTotalUsers > 0 
      ? Math.max(Math.min(((currentTotalUsers - previousTotalUsers) / previousTotalUsers) * 100, 100), -100)
      : 0;

    // 2. Total Registered Users with active/inactive breakdown
    const [currentTotalRegisteredUsers, previousTotalRegisteredUsers, actualRegisteredUsers] = await Promise.all([
      userRepository.count({
        where: {
          createdAt: Between(twentyFourHoursAgo, now)
        }
      }),
      userRepository.count({
        where: {
          createdAt: Between(fortyEightHoursAgo, twentyFourHoursAgo)
        }
      }),
      userRepository.count()
    ]);

    const totalRegisteredUsersPercentageChange = previousTotalRegisteredUsers > 0
      ? Math.max(Math.min(((currentTotalRegisteredUsers - previousTotalRegisteredUsers) / previousTotalRegisteredUsers) * 100, 100), -100)
      : 0;

    // Count active and inactive users (no percentage change needed as requested)
    const activeUsers = await userRepository.count({
      where: { isActive: true }
    });
    
    const inactiveUsers = await userRepository.count({
      where: { isActive: false }
    });

    // 3. Total Games
    const [currentTotalGames, previousTotalGames, actualGames] = await Promise.all([
      gameRepository.count({
        where: {
          createdAt: Between(twentyFourHoursAgo, now)
        }
      }),
      gameRepository.count({
        where: {
          createdAt: Between(fortyEightHoursAgo, twentyFourHoursAgo)
        }
      }),
      gameRepository.count()
    ]);

    const totalGamesPercentageChange = previousTotalGames > 0
      ? Math.max(Math.min(((currentTotalGames - previousTotalGames) / previousTotalGames) * 100, 100), -100)
      : 0;

    // 4. Total Sessions (game-related only)
    const [currentTotalSessions, previousTotalSessions, actualSessions] = await Promise.all([
      analyticsRepository.count({
        where: {
          gameId: Not(IsNull()),
          startTime: Not(IsNull()),
          endTime: Not(IsNull()),
          createdAt: Between(twentyFourHoursAgo, now)
        }
      }),
      analyticsRepository.count({
        where: {
          gameId: Not(IsNull()),
          startTime: Not(IsNull()),
          endTime: Not(IsNull()),
          createdAt: Between(fortyEightHoursAgo, twentyFourHoursAgo)
        }
      }),
      analyticsRepository.count({
        where: {
          gameId: Not(IsNull()),
          startTime: Not(IsNull()),
          endTime: Not(IsNull())
        }
      })
    ]);

    const totalSessionsPercentageChange = previousTotalSessions > 0
      ? Math.max(Math.min(((currentTotalSessions - previousTotalSessions) / previousTotalSessions) * 100, 100), -100)
      : 0;

    // 5. Total Time Played (in minutes, game-related only)
    const [currentTotalTimePlayedResult, previousTotalTimePlayedResult, actualTimePlayed] = await Promise.all([
      analyticsRepository
        .createQueryBuilder('analytics')
        .select('SUM(analytics.duration)', 'totalPlayTime')
        .where('analytics.gameId IS NOT NULL')
        .andWhere('analytics.startTime IS NOT NULL')
        .andWhere('analytics.endTime IS NOT NULL')
        .andWhere('analytics.createdAt > :twentyFourHoursAgo', { twentyFourHoursAgo })
        .getRawOne(),

      analyticsRepository
        .createQueryBuilder('analytics')
        .select('SUM(analytics.duration)', 'totalPlayTime')
        .where('analytics.gameId IS NOT NULL')
        .andWhere('analytics.startTime IS NOT NULL')
        .andWhere('analytics.endTime IS NOT NULL')
        .andWhere('analytics.createdAt BETWEEN :start AND :end', {
          start: fortyEightHoursAgo,
          end: twentyFourHoursAgo
        })
        .getRawOne(),

      analyticsRepository
        .createQueryBuilder('analytics')
        .select('SUM(analytics.duration)', 'totalPlayTime')
        .where('analytics.gameId IS NOT NULL')
        .andWhere('analytics.startTime IS NOT NULL')
        .andWhere('analytics.endTime IS NOT NULL')
        .getRawOne()
    ]);

    const totalPlayTime = Number(actualTimePlayed?.totalPlayTime) || 0;


    const currentTotalTimePlayed = Math.round((currentTotalTimePlayedResult?.totalPlayTime || 0) / 60);
    const previousTotalTimePlayed = Math.round((previousTotalTimePlayedResult?.totalPlayTime || 0) / 60);
    const totalTimePlayedPercentageChange = previousTotalTimePlayed > 0
      ? Math.max(Math.min(((currentTotalTimePlayed - previousTotalTimePlayed) / previousTotalTimePlayed) * 100, 100), -100)
      : 0;

    // 6. Most Played Game with percentage change
    const mostPlayedGameResult = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.gameId', 'gameId')
      .addSelect('game.title', 'gameTitle')
      .addSelect('thumbnailFile.s3Key', 'thumbnailKey')
      .addSelect('COUNT(*)', 'sessionCount')
      .leftJoin('analytics.game', 'game')
      .leftJoin('game.thumbnailFile', 'thumbnailFile')
      .where('analytics.gameId IS NOT NULL')
      .andWhere('analytics.startTime IS NOT NULL')
      .andWhere('analytics.endTime IS NOT NULL')
      .groupBy('analytics.gameId')
      .addGroupBy('game.title')
      .addGroupBy('thumbnailFile.s3Key')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();

    let mostPlayedGame = null;
    if (mostPlayedGameResult) {
      // Get current period sessions for most played game
      const currentSessions = await analyticsRepository
        .createQueryBuilder('analytics')
        .select('COUNT(*)', 'count')
        .where('analytics.gameId = :gameId', { gameId: mostPlayedGameResult.gameId })
        .andWhere('analytics.startTime IS NOT NULL')
        .andWhere('analytics.endTime IS NOT NULL')
        .andWhere('analytics.createdAt > :twentyFourHoursAgo', { twentyFourHoursAgo })
        .getRawOne();

      // Get previous period sessions for most played game
      const previousSessions = await analyticsRepository
        .createQueryBuilder('analytics')
        .select('COUNT(*)', 'count')
        .where('analytics.gameId = :gameId', { gameId: mostPlayedGameResult.gameId })
        .andWhere('analytics.startTime IS NOT NULL')
        .andWhere('analytics.endTime IS NOT NULL')
        .andWhere('analytics.createdAt BETWEEN :start AND :end', {
          start: fortyEightHoursAgo,
          end: twentyFourHoursAgo
        })
        .getRawOne();

      const current = parseInt(currentSessions?.count) || 0;
      const previous = parseInt(previousSessions?.count) || 0;
      const percentageChange = previous > 0
        ? Math.max(Math.min(((current - previous) / previous) * 100, 100), -100)
        : 0;

      mostPlayedGame = {
        id: mostPlayedGameResult.gameId,
        title: mostPlayedGameResult.gameTitle,
        thumbnailUrl: mostPlayedGameResult.thumbnailKey ? `${s3Service.getBaseUrl()}/${mostPlayedGameResult.thumbnailKey}` : null,
        sessionCount: parseInt(mostPlayedGameResult.sessionCount),
        percentageChange: Number(percentageChange.toFixed(2))
      };
    }
    
    // 7. Average Session Duration (in minutes, game-related only)
    const [currentAvgDurationResult, previousAvgDurationResult] = await Promise.all([
      analyticsRepository
        .createQueryBuilder('analytics')
        .select('AVG(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.duration END)', 'avgDuration')
        .where('analytics.gameId IS NOT NULL')
        .andWhere('analytics.duration IS NOT NULL')
        .andWhere('analytics.createdAt > :twentyFourHoursAgo', { twentyFourHoursAgo })
        .getRawOne(),
      analyticsRepository
        .createQueryBuilder('analytics')
        .select('AVG(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.duration END)', 'avgDuration')
        .where('analytics.gameId IS NOT NULL')
        .andWhere('analytics.duration IS NOT NULL')
        .andWhere('analytics.createdAt BETWEEN :start AND :end', {
          start: fortyEightHoursAgo,
          end: twentyFourHoursAgo
        })
        .getRawOne()
    ]);

    // Convert to minutes before calculating percentage change
    const currentAvgSessionDuration = Math.round(currentAvgDurationResult?.avgDuration || 0);
    const previousAvgSessionDuration = Math.round(previousAvgDurationResult?.avgDuration || 0);
    const avgSessionDurationPercentageChange = previousAvgSessionDuration > 0
      ? Math.max(Math.min(((currentAvgSessionDuration - previousAvgSessionDuration) / previousAvgSessionDuration) * 100, 100), -100)
      : 0;

    const [adultsCount, minorsCount] = await Promise.all([
      userRepository.count({ where: { isAdult: true } }),
      userRepository.count({ where: { isAdult: false } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: {
          current: actualAppUser,
          percentageChange: Number(totalUsersPercentageChange.toFixed(2))
        },
        totalRegisteredUsers: {
          current: actualRegisteredUsers,
          percentageChange: Number(totalRegisteredUsersPercentageChange.toFixed(2))
        },
        activeUsers,
        inactiveUsers,
        adultsCount,
        minorsCount,
        totalGames: {
          current: actualGames,
          percentageChange: Number(totalGamesPercentageChange.toFixed(2))
        },
        totalSessions: {
          current: actualSessions,
          percentageChange: Number(totalSessionsPercentageChange.toFixed(2))
        },
        totalTimePlayed: {
          current: totalPlayTime,
          percentageChange: Number(totalTimePlayedPercentageChange.toFixed(2))
        },
        mostPlayedGame,
        avgSessionDuration: {
          current: currentAvgSessionDuration,
          percentageChange: Number(avgSessionDurationPercentageChange.toFixed(2))
        },
        retentionRate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/check-inactive-users:
 *   post:
 *     summary: Manually trigger the check for inactive users
 *     description: Checks for users who haven't logged in for 14+ days and sets them to inactive
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inactive users check completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export const runInactiveUsersCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await checkInactiveUsers();
    
    res.status(200).json({
      success: true,
      message: 'Inactive users check completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/user-activity-log:
 *   get:
 *     summary: Get user activity log
 *     description: Retrieves a log of user activities including logins, signups, and game sessions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: User activity log retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
/**
 * Get user activity log - shows one entry per user with their latest activity and last game played
 */
export const getUserActivityLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 11, userId } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    // First, get the list of users (with pagination)
    const userQueryBuilder = userRepository.createQueryBuilder('user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email', 'user.isActive']);
    
    // Apply user filter if provided
    if (userId) {
      userQueryBuilder.where('user.id = :userId', { userId });
    }
    
    // Get total count for pagination
    const total = await userQueryBuilder.getCount();
    
    // Apply pagination
    userQueryBuilder
      .skip((pageNumber - 1) * limitNumber)
      .take(limitNumber)
      .orderBy('user.createdAt', 'DESC');
    
    const users = await userQueryBuilder.getMany();
    
    // Format the data - one entry per user
    const formattedActivities = await Promise.all(users.map(async (user) => {
      // Get the user's latest activity
      const latestActivity = await analyticsRepository.findOne({
        where: { userId: user.id },
        order: { createdAt: 'DESC' }
      });
      
      // Get the user's last played game
      const lastGameActivity = await analyticsRepository.findOne({
        where: {
          userId: user.id,
          gameId: Not(IsNull())
        },
        relations: ['game'],
        order: { startTime: 'DESC' }
      });
      
      // Default values
      let activity = '';
      let gameTitle = '';
      let gameStartTime: Date | null = null;
      let gameEndTime: Date | null = null;
      
      // If we found an activity, use its data
      if (latestActivity) {
        activity = latestActivity.activityType;
      }
      
      // If we found a game activity, use its data
      if (lastGameActivity && lastGameActivity.game) {
        gameTitle = lastGameActivity.game.title;
        gameStartTime = lastGameActivity.startTime;
        gameEndTime = lastGameActivity.endTime;
      }

      console.log(activity)
      
      return {
        userId: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        userStatus: user.isActive ? 'Online' : 'Offline',
        activity: activity,
        lastGamePlayed: gameTitle,
        startTime: gameStartTime,
        endTime: gameEndTime
      };
    }));
    
    res.status(200).json({
      success: true,
      count: formattedActivities.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: formattedActivities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/games-analytics:
 *   get:
 *     summary: Get all games with their analytics
 *     tags: [Admin]
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
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, disabled]
 *         description: Filter by game status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for game title or description
 *     responses:
 *       200:
 *         description: Games with analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export const getGamesWithAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoryId, 
      status, 
      search
    } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    // Build query for games
    const queryBuilder = gameRepository.createQueryBuilder('game')
      .leftJoinAndSelect('game.category', 'category')
      .leftJoinAndSelect('game.thumbnailFile', 'thumbnailFile')
      .leftJoinAndSelect('game.createdBy', 'createdBy');
    
    // Apply category filter if provided
    if (categoryId) {
      queryBuilder.andWhere('game.categoryId = :categoryId', { categoryId });
    }
    
    // Apply status filter if provided
    if (status) {
      queryBuilder.andWhere('game.status = :status', { status });
    }
    
    // Apply search filter if provided
    if (search) {
      queryBuilder.andWhere(
        '(game.title ILIKE :search OR game.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // Get total count for pagination
    const total = await queryBuilder.getCount();
    
    // Apply pagination
    queryBuilder
      .skip((pageNumber - 1) * limitNumber)
      .take(limitNumber)
      .orderBy('game.createdAt', 'DESC');
    
    const games = await queryBuilder.getMany();
    
    // Get game IDs for analytics query
    const gameIds = games.map(game => game.id);
    
    // Get analytics data for these games
    let gamesAnalytics = [];

    if (gameIds.length > 0) {
      gamesAnalytics = await analyticsRepository
        .createQueryBuilder('analytics')
        .select('analytics.gameId', 'gameId')
        .addSelect('COUNT(*)', 'uniquePlayers')
        .addSelect('COUNT(*)', 'totalSessions')
        .addSelect('SUM(analytics.duration)', 'totalPlayTime')
        .where('analytics.gameId IN (:...gameIds)', { gameIds })
        .andWhere('analytics.startTime IS NOT NULL')
        .andWhere('analytics.endTime IS NOT NULL')
        .groupBy('analytics.gameId')
        .getRawMany();
    }

    
    // Create a map of game IDs to their analytics data
    const analyticsMap = new Map();
    
    gamesAnalytics.forEach(item => {
      analyticsMap.set(item.gameId, {
        uniquePlayers: parseInt(item.uniquePlayers) || 0,
        totalSessions: parseInt(item.totalSessions) || 0,
        totalPlayTime: item.totalPlayTime || 0
      });
    });
    
    // Combine game data with analytics data and transform URLs
    const gamesWithAnalytics = games.map(game => {
      const analytics = analyticsMap.get(game.id) || {
        uniquePlayers: 0,
        totalSessions: 0,
        totalPlayTime: 0
      };
      
      // Transform game data to include CloudFront URLs
      const transformedGame = {
        ...game,
        thumbnailFile: game.thumbnailFile ? {
          ...game.thumbnailFile,
          url: game.thumbnailFile.s3Key ? `${s3Service.getBaseUrl()}/${game.thumbnailFile.s3Key}` : null
        } : null,
        analytics
      };
      
      return transformedGame;
    });
    
    res.status(200).json({
      success: true,
      count: games.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: gamesWithAnalytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/games/{id}/analytics:
 *   get:
 *     summary: Get analytics for a specific game
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Game ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Game analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export const getGameAnalyticsById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check if game exists
    const game = await gameRepository.findOne({
      where: { id },
      relations: ['category', 'thumbnailFile', 'createdBy', 'gameFile']
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${id} not found`));
    }
    
    // Build where conditions for analytics queries
    const whereConditions: FindOptionsWhere<Analytics> = {
      gameId: id
    };
    
    // Add date range if provided
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
    
    // Get game's analytics summary
    const analyticsSummary = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(*)', 'uniquePlayers')
      .addSelect('COUNT(*)', 'totalSessions')
      .addSelect('SUM(analytics.duration)', 'totalPlayTime')
      .addSelect('AVG(analytics.duration)', 'avgSessionDuration')
      .where(whereConditions)
      .andWhere('analytics.startTime IS NOT NULL')
      .andWhere('analytics.endTime IS NOT NULL')
      .getRawOne();
    
    // Get top players for this game
    const topPlayers = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.userId', 'userId')
      .addSelect('user.email', 'userEmail')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('COUNT(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.id END)', 'sessionCount')
      .addSelect('SUM(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.duration ELSE 0 END)', 'totalPlayTime')
      .leftJoin('analytics.user', 'user')
      .where(whereConditions)
      .groupBy('analytics.userId')
      .addGroupBy('user.email')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .orderBy('SUM(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.duration ELSE 0 END)', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Format the top players data
    const formattedTopPlayers = topPlayers.map(player => ({
      userId: player.userId,
      email: player.userEmail,
      name: `${player.firstName} ${player.lastName}`,
      sessionCount: parseInt(player.sessionCount) || 0,
      totalPlayTime: Math.round((player.totalPlayTime || 0) / 60) // Convert to minutes
    }));
    
    // Get daily play time for trend analysis
    const dailyPlayTime = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('DATE(analytics.startTime)', 'date')
      .addSelect('COUNT(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.id END)', 'sessions')
      .addSelect('COUNT(DISTINCT CASE WHEN analytics.gameId IS NOT NULL THEN analytics.userId END)', 'players')
      .addSelect('SUM(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.duration ELSE 0 END)', 'totalPlayTime')
      .where(whereConditions)
      .groupBy('DATE(analytics.startTime)')
      .orderBy('date', 'ASC')
      .getRawMany();
    
    // Format the daily play time data
    const formattedDailyPlayTime = dailyPlayTime.map(day => ({
      date: day.date,
      sessions: parseInt(day.sessions) || 0,
      players: parseInt(day.players) || 0,
      playTime: parseInt((day.totalPlayTime || 0))
    }));
    
    const transformedGame = {
      ...game,
      thumbnailFile: game.thumbnailFile ? {
        ...game.thumbnailFile,
        url: game.thumbnailFile.s3Key ? `${s3Service.getBaseUrl()}/${game.thumbnailFile.s3Key}` : null
      } : null,
      gameFile: game.gameFile ? {
        ...game.gameFile,
        url: game.gameFile.s3Key ? `${s3Service.getBaseUrl()}/${game.gameFile.s3Key}` : null
      } : null
    };

    // Prepare the response
    const gameAnalytics = {
      game: transformedGame,
      analytics: {
        uniquePlayers: parseInt(analyticsSummary?.uniquePlayers) || 0,
        totalSessions: parseInt(analyticsSummary?.totalSessions) || 0,
        totalPlayTime: parseInt((analyticsSummary?.totalPlayTime || 0)),
        avgSessionDuration: Math.round((analyticsSummary?.avgSessionDuration || 0) / 60), // Convert to minutes
        topPlayers: formattedTopPlayers,
        dailyPlayTime: formattedDailyPlayTime
      }
    };
    
    res.status(200).json({
      success: true,
      data: gameAnalytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/users/{id}/analytics:
 *   get:
 *     summary: Get analytics for a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const getUserAnalyticsById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await userRepository.findOne({
      where: { id },
      relations: ['role'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        isVerified: true,
        lastLoggedIn: true,
        createdAt: true,
        updatedAt: true,
        role: {
          id: true,
          name: true,
          description: true
        }
      }
    });

    if (!user) {
      return next(ApiError.notFound(`User with id ${id} not found`));
    }

    // Get user's analytics summary
    const analyticsSummary = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(DISTINCT analytics.gameId)', 'totalGamesPlayed')
      .addSelect('COUNT(*)', 'totalSessionCount')
      .addSelect('SUM(analytics.duration)', 'totalTimePlayed')
      .where('analytics.userId = :userId', { userId: id })
      .andWhere('analytics.startTime IS NOT NULL')
      .andWhere('analytics.endTime IS NOT NULL')
      .getRawOne();

    // Get user's game activity details
    const gameActivity = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.gameId', 'gameId')
      .addSelect('game.title', 'gameTitle')
      .addSelect('thumbnailFile.s3Key', 'thumbnailKey')
      .addSelect('COUNT(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.id END)', 'sessionCount')
      .addSelect('SUM(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.duration ELSE 0 END)', 'totalPlayTime')
      .addSelect('MAX(analytics.startTime)', 'lastPlayed')
      .leftJoin('analytics.game', 'game')
      .leftJoin('game.thumbnailFile', 'thumbnailFile')
      .where('analytics.userId = :userId', { userId: id })
      .andWhere('analytics.gameId IS NOT NULL')
      .groupBy('analytics.gameId')
      .addGroupBy('game.title')
      .addGroupBy('thumbnailFile.s3Key')
      .orderBy('MAX(analytics.startTime)', 'DESC')
      .getRawMany();

    // Format the game activity data
    const formattedGameActivity = gameActivity.map(game => ({
      gameId: game.gameId,
      gameTitle: game.gameTitle,
      thumbnailUrl: game.thumbnailKey ? `${s3Service.getBaseUrl()}/${game.thumbnailKey}` : null,
      sessionCount: parseInt(game.sessionCount) || 0,
      totalPlayTime: parseInt((game.totalPlayTime || 0)), // Convert to minutes
      lastPlayed: game.lastPlayed
    }));

    // Prepare the response
    const userAnalytics = {
      user,
      analytics: {
        totalGamesPlayed: parseInt(analyticsSummary?.totalGamesPlayed) || 0,
        totalSessionCount: parseInt(analyticsSummary?.totalSessionCount) || 0,
        totalTimePlayed: parseInt((analyticsSummary?.totalTimePlayed || 0)), // Convert to minutes
        gameActivity: formattedGameActivity
      }
    };

    res.status(200).json({
      success: true,
      data: userAnalytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/users-analytics:
 *   get:
 *     summary: Get all users with their game analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users with analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /admin/games-popularity:
 *   get:
 *     summary: Get popularity metrics for all games
 *     description: Returns total plays, average play time, and popularity trend for each game
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Games popularity metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export const getGamesPopularityMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Get all games with basic info
    const games = await gameRepository.find({
      relations: ['thumbnailFile'],
      select: {
        id: true,
        title: true,
        status: true,
        thumbnailFile: {
          s3Key: true
        }
      }
    });

    // Get metrics for all games
    const gamesMetrics = await Promise.all(games.map(async (game) => {
      // Get total plays and average play time
      const overallMetrics = await analyticsRepository
        .createQueryBuilder('analytics')
        .select('COUNT(*)', 'totalPlays')
        .addSelect('AVG(analytics.duration)', 'averagePlayTime')
        .where('analytics.gameId = :gameId', { gameId: game.id })
        .andWhere('analytics.startTime IS NOT NULL')
        .andWhere('analytics.endTime IS NOT NULL')
        .getRawOne();

      // Get plays in last 24 hours
      const currentPeriodPlays = await analyticsRepository
        .createQueryBuilder('analytics')
        .select('COUNT(*)', 'count')
        .where('analytics.gameId = :gameId', { gameId: game.id })
        .andWhere('analytics.startTime IS NOT NULL')
        .andWhere('analytics.endTime IS NOT NULL')
        .andWhere('analytics.createdAt > :twentyFourHoursAgo', { twentyFourHoursAgo })
        .getRawOne();

      // Get plays in previous 24 hours
      const previousPeriodPlays = await analyticsRepository
        .createQueryBuilder('analytics')
        .select('COUNT(*)', 'count')
        .where('analytics.gameId = :gameId', { gameId: game.id })
        .andWhere('analytics.startTime IS NOT NULL')
        .andWhere('analytics.endTime IS NOT NULL')
        .andWhere('analytics.createdAt BETWEEN :start AND :end', {
          start: fortyEightHoursAgo,
          end: twentyFourHoursAgo
        })
        .getRawOne();

      const currentPlays = parseInt(currentPeriodPlays?.count) || 0;
      const previousPlays = parseInt(previousPeriodPlays?.count) || 0;

      // Determine popularity trend
      let popularity: 'up' | 'down' = 'down';
      if (currentPlays > previousPlays) {
        popularity = 'up';
      }

      return {
        id: game.id,
        title: game.title,
      thumbnailUrl: game.thumbnailFile?.s3Key ? `${s3Service.getBaseUrl()}/${game.thumbnailFile.s3Key}` : null,
        status: game.status,
        metrics: {
          totalPlays: parseInt(overallMetrics?.totalPlays) || 0,
          averagePlayTime: Math.round((overallMetrics?.averagePlayTime || 0) / 60), // Convert to minutes
          popularity
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: gamesMetrics
    });
  } catch (error) {
    next(error);
  }
};

export const getUsersWithAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get all users with their basic information
    const users = await userRepository.find({
      relations: ['role'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        isVerified: true,
        lastLoggedIn: true,
        createdAt: true,
        updatedAt: true,
        role: {
          id: true,
          name: true,
          description: true
        }
      }
    });

    // Get analytics data for all users
    const usersAnalytics = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.userId', 'userId')
      .addSelect('COUNT(DISTINCT analytics.gameId)', 'totalGamesPlayed')
      .addSelect('COUNT(*)', 'totalSessionCount')
      .addSelect('SUM(analytics.duration)', 'totalTimePlayed')
      .where('analytics.startTime IS NOT NULL')
      .andWhere('analytics.endTime IS NOT NULL')
      .groupBy('analytics.userId')
      .getRawMany();

    // Get most played game for each user
    const usersMostPlayedGames = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.userId', 'userId')
      .addSelect('analytics.gameId', 'gameId')
      .addSelect('game.title', 'gameTitle')
      .addSelect('thumbnailFile.s3Key', 'thumbnailKey')
      .addSelect('COUNT(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.id END)', 'sessionCount')
      .leftJoin('analytics.game', 'game')
      .leftJoin('game.thumbnailFile', 'thumbnailFile')
      .where('analytics.gameId IS NOT NULL')
      .groupBy('analytics.userId')
      .addGroupBy('analytics.gameId')
      .addGroupBy('game.title')
      .addGroupBy('thumbnailFile.s3Key')
      .orderBy('analytics.userId')
      .addOrderBy('COUNT(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.id END)', 'DESC')
      .getRawMany();

    // Create a map of user IDs to their most played game
    const mostPlayedGameMap = new Map();
    usersMostPlayedGames.forEach(item => {
      // Only add the first game for each user (the most played one)
      if (!mostPlayedGameMap.has(item.userId)) {
        mostPlayedGameMap.set(item.userId, {
          gameId: item.gameId,
          gameTitle: item.gameTitle,
          thumbnailUrl: item.thumbnailKey ? `${s3Service.getBaseUrl()}/${item.thumbnailKey}` : null,
          sessionCount: parseInt(item.sessionCount) || 0
        });
      }
    });

    // Create a map of user IDs to their analytics data
    const analyticsMap = new Map();
    usersAnalytics.forEach(item => {
      analyticsMap.set(item.userId, {
        totalGamesPlayed: parseInt(item.totalGamesPlayed) || 0,
        totalSessionCount: parseInt(item.totalSessionCount) || 0,
        totalTimePlayed: item.totalTimePlayed || 0, 
        mostPlayedGame: mostPlayedGameMap.get(item.userId) || null
      });
    });

    // Combine user data with analytics data
    const usersWithAnalytics = users.map(user => {
      const analytics = analyticsMap.get(user.id) || {
        totalGamesPlayed: 0,
        totalSessionCount: 0,
        totalTimePlayed: 0
      };

      return {
        ...user,
        analytics
      };
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: usersWithAnalytics
    });
  } catch (error) {
    next(error);
  }
};
