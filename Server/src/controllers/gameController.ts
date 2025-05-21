import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameStatus } from '../entities/Games';
import { Category } from '../entities/Category';
import { File } from '../entities/Files';
import { ApiError } from '../middlewares/errorHandler';
import { RoleType } from '../entities/Role';
import { Not } from 'typeorm';
import { s3Service } from '../services/s3.service';
import { zipService } from '../services/zip.service';
import multer from 'multer';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const gameRepository = AppDataSource.getRepository(Game);
const categoryRepository = AppDataSource.getRepository(Category);
const fileRepository = AppDataSource.getRepository(File);

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
      limit = 10, 
      categoryId, 
      status, 
      search,
      createdById 
    } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    const queryBuilder = gameRepository.createQueryBuilder('game')
      .leftJoinAndSelect('game.category', 'category')
      .leftJoinAndSelect('game.thumbnailFile', 'thumbnailFile')
      .leftJoinAndSelect('game.gameFile', 'gameFile')
      .leftJoinAndSelect('game.createdBy', 'createdBy');
    
    // Apply category filter if provided
    if (categoryId) {
      queryBuilder.andWhere('game.categoryId = :categoryId', { categoryId });
    }
    
    // Apply status filter if provided
    if (status) {
      queryBuilder.andWhere('game.status = :status', { status });
    }
    
    // Apply creator filter if provided
    if (createdById) {
      queryBuilder.andWhere('game.createdById = :createdById', { createdById });
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
    
    res.status(200).json({
      success: true,
      count: games.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
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
    
    // Find similar games (same category, different ID, active status)
    let similarGames: Game[] = [];
    
    if (game.categoryId) {
      similarGames = await gameRepository.find({
        where: {
          categoryId: game.categoryId,
          id: Not(id), // Exclude the current game
          status: GameStatus.ACTIVE
        },
        relations: ['thumbnailFile'],
        take: 5, // Limit to 5 similar games
        order: { createdAt: 'DESC' } // Get the newest games first
      });
    }
    
    // Return the game with similar games
    res.status(200).json({
      success: true,
      data: {
        ...game,
        similarGames
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
      config = 0
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return next(ApiError.badRequest('Game title is required'));
    }
    
    // Get files from request
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || !files.thumbnailFile || !files.thumbnailFile[0] || !files.gameFile || !files.gameFile[0]) {
      return next(ApiError.badRequest('Thumbnail and game files are required'));
    }
    
    const thumbnailFile = files.thumbnailFile[0];
    const gameFile = files.gameFile[0];
    
    try {
      // Check if category exists if provided
      if (categoryId) {
        const category = await queryRunner.manager.findOne(Category, {
          where: { id: categoryId }
        });
        
        if (!category) {
          throw new ApiError(400, `Category with id ${categoryId} not found`);
        }
      }

      // Process game zip file first to validate it
      logger.info('Processing game zip file...');
      const processedZip = await zipService.processGameZip(gameFile.buffer);
      
      if (processedZip.error) {
        throw new ApiError(400, processedZip.error);
      }

      // Generate unique game folder name
      const gameFolderId = uuidv4();

      // Upload thumbnail to S3
      logger.info('Uploading thumbnail file to S3...');
      const thumbnailUploadResult = await s3Service.uploadFile(
        thumbnailFile.buffer,
        thumbnailFile.originalname,
        thumbnailFile.mimetype,
        'thumbnails'
      );

      // Upload all game files to S3
      logger.info('Uploading game files to S3...');
      for (const extractedFile of processedZip.files) {
        // Use the full path including game ID
        const filePath = `${gameFolderId}/${extractedFile.relativePath.replace(/\\/g, '/')}`;
        await s3Service.uploadFile(
          extractedFile.buffer,
          filePath,
          extractedFile.isIndex ? 'text/html' : 'application/octet-stream',
          'games'
        );
      }

      // Create file records in the database using transaction
      logger.info('Creating file records in the database...');
      const thumbnailFileRecord = fileRepository.create({
        s3Key: thumbnailUploadResult.key,
        s3Url: thumbnailUploadResult.url,
        type: 'thumbnail'
      });

      const gameFileRecord = fileRepository.create({
        s3Key: `games/${gameFolderId}/${processedZip.indexPath}`,
        s3Url: `${s3Service.getBaseUrl()}/games/${gameFolderId}/${processedZip.indexPath}`,
        type: 'game_file'
      });

      await queryRunner.manager.save([thumbnailFileRecord, gameFileRecord]);

      // Create new game with file IDs using transaction
      logger.info('Creating game record...');
      const game = gameRepository.create({
        title,
        description,
        thumbnailFileId: thumbnailFileRecord.id,
        gameFileId: gameFileRecord.id,
        categoryId,
        status,
        config,
        createdById: req.user?.userId
      });

      await queryRunner.manager.save(game);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Fetch the game with relations to return
      const savedGame = await gameRepository.findOne({
        where: { id: game.id },
        relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
      });

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
      config
    } = req.body;
    
    const game = await queryRunner.manager.findOne(Game, {
      where: { id }
    });
    
    if (!game) {
      return next(ApiError.notFound(`Game with id ${id} not found`));
    }
    
    // Handle file uploads if provided
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Handle thumbnail file upload
    if (files?.thumbnailFile && files.thumbnailFile[0]) {
      const thumbnailFile = files.thumbnailFile[0];
      
      // Upload to S3
      logger.info('Uploading new thumbnail file to S3...');
      const thumbnailUploadResult = await s3Service.uploadFile(
        thumbnailFile.buffer,
        thumbnailFile.originalname,
        thumbnailFile.mimetype,
        'thumbnails'
      );
      
      // Create file record
      logger.info('Creating new thumbnail file record...');
      const thumbnailFileRecord = fileRepository.create({
        s3Key: thumbnailUploadResult.key,
        s3Url: thumbnailUploadResult.url,
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

      // Upload all game files to S3
      logger.info('Uploading game files to S3...');
      for (const extractedFile of processedZip.files) {
        // Use the full path including game ID
        const filePath = `${gameFolderId}/${extractedFile.relativePath.replace(/\\/g, '/')}`;
        await s3Service.uploadFile(
          extractedFile.buffer,
          filePath,
          extractedFile.isIndex ? 'text/html' : 'application/octet-stream',
          'games'
        );
      }

      // Create file record for the index.html
      logger.info('Creating new game file record...');
      const gameFileRecord = fileRepository.create({
        s3Key: `games/${gameFolderId}/${processedZip.indexPath}`,
        s3Url: `${s3Service.getBaseUrl()}/games/${gameFolderId}/${processedZip.indexPath}`,
        type: 'game_file'
      });
      
      await queryRunner.manager.save(gameFileRecord);
      
      // Update game with new file ID
      game.gameFileId = gameFileRecord.id;
    }
    
    // Check if category exists if provided
    if (categoryId && categoryId !== game.categoryId) {
      const category = await categoryRepository.findOne({
        where: { id: categoryId }
      });
      
      if (!category) {
        return next(ApiError.badRequest(`Category with id ${categoryId} not found`));
      }
      
      game.categoryId = categoryId;
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
