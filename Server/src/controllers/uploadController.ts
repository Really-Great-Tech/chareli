import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameStatus } from '../entities/Games';
import { Category } from '../entities/Category';
import { File } from '../entities/Files';
import { ApiError } from '../middlewares/errorHandler';
import { s3Service } from '../services/s3.service';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const gameRepository = AppDataSource.getRepository(Game);
const categoryRepository = AppDataSource.getRepository(Category);
const fileRepository = AppDataSource.getRepository(File);

// Interfaces for new upload flow
export interface PresignedUrlRequest {
  files: Array<{
    path: string;
    contentType: string;
    size: number;
  }>;
  thumbnail: {
    name: string;
    contentType: string;
    size: number;
  };
}

export interface PresignedUrlResponse {
  gameId: string;
  gameFiles: Array<{
    path: string;
    uploadUrl: string;
    s3Key: string;
  }>;
  thumbnail: {
    uploadUrl: string;
    s3Key: string;
  };
  indexFileKey: string;
}

export interface CreateGameFromUploadRequest {
  gameId: string;
  title: string;
  description?: string;
  categoryId?: string;
  status?: GameStatus;
  config?: number;
  thumbnailS3Key: string;
  gameFileS3Key: string;
}

/**
 * @swagger
 * /upload/presigned-urls:
 *   post:
 *     summary: Generate presigned URLs for direct S3 upload
 *     description: Generate presigned URLs for uploading game files and thumbnail directly to S3. Accessible by admins.
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
 *               - files
 *               - thumbnail
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     path:
 *                       type: string
 *                     contentType:
 *                       type: string
 *                     size:
 *                       type: number
 *               thumbnail:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   contentType:
 *                     type: string
 *                   size:
 *                     type: number
 *     responses:
 *       200:
 *         description: Presigned URLs generated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const generatePresignedUrls = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let { files, thumbnail }: PresignedUrlRequest = req.body;
    
    // Convert object with numeric keys back to array if needed
    if (!Array.isArray(files) && typeof files === 'object' && files !== null) {
      logger.info('Converting files object to array');
      files = Object.values(files);
    }
    
    // Validate request
    if (!files || !Array.isArray(files) || files.length === 0) {
      return next(ApiError.badRequest('Files array is required and cannot be empty'));
    }
    
    if (!thumbnail || !thumbnail.name || !thumbnail.contentType) {
      return next(ApiError.badRequest('Thumbnail information is required'));
    }
    
    // Validate that index.html exists in files
    const indexFile = files.find(file => file.path.toLowerCase().endsWith('index.html'));
    if (!indexFile) {
      return next(ApiError.badRequest('index.html file is required in the game files'));
    }
    
    // Generate unique game ID
    const gameId = uuidv4();
    
    // Generate presigned URLs for game files
    const gameFiles = await s3Service.generateMultiplePresignedUrls(files, gameId);
    
    // Generate presigned URL for thumbnail
    const thumbnailS3Key = `thumbnails/${uuidv4()}-${thumbnail.name.replace(/\s+/g, '-').toLowerCase()}`;
    const thumbnailUploadUrl = await s3Service.getSignedUrl(thumbnailS3Key, 'put');
    
    // Find the index.html file's S3 key for the response
    const indexFileData = gameFiles.find(file => file.path.toLowerCase().endsWith('index.html'));
    if (!indexFileData) {
      return next(ApiError.badRequest('Failed to generate presigned URL for index.html'));
    }
    
    const response: PresignedUrlResponse = {
      gameId,
      gameFiles,
      thumbnail: {
        uploadUrl: thumbnailUploadUrl,
        s3Key: thumbnailS3Key
      },
      indexFileKey: indexFileData.s3Key
    };
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /upload/create-game:
 *   post:
 *     summary: Create game from uploaded files
 *     description: Create a game record after files have been uploaded to S3. Accessible by admins.
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
 *               - gameId
 *               - title
 *               - thumbnailS3Key
 *               - gameFileS3Key
 *             properties:
 *               gameId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [active, disabled]
 *               config:
 *                 type: integer
 *               thumbnailS3Key:
 *                 type: string
 *               gameFileS3Key:
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
export const createGameFromUpload = async (
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
      gameId,
      title,
      description,
      categoryId,
      status = GameStatus.ACTIVE,
      config = 0,
      thumbnailS3Key,
      gameFileS3Key
    }: CreateGameFromUploadRequest = req.body;
    
    // Validate required fields
    if (!gameId || !title || !thumbnailS3Key || !gameFileS3Key) {
      return next(ApiError.badRequest('gameId, title, thumbnailS3Key, and gameFileS3Key are required'));
    }
    
    // Check if category exists if provided
    if (categoryId) {
      const category = await queryRunner.manager.findOne(Category, {
        where: { id: categoryId }
      });
      
      if (!category) {
        throw new ApiError(400, `Category with id ${categoryId} not found`);
      }
    }
    
    // Verify files exist in S3 (optional check)
    const thumbnailExists = await s3Service.fileExists(thumbnailS3Key);
    const gameFileExists = await s3Service.fileExists(gameFileS3Key);
    
    if (!thumbnailExists) {
      return next(ApiError.badRequest('Thumbnail file not found in S3. Please upload the file first.'));
    }
    
    if (!gameFileExists) {
      return next(ApiError.badRequest('Game file not found in S3. Please upload the file first.'));
    }
    
    // Create file records in the database
    logger.info('Creating file records in the database...');
    const thumbnailFileRecord = fileRepository.create({
      s3Key: thumbnailS3Key,
      type: 'thumbnail'
    });
    
    const gameFileRecord = fileRepository.create({
      s3Key: gameFileS3Key,
      type: 'game_file'
    });
    
    await queryRunner.manager.save([thumbnailFileRecord, gameFileRecord]);
    
    // Create new game with file IDs
    logger.info('Creating game record...');
    const game = gameRepository.create({
      id: gameId,
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
      where: { id: gameId },
      relations: ['category', 'thumbnailFile', 'gameFile', 'createdBy']
    });
    
    if (!savedGame) {
      return next(ApiError.notFound(`Game with id ${gameId} not found`));
    }
    
    // Transform game file and thumbnail URLs to direct S3 URLs
    if (savedGame.gameFile) {
      const s3Key = savedGame.gameFile.s3Key;
      const baseUrl = s3Service.getBaseUrl();
      savedGame.gameFile.s3Key = `${baseUrl}/${s3Key}`;
    }
    if (savedGame.thumbnailFile) {
      const s3Key = savedGame.thumbnailFile.s3Key;
      const baseUrl = s3Service.getBaseUrl();
      savedGame.thumbnailFile.s3Key = `${baseUrl}/${s3Key}`;
    }
    
    res.status(201).json({
      success: true,
      data: savedGame
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
