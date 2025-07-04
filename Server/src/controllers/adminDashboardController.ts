import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Game, GameStatus } from '../entities/Games';
import { Analytics } from '../entities/Analytics';
import { SignupAnalytics } from '../entities/SignupAnalytics';
import { GamePositionHistory } from '../entities/GamePositionHistory';
import { ApiError } from '../middlewares/errorHandler';
import { Between, FindOptionsWhere, In, LessThan, IsNull, Not } from 'typeorm';
import { checkInactiveUsers } from '../jobs/userInactivityCheck';
import { s3Service } from '../services/s3.service';

const userRepository = AppDataSource.getRepository(User);
const gameRepository = AppDataSource.getRepository(Game);
const analyticsRepository = AppDataSource.getRepository(Analytics);
const signupAnalyticsRepository = AppDataSource.getRepository(SignupAnalytics);
const gamePositionHistoryRepository = AppDataSource.getRepository(GamePositionHistory);

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
    const { period, startDate, endDate } = req.query;
    
    let now = new Date();
    let currentPeriodStart: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    // Determine time ranges based on the period parameter
    switch (period) {
      case 'last7days':
        currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
      case 'last30days':
        currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
      case 'custom':
        if (startDate && endDate) {
          currentPeriodStart = new Date(startDate as string);
          currentPeriodStart.setHours(0, 0, 0, 0); // Start of day
          
          const customEndDate = new Date(endDate as string);
          customEndDate.setHours(23, 59, 59, 999); // End of day
          
          const daysDiff = Math.ceil((customEndDate.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
          previousPeriodStart = new Date(currentPeriodStart.getTime() - daysDiff * 24 * 60 * 60 * 1000);
          previousPeriodEnd = currentPeriodStart;
          
          // For custom range, we need to use the actual end date for current period queries
          now = customEndDate;
        } else {
          // Fallback to last 24 hours if custom dates are invalid
          currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          previousPeriodStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
          previousPeriodEnd = currentPeriodStart;
        }
        break;
      default: // 'last24hours' or no period specified
        currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        previousPeriodEnd = currentPeriodStart;
        break;
    }

    // For backward compatibility, keep the original variable names
    const twentyFourHoursAgo = currentPeriodStart;
    const fortyEightHoursAgo = previousPeriodStart;

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

    // 1. Total Users (unique visitors using sessionId + IP + device hybrid approach)
    const [currentUniqueUsersResult, previousUniqueUsersResult, actualAppUser] = await Promise.all([
      signupAnalyticsRepository
        .createQueryBuilder('signup_analytics')
        .select(`
          COUNT(DISTINCT 
            CASE 
              WHEN signup_analytics."sessionId" IS NOT NULL THEN signup_analytics."sessionId"
              ELSE CONCAT(signup_analytics."ipAddress", '|', signup_analytics."deviceType")
            END
          )`, 'count')
        .where('signup_analytics."createdAt" BETWEEN :start AND :end', {
          start: twentyFourHoursAgo,
          end: now
        })
        .getRawOne(),
      signupAnalyticsRepository
        .createQueryBuilder('signup_analytics')
        .select(`
          COUNT(DISTINCT 
            CASE 
              WHEN signup_analytics."sessionId" IS NOT NULL THEN signup_analytics."sessionId"
              ELSE CONCAT(signup_analytics."ipAddress", '|', signup_analytics."deviceType")
            END
          )`, 'count')
        .where('signup_analytics."createdAt" BETWEEN :start AND :end', {
          start: fortyEightHoursAgo,
          end: twentyFourHoursAgo
        })
        .getRawOne(),
      
      signupAnalyticsRepository
        .createQueryBuilder('signup_analytics')
        .select(`
          COUNT(DISTINCT 
            CASE 
              WHEN signup_analytics."sessionId" IS NOT NULL THEN signup_analytics."sessionId"
              ELSE CONCAT(signup_analytics."ipAddress", '|', signup_analytics."deviceType")
            END
          )`, 'count')
        .getRawOne()
    ]);
    
    const currentTotalUsers = parseInt(currentUniqueUsersResult?.count) || 0;
    const previousTotalUsers = parseInt(previousUniqueUsersResult?.count) || 0;
    // Ensure minimum count is 1 since admin user always exists
    const actualAppUserCount = Math.max(parseInt(actualAppUser?.count) || 0, 1);
    const totalUsersPercentageChange = previousTotalUsers > 0 
      ? Math.max(Math.min(((currentTotalUsers - previousTotalUsers) / previousTotalUsers) * 100, 100), -100)
      : 0;

    // 2. Total Registered Users with active/inactive breakdown
    const [currentTotalRegisteredUsers, previousTotalRegisteredUsers, actualRegisteredUsers] = await Promise.all([
      userRepository.count({
        where: {
          createdAt: Between(twentyFourHoursAgo, now),
          isDeleted: false
        }
      }),
      userRepository.count({
        where: {
          createdAt: Between(fortyEightHoursAgo, twentyFourHoursAgo),
          isDeleted: false
        }
      }),
      userRepository.count({
        where: { isDeleted: false }
      })
    ]);

    const totalRegisteredUsersPercentageChange = previousTotalRegisteredUsers > 0
      ? Math.max(Math.min(((currentTotalRegisteredUsers - previousTotalRegisteredUsers) / previousTotalRegisteredUsers) * 100, 100), -100)
      : 0;

    // Count active and inactive users (no percentage change needed as requested)
    const activeUsers = await userRepository.count({
      where: { isActive: true, isDeleted: false }
    });
    
    const inactiveUsers = await userRepository.count({
      where: { isActive: false, isDeleted: false }
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
        .andWhere('analytics.createdAt BETWEEN :start AND :end', {
          start: twentyFourHoursAgo,
          end: now
        })
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

    // 6. Most Played Game with percentage change (for the current period)
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
      .andWhere('analytics.createdAt BETWEEN :start AND :end', {
        start: twentyFourHoursAgo,
        end: now
      })
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
        .andWhere('analytics.createdAt BETWEEN :start AND :end', {
          start: twentyFourHoursAgo,
          end: now
        })
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
      userRepository.count({ where: { isAdult: true, isDeleted: false } }),
      userRepository.count({ where: { isAdult: false, isDeleted: false } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: {
          current: currentTotalUsers.toString(),
          percentageChange: Number(totalUsersPercentageChange.toFixed(2))
        },
        totalRegisteredUsers: {
          current: currentTotalRegisteredUsers,
          percentageChange: Number(totalRegisteredUsersPercentageChange.toFixed(2))
        },
        activeUsers,
        inactiveUsers,
        adultsCount,
        minorsCount,
        totalGames: {
          current: currentTotalGames,
          percentageChange: Number(totalGamesPercentageChange.toFixed(2))
        },
        totalSessions: {
          current: currentTotalSessions,
          percentageChange: Number(totalSessionsPercentageChange.toFixed(2))
        },
        totalTimePlayed: {
          current: currentTotalTimePlayed,
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
    const { 
      page, 
      limit, 
      userId,
      startDate,
      endDate,
      userStatus,
      userName,
      gameTitle,
      activityType,
      sortBy,
      sortOrder
    } = req.query;
    
    // Handle multi-select parameters
    const gameTitles = Array.isArray(gameTitle) ? gameTitle as string[] : gameTitle ? [gameTitle as string] : [];
    
    // Only apply pagination if page or limit parameters are explicitly provided
    const shouldPaginate = page || limit;
    const pageNumber = shouldPaginate ? parseInt(page as string, 10) || 1 : 1;
    const limitNumber = shouldPaginate ? parseInt(limit as string, 10) || 10 : undefined;
    
    // First, get the list of users with filters
    const userQueryBuilder = userRepository.createQueryBuilder('user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email', 'user.isActive', 'user.lastSeen'])
      .where('user.isDeleted = :isDeleted', { isDeleted: false });
    
    // Apply user filter if provided
    if (userId) {
      userQueryBuilder.andWhere('user.id = :userId', { userId });
    }
    
    // Apply user name filter if provided
    if (userName) {
      userQueryBuilder.andWhere(
        '(user.firstName ILIKE :userName OR user.lastName ILIKE :userName OR CONCAT(user.firstName, \' \', user.lastName) ILIKE :userName)',
        { userName: `%${userName}%` }
      );
    }
    
    // Get total count for pagination info
    const total = await userQueryBuilder.getCount();
    
    // Apply pagination only if explicitly requested
    if (shouldPaginate && limitNumber) {
      userQueryBuilder
        .skip((pageNumber - 1) * limitNumber)
        .take(limitNumber);
    }
    
    // Apply sorting
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
    switch (sortBy) {
      case 'name':
        userQueryBuilder.orderBy('user.firstName', order).addOrderBy('user.lastName', order);
        break;
      case 'email':
        userQueryBuilder.orderBy('user.email', order);
        break;
      case 'createdAt':
        userQueryBuilder.orderBy('user.createdAt', order);
        break;
      default:
        userQueryBuilder.orderBy('user.createdAt', 'DESC');
        break;
    }
    
    const users = await userQueryBuilder.getMany();
    
    // Format the data - one entry per user
    let formattedActivities = await Promise.all(users.map(async (user) => {
      // Get the user's latest activity with date filtering if provided
      let latestActivityQuery = analyticsRepository.createQueryBuilder('analytics')
        .where('analytics.userId = :userId', { userId: user.id })
        .orderBy('analytics.createdAt', 'DESC');
      
      // Apply date range filter to activities if provided
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        latestActivityQuery = latestActivityQuery.andWhere('analytics.createdAt BETWEEN :startDate AND :endDate', {
          startDate: start,
          endDate: end
        });
      }
      
      const latestActivity = await latestActivityQuery.getOne();
      
      // Get the user's last played game with date filtering if provided
      let lastGameActivityQuery = analyticsRepository.createQueryBuilder('analytics')
        .leftJoinAndSelect('analytics.game', 'game')
        .where('analytics.userId = :userId', { userId: user.id })
        .andWhere('analytics.gameId IS NOT NULL')
        .orderBy('analytics.startTime', 'DESC');
      
      // Apply date range filter to game activities if provided
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        lastGameActivityQuery = lastGameActivityQuery.andWhere('analytics.startTime BETWEEN :startDate AND :endDate', {
          startDate: start,
          endDate: end
        });
      }
      
      const lastGameActivity = await lastGameActivityQuery.getOne();
      
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
      
      // Determine if user is online based on lastSeen timestamp and heartbeat system
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isOnline = user.lastSeen && user.lastSeen > fiveMinutesAgo && user.isActive;
      
      return {
        userId: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        userStatus: isOnline ? 'Online' : 'Offline',
        activity: activity,
        lastGamePlayed: gameTitle,
        startTime: gameStartTime,
        endTime: gameEndTime
      };
    }));
    
    // Apply additional filters to the formatted activities
    
    // Filter by user status if provided
    if (userStatus) {
      if (userStatus === 'Online') {
        formattedActivities = formattedActivities.filter(activity => activity.userStatus === 'Online');
      } else if (userStatus === 'Offline') {
        formattedActivities = formattedActivities.filter(activity => activity.userStatus === 'Offline');
      }
    }
    
    // Filter by activity type if provided
    if (activityType) {
      const activityTypeStr = Array.isArray(activityType) ? activityType[0] as string : activityType as string;
      formattedActivities = formattedActivities.filter(activity => 
        activity.activity && activity.activity.toLowerCase().includes(activityTypeStr.toLowerCase())
      );
    }
    
    // Filter by game titles if provided
    if (gameTitles.length > 0) {
      formattedActivities = formattedActivities.filter(activity => 
        activity.lastGamePlayed && gameTitles.some(title => 
          activity.lastGamePlayed.toLowerCase().includes((title as string).toLowerCase())
        )
      );
    }
    
    // Prepare response with conditional pagination info
    const response: any = {
      success: true,
      count: formattedActivities.length,
      total,
      data: formattedActivities
    };
    
    // Only include pagination info if pagination was applied
    if (shouldPaginate && limitNumber) {
      response.page = pageNumber;
      response.limit = limitNumber;
      response.totalPages = Math.ceil(total / limitNumber);
    }
    
    res.status(200).json(response);
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
      page, 
      limit, 
      categoryId, 
      status, 
      search
    } = req.query;
    
    // Only apply pagination if page or limit parameters are explicitly provided
    const shouldPaginate = page || limit;
    const pageNumber = shouldPaginate ? parseInt(page as string, 10) || 1 : 1;
    const limitNumber = shouldPaginate ? parseInt(limit as string, 10) || 10 : undefined;
    
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
    
    // Get total count for pagination info
    const total = await queryBuilder.getCount();
    
    // Apply pagination only if explicitly requested
    if (shouldPaginate && limitNumber) {
      queryBuilder
        .skip((pageNumber - 1) * limitNumber)
        .take(limitNumber);
    }
    
    queryBuilder.orderBy('game.position', 'ASC');
    queryBuilder.addOrderBy('game.createdAt', 'DESC')
    
    
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
    
    // Prepare response with conditional pagination info
    const response: any = {
      success: true,
      count: games.length,
      total,
      data: gamesWithAnalytics
    };
    
    // Only include pagination info if pagination was applied
    if (shouldPaginate && limitNumber) {
      response.page = pageNumber;
      response.limit = limitNumber;
      response.totalPages = Math.ceil(total / limitNumber);
    }
    
    res.status(200).json(response);
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
        country: true,
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

      // Get position with highest click count for this game
      const mostPlayedAtPosition = await gamePositionHistoryRepository
        .createQueryBuilder('history')
        .select('history.position', 'position')
        .addSelect('history.clickCount', 'clickCount')
        .where('history.gameId = :gameId', { gameId: game.id })
        .orderBy('history.clickCount', 'DESC')
        .addOrderBy('history.position', 'ASC') // Tie-breaker: prefer lower position number
        .limit(1)
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
          popularity,
          mostPlayedAt: mostPlayedAtPosition ? {
            position: parseInt(mostPlayedAtPosition.position),
            clickCount: parseInt(mostPlayedAtPosition.clickCount)
          } : null
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
    const { 
      startDate, 
      endDate, 
      lastLoginStartDate,
      lastLoginEndDate,
      userStatus,
      sortBy,
      sortOrder,
      sessionCount, 
      minTimePlayed, 
      maxTimePlayed, 
      gameTitle, 
      gameCategory,
      country,
      ageGroup,
      sortByMaxTimePlayed
    } = req.query;

    // Handle multi-select parameters (they come as arrays)
    const gameTitles = Array.isArray(gameTitle) ? gameTitle : gameTitle ? [gameTitle] : [];
    const gameCategories = Array.isArray(gameCategory) ? gameCategory : gameCategory ? [gameCategory] : [];
    const countries = Array.isArray(country) ? country : country ? [country] : [];

    // Build base query for users
    let userQueryBuilder = userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.isDeleted = :isDeleted', { isDeleted: false })
      .select([
        'user.id',
        'user.firstName', 
        'user.lastName',
        'user.email',
        'user.country',
        'user.phoneNumber',
        'user.isActive',
        'user.isVerified',
        'user.isAdult',
        'user.lastLoggedIn',
        'user.createdAt',
        'user.updatedAt',
        'role.id',
        'role.name',
        'role.description'
      ]);

    // Apply date range filter if provided
    if (startDate && endDate) {
      // Create date objects and set time to cover the full day
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0); // Start of day
      
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999); // End of day
      
      userQueryBuilder = userQueryBuilder.andWhere('user.createdAt >= :startDate AND user.createdAt <= :endDate', {
        startDate: start,
        endDate: end
      });
    } else if (startDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0); // Start of day
      
      userQueryBuilder = userQueryBuilder.andWhere('user.createdAt >= :startDate', {
        startDate: start
      });
    }

    // Apply last login date filter if provided
    if (lastLoginStartDate && lastLoginEndDate) {
      const start = new Date(lastLoginStartDate as string);
      start.setHours(0, 0, 0, 0); // Start of day
      
      const end = new Date(lastLoginEndDate as string);
      end.setHours(23, 59, 59, 999); // End of day
      
      userQueryBuilder = userQueryBuilder.andWhere('user.lastLoggedIn >= :lastLoginStartDate AND user.lastLoggedIn <= :lastLoginEndDate', {
        lastLoginStartDate: start,
        lastLoginEndDate: end
      });
    } else if (lastLoginStartDate) {
      const start = new Date(lastLoginStartDate as string);
      start.setHours(0, 0, 0, 0); // Start of day
      
      userQueryBuilder = userQueryBuilder.andWhere('user.lastLoggedIn >= :lastLoginStartDate', {
        lastLoginStartDate: start
      });
    } else if (lastLoginEndDate) {
      const end = new Date(lastLoginEndDate as string);
      end.setHours(23, 59, 59, 999); // End of day
      
      userQueryBuilder = userQueryBuilder.andWhere('user.lastLoggedIn <= :lastLoginEndDate', {
        lastLoginEndDate: end
      });
    }

    // Apply user status filter if provided
    if (userStatus) {
      if (userStatus === 'active') {
        userQueryBuilder = userQueryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
      } else if (userStatus === 'inactive') {
        userQueryBuilder = userQueryBuilder.andWhere('user.isActive = :isActive', { isActive: false });
      }
    }

    // Get all users first (we'll filter by analytics later)
    const users = await userQueryBuilder.getMany();

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

    // Apply additional filters based on analytics data
    let filteredUsers = users.map(user => {
      const analytics = analyticsMap.get(user.id) || {
        totalGamesPlayed: 0,
        totalSessionCount: 0,
        totalTimePlayed: 0,
        mostPlayedGame: null
      };

      return {
        ...user,
        analytics
      };
    });

    // Filter by session count
    if (sessionCount) {
      const minSessions = parseInt(sessionCount as string);
      filteredUsers = filteredUsers.filter(user => 
        user.analytics.totalSessionCount >= minSessions
      );
    }

    // Filter by time played (in seconds, converted from minutes)
    if (minTimePlayed) {
      const minSeconds = parseInt(minTimePlayed as string);
      filteredUsers = filteredUsers.filter(user => 
        user.analytics.totalTimePlayed >= minSeconds
      );
    }

    if (maxTimePlayed) {
      const maxSeconds = parseInt(maxTimePlayed as string);
      filteredUsers = filteredUsers.filter(user => 
        user.analytics.totalTimePlayed <= maxSeconds
      );
    }

    // Filter by game titles - check if user has played any of the specified games
    if (gameTitles.length > 0) {
      const usersWhoPlayedGames = await analyticsRepository
        .createQueryBuilder('analytics')
        .select('DISTINCT analytics.userId', 'userId')
        .leftJoin('analytics.game', 'game')
        .where('game.title IN (:...gameTitles)', { gameTitles })
        .andWhere('analytics.gameId IS NOT NULL')
        .getRawMany();

      const userIdsWhoPlayedGames = new Set(usersWhoPlayedGames.map(item => item.userId));
      
      filteredUsers = filteredUsers.filter(user => 
        userIdsWhoPlayedGames.has(user.id)
      );
    }

    // Filter by game categories - check if user has played games from any of the specified categories
    if (gameCategories.length > 0) {
      const usersWhoPlayedCategories = await analyticsRepository
        .createQueryBuilder('analytics')
        .select('DISTINCT analytics.userId', 'userId')
        .leftJoin('analytics.game', 'game')
        .leftJoin('game.category', 'category')
        .where('category.name IN (:...gameCategories)', { gameCategories })
        .andWhere('analytics.gameId IS NOT NULL')
        .getRawMany();

      const userIdsWhoPlayedCategories = new Set(usersWhoPlayedCategories.map(item => item.userId));
      
      filteredUsers = filteredUsers.filter(user => 
        userIdsWhoPlayedCategories.has(user.id)
      );
    }

    // Filter by countries
    if (countries.length > 0) {
      filteredUsers = filteredUsers.filter(user => 
        countries.includes(user.country)
      );
    }

    // Filter by age group
    if (ageGroup) {
      if (ageGroup === 'adults') {
        filteredUsers = filteredUsers.filter(user => user.isAdult === true);
      } else if (ageGroup === 'minors') {
        filteredUsers = filteredUsers.filter(user => user.isAdult === false);
      }
    }

    // Apply sorting based on sortBy and sortOrder parameters
    const order = sortOrder === 'asc' ? 1 : -1;
    
    if (sortBy) {
      switch (sortBy) {
        case 'firstName':
          filteredUsers = filteredUsers.sort((a, b) => 
            order * ((a.firstName || '').localeCompare(b.firstName || ''))
          );
          break;
        case 'lastName':
          filteredUsers = filteredUsers.sort((a, b) => 
            order * ((a.lastName || '').localeCompare(b.lastName || ''))
          );
          break;
        case 'email':
          filteredUsers = filteredUsers.sort((a, b) => 
            order * ((a.email || '').localeCompare(b.email || ''))
          );
          break;
        case 'createdAt':
        case 'registrationDate':
          filteredUsers = filteredUsers.sort((a, b) => 
            order * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
          break;
        case 'lastLoggedIn':
        case 'lastLogin':
          filteredUsers = filteredUsers.sort((a, b) => 
            order * (new Date(a.lastLoggedIn || 0).getTime() - new Date(b.lastLoggedIn || 0).getTime())
          );
          break;
        case 'lastSeen':
          filteredUsers = filteredUsers.sort((a, b) => 
            order * (new Date(a.lastSeen || 0).getTime() - new Date(b.lastSeen || 0).getTime())
          );
          break;
        case 'country':
          filteredUsers = filteredUsers.sort((a, b) => 
            order * ((a.country || '').localeCompare(b.country || ''))
          );
          break;
        case 'timePlayed':
          filteredUsers = filteredUsers.sort((a, b) => 
            order * ((a.analytics.totalTimePlayed || 0) - (b.analytics.totalTimePlayed || 0))
          );
          break;
        case 'sessionCount':
          filteredUsers = filteredUsers.sort((a, b) => 
            order * ((a.analytics.totalSessionCount || 0) - (b.analytics.totalSessionCount || 0))
          );
          break;
        default:
          // Default sorting by last login descending
          filteredUsers = filteredUsers.sort((a, b) => 
            new Date(b.lastLoggedIn || 0).getTime() - new Date(a.lastLoggedIn || 0).getTime()
          );
          break;
      }
    } else if (sortByMaxTimePlayed === 'true') {
      // Keep backward compatibility for the old sorting parameter
      filteredUsers = filteredUsers.sort((a, b) => 
        (b.analytics.totalTimePlayed || 0) - (a.analytics.totalTimePlayed || 0)
      );
    } else {
      // Default sorting by last login descending
      filteredUsers = filteredUsers.sort((a, b) => 
        new Date(b.lastLoggedIn || 0).getTime() - new Date(a.lastLoggedIn || 0).getTime()
      );
    }

    res.status(200).json({
      success: true,
      count: filteredUsers.length,
      data: filteredUsers
    });
  } catch (error) {
    next(error);
  }
};
