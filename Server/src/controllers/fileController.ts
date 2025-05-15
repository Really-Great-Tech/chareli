import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { File } from '../entities/Files';
import { ApiError } from '../middlewares/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const fileRepository = AppDataSource.getRepository(File);

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
 *     summary: Create a new file record
 *     description: Create a new file record with simulated S3 data.
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of file (e.g., 'thumbnail', 'game_file')
 *               filename:
 *                 type: string
 *                 description: Optional filename to use in the S3 key
 *     responses:
 *       201:
 *         description: File record created successfully
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
    const { type, filename = 'file' } = req.body;
    
    // Generate a UUID for the file
    const fileId = uuidv4();
    
    // Create mock S3 key and URL
    const s3Key = `${fileId}-${filename.replace(/\s+/g, '-')}`;
    const s3Url = `https://mock-s3-bucket.example.com/${s3Key}`;
    
    // Create new file record
    const file = fileRepository.create({
      s3Key,
      s3Url,
      type
    });
    
    await fileRepository.save(file);
    
    res.status(201).json({
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
 *   put:
 *     summary: Update a file record
 *     description: Update a file record by its ID.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               s3Key:
 *                 type: string
 *               s3Url:
 *                 type: string
 *               type:
 *                 type: string
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
    const { s3Key, s3Url, type } = req.body;
    
    const file = await fileRepository.findOne({
      where: { id }
    });
    
    if (!file) {
      return next(ApiError.notFound(`File with id ${id} not found`));
    }
    
    // Update file properties if provided
    if (s3Key) file.s3Key = s3Key;
    if (s3Url) file.s3Url = s3Url;
    if (type) file.type = type;
    
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
    
    await fileRepository.remove(file);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
