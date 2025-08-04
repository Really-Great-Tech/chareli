import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameStatus } from '../entities/Games';
import { GamePositionHistory } from '../entities/GamePositionHistory';
import { Category } from '../entities/Category';
import { File } from '../entities/Files';
import { Analytics } from '../entities/Analytics';
import { SystemConfig } from '../entities/SystemConfig';
import { ApiError } from '../middlewares/errorHandler';
import { RoleType } from '../entities/Role';
import { Not, In } from 'typeorm';
import { storageService } from '../services/storage.service';
import { zipService } from '../services/zip.service';
import { directUploadService } from '../services/direct-upload.service';
import { jobQueueService } from '../services/job-queue.service';
import { UploadJobType } from '../entities/UploadJob';
import multer from 'multer';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import config from '../config/config';
// import { processImage } from '../services/file.service';

const gameRepository = AppDataSource.getRepository(Game);
const gamePositionHistoryRepository = AppDataSource.getRepository(GamePositionHistory);
const categoryRepository = AppDataSource.getRepository(Category);
const fileRepository = AppDataSource.getRepository(File);

// Helper function to get the maximum position
const getMaxPosition = async (): Promise<number> => {
  const result = await gameRepository
    .createQueryBuilder('game')
    .select('MAX(game.position)', 'maxPosition')
    .getRawOne();
  
  return result?.maxPosition || 0;
};

// Helper function to create or update position history record
const createOrUpdatePositionHistoryRecord = async (gameId: string, position: number, queryRunner?: any): Promise<void> => {
  const repository = queryRunner ? queryRunner.manager.getRepository(GamePositionHistory) : gamePositionHistoryRepository;
  
  // Check if record already exists for this game and position
  let historyRecord = await repository.findOne({
    where: { gameId, position }
  });
  
  if (!historyRecord) {
    // Create new record if it doesn't exist
    historyRecord = repository.create({
      gameId,
      position,
      clickCount: 0
    });
    await repository.save(historyRecord);
  }
};

// Helper function to get the default category ID
const getDefaultCategoryId = async (queryRunner?: any): Promise<string> => {
  const repository = queryRunner ? queryRunner.manager.getRepository(Category) : categoryRepository;
  
  const defaultCategory = await repository.findOne({
    where: { isDefault: true }
  });
  
  if (!defaultCategory) {
    throw new ApiError(500, 'Default category not found. Please ensure the "General" category exists.');
  }
  
  return defaultCategory.id;
};

const assignPositionForNewGame = async (requestedPosition?: number, queryRunner?: any): Promise<number> => {
  const repository = queryRunner ? queryRunner.manager.getRepository(Game) : gameRepository;
  
  if (requestedPosition) {
    const totalGames = await repository.count();
    if (requestedPosition > totalGames + 1) {
      throw new ApiError(400, `Position cannot be greater than ${totalGames + 1}`);
    }
    
    const existingGame = await repository.findOne({
      where: { position: requestedPosition }
    });
    
    if (existingGame) {
      const maxPosition = await getMaxPosition();
      existingGame.position = maxPosition + 1;
      await repository.save(existingGame);
      
      // Create or update position history for existing game at new position
      await createOrUpdatePositionHistoryRecord(existingGame.id, maxPosition + 1, queryRunner);
    }
    
    return requestedPosition;
  } else {
    // Auto-assign to next available position
    const maxPosition = await getMaxPosition();
    return maxPosition + 1;
  }
};



