import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Game, GameStatus } from '../entities/Games';
import { Analytics } from '../entities/Analytics';
import { SignupAnalytics } from '../entities/SignupAnalytics';
import { ApiError } from '../middlewares/errorHandler';
import { Between, FindOptionsWhere, In, LessThan, IsNull, Not } from 'typeorm';
import { checkInactiveUsers } from '../jobs/userInactivityCheck';

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
    // 1. Total Users (unique visitors)
    const uniqueSessionsResult = await signupAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(DISTINCT analytics.sessionId)', 'count')
      .where('analytics.sessionId IS NOT NULL')
      .getRawOne();
    
    const totalUsers = uniqueSessionsResult?.count || 0;
    
    // 2. Total Registered Users with active/inactive breakdown
    const totalRegisteredUsers = await userRepository.count();
    
    // Count active and inactive users
    const activeUsers = await userRepository.count({
      where: { isActive: true }
    });
    
    const inactiveUsers = await userRepository.count({
      where: { isActive: false }
    });
    
    // 3. Total Games
    const totalGames = await gameRepository.count();
    
    // 4. Total Sessions
    const totalSessions = await analyticsRepository.count();
    
    // 5. Total Time Played (in minutes)
    const totalTimePlayedResult = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('SUM(analytics.duration)', 'totalPlayTime')
      .getRawOne();
    
    // Convert seconds to minutes and round to nearest minute
    const totalTimePlayed = Math.round((totalTimePlayedResult?.totalPlayTime || 0) / 60);
    
    // 6. Most Popular Game
    const mostPopularGameResult = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.gameId', 'gameId')
      .addSelect('game.title', 'gameTitle')
      .addSelect('thumbnailFile.s3Url', 'thumbnailUrl')
      .addSelect('COUNT(*)', 'sessionCount')
      .leftJoin('analytics.game', 'game')
      .leftJoin('game.thumbnailFile', 'thumbnailFile')
      .groupBy('analytics.gameId')
      .addGroupBy('game.title')
      .addGroupBy('thumbnailFile.s3Url')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();
    
    const mostPopularGame = mostPopularGameResult ? {
      id: mostPopularGameResult.gameId,
      title: mostPopularGameResult.gameTitle,
      thumbnailUrl: mostPopularGameResult.thumbnailUrl || null,
      sessionCount: parseInt(mostPopularGameResult.sessionCount)
    } : null;
    
    // 7. Average Session Duration (in minutes)
    const avgDurationResult = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.duration)', 'avgDuration')
      .where('analytics.duration IS NOT NULL')
      .getRawOne();
    
    // Convert seconds to minutes and round to nearest minute
    const avgSessionDuration = Math.round((avgDurationResult?.avgDuration || 0) / 60);
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRegisteredUsers,
        activeUsers,
        inactiveUsers,
        totalGames,
        totalSessions,
        totalTimePlayed,
        mostPopularGame,
        avgSessionDuration
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
    const { page = 1, limit = 10, userId } = req.query;
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
      let activity = 'No activity';
      let gameTitle = 'None';
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
      
      return {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
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
    const gamesAnalytics = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.gameId', 'gameId')
      .addSelect('COUNT(DISTINCT analytics.userId)', 'uniquePlayers')
      .addSelect('COUNT(analytics.id)', 'totalSessions')
      .addSelect('SUM(analytics.duration)', 'totalPlayTime')
      .where('analytics.gameId IN (:...gameIds)', { gameIds })
      .groupBy('analytics.gameId')
      .getRawMany();
    
    // Create a map of game IDs to their analytics data
    const analyticsMap = new Map();
    
    gamesAnalytics.forEach(item => {
      analyticsMap.set(item.gameId, {
        uniquePlayers: parseInt(item.uniquePlayers) || 0,
        totalSessions: parseInt(item.totalSessions) || 0,
        totalPlayTime: item.totalPlayTime || 0
      });
    });
    
    // Combine game data with analytics data
    const gamesWithAnalytics = games.map(game => {
      const analytics = analyticsMap.get(game.id) || {
        uniquePlayers: 0,
        totalSessions: 0,
        totalPlayTime: 0
      };
      
      return {
        ...game,
        analytics
      };
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
      relations: ['category', 'thumbnailFile', 'createdBy']
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
      .select('COUNT(DISTINCT analytics.userId)', 'uniquePlayers')
      .addSelect('COUNT(analytics.id)', 'totalSessions')
      .addSelect('SUM(analytics.duration)', 'totalPlayTime')
      .addSelect('AVG(analytics.duration)', 'avgSessionDuration')
      .where(whereConditions)
      .getRawOne();
    
    // Get top players for this game
    const topPlayers = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.userId', 'userId')
      .addSelect('user.email', 'userEmail')
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('COUNT(analytics.id)', 'sessionCount')
      .addSelect('SUM(analytics.duration)', 'totalPlayTime')
      .leftJoin('analytics.user', 'user')
      .where(whereConditions)
      .groupBy('analytics.userId')
      .addGroupBy('user.email')
      .addGroupBy('user.firstName')
      .addGroupBy('user.lastName')
      .orderBy('SUM(analytics.duration)', 'DESC')
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
      .addSelect('COUNT(analytics.id)', 'sessions')
      .addSelect('COUNT(DISTINCT analytics.userId)', 'players')
      .addSelect('SUM(analytics.duration)', 'totalPlayTime')
      .where(whereConditions)
      .groupBy('DATE(analytics.startTime)')
      .orderBy('date', 'ASC')
      .getRawMany();
    
    // Format the daily play time data
    const formattedDailyPlayTime = dailyPlayTime.map(day => ({
      date: day.date,
      sessions: parseInt(day.sessions) || 0,
      players: parseInt(day.players) || 0,
      playTime: Math.round((day.totalPlayTime || 0) / 60) // Convert to minutes
    }));
    
    // Prepare the response
    const gameAnalytics = {
      game,
      analytics: {
        uniquePlayers: parseInt(analyticsSummary?.uniquePlayers) || 0,
        totalSessions: parseInt(analyticsSummary?.totalSessions) || 0,
        totalPlayTime: Math.round((analyticsSummary?.totalPlayTime || 0) / 60), // Convert to minutes
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

    console.log(user)
    // Get user's analytics summary
    const analyticsSummary = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(DISTINCT analytics.gameId)', 'totalGamesPlayed')
      .addSelect('COUNT(analytics.id)', 'totalSessionCount')
      .addSelect('SUM(analytics.duration)', 'totalTimePlayed')
      .where('analytics.userId = :userId', { userId: id })
      .getRawOne();

    // Get user's game activity details
    const gameActivity = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.gameId', 'gameId')
      .addSelect('game.title', 'gameTitle')
      .addSelect('thumbnailFile.s3Url', 'thumbnailUrl')
      .addSelect('COUNT(analytics.id)', 'sessionCount')
      .addSelect('SUM(analytics.duration)', 'totalPlayTime')
      .addSelect('MAX(analytics.startTime)', 'lastPlayed')
      .leftJoin('analytics.game', 'game')
      .leftJoin('game.thumbnailFile', 'thumbnailFile')
      .where('analytics.userId = :userId', { userId: id })
      .groupBy('analytics.gameId')
      .addGroupBy('game.title')
      .addGroupBy('thumbnailFile.s3Url')
      .orderBy('lastPlayed', 'DESC')
      .getRawMany();

    // Format the game activity data
    const formattedGameActivity = gameActivity.map(game => ({
      gameId: game.gameId,
      gameTitle: game.gameTitle,
      thumbnailUrl: game.thumbnailUrl || null,
      sessionCount: parseInt(game.sessionCount) || 0,
      totalPlayTime: Math.round((game.totalPlayTime || 0) / 60), // Convert to minutes
      lastPlayed: game.lastPlayed
    }));

    // Prepare the response
    const userAnalytics = {
      user,
      analytics: {
        totalGamesPlayed: parseInt(analyticsSummary?.totalGamesPlayed) || 0,
        totalSessionCount: parseInt(analyticsSummary?.totalSessionCount) || 0,
        totalTimePlayed: Math.round((analyticsSummary?.totalTimePlayed || 0) / 60), // Convert to minutes
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
      .addSelect('COUNT(DISTINCT CASE WHEN analytics.gameId IS NOT NULL THEN analytics.gameId END)', 'totalGamesPlayed')
      .addSelect('COUNT(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.id END)', 'totalSessionCount')
      .addSelect('SUM(CASE WHEN analytics.gameId IS NOT NULL THEN analytics.duration ELSE 0 END)', 'totalTimePlayed')
      .groupBy('analytics.userId')
      .getRawMany();

    // Get most played game for each user
    const usersMostPlayedGames = await analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.userId', 'userId')
      .addSelect('analytics.gameId', 'gameId')
      .addSelect('game.title', 'gameTitle')
      .addSelect('thumbnailFile.s3Url', 'thumbnailUrl')
      .addSelect('COUNT(analytics.id)', 'sessionCount')
      .leftJoin('analytics.game', 'game')
      .leftJoin('game.thumbnailFile', 'thumbnailFile')
      .groupBy('analytics.userId')
      .addGroupBy('analytics.gameId')
      .addGroupBy('game.title')
      .addGroupBy('thumbnailFile.s3Url')
      .orderBy('analytics.userId')
      .addOrderBy('COUNT(analytics.id)', 'DESC')
      .getRawMany();

    // Create a map of user IDs to their most played game
    const mostPlayedGameMap = new Map();
    usersMostPlayedGames.forEach(item => {
      // Only add the first game for each user (the most played one)
      if (!mostPlayedGameMap.has(item.userId)) {
        mostPlayedGameMap.set(item.userId, {
          gameId: item.gameId,
          gameTitle: item.gameTitle,
          thumbnailUrl: item.thumbnailUrl || null,
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
