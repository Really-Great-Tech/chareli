import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameStatus } from '../entities/Games';
import { File } from '../entities/Files';
import { Category } from '../entities/Category';
import { ApiError } from '../middlewares/errorHandler';
import { storageService } from '../services/storage.service';
import logger from '../utils/logger';
import redis from '../config/redisClient';

const gameRepository = AppDataSource.getRepository(Game);
const fileRepository = AppDataSource.getRepository(File);
const categoryRepository = AppDataSource.getRepository(Category);

/**
 * @swagger
 * /games/frontend-upload:
 *   post:
 *     summary: Create game from frontend-processed files
 *     description: Create a game record after files have been processed and uploaded by the frontend
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
 *               - thumbnailUrl
 *               - gameFileUrl
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               config:
 *                 type: integer
 *               position:
 *                 type: integer
 *               thumbnailUrl:
 *                 type: string
 *               gameFileUrl:
 *                 type: string
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
export const createGameFromFrontendUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const {
      title,
      description,
      categoryId,
      config = 1,
      position,
      thumbnailUrl,
      gameFileUrl
    } = req.body;

    if (!title || !thumbnailUrl || !gameFileUrl) {
      return next(ApiError.badRequest('Title, thumbnailUrl, and gameFileUrl are required'));
    }

    logger.info(`Creating game from frontend upload: ${title}`);

    // Validate position if provided
    if (position !== undefined) {
      const requestedPosition = parseInt(position);
      if (requestedPosition < 1) {
        return next(ApiError.badRequest('Position must be a positive integer'));
      }
      const totalGames = await gameRepository.count();
      if (requestedPosition > totalGames + 1) {
        return next(ApiError.badRequest(`Position cannot be greater than ${totalGames + 1}`));
      }
    }

    // Determine category
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      // Auto-assign default "General" category
      const defaultCategory = await queryRunner.manager.findOne(Category, {
        where: { isDefault: true }
      });
      
      if (!defaultCategory) {
        throw new ApiError(500, 'Default category not found. Please ensure the "General" category exists.');
      }
      
      finalCategoryId = defaultCategory.id;
    } else {
      // Validate provided category exists
      const category = await queryRunner.manager.findOne(Category, {
        where: { id: categoryId }
      });
      
      if (!category) {
        return next(ApiError.badRequest(`Category with id ${categoryId} not found`));
      }
    }

    // Create file records
    const thumbnailFileRecord = fileRepository.create({
      s3Key: thumbnailUrl,
      type: 'thumbnail'
    });

    const gameFileRecord = fileRepository.create({
      s3Key: gameFileUrl,
      type: 'game_file'
    });

    await queryRunner.manager.save([thumbnailFileRecord, gameFileRecord]);

    // Handle position assignment
    let assignedPosition = position;
    if (position !== undefined) {
      const requestedPosition = parseInt(position);
      
      // Check if position is already occupied
      const existingGame = await queryRunner.manager.findOne(Game, {
        where: { position: requestedPosition }
      });
      
      if (existingGame) {
        // Move existing game to end
        const maxPositionResult = await queryRunner.manager
          .createQueryBuilder(Game, 'game')
          .select('MAX(game.position)', 'maxPosition')
          .getRawOne();
        
        const maxPosition = maxPositionResult?.maxPosition || 0;
        existingGame.position = maxPosition + 1;
        await queryRunner.manager.save(existingGame);
      }
      
      assignedPosition = requestedPosition;
    } else {
      // Auto-assign to next available position
      const maxPositionResult = await queryRunner.manager
        .createQueryBuilder(Game, 'game')
        .select('MAX(game.position)', 'maxPosition')
        .getRawOne();
      
      const maxPosition = maxPositionResult?.maxPosition || 0;
      assignedPosition = maxPosition + 1;
    }

    // Create game record
    const game = gameRepository.create({
      title,
      description,
      thumbnailFileId: thumbnailFileRecord.id,
      gameFileId: gameFileRecord.id,
      categoryId: finalCategoryId,
      status: GameStatus.ACTIVE,
      config,
      position: assignedPosition,
      createdById: req.user?.userId
    });

    await queryRunner.manager.save(game);

    // Commit transaction
    await queryRunner.commitTransaction();

    // Invalidate all games-related cache (comprehensive cache invalidation)
    const cachePatterns = [
      'games:all:*',
      'games:id:*',
      'admin:games:*',
      'admin:games-analytics:*',
      'categories:*'
    ];
    
    for (const pattern of cachePatterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
        logger.info(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    }

    // Fetch the created game with relations
    const savedGame = await gameRepository.findOne({
      where: { id: game.id },
      relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
    });

    if (!savedGame) {
      return next(ApiError.notFound(`Game with id ${game.id} not found`));
    }

    // Transform file URLs to public URLs
    if (savedGame.gameFile) {
      savedGame.gameFile.s3Key = storageService.getPublicUrl(savedGame.gameFile.s3Key);
    }
    if (savedGame.thumbnailFile) {
      savedGame.thumbnailFile.s3Key = storageService.getPublicUrl(savedGame.thumbnailFile.s3Key);
    }

    logger.info(`Successfully created game: ${savedGame.id}`);

    res.status(201).json({
      success: true,
      data: savedGame,
    });

  } catch (error) {
    // Rollback transaction on error
    await queryRunner.rollbackTransaction();
    logger.error('Error creating game from frontend upload:', error);
    next(error);
  } finally {
    // Release query runner
    await queryRunner.release();
  }
};

/**
 * @swagger
 * /upload/signed-url:
 *   post:
 *     summary: Generate signed URL for direct upload
 *     description: Generate a signed URL for uploading files directly to R2
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - contentType
 *             properties:
 *               filename:
 *                 type: string
 *               contentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed URL generated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const generateSignedUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return next(ApiError.badRequest('Filename and contentType are required'));
    }

    // Generate unique key for the file
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const key = `${timestamp}-${randomString}-${filename}`;

    // Generate signed URL for upload
    if (!storageService.generatePresignedUploadUrl) {
      return next(ApiError.badRequest('Signed URL generation not supported by current storage provider'));
    }

    const uploadUrl = await storageService.generatePresignedUploadUrl(key, contentType);

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        key
      }
    });

  } catch (error) {
    logger.error('Error generating signed URL:', error);
    next(error);
  }
};