/**
 * @swagger
 * /games:
 *   get:
 *     summary: Get all games
 *     description: Retrieve a list of all games with pagination and filtering options. Accessible by admins.
 *     tags: [Games]
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
 *       - in: query
 *         name: createdById
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by creator ID
 *     responses:
 *       200:
 *         description: A list of games
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const getAllGames = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit, 
      categoryId, 
      status, 
      search,
      createdById,
      filter
    } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = limit ? parseInt(limit as string, 10) : undefined;
    
    let queryBuilder = gameRepository.createQueryBuilder('game')
      .leftJoinAndSelect('game.category', 'category')
      .leftJoinAndSelect('game.thumbnailFile', 'thumbnailFile')
      .leftJoinAndSelect('game.gameFile', 'gameFile')
      .leftJoinAndSelect('game.createdBy', 'createdBy');

    // Handle special filters
    if (filter === 'recently_added') {
      // Get games from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      queryBuilder.andWhere('game.createdAt >= :sevenDaysAgo', { sevenDaysAgo });
    } else if (filter === 'popular') {
      const systemConfigRepository = AppDataSource.getRepository(SystemConfig);
      const popularConfig = await systemConfigRepository.findOne({
        where: { key: 'popular_games_settings' }
      });

      if (popularConfig?.value?.mode === 'manual') {
        let gameIds: string[] = [];
        if (popularConfig.value.selectedGameIds) {
          if (Array.isArray(popularConfig.value.selectedGameIds)) {
            gameIds = popularConfig.value.selectedGameIds;
          } else if (typeof popularConfig.value.selectedGameIds === 'object') {
            gameIds = Object.values(popularConfig.value.selectedGameIds);
          }
        }

        // If manual mode is selected, always return the selected games (even if empty)
        if (gameIds.length > 0) {
          const games = await gameRepository.find({
            where: {
              id: In(gameIds),
              status: GameStatus.ACTIVE
            },
            relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy'],
            order: { position: 'ASC' } // Order by position
          });

          // For manual mode, show ALL selected games (no limit applied)
          const orderedGames = gameIds
            .map((id: string) => games.find(game => game.id === id))
            .filter((game: Game | undefined): game is Game => game !== undefined);

          orderedGames.forEach((game: Game) => {
            if (game.gameFile) {
              const s3Key = game.gameFile.s3Key;
              game.gameFile.s3Key = storageService.getPublicUrl(s3Key);
            }
            if (game.thumbnailFile) {
              const s3Key = game.thumbnailFile.s3Key;
              game.thumbnailFile.s3Key = storageService.getPublicUrl(s3Key);
            }
          });

          res.status(200).json({
            data: orderedGames,
          });
          return;
        } else {
          // Manual mode with no games selected - return empty array
          res.status(200).json({
            data: [],
          });
          return;
        }
      } else {
        queryBuilder = gameRepository.createQueryBuilder('game')
          .leftJoinAndSelect('game.category', 'category')
          .leftJoinAndSelect('game.thumbnailFile', 'thumbnailFile')
          .leftJoinAndSelect('game.gameFile', 'gameFile')
          .leftJoinAndSelect('game.createdBy', 'createdBy')
          .leftJoin('analytics', 'a', 'a.gameId = game.id')
          .addSelect([
            'COUNT(DISTINCT a.userId) as playerCount',
            'SUM(a.duration) as totalPlayTime',
            'COUNT(a.id) as sessionCount'
          ])
          .groupBy('game.id')
          .addGroupBy('category.id')
          .addGroupBy('thumbnailFile.id')
          .addGroupBy('gameFile.id')
          .addGroupBy('createdBy.id')
          .orderBy('playerCount', 'DESC')
          .addOrderBy('totalPlayTime', 'DESC')
          .addOrderBy('sessionCount', 'DESC');
      }
    } else if (filter === 'recommended' && req.user?.userId) {
      const userTopCategory = await AppDataSource
        .getRepository(Analytics)
        .createQueryBuilder('analytics')
        .select('g.categoryId', 'categoryId')
        .innerJoin('games', 'g', 'analytics.gameId = g.id')
        .where('analytics.userId = :userId', { userId: req.user.userId })
        .groupBy('g.categoryId')
        .orderBy('SUM(analytics.duration)', 'DESC')
        .limit(1)
        .getRawOne();

      if (!userTopCategory) {
        queryBuilder = gameRepository.createQueryBuilder('game')
          .leftJoinAndSelect('game.category', 'category')
          .leftJoinAndSelect('game.thumbnailFile', 'thumbnailFile')
          .leftJoinAndSelect('game.gameFile', 'gameFile')
          .leftJoinAndSelect('game.createdBy', 'createdBy')
          .leftJoin('analytics', 'a', 'a.gameId = game.id')
          .addSelect([
            'COUNT(DISTINCT a.userId) as playerCount',
            'SUM(a.duration) as totalPlayTime',
            'COUNT(a.id) as sessionCount'
          ])
          .groupBy('game.id')
          .addGroupBy('category.id')
          .addGroupBy('thumbnailFile.id')
          .addGroupBy('gameFile.id')
          .addGroupBy('createdBy.id')
          .orderBy('playerCount', 'DESC')
          .addOrderBy('totalPlayTime', 'DESC')
          .addOrderBy('sessionCount', 'DESC');
      } else {
        const playedGameIds = await AppDataSource
          .getRepository(Analytics)
          .createQueryBuilder('analytics')
          .select('analytics.gameId', 'gameId')
          .where('analytics.userId = :userId', { userId: req.user.userId })
          .andWhere('analytics.gameId IS NOT NULL')
          .groupBy('analytics.gameId')
          .getRawMany();

        const playedIds = playedGameIds.map(item => item.gameId).filter(id => id !== null && id !== undefined);
        const totalLimit = limitNumber || 20;
        const sameCategoryLimit = Math.ceil(totalLimit * 0.6);
        
        // Get games from user's preferred category
        let sameCategoryQuery = gameRepository.createQueryBuilder('game')
          .leftJoinAndSelect('game.category', 'category')
          .leftJoinAndSelect('game.thumbnailFile', 'thumbnailFile')
          .leftJoinAndSelect('game.gameFile', 'gameFile')
          .leftJoinAndSelect('game.createdBy', 'createdBy')
          .where('game.categoryId = :topCategoryId', { topCategoryId: userTopCategory.categoryId })
          .andWhere('game.status = :status', { status: 'active' });

        if (playedIds.length > 0) {
          sameCategoryQuery.andWhere('game.id NOT IN (:...playedIds)', { playedIds });
        }

        const sameCategoryGames = await sameCategoryQuery
          .orderBy('game.createdAt', 'DESC')
          .take(sameCategoryLimit)
          .getMany();
        
        // Calculate remaining slots
        const remainingSlots = totalLimit - sameCategoryGames.length;
        
        // Get games from other categories if we need more
        let otherCategoryGames: Game[] = [];
        if (remainingSlots > 0) {
          let otherCategoryQuery = gameRepository.createQueryBuilder('game')
            .leftJoinAndSelect('game.category', 'category')
            .leftJoinAndSelect('game.thumbnailFile', 'thumbnailFile')
            .leftJoinAndSelect('game.gameFile', 'gameFile')
            .leftJoinAndSelect('game.createdBy', 'createdBy')
            .where('game.categoryId != :topCategoryId', { topCategoryId: userTopCategory.categoryId })
            .andWhere('game.status = :status', { status: 'active' });

          if (playedIds.length > 0) {
            otherCategoryQuery.andWhere('game.id NOT IN (:...playedIds)', { playedIds });
          }

          otherCategoryGames = await otherCategoryQuery
            .take(remainingSlots)
            .getMany();
        }
        
        // Combine and shuffle the results
        const allRecommendations = [...sameCategoryGames, ...otherCategoryGames];
        
        for (let i = allRecommendations.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allRecommendations[i], allRecommendations[j]] = [allRecommendations[j], allRecommendations[i]];
        }
        
        // Override the main query with our custom results
        const games = allRecommendations.slice(0, totalLimit);
        
        // Transform URLs and return early
        games.forEach(game => {
          if (game.gameFile) {
            const s3Key = game.gameFile.s3Key;
            game.gameFile.s3Key = storageService.getPublicUrl(s3Key);
          }
          if (game.thumbnailFile) {
            const s3Key = game.thumbnailFile.s3Key;
            game.thumbnailFile.s3Key = storageService.getPublicUrl(s3Key);
          }
        });
        
        res.status(200).json({
          data: games,
        });
        return;
      }
    }
    
    // Apply standard filters
    if (categoryId) {
      queryBuilder.andWhere('game.categoryId = :categoryId', { categoryId });
    }
    
    if (status) {
      queryBuilder.andWhere('game.status = :status', { status });
    }
    
    if (createdById) {
      queryBuilder.andWhere('game.createdById = :createdById', { createdById });
    }
    
    if (search) {
      queryBuilder.andWhere(
        '(game.title ILIKE :search OR game.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // Get total count for pagination
    const total = await queryBuilder.getCount();
    
    // Apply pagination and order by position
    if (limitNumber) {
      queryBuilder
        .skip((pageNumber - 1) * limitNumber)
        .take(limitNumber);
    }
    
    queryBuilder
      .orderBy('game.position', 'ASC')
      .addOrderBy('game.createdAt', 'DESC'); 
    
    const games = await queryBuilder.getMany();

    // Transform game file and thumbnail URLs to direct storage URLs
    games.forEach(game => {
      if (game.gameFile) {
        const s3Key = game.gameFile.s3Key;
        game.gameFile.s3Key = storageService.getPublicUrl(s3Key);
      }
      if (game.thumbnailFile) {
        const s3Key = game.thumbnailFile.s3Key;
        game.thumbnailFile.s3Key = storageService.getPublicUrl(s3Key);
      }
    });
    
    const totalPages = limitNumber ? Math.ceil(total / limitNumber) : 1;
    
    res.status(200).json({
      data: games,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /games/{id}:
 *   get:
 *     summary: Get game by ID
 *     description: Retrieve a single game by its ID with related entities and similar games. Accessible by admins.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game to retrieve
 *     responses:
 *       200:
 *         description: Game found with similar games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     category:
 *                       type: object
 *                     thumbnailFile:
 *                       type: object
 *                     gameFile:
 *                       type: object
 *                     createdBy:
 *                       type: object
 *                     similarGames:
 *                       type: array
 *                       description: Up to 5 similar games from the same category
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export const getGameById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Get the requested game with its relations
    const game = await gameRepository.findOne({
      where: { id },
      relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${id} not found`));
    }
    
    // Transform game file and thumbnail URLs to direct storage URLs
    if (game.gameFile) {
      const s3Key = game.gameFile.s3Key;
      game.gameFile.s3Key = storageService.getPublicUrl(s3Key);
    }
    if (game.thumbnailFile) {
      const s3Key = game.thumbnailFile.s3Key;
      game.thumbnailFile.s3Key = storageService.getPublicUrl(s3Key);
    }

    // Find similar games (same category, different ID, active status)
    let similarGames: Game[] = [];
    
    if (game.categoryId) {
      similarGames = await gameRepository.find({
        where: {
          categoryId: game.categoryId,
          id: Not(id), // Exclude the current game
          status: GameStatus.ACTIVE
        },
        relations: ['thumbnailFile', 'gameFile'],
        take: 5, // Limit to 5 similar games
        order: { createdAt: 'DESC' } // Get the newest games first
      });

      // Transform similar games' file and thumbnail URLs to direct storage URLs
      similarGames.forEach(similarGame => {
        if (similarGame.gameFile) {
          const s3Key = similarGame.gameFile.s3Key;
          similarGame.gameFile.s3Key = storageService.getPublicUrl(s3Key);
        }
        if (similarGame.thumbnailFile) {
          const s3Key = similarGame.thumbnailFile.s3Key;
          similarGame.thumbnailFile.s3Key = storageService.getPublicUrl(s3Key);
        }
      });
    }
      
    res.status(200).json({
      success: true,
      data: {
        ...game,
        similarGames: similarGames
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /games:
 *   post:
 *     summary: Create a new game
 *     description: Create a new game with file uploads. Accessible by admins.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - thumbnailFile
 *               - gameFile
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnailFile:
 *                 type: string
 *                 format: binary
 *                 description: Thumbnail image file
 *               gameFile:
 *                 type: string
 *                 format: binary
 *                 description: Game file (HTML, ZIP, etc.)
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [active, disabled]
 *               config:
 *                 type: integer
 *               position:
 *                 type: integer
 *                 minimum: 1
 *                 description: Position for the game (optional, auto-assigned if not provided)
 *     responses:
 *       201:
 *         description: Game created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Infinity, // No size limit for game files
  }
});

// Middleware to handle file uploads
export const uploadGameFiles = upload.fields([
  { name: 'thumbnailFile', maxCount: 1 },
  { name: 'gameFile', maxCount: 1 }
]);

// Middleware to handle file uploads for updates
export const uploadGameFilesForUpdate = upload.fields([
  { name: 'thumbnailFile', maxCount: 1 },
  { name: 'gameFile', maxCount: 1 }
]);

export const createGame = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Start a transaction
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { 
      title, 
      description, 
      categoryId, 
      status = GameStatus.ACTIVE,
      config = 0,
      position
    } = req.body;
    
    if (!title) {
      return next(ApiError.badRequest('Game title is required'));
    }
    
    if (position) {
      const requestedPosition = parseInt(position);
      if (requestedPosition < 1) {
        return next(ApiError.badRequest('Position must be a positive integer'));
      }
      const totalGames = await gameRepository.count();
      if (requestedPosition > totalGames + 1) {
        return next(ApiError.badRequest(`Position cannot be greater than ${totalGames + 1} (total number of games)`));
      }
    }
    
    // Get files from request
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || !files.thumbnailFile || !files.thumbnailFile[0] || !files.gameFile || !files.gameFile[0]) {
      return next(ApiError.badRequest('Thumbnail and game files are required'));
    }
    
    const thumbnailFile = files.thumbnailFile[0];
    const gameFile = files.gameFile[0];
    
    try {
      // Convert and resize thumbnail to webp before upload
      // const processedThumbnailBuffer = await processImage(thumbnailFile.buffer);
      
      // Determine the final categoryId to use
      let finalCategoryId = categoryId;
      
      if (categoryId) {
        // Check if provided category exists
        const category = await queryRunner.manager.findOne(Category, {
          where: { id: categoryId }
        });
        
        if (!category) {
          throw new ApiError(400, `Category with id ${categoryId} not found`);
        }
      } else {
        // Auto-assign default "General" category if no category provided
        finalCategoryId = await getDefaultCategoryId(queryRunner);
      }

      // Process game zip file first to validate it
      logger.info('Processing game zip file...');
      const processedZip = await zipService.processGameZip(gameFile.buffer);
      
      if (processedZip.error) {
        throw new ApiError(400, processedZip.error);
      }

      // Generate unique game folder name
      const gameFolderId = uuidv4();

      // Upload thumbnail to storage
      logger.info('Uploading thumbnail file to storage...');
      const thumbnailUploadResult = await storageService.uploadFile(
        thumbnailFile.buffer,
        thumbnailFile.originalname.replace(/\.[^.]+$/, '.webp'),
        'image/webp',
        'thumbnails'
      );

      // Upload game folder to storage
      logger.info('Uploading game folder to storage...');
      const gamePath = `games/${gameFolderId}`;
      await storageService.uploadDirectory(processedZip.extractedPath, gamePath);

      // Create file records in the database using transaction
      logger.info('Creating file records in the database...');
      const thumbnailFileRecord = fileRepository.create({
        s3Key: thumbnailUploadResult.key,
        type: 'thumbnail'
      });

      if (!processedZip.indexPath) {
        throw new ApiError(400, 'No index.html found in the zip file');
      }

      const indexPath = processedZip.indexPath.replace(/\\/g, '/');
      const gameFileRecord = fileRepository.create({
        s3Key: `${gamePath}/${indexPath}`,
        type: 'game_file'
      });

      await queryRunner.manager.save([thumbnailFileRecord, gameFileRecord]);

      // Assign position for the new game
      logger.info('Assigning position for new game...');
      const assignedPosition = await assignPositionForNewGame(position ? parseInt(position) : undefined, queryRunner);

      // Create new game with file IDs and position using transaction
      logger.info('Creating game record...');
      const game = gameRepository.create({
        title,
        description,
        thumbnailFileId: thumbnailFileRecord.id,
        gameFileId: gameFileRecord.id,
        categoryId: finalCategoryId,
        status,
        config,
        position: assignedPosition,
        createdById: req.user?.userId
      });

      await queryRunner.manager.save(game);

      // Create initial position history record
      logger.info('Creating initial position history record...');
      await createOrUpdatePositionHistoryRecord(game.id, assignedPosition, queryRunner);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Fetch the game with relations to return
      const savedGame = await gameRepository.findOne({
        where: { id: game.id },
        relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
      });

      if (!savedGame) {
        return next(ApiError.notFound(`Game with id ${game.id} not found`));
      }

      // Transform game file and thumbnail URLs to direct storage URLs
      if (savedGame.gameFile) {
        const s3Key = savedGame.gameFile.s3Key;
        savedGame.gameFile.s3Key = storageService.getPublicUrl(s3Key);
      }
      if (savedGame.thumbnailFile) {
        const s3Key = savedGame.thumbnailFile.s3Key;
        savedGame.thumbnailFile.s3Key = storageService.getPublicUrl(s3Key);
      }

      res.status(201).json({
        success: true,
        data: savedGame,
      });
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    }
  } catch (error) {
    next(error);
  } finally {
    // Release query runner
    await queryRunner.release();
  }
};

/**
 * @swagger
 * /games/{id}:
 *   put:
 *     summary: Update a game
 *     description: Update a game by its ID, including file uploads. Accessible by admins.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnailFile:
 *                 type: string
 *                 format: binary
 *                 description: New thumbnail image file (optional)
 *               gameFile:
 *                 type: string
 *                 format: binary
 *                 description: New game file (HTML, ZIP, etc.) (optional)
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [active, disabled]
 *               config:
 *                 type: integer
 *               position:
 *                 type: integer
 *                 minimum: 1
 *                 description: Position for the game (optional, will swap with existing game if position is occupied)
 *     responses:
 *       200:
 *         description: Game updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export const updateGame = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Start a transaction
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      categoryId, 
      status,
      config,
      position
    } = req.body;
    
    const game = await queryRunner.manager.findOne(Game, {
      where: { id }
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${id} not found`));
    }
    
    // Validate position early if provided (before any expensive operations)
    if (position !== undefined && position !== game.position) {
      const newPosition = parseInt(position);
      
      if (newPosition < 1) {
        return next(ApiError.badRequest('Position must be a positive integer'));
      }
      
      // Validate that position doesn't exceed total number of games
      const totalGames = await queryRunner.manager.count(Game);
      if (newPosition > totalGames) {
        return next(ApiError.badRequest(`Position cannot be greater than ${totalGames} (total number of games)`));
      }
    }
    
    // Handle file uploads if provided
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Handle thumbnail file upload
    if (files?.thumbnailFile && files.thumbnailFile[0]) {
      const thumbnailFile = files.thumbnailFile[0];
      
      // Upload to storage
      logger.info('Uploading new thumbnail file to storage...');
      const thumbnailUploadResult = await storageService.uploadFile(
        thumbnailFile.buffer,
        thumbnailFile.originalname,
        thumbnailFile.mimetype,
        'thumbnails'
      );
      
      // Create file record
      logger.info('Creating new thumbnail file record...');
      const thumbnailFileRecord = fileRepository.create({
        s3Key: thumbnailUploadResult.key,
        type: 'thumbnail'
      });
      
      await fileRepository.save(thumbnailFileRecord);
      
      // Update game with new file ID
      game.thumbnailFileId = thumbnailFileRecord.id;
    }
    
    // Handle game file upload
    if (files?.gameFile && files.gameFile[0]) {
      const gameFile = files.gameFile[0];
      
      // Process game zip file first to validate it
      logger.info('Processing game zip file...');
      const processedZip = await zipService.processGameZip(gameFile.buffer);
      
      if (processedZip.error) {
        throw new ApiError(400, processedZip.error);
      }

      // Generate unique game folder name
      const gameFolderId = uuidv4();

      // Upload game folder to storage
      logger.info('Uploading game folder to storage...');
      const gamePath = `games/${gameFolderId}`;
      await storageService.uploadDirectory(processedZip.extractedPath, gamePath);

      // Create file record for the index.html
      logger.info('Creating new game file record...');
      if (!processedZip.indexPath) {
        throw new ApiError(400, 'No index.html found in the zip file');
      }

      const indexPath = processedZip.indexPath.replace(/\\/g, '/');
      const gameFileRecord = fileRepository.create({
        s3Key: `${gamePath}/${indexPath}`,
        type: 'game_file'
      });
      
      await queryRunner.manager.save(gameFileRecord);
      
      // Update game with new file ID
      game.gameFileId = gameFileRecord.id;
    }
    
    // Handle category update
    if (categoryId !== undefined) {
      if (categoryId && categoryId !== game.categoryId) {
        // User provided a specific category
        const category = await categoryRepository.findOne({
          where: { id: categoryId }
        });
        
        if (!category) {
          return next(ApiError.badRequest(`Category with id ${categoryId} not found`));
        }
        
        game.categoryId = categoryId;
      } else if (!categoryId && game.categoryId) {
        // User explicitly cleared the category, auto-assign "General"
        const defaultCategoryId = await getDefaultCategoryId(queryRunner);
        game.categoryId = defaultCategoryId;
      }
      // If categoryId is same as current, no change needed
    }
    // If categoryId is undefined (not provided in request), keep existing category
    
    // Handle position update if provided
    if (position !== undefined && position !== game.position) {
      const newPosition = parseInt(position);
      
      // Check if target position is occupied
      const gameAtTargetPosition = await queryRunner.manager.findOne(Game, {
        where: { position: newPosition }
      });
      
      if (gameAtTargetPosition) {
        // Swap positions
        const currentPosition = game.position;
        
        // Update positions
        game.position = newPosition;
        gameAtTargetPosition.position = currentPosition;
        
        await queryRunner.manager.save(gameAtTargetPosition);
        
        // Create or update position history for both games
        await createOrUpdatePositionHistoryRecord(game.id, newPosition, queryRunner);
        await createOrUpdatePositionHistoryRecord(gameAtTargetPosition.id, currentPosition, queryRunner);
      } else {
        // Position is free, just move there
        game.position = newPosition;
        
        // Create or update position history
        await createOrUpdatePositionHistoryRecord(game.id, newPosition, queryRunner);
      }
    }
    
    // Update basic game properties
    if (title) game.title = title;
    if (description !== undefined) game.description = description;
    if (status) game.status = status as GameStatus;
    if (config !== undefined) game.config = config;
    
    await queryRunner.manager.save(game);

    // Commit transaction
    await queryRunner.commitTransaction();
    
    // Fetch the updated game with relations to return
      const updatedGame = await gameRepository.findOne({
        where: { id },
        relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
      });

      if (!updatedGame) {
        return next(ApiError.notFound(`Game with id ${id} not found`));
      }

      // Transform game file and thumbnail URLs to direct storage URLs
      if (updatedGame.gameFile) {
        const s3Key = updatedGame.gameFile.s3Key;
        updatedGame.gameFile.s3Key = storageService.getPublicUrl(s3Key);
      }
      if (updatedGame.thumbnailFile) {
        const s3Key = updatedGame.thumbnailFile.s3Key;
        updatedGame.thumbnailFile.s3Key = storageService.getPublicUrl(s3Key);
      }
    
      res.status(200).json({
        success: true,
        data: updatedGame,
      });
  } catch (error) {
    // Rollback transaction on error
    await queryRunner.rollbackTransaction();
    next(error);
  } finally {
    // Release query runner
    await queryRunner.release();
  }
};

/**
 * @swagger
 * /games/{id}:
 *   delete:
 *     summary: Delete a game
 *     description: Delete a game by its ID. Accessible by admins.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the game to delete
 *     responses:
 *       200:
 *         description: Game deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Game not found
 *       500:
 *         description: Internal server error
 */
