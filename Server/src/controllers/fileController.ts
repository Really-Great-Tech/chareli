import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { File } from '../entities/Files';
import { ApiError } from '../middlewares/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { s3Service } from '../services/s3.service';
import { zipService } from '../services/zip.service';
import multer from 'multer';
import logger from '../utils/logger';
import * as path from 'path';

const fileRepository = AppDataSource.getRepository(File);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Middleware to handle file uploads
export const uploadFile = upload.single('file');

// Middleware to handle file uploads for updates
export const uploadFileForUpdate = upload.single('file');

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Get all files
 *     description: Retrieve a list of all files with pagination and filtering options.
 *     tags: [Files]
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
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by file type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for file key or URL
 *     responses:
 *       200:
 *         description: A list of files
 *       500:
 *         description: Internal server error
 */
export const getAllFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, type, search } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    const queryBuilder = fileRepository.createQueryBuilder('file');
    
    // Apply type filter if provided
    if (type) {
      queryBuilder.where('file.type = :type', { type });
    }
    
    // Apply search filter if provided
    if (search) {
      queryBuilder.andWhere(
        '(file.s3Key ILIKE :search OR file.s3Url ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // Get total count for pagination
    const total = await queryBuilder.getCount();
    
    // Apply pagination
    queryBuilder
      .skip((pageNumber - 1) * limitNumber)
      .take(limitNumber)
      .orderBy('file.createdAt', 'DESC');
    
    const files = await queryBuilder.getMany();
    
    res.status(200).json({
      success: true,
      count: files.length,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Get file by ID
 *     description: Retrieve a single file by its ID.
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the file to retrieve
 *     responses:
 *       200:
 *         description: File found
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
export const getFileById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const file = await fileRepository.findOne({
      where: { id }
    });
    
    if (!file) {
      return next(ApiError.notFound(`File with id ${id} not found`));
    }
    
    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Upload a file and create a file record
 *     description: Upload a file to S3 and create a record in the database.
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - type
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               type:
 *                 type: string
 *                 description: Type of file (e.g., 'thumbnail', 'game_file')
 *     responses:
 *       201:
 *         description: File uploaded and record created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export const createFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type } = req.body;
    const file = req.file;
    
    if (!file) {
      return next(ApiError.badRequest('File is required'));
    }
    
    if (!type) {
      return next(ApiError.badRequest('File type is required'));
    }
    
    let fileRecord;

    // Handle file upload based on type
    if (type === 'game_file') {
      // Process game zip file
      logger.info('Processing game zip file');
      const processedZip = await zipService.processGameZip(file.buffer);
      
      if (processedZip.error) {
        return next(ApiError.badRequest(processedZip.error));
      }

      const gameId = uuidv4(); // Generate unique ID for this game
      const uploadedFiles = [];

      // Upload each file from the zip
      for (const extractedFile of processedZip.files) {
        const isIndex = extractedFile.isIndex;
        const filePath = path.join(gameId, extractedFile.relativePath);
        
        // Upload to S3
        const uploadResult = await s3Service.uploadFile(
          extractedFile.buffer,
          extractedFile.relativePath,
          'text/html', // For HTML files
          'games'
        );

        // Create file record for each file
        const fileRecord = fileRepository.create({
          s3Key: uploadResult.key,
          s3Url: uploadResult.url,
          type: 'game_content'
        });

        uploadedFiles.push(fileRecord);
      }

      // Save all file records
      await fileRepository.save(uploadedFiles);

      // Return the index.html file record
      fileRecord = uploadedFiles[0];
    } else {
      // Handle normal file upload (e.g., thumbnail)
      logger.info(`Uploading file to S3: ${file.originalname}`);
      const uploadResult = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        type
      );
      
      // Create file record in database
      logger.info('Creating file record in database');
      fileRecord = fileRepository.create({
        s3Key: uploadResult.key,
        s3Url: uploadResult.url,
        type
      });
      
      await fileRepository.save(fileRecord);
    }
    
    res.status(201).json({
      success: true,
      data: fileRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /files/{id}:
 *   put:
 *     summary: Update a file record
 *     description: Update a file record by its ID, optionally replacing the file.
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the file to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New file to upload (optional)
 *               type:
 *                 type: string
 *                 description: Type of file (e.g., 'thumbnail', 'game_file')
 *     responses:
 *       200:
 *         description: File record updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
export const updateFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const uploadedFile = req.file;
    
    const file = await fileRepository.findOne({
      where: { id }
    });
    
    if (!file) {
      return next(ApiError.notFound(`File with id ${id} not found`));
    }
    
    // If a new file is uploaded, replace the old one in S3
    if (uploadedFile) {
      logger.info(`Uploading new file to S3: ${uploadedFile.originalname}`);
      const uploadResult = await s3Service.uploadFile(
        uploadedFile.buffer,
        uploadedFile.originalname,
        uploadedFile.mimetype,
        file.type // Use existing type as folder
      );
      
      // Update file record with new S3 info
      file.s3Key = uploadResult.key;
      file.s3Url = uploadResult.url;
    }
    
    // Update type if provided
    if (type) {
      file.type = type;
    }
    
    await fileRepository.save(file);
    
    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Delete a file record
 *     description: Delete a file record by its ID.
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the file to delete
 *     responses:
 *       200:
 *         description: File record deleted successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
export const deleteFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const file = await fileRepository.findOne({
      where: { id }
    });
    
    if (!file) {
      return next(ApiError.notFound(`File with id ${id} not found`));
    }
    
    // In a real implementation, we would check if the file is referenced by any games
    // and prevent deletion if it is. For now, we'll just delete it.
    
    // Delete from S3
    try {
      logger.info(`Deleting file from S3: ${file.s3Key}`);
      await s3Service.deleteFile(file.s3Key);
    } catch (error) {
      logger.warn(`Failed to delete file from S3: ${error}`);
      // Continue with database deletion even if S3 deletion fails
    }
    
    // Delete from database
    await fileRepository.remove(file);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