export const deleteGame = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const game = await gameRepository.findOne({
      where: { id }
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${id} not found`));
    }
    
    // Check if user has permission to delete
    // Only super admins can delete games created by other admins
    if (
      req.user?.role === RoleType.ADMIN &&
      game.createdById !== req.user.userId
    ) {
      const createdByAdmin = await gameRepository
        .createQueryBuilder('game')
        .leftJoinAndSelect('game.createdBy', 'user')
        .leftJoinAndSelect('user.role', 'role')
        .where('game.id = :id', { id })
        .andWhere('role.name IN (:...roles)', { roles: [RoleType.ADMIN, RoleType.SUPERADMIN] })
        .getOne();
      
      if (createdByAdmin) {
        return next(ApiError.forbidden('You do not have permission to delete this game'));
      }
    }
    
    await gameRepository.remove(game);
    
    res.status(200).json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /games/position/{position}:
 *   get:
 *     summary: Get game by position
 *     description: Retrieve a game by its position number.
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: position
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Position number of the game to retrieve
 *     responses:
 *       200:
 *         description: Game found at the specified position
 *       404:
 *         description: No game found at the specified position
 *       400:
 *         description: Invalid position parameter
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getGameByPosition = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { position } = req.params;
    
    const positionNumber = parseInt(position);
    
    if (isNaN(positionNumber) || positionNumber < 1) {
      return next(ApiError.badRequest('Position must be a positive integer'));
    }
    
    // Get the game at the specified position
    const game = await gameRepository.findOne({
      where: { position: positionNumber },
      relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
    });
    
    if (!game) {
      return next(ApiError.notFound(`No game found at position ${positionNumber}`));
    }
    
    // Transform game file and thumbnail URLs to direct storage URLs
    if (game.gameFile) {
      const s3Key = game.gameFile.s3Key;
      game.gameFile.s3Key = storageService.getPublicUrl(s3Key);
    }
    if (game.thumbnailFile) {
      const s3Key = game.thumbnailFile.s3Key;
      game.thumbnailFile.s3Key = storageService.getPublicUrl(s3Key);
    }
    
    res.status(200).json({
      success: true,
      data: game
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ASYNC UPLOAD ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /games/upload/prepare:
 *   post:
 *     summary: Prepare async game upload
 *     description: Generate direct upload URLs and create upload job for async processing
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - thumbnailFilename
 *               - gameFilename
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnailFilename:
 *                 type: string
 *               gameFilename:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               config:
 *                 type: integer
 *               position:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Upload URLs generated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const prepareAsyncUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      description,
      thumbnailFilename,
      gameFilename,
      categoryId,
      config = 1,
      position
    } = req.body;

    if (!title || !thumbnailFilename || !gameFilename) {
      return next(ApiError.badRequest('Title, thumbnail filename, and game filename are required'));
    }

    // Validate file extensions
    if (!thumbnailFilename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return next(ApiError.badRequest('Thumbnail must be an image file'));
    }

    if (!gameFilename.toLowerCase().endsWith('.zip')) {
      return next(ApiError.badRequest('Game file must be a ZIP file'));
    }

    // Generate direct upload URLs
    const thumbnailUpload = await directUploadService.generateUploadUrl({
      filename: thumbnailFilename,
      contentType: 'image/*',
      folder: 'thumbnails',
      gameTitle: title
    });

    const gameUpload = await directUploadService.generateUploadUrl({
      filename: gameFilename,
      contentType: 'application/zip',
      folder: 'temp-uploads',
      gameTitle: title
    });

    // Create upload job
    const job = await jobQueueService.createJob({
      type: UploadJobType.GAME,
      userId: req.user!.userId,
      metadata: {
        title,
        description,
        categoryId,
        config,
        position: position ? parseInt(position) : undefined,
        thumbnailKey: thumbnailUpload.key,
        gameFileKey: gameUpload.key,
        originalFilename: gameFilename
      }
    });

    res.status(200).json({
      success: true,
      data: {
        jobId: job.id,
        uploadUrls: {
          thumbnail: thumbnailUpload.uploadUrl,
          game: gameUpload.uploadUrl
        },
        keys: {
          thumbnail: thumbnailUpload.key,
          game: gameUpload.key
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /games/upload/status/{jobId}:
 *   get:
 *     summary: Get upload job status
 *     description: Check the status of an async upload job
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Upload job ID
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getUploadStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await jobQueueService.getJob(jobId);
    if (!job) {
      return next(ApiError.notFound('Upload job not found'));
    }

    // Check if user owns this job
    if (job.userId !== req.user!.userId) {
      return next(ApiError.forbidden('You do not have access to this upload job'));
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        result: job.result,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /games/upload/confirm:
 *   post:
 *     summary: Confirm files uploaded and start processing
 *     description: Notify server that files have been uploaded and processing can begin
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Upload confirmed, processing started
 *       400:
 *         description: Bad request
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const confirmUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return next(ApiError.badRequest('Job ID is required'));
    }

    const job = await jobQueueService.getJob(jobId);
    if (!job) {
      return next(ApiError.notFound('Upload job not found'));
    }

    // Check if user owns this job
    if (job.userId !== req.user!.userId) {
      return next(ApiError.forbidden('You do not have access to this upload job'));
    }

    // Update job status to indicate files are uploaded
    await jobQueueService.updateJobProgress({
      jobId,
      progress: 5,
      currentStep: 'Getting ready to process your game...',
      status: job.status // Keep current status
    });

    res.status(200).json({
      success: true,
      message: 'Upload confirmed. Processing will begin shortly.',
      data: {
        jobId,
        status: 'confirmed'
      }
    });
  } catch (error) {
    next(error);
  }
};
